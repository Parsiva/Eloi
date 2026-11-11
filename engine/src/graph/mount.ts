// mountGraph(): put a frame graph on a host element. The host is the screen: the frame is drawn
// to its size, never to its content, and is redrawn whenever that size changes. The host's
// [data-slot] children are moved into the openings the frame leaves; content that does not fit
// scrolls inside its opening.
import type { FrameGraph } from './doc'
import { evaluate, type Num } from './expr'
import { pathOf } from './geom'
import { glyph } from './glyphs'
import { solve, type Solved } from './solve'

export interface GraphHandle {
  readonly host: HTMLElement
  readonly doc: FrameGraph
  readonly solved: Solved
  setDoc(doc: FrameGraph): void
  // Called after every solve (a resize or a new document).
  on(listener: (solved: Solved) => void): () => void
  dispose(): void
}

const STYLE_ID = 'eloi-graph-styles'
const STYLES = `
:where(.eloi-graph) { position: relative; overflow: hidden; }
.eloi-graph > .eloi-ink { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.eloi-graph > .eloi-opening { position: absolute; box-sizing: border-box; overflow: hidden; container-type: size; }
.eloi-graph > .eloi-opening[data-scroll] { overflow: hidden auto; overscroll-behavior: contain; }
.eloi-graph > .eloi-opening[hidden] { display: none; }
`
const DEFAULT_INKS: Record<string, string> = {
  ink: 'var(--ink, #222)',
  soft: 'var(--ink-soft, #666)',
  faint: 'var(--rule, #999)',
  paper: 'var(--paper, #fff)',
}
const SVG = 'http://www.w3.org/2000/svg'
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export function mountGraph(host: HTMLElement, initial: FrameGraph): GraphHandle {
  let doc = initial
  let solved: Solved
  let frame = 0
  const listeners = new Set<(solved: Solved) => void>()

  const root = host.ownerDocument
  if (!root.getElementById(STYLE_ID)) {
    const style = root.createElement('style')
    style.id = STYLE_ID
    style.textContent = STYLES
    root.head.append(style)
  }
  host.classList.add('eloi-graph')
  host.dataset.frame = doc.id

  const svg = root.createElementNS(SVG, 'svg')
  svg.setAttribute('class', 'eloi-ink')
  svg.setAttribute('aria-hidden', 'true')
  host.prepend(svg)

  // The host's own content, by slot. Each gets a wrapper the frame positions.
  const slots = new Map<string, HTMLElement>()
  for (const el of Array.from(host.children)) if (el instanceof HTMLElement && el.dataset.slot) slots.set(el.dataset.slot, el)
  const wrappers = new Map<string, HTMLElement>()
  for (const [slot, el] of slots) {
    const wrapper = root.createElement('div')
    wrapper.className = 'eloi-opening'
    wrapper.dataset.opening = slot
    wrapper.hidden = true
    host.append(wrapper)
    wrapper.append(el)
    wrappers.set(slot, wrapper)
  }

  // A value that must not stop the drawing: a bad expression falls back.
  const quiet = (value: Num | undefined, fallback: number): number => {
    try {
      return evaluate(value, solved.env, fallback)
    } catch {
      return fallback
    }
  }

  function render(): void {
    frame = 0
    const w = host.clientWidth
    const h = host.clientHeight
    solved = solve(doc, w, h)
    host.style.setProperty('--m', `${solved.m}px`)
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)

    const ink = (name: string | undefined) => doc.inks?.[name ?? 'ink'] ?? DEFAULT_INKS[name ?? 'ink'] ?? name ?? 'currentColor'
    let out = '<g class="eloi-lines" fill="none" stroke-linecap="round" stroke-linejoin="round">'
    for (const line of solved.lines.values()) {
      if (line.def.draw === false) continue
      const weight = quiet(line.def.weight, 1)
      const dash = line.def.dash ? ` stroke-dasharray="${line.def.dash.join(' ')}"` : ''
      out += `<path data-line="${esc(line.id)}" d="${line.parts.map((part) => pathOf(part)).join('')}" stroke="${esc(ink(line.def.ink))}" stroke-width="${weight}"${dash}/>`
    }
    out += '</g><g class="eloi-nodes" stroke-linecap="round" stroke-linejoin="round">'
    for (const node of solved.nodes.values()) {
      let shapes: ReturnType<typeof glyph> = []
      try {
        shapes = glyph(node, solved.env)
      } catch (err) {
        solved.issues.push({ kind: 'node', id: node.id, message: err instanceof Error ? err.message : String(err) })
      }
      if (shapes.length === 0) continue
      out += `<g data-node="${esc(node.id)}">`
      for (const shape of shapes)
        out += `<path d="${shape.d}" stroke="${esc(ink(shape.ink))}" stroke-width="${shape.weight}" fill="${shape.fill ? esc(ink(shape.fill)) : 'none'}"/>`
      out += '</g>'
    }
    svg.innerHTML = out + '</g>'

    const open = new Map(solved.openings.map((o) => [o.id, o]))
    for (const [slot, wrapper] of wrappers) {
      const o = open.get(slot)
      wrapper.hidden = !o
      if (!o) continue
      wrapper.style.left = `${o.x}px`
      wrapper.style.top = `${o.y}px`
      wrapper.style.width = `${o.width}px`
      wrapper.style.height = `${o.height}px`
      wrapper.style.padding = `${quiet(o.def.pad, 0) * solved.m}px`
      wrapper.toggleAttribute('data-scroll', o.def.scroll !== false)
    }
    for (const listener of listeners) listener(solved)
  }

  const schedule = () => {
    if (frame) return
    if (typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(render)
    else render()
  }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : undefined
  observer?.observe(host)
  render()

  return {
    host,
    get doc() {
      return doc
    },
    get solved() {
      return solved
    },
    setDoc(next) {
      doc = next
      host.dataset.frame = doc.id
      if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
      render()
    },
    on(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    dispose() {
      if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
      observer?.disconnect()
      listeners.clear()
      for (const [slot, wrapper] of wrappers) {
        host.append(slots.get(slot)!)
        wrapper.remove()
      }
      svg.remove()
      host.classList.remove('eloi-graph')
      host.style.removeProperty('--m')
      delete host.dataset.frame
    },
  }
}
