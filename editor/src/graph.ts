// The frame graph editor: an x-ray over the live page. It shows what the frame is made of (the
// nodes, the leading lines and the lines that follow them, the openings, and what each is
// measured from) and opens a floating card for whatever you click. Every change is applied to
// the page at once and saved to the frame's file, so a second window on the clean view follows.
//
// Development only: the page imports this module dynamically, and never in a production build.
import { isCorner, problemWith, type End, type FrameGraph, type GraphEdge, type GraphHandle, type Layer, type LineDef, type NodeDef, type Num, type OpeningDef, type Variant } from '@eloi/engine'
import { addLine, addNode, dependents, depths, lineNodes, placeKind, placedBy, remove, renameLine, renameNode, setPlaceKind, unique, type Ref } from './graph-doc'
import { GRAPH_STYLES } from './graph-styles'
import { STYLES } from './styles'

export interface GraphEditorOptions {
  save(doc: FrameGraph): Promise<void>
}
export interface GraphEditorHandle {
  // A document that arrived from outside (the file changed on disk).
  external(doc: FrameGraph): void
  dispose(): void
}

type Panel = 'params' | 'rules' | 'tree' | 'issues'
type Selection = Ref | { kind: 'panel'; id: Panel }
type Child = Node | string | undefined | null | false

const XRAY_KEY = 'eloi.graph.xray'
const SVG = 'http://www.w3.org/2000/svg'
const NUMBER = /^-?(\d+\.?\d*|\.\d+)$/

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  node.append(...children.filter((c): c is Node | string => !!c))
  return node
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const fix = (v: number) => (Math.round(v * 10) / 10).toString()
const show = (v: number) => (Math.round(v * 100) / 100).toString()
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const parse = (raw: string): Num | undefined => {
  const text = raw.trim()
  return text === '' ? undefined : NUMBER.test(text) ? Number(text) : text
}
const LAYER_FIELDS: Record<Layer['kind'], string[]> = {
  circle: ['r'],
  polygon: ['sides', 'r', 'turn'],
  petals: ['n', 'r0', 'r1', 'width', 'turn'],
  rays: ['n', 'r0', 'r1', 'a0', 'a1'],
  spiral: ['turns', 'r0', 'r1', 'turn'],
  dots: ['n', 'r', 'size', 'turn'],
}

export function attachGraphEditor(frame: GraphHandle, options: GraphEditorOptions): GraphEditorHandle {
  let doc = clone(frame.doc)
  const undoStack: string[] = []
  const redoStack: string[] = []
  let selected: Selection | undefined
  let hover: Ref | undefined
  let xray = localStorage.getItem(XRAY_KEY) !== 'false'
  let status: 'saved' | 'saving' | 'failed' = 'saved'
  let flash = ''
  let cardAt: { x: number; y: number } | undefined
  const sent = new Map<string, number>() // JSON of our own saves → when, to recognise echoes

  const mountPoint = el('div', { style: 'position:fixed;inset:0;z-index:2147483000;pointer-events:none' })
  const shadow = mountPoint.attachShadow({ mode: 'open' })
  const overlay = document.createElementNS(SVG, 'svg')
  overlay.setAttribute('class', 'graph')
  const card = el('div', { class: 'card', hidden: '' })
  const toolbar = el('div', { class: 'toolbar' })
  shadow.append(el('style', {}, STYLES + GRAPH_STYLES), overlay, card, toolbar)
  document.body.append(mountPoint)

  // ── Changing the document ────────────────────────────────────────────────────────────────
  // Show a change without keeping it (while typing or dragging).
  function preview(change: (d: FrameGraph) => void): void {
    const next = clone(doc)
    try {
      change(next)
      frame.setDoc(next)
    } catch {
      /* a half-typed value; the field shows it */
    }
  }

  // Keep a change: one undo step, saved to the file. `rebuild` redraws the card (needed when
  // the change alters what the card shows, not just a value in it).
  function commit(change: (d: FrameGraph) => string | undefined | void, rebuild = true): boolean {
    const next = clone(doc)
    const refusal = change(next)
    if (typeof refusal === 'string') {
      flash = refusal
      frame.setDoc(doc)
      drawCard()
      return false
    }
    flash = ''
    if (JSON.stringify(next) === JSON.stringify(doc)) {
      frame.setDoc(doc)
      return true
    }
    undoStack.push(JSON.stringify(doc))
    if (undoStack.length > 200) undoStack.shift()
    redoStack.length = 0
    doc = next
    frame.setDoc(doc)
    queueSave()
    if (rebuild) drawCard()
    drawToolbar()
    return true
  }

  function step(from: string[], to: string[]): void {
    const text = from.pop()
    if (!text) return
    to.push(JSON.stringify(doc))
    doc = JSON.parse(text) as FrameGraph
    frame.setDoc(doc)
    queueSave()
    drawCard()
    drawToolbar()
  }

  // Saves run one at a time; edits made while one is in flight go out as one more save after.
  let timer = 0
  let saving = false
  let dirty = false
  function queueSave(): void {
    dirty = true
    status = 'saving'
    window.clearTimeout(timer)
    timer = window.setTimeout(() => void flush(), 150)
  }
  async function flush(): Promise<void> {
    if (saving || !dirty) return
    saving = true
    dirty = false
    const text = JSON.stringify(doc)
    const now = Date.now()
    for (const [key, at] of sent) if (now - at > 5000) sent.delete(key)
    sent.set(text, now)
    try {
      await options.save(JSON.parse(text) as FrameGraph)
      status = dirty ? 'saving' : 'saved'
    } catch (err) {
      status = 'failed'
      console.error(err)
    }
    saving = false
    drawToolbar()
    if (dirty) void flush()
  }

  // ── Finding things ───────────────────────────────────────────────────────────────────────
  const nodeIn = (d: FrameGraph, id: string) => d.nodes.find((n) => n.id === id)
  const lineIn = (d: FrameGraph, id: string) => d.lines.find((l) => l.id === id)
  const openingIn = (d: FrameGraph, id: string) => d.openings.find((o) => o.id === id)
  const nodeIds = () => ['tl', 'tr', 'bl', 'br', ...doc.nodes.map((n) => n.id)]
  const issuesFor = (ref: Ref) => frame.solved.issues.filter((i) => i.kind === ref.kind && i.id === ref.id)

  function select(next: Selection | undefined): void {
    selected = next
    flash = ''
    drawCard()
    drawXray()
  }

  // ── The x-ray ────────────────────────────────────────────────────────────────────────────
  const pathOf = (parts: { x: number; y: number }[][]) => parts.map((pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${fix(p.x)} ${fix(p.y)}`).join('')).join('')

  function drawXray(): void {
    overlay.style.display = xray ? '' : 'none'
    if (!xray) return
    const solved = frame.solved
    const box = frame.host.getBoundingClientRect()
    const sel = selected && selected.kind !== 'panel' ? selected : undefined
    const is = (ref: Ref | undefined, kind: Ref['kind'], id: string) => ref?.kind === kind && ref.id === id
    const related = new Set<string>() // "kind:id" of what the selection depends on or is used by
    if (sel) {
      for (const d of dependents(doc, sel)) related.add(`${d.kind}:${d.id}`)
      if (sel.kind === 'node') {
        const def = nodeIn(doc, sel.id)
        if (def) {
          const by = placedBy(def.at)
          for (const id of by.nodes) related.add(`node:${id}`)
          if (by.line) related.add(`line:${by.line}`)
        }
      } else if (sel.kind === 'line') {
        const def = lineIn(doc, sel.id)
        if (def?.along) related.add(`line:${def.along}`)
        if (def) for (const id of lineNodes(def)) related.add(`node:${id}`)
      }
    }
    const state = (kind: Ref['kind'], id: string) => (is(sel, kind, id) ? ' sel' : related.has(`${kind}:${id}`) ? ' rel' : '') + (is(hover, kind, id) ? ' hover' : '')

    let out = `<g transform="translate(${fix(box.left)} ${fix(box.top)})">`
    for (const o of solved.openings) {
      out += `<g class="opening${state('opening', o.id)}"><rect x="${fix(o.x)}" y="${fix(o.y)}" width="${fix(o.width)}" height="${fix(o.height)}"/>`
      out += `<g class="tag" data-kind="opening" data-id="${esc(o.id)}"><rect x="${fix(o.x + 3)}" y="${fix(o.y + 3)}" width="${o.id.length * 6.6 + 10}" height="15" rx="3"/><text x="${fix(o.x + 8)}" y="${fix(o.y + 14)}">${esc(o.id)}</text></g></g>`
    }
    // What each node is measured from.
    for (const n of solved.nodes.values()) {
      for (const parent of n.parents) {
        const p = solved.nodes.get(parent)
        if (!p) continue
        const on = is(sel, 'node', n.id) || is(sel, 'node', parent)
        out += `<line class="link${on ? ' on' : ''}" x1="${fix(p.x)}" y1="${fix(p.y)}" x2="${fix(n.x)}" y2="${fix(n.y)}"/>`
      }
    }
    for (const l of solved.lines.values()) {
      const d = pathOf(l.parts.length ? [l.pts] : [])
      const guide = l.def.draw === false
      out += `<g class="line${guide ? ' guide' : ''}${state('line', l.id)}" data-kind="line" data-id="${esc(l.id)}"><path class="show" d="${d}"/><path class="hit" d="${d}"/></g>`
    }
    for (const n of solved.nodes.values()) {
      const r = Math.max(n.r, 5)
      const corner = isCorner(n.id)
      const side = n.x > solved.w / 2 ? -1 : 1
      out += `<g class="node${corner ? ' corner' : ''}${state('node', n.id)}" data-kind="node" data-id="${esc(n.id)}">`
      out += corner ? `<rect x="${fix(n.x - 9)}" y="${fix(n.y - 9)}" width="18" height="18"/>` : `<circle cx="${fix(n.x)}" cy="${fix(n.y)}" r="${fix(r)}"/><circle class="dot" cx="${fix(n.x)}" cy="${fix(n.y)}" r="2"/>`
      const lx = corner ? n.x + (n.sx > 0 ? 14 : -14) : n.x + side * (r + 5)
      const ly = corner ? n.y + (n.sy > 0 ? 14 : -6) : n.y + 4
      out += `<text x="${fix(lx)}" y="${fix(ly)}" text-anchor="${(corner ? n.sx > 0 : side > 0) ? 'start' : 'end'}">${esc(n.id)}</text></g>`
    }
    overlay.innerHTML = out + '</g>'
  }

  const refAt = (target: EventTarget | null): Ref | undefined => {
    const hit = target instanceof Element ? target.closest('[data-kind]') : null
    const kind = hit?.getAttribute('data-kind')
    const id = hit?.getAttribute('data-id')
    return id && (kind === 'node' || kind === 'line' || kind === 'opening') ? { kind, id } : undefined
  }

  overlay.addEventListener('pointerover', (event) => {
    const ref = refAt(event.target)
    if (ref?.kind === hover?.kind && ref?.id === hover?.id) return
    hover = ref
    drawToolbar()
  })
  overlay.addEventListener('pointerdown', (event) => {
    const ref = refAt(event.target)
    if (!ref || event.button !== 0) return
    event.preventDefault()
    if (!cardAt) cardAt = { x: Math.min(window.innerWidth - 372, event.clientX + 28), y: Math.max(12, Math.min(window.innerHeight - 420, event.clientY - 40)) }
    select(ref)
    if (ref.kind === 'node' && !isCorner(ref.id)) startDrag(ref.id, event)
  })

  // Drag a node: changes the numbers of its placement, when they are plain numbers.
  function startDrag(id: string, down: PointerEvent): void {
    const def = nodeIn(doc, id)
    const start = frame.solved.nodes.get(id)
    if (!def || !start) return
    const kind = placeKind(def.at)
    const plain = (v: Num | undefined) => v === undefined || typeof v === 'number'
    const at = def.at
    const free = 'from' in at ? plain(at.dx) && plain(at.dy) : 'between' in at || 'on' in at ? plain(at.t) : false
    let moved = false
    let change: ((d: FrameGraph) => void) | undefined
    const move = (event: PointerEvent) => {
      if (!moved && Math.hypot(event.clientX - down.clientX, event.clientY - down.clientY) < 4) return
      moved = true
      if (!free) {
        flash = kind === 'cross' ? 'This node is level with one node and in line with another; change those, or its steps in the card.' : 'Its position follows a rule, not a plain number. Change the rule in the card.'
        drawCard()
        return
      }
      const box = frame.host.getBoundingClientRect()
      const x = event.clientX - box.left
      const y = event.clientY - box.top
      const solved = frame.solved
      const snap = (v: number, to: number) => Math.round(v / to) * to
      if ('from' in at) {
        const p = solved.nodes.get(at.from)
        if (!p) return
        const dx = snap((start.sx * (x - p.x)) / solved.m, 0.1)
        const dy = snap((start.sy * (y - p.y)) / solved.m, 0.1)
        change = (d) => Object.assign(nodeIn(d, id)!.at, { dx: Number(dx.toFixed(2)), dy: Number(dy.toFixed(2)) })
      } else if ('between' in at) {
        const a = solved.nodes.get(at.between[0])
        const b = solved.nodes.get(at.between[1])
        if (!a || !b) return
        const len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 || 1
        const t = Math.min(1, Math.max(0, ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / len2))
        change = (d) => Object.assign(nodeIn(d, id)!.at, { t: Number(snap(t, 0.005).toFixed(3)) })
      } else if ('on' in at) {
        const leader = solved.lines.get(at.on)
        if (!leader) return
        let best = 0
        let bestD = Infinity
        leader.pts.forEach((p, i) => {
          const dist = (p.x - x) ** 2 + (p.y - y) ** 2
          if (dist < bestD) {
            bestD = dist
            best = i
          }
        })
        const t = leader.len > 0 ? leader.cum[best]! / leader.len : 0
        change = (d) => Object.assign(nodeIn(d, id)!.at, { t: Number(snap(t, 0.005).toFixed(3)) })
      }
      if (change) preview(change)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (change) commit(change)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // ── Card building blocks ─────────────────────────────────────────────────────────────────
  const row = (label: string, ...controls: Child[]) => el('div', { class: 'row' }, el('label', {}, label), el('div', { class: 'controls' }, ...controls))
  const button = (label: string, action: () => void, attrs: Record<string, string> = {}) => {
    const b = el('button', { type: 'button', ...attrs }, label)
    b.addEventListener('click', action)
    return b
  }
  const chip = (ref: Ref) => button(ref.id, () => select(ref), { class: `chip ${ref.kind}` })

  // A field holding a number or an expression. Typing previews; leaving the field keeps it.
  // Up and down arrows nudge a plain number.
  function field(read: Num | undefined, write: (d: FrameGraph, value: Num | undefined) => void, opts: { hint?: string; wide?: boolean; required?: boolean; step?: number } = {}): HTMLInputElement {
    const input = el('input', { type: 'text', spellcheck: 'false', class: opts.wide ? 'expr wide' : 'expr', placeholder: opts.hint ?? '' })
    input.value = read === undefined ? '' : String(read)
    const value = () => parse(input.value)
    const bad = () => {
      const v = value()
      const problem = v === undefined ? (opts.required ? 'needs a value' : undefined) : problemWith(v)
      input.classList.toggle('bad', !!problem)
      input.title = problem ?? ''
      return !!problem
    }
    input.addEventListener('input', () => {
      if (!bad()) preview((d) => write(d, value()))
    })
    input.addEventListener('change', () => {
      if (bad()) return
      commit((d) => write(d, value()), false)
    })
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
      const v = value()
      if (typeof v !== 'number') return
      event.preventDefault()
      const by = (opts.step ?? 0.1) * (event.shiftKey ? 10 : 1) * (event.key === 'ArrowUp' ? 1 : -1)
      input.value = String(Number((v + by).toFixed(4)))
      commit((d) => write(d, value()), false)
    })
    return input
  }

  // A plain text field (names, inks, notes).
  function text(read: string | undefined, write: (d: FrameGraph, value: string) => string | undefined | void, opts: { hint?: string; rebuild?: boolean } = {}): HTMLInputElement {
    const input = el('input', { type: 'text', spellcheck: 'false', placeholder: opts.hint ?? '' })
    input.value = read ?? ''
    input.addEventListener('change', () => {
      if (!commit((d) => write(d, input.value.trim()), opts.rebuild ?? false)) input.value = read ?? ''
    })
    return input
  }

  function pick(options: (string | [string, string])[], value: string, onpick: (value: string) => void): HTMLSelectElement {
    const select = el('select')
    for (const option of options) {
      const [v, label] = typeof option === 'string' ? [option, option] : option
      const o = el('option', { value: v }, label)
      o.selected = v === value
      select.append(o)
    }
    select.addEventListener('change', () => onpick(select.value))
    return select
  }

  function segments(options: [string, string][], value: string, onpick: (value: string) => void): HTMLElement {
    return el('div', { class: 'segments' }, ...options.map(([v, label]) => button(label, () => onpick(v), { 'aria-pressed': String(v === value) })))
  }

  // The variants of a rule, editable. `at` finds the list in a document.
  function variantsEditor(variants: Variant[], at: (d: FrameGraph) => Variant[] | undefined, inUse = -1): HTMLElement {
    const box = el('div', { class: 'variants' })
    variants.forEach((variant, i) => {
      const set = (key: 'when' | 'cycles' | 'offset') => (d: FrameGraph, value: Num | undefined) => {
        const v = at(d)?.[i]
        if (!v) return
        if (value === undefined && key !== 'offset') delete v[key]
        else v[key] = value ?? 0
      }
      box.append(
        el(
          'div',
          { class: `variant${i === inUse ? ' used' : ''}` },
          el('div', { class: 'variant-head' }, el('span', {}, i === inUse ? `${i + 1} · in use now` : String(i + 1)), variants.length > 1 ? button('×', () => commit((d) => void at(d)?.splice(i, 1)), { class: 'icon', title: 'Remove this variant' }) : null),
          row('When', field(variant.when, set('when'), { hint: 'always', wide: true })),
          row('Cycles', field(variant.cycles, set('cycles'), { hint: 'not counted', wide: true })),
          row('Offset', field(variant.offset, set('offset'), { wide: true, required: true })),
          variant.note ? el('p', { class: 'note' }, variant.note) : null,
        ),
      )
    })
    box.append(button('+ Variant', () => commit((d) => void at(d)?.push({ offset: 0 }))))
    return box
  }

  // ── Cards ────────────────────────────────────────────────────────────────────────────────
  function nodeCard(id: string): Child[] {
    if (isCorner(id)) {
      return [
        el('p', { class: 'note' }, `The ${{ tl: 'top left', tr: 'top right', bl: 'bottom left', br: 'bottom right' }[id]} corner of the screen. It is given; everything else is measured from the four corners.`),
        el('div', { class: 'actions' }, button('+ Node from here', () => addFrom(id))),
        usedBy({ kind: 'node', id }),
      ]
    }
    const def = nodeIn(doc, id)
    if (!def) return [el('p', { class: 'note' }, 'This node is gone.')]
    const solved = frame.solved.nodes.get(id)
    const at = def.at
    const kind = placeKind(at)
    const others = nodeIds().filter((n) => n !== id)
    const lines = doc.lines.map((l) => l.id)
    const setAt = (key: string) => (d: FrameGraph, value: Num | undefined) => {
      const target = nodeIn(d, id)!.at as Record<string, unknown>
      if (value === undefined) delete target[key]
      else target[key] = value
    }
    const setRef = (apply: (at: Record<string, unknown>, value: string) => void) => (value: string) => commit((d) => apply(nodeIn(d, id)!.at as Record<string, unknown>, value))
    const place: Child[] = []
    if ('from' in at)
      place.push(row('From', pick(others, at.from, setRef((a, v) => (a.from = v)))), row('Step in', field(at.dx, setAt('dx'), { hint: '0' }), el('span', { class: 'unit' }, 'across'), field(at.dy, setAt('dy'), { hint: '0' }), el('span', { class: 'unit' }, 'down')))
    else if ('between' in at)
      place.push(
        row('Between', pick(others, at.between[0], setRef((a, v) => ((a.between as string[])[0] = v))), pick(others, at.between[1], setRef((a, v) => ((a.between as string[])[1] = v)))),
        row('Along', field(at.t, setAt('t'), { hint: '0.5', step: 0.01 }), el('span', { class: 'unit' }, '0 to 1'), field(at.off, setAt('off'), { hint: '0' }), el('span', { class: 'unit' }, 'aside')),
      )
    else if ('on' in at)
      place.push(row('Rides', pick(lines, at.on, setRef((a, v) => (a.on = v)))), row('Along', field(at.t, setAt('t'), { hint: '0.5', step: 0.01 }), el('span', { class: 'unit' }, '0 to 1'), field(at.off, setAt('off'), { hint: '0' }), el('span', { class: 'unit' }, 'aside')))
    else
      place.push(
        row('Across as', pick(others, at.x, setRef((a, v) => (a.x = v))), field(at.dx, setAt('dx'), { hint: '+0' })),
        row('Down as', pick(others, at.y, setRef((a, v) => (a.y = v))), field(at.dy, setAt('dy'), { hint: '+0' })),
      )

    const setNode = (key: keyof NodeDef) => (d: FrameGraph, value: Num | undefined) => {
      const target = nodeIn(d, id)! as unknown as Record<string, unknown>
      if (value === undefined) delete target[key]
      else target[key] = value
    }
    const layers = el('div', { class: 'variants' })
    ;(def.glyph ?? []).forEach((layer, i) => {
      const setLayer = (key: string) => (d: FrameGraph, value: Num | undefined) => {
        const target = nodeIn(d, id)!.glyph![i] as unknown as Record<string, unknown>
        if (value === undefined) delete target[key]
        else target[key] = value
      }
      const values = layer as unknown as Record<string, Num | undefined>
      layers.append(
        el(
          'div',
          { class: 'variant' },
          el(
            'div',
            { class: 'variant-head' },
            pick(Object.keys(LAYER_FIELDS), layer.kind, (v) => commit((d) => void (nodeIn(d, id)!.glyph![i] = { kind: v, ...(v === 'polygon' ? { sides: 4 } : v === 'circle' || v === 'spiral' ? {} : { n: 8 }), weight: layer.weight, fill: layer.fill } as Layer))),
            button('×', () => commit((d) => void nodeIn(d, id)!.glyph!.splice(i, 1)), { class: 'icon', title: 'Remove this layer' }),
          ),
          el('div', { class: 'grid' }, ...LAYER_FIELDS[layer.kind].flatMap((key) => [el('label', {}, key), field(values[key], setLayer(key))]), el('label', {}, 'weight'), field(layer.weight, setLayer('weight'), { hint: '1' }), el('label', {}, 'fill'), text(layer.fill, (d, v) => void setLayer('fill')(d, v || undefined), { hint: 'none' })),
        ),
      )
    })
    layers.append(button('+ Layer', () => commit((d) => void (nodeIn(d, id)!.glyph ??= []).push({ kind: 'circle', weight: 1 }))))

    return [
      def.note ? el('p', { class: 'note' }, def.note) : null,
      row('Name', text(def.id, (d, v) => rename({ kind: 'node', id }, v, d), { rebuild: true })),
      el('h3', {}, 'Placed'),
      segments(
        [
          ['from', 'A step from'],
          ['between', 'Between'],
          ['cross', 'Level with'],
          ['on', 'On a line'],
        ],
        kind,
        (v) => commit((d) => setPlaceKind(nodeIn(d, id)!, v as ReturnType<typeof placeKind>, d.lines[0]?.id)),
      ),
      ...place,
      row('Faces', pick([['', 'as its parent'], ['tl', 'like top left'], ['tr', 'like top right'], ['bl', 'like bottom left'], ['br', 'like bottom right']], def.frame ?? '', (v) => commit((d) => void (v ? (nodeIn(d, id)!.frame = v as NodeDef['frame']) : delete nodeIn(d, id)!.frame)))),
      solved ? el('p', { class: 'readout' }, `at ${show(solved.x / frame.solved.m)}, ${show(solved.y / frame.solved.m)} · ${Math.round(solved.x)}, ${Math.round(solved.y)} px`) : null,
      el('h3', {}, 'Body'),
      row('Radius', field(def.r, setNode('r'), { hint: '0' }), el('span', { class: 'unit' }, 'm'), el('span', { class: 'unit' }, 'turn'), field(def.turn, setNode('turn'), { hint: '0', step: 1 })),
      row('Only when', field(def.when, setNode('when'), { hint: 'always', wide: true })),
      el('h3', {}, 'Drawn as'),
      layers,
      usedBy({ kind: 'node', id }),
      el(
        'div',
        { class: 'actions' },
        button('+ Node from here', () => addFrom(id)),
        button('+ Line from here', () => {
          let made = ''
          if (commit((d) => void (made = addLine(d, { kind: 'node', id }, id === 'br' ? 'tl' : 'br').id))) select({ kind: 'line', id: made })
        }),
        button('Delete', () => drop({ kind: 'node', id })),
      ),
    ]
  }

  function endEditor(label: string, end: End | undefined, key: 'from' | 'to', id: string): Child[] {
    const ref = typeof end === 'string' ? { node: end } : (end ?? { node: 'tl' })
    const write = (apply: (e: { node: string; port?: Num; wrap?: 'cw' | 'ccw'; gap?: Num; ease?: Num }) => void) => (d: FrameGraph) => {
      const line = lineIn(d, id)!
      const current = line[key]
      const next = typeof current === 'string' ? { node: current } : { ...(current ?? { node: 'tl' }) }
      apply(next)
      line[key] = next.port === undefined && !next.wrap && next.gap === undefined && next.ease === undefined ? next.node : next
    }
    const setNum = (name: 'port' | 'gap' | 'ease') => (d: FrameGraph, value: Num | undefined) =>
      write((e) => {
        if (value === undefined) delete e[name]
        else e[name] = value
      })(d)
    return [
      row(
        label,
        pick(nodeIds(), ref.node, (v) => commit(write((e) => void (e.node = v)))),
        pick([['', 'straight in'], ['cw', 'winds clockwise'], ['ccw', 'winds anticlockwise']], ref.wrap ?? '', (v) => commit(write((e) => void (v ? (e.wrap = v as 'cw' | 'ccw') : delete e.wrap)))),
      ),
      row('', el('span', { class: 'unit' }, 'port'), field(ref.port, setNum('port'), { hint: 'facing', step: 5 }), el('span', { class: 'unit' }, '°  gap'), field(ref.gap, setNum('gap'), { hint: '0' })),
      row('', el('span', { class: 'unit' }, key === 'from' ? 'lets go over' : 'takes in over'), field(ref.ease, setNum('ease'), { hint: '0' }), el('span', { class: 'unit' }, 'm')),
    ]
  }

  function lineCard(id: string): Child[] {
    const def = lineIn(doc, id)
    if (!def) return [el('p', { class: 'note' }, 'This line is gone.')]
    const solved = frame.solved.lines.get(id)
    const setLine = (key: keyof LineDef) => (d: FrameGraph, value: Num | undefined) => {
      const target = lineIn(d, id)! as unknown as Record<string, unknown>
      if (value === undefined) delete target[key]
      else target[key] = value
    }
    const others = doc.lines.map((l) => l.id).filter((l) => l !== id)
    const runs: Child[] = def.along
      ? [
          row('Leader', pick(others, def.along, (v) => commit((d) => void (lineIn(d, id)!.along = v))), button('Go', () => select({ kind: 'line', id: def.along! }))),
          row(
            'Part of it',
            field(def.span?.[0], (d, v) => setSpan(d, 0, v), { hint: '0', step: 0.01 }),
            el('span', { class: 'unit' }, 'to'),
            field(def.span?.[1], (d, v) => setSpan(d, 1, v), { hint: '1', step: 0.01 }),
          ),
        ]
      : [
          ...endEditor('Leaves', def.from, 'from', id),
          ...endEditor('Meets', def.to, 'to', id),
          row(
            'Through',
            text((def.via ?? []).join(', '), (d, v) => {
              const via = v.split(',').map((s) => s.trim()).filter(Boolean)
              const missing = via.find((n) => !nodeIds().includes(n))
              if (missing) return `There is no node "${missing}".`
              if (via.length) lineIn(d, id)!.via = via
              else delete lineIn(d, id)!.via
            }, { hint: 'nodes, in order' }),
          ),
          row('Rounding', field(def.round, setLine('round'), { hint: '0' }), el('span', { class: 'unit' }, 'm at each')),
        ]
    function setSpan(d: FrameGraph, index: 0 | 1, value: Num | undefined): void {
      const line = lineIn(d, id)!
      const span: [Num, Num] = [line.span?.[0] ?? 0, line.span?.[1] ?? 1]
      span[index] = value ?? index
      if (span[0] === 0 && span[1] === 1) delete line.span
      else line.span = span
    }

    const named = typeof def.rule === 'string' ? def.rule : undefined
    const ruleNames = Object.keys(doc.rules ?? {})
    const variants = named ? doc.rules?.[named] : Array.isArray(def.rule) ? def.rule : undefined
    // Names the rule uses that nothing defines: the line's own values.
    const known = new Set([...Object.keys(frame.solved.env), 't', 's', 'len', 'n'])
    const wanted = new Set<string>(Object.keys(def.vars ?? {}))
    for (const v of variants ?? []) for (const src of [v.when, v.cycles, v.offset]) if (typeof src === 'string') for (const name of freeNames(src)) if (!known.has(name)) wanted.add(name)
    const vars = [...wanted].map((name) =>
      row(
        name,
        field(def.vars?.[name], (d, value) => {
          const line = lineIn(d, id)!
          if (value === undefined) {
            if (line.vars) delete line.vars[name]
          } else (line.vars ??= {})[name] = value
        }, { hint: 'not set' }),
      ),
    )
    const shape: Child[] = [
      row(
        'Rule',
        pick([['', 'none: its spine'], ...ruleNames.map((n): [string, string] => [n, n]), ['*', 'its own']], named ?? (variants ? '*' : ''), (v) =>
          commit((d) => {
            const line = lineIn(d, id)!
            if (v === '') delete line.rule
            else if (v === '*') line.rule = clone(variants ?? [{ offset: 0 }])
            else line.rule = v
          }),
        ),
        named ? button('Edit rule', () => select({ kind: 'panel', id: 'rules' })) : null,
      ),
      ...vars,
      !named && variants ? variantsEditor(variants, (d) => (Array.isArray(lineIn(d, id)?.rule) ? (lineIn(d, id)!.rule as Variant[]) : undefined), solved?.variant) : null,
      named && solved && variants?.[solved.variant] ? el('p', { class: 'readout' }, `using variant ${solved.variant + 1} of ${variants.length}${variants[solved.variant]!.note ? `: ${variants[solved.variant]!.note}` : ''}`) : null,
    ]
    const drawn = el('input', { type: 'checkbox' })
    drawn.checked = def.draw !== false
    drawn.addEventListener('change', () => commit((d) => void (drawn.checked ? delete lineIn(d, id)!.draw : (lineIn(d, id)!.draw = false))))

    return [
      def.note ? el('p', { class: 'note' }, def.note) : null,
      row('Name', text(def.id, (d, v) => rename({ kind: 'line', id }, v, d), { rebuild: true })),
      el('h3', {}, 'Runs'),
      segments(
        [
          ['own', 'Between nodes'],
          ['along', 'Along a line'],
        ],
        def.along ? 'along' : 'own',
        (v) =>
          commit((d) => {
            const line = lineIn(d, id)!
            if (v === 'along') {
              if (!others.length) return 'There is no other line to follow yet.'
              line.along = others[0]!
              delete line.from
              delete line.to
              delete line.via
            } else {
              const leader = lineIn(d, line.along ?? '')
              line.from = leader?.from ?? 'tl'
              line.to = leader?.to ?? 'br'
              delete line.along
              delete line.span
            }
            return undefined
          }),
      ),
      ...runs,
      solved ? el('p', { class: 'readout' }, `${show(solved.len / frame.solved.m)} m long · ${solved.n} cycle${solved.n === 1 ? '' : 's'}`) : null,
      el('h3', {}, 'Shape'),
      ...shape,
      el('h3', {}, 'Look'),
      row('Drawn', el('label', { class: 'check' }, drawn, def.draw === false ? 'no: a guide for others' : 'yes'), el('span', { class: 'unit' }, 'weight'), field(def.weight, setLine('weight'), { hint: '1' })),
      row('Weave', text(def.weave, (d, v) => void (v ? (lineIn(d, id)!.weave = v) : delete lineIn(d, id)!.weave), { hint: 'none' }), el('span', { class: 'unit' }, 'ink'), text(def.ink, (d, v) => void (v ? (lineIn(d, id)!.ink = v) : delete lineIn(d, id)!.ink), { hint: 'ink' })),
      row('Only when', field(def.when, setLine('when'), { hint: 'always', wide: true })),
      usedBy({ kind: 'line', id }),
      el(
        'div',
        { class: 'actions' },
        button('+ Strand along it', () => {
          let made = ''
          if (commit((d) => void (made = addLine(d, { kind: 'line', id }).id))) select({ kind: 'line', id: made })
        }),
        button('+ Node on it', () => {
          let made = ''
          if (
            commit((d) => {
              const node = addNode(d, 'tl')
              node.at = { on: id, t: 0.5 }
              made = node.id
            })
          )
            select({ kind: 'node', id: made })
        }),
        button('Delete', () => drop({ kind: 'line', id })),
      ),
    ]
  }

  function openingCard(id: string): Child[] {
    const def = openingIn(doc, id)
    if (!def) return [el('p', { class: 'note' }, 'This opening is gone.')]
    const solved = frame.solved.openings.find((o) => o.id === id)
    const edge = (label: string, key: 'left' | 'right' | 'top' | 'bottom') => {
      const value = def[key]
      const of = typeof value === 'object' ? value.of : ''
      const set = (next: GraphEdge) => (d: FrameGraph) => void (openingIn(d, id)![key] = next)
      return row(
        label,
        pick([['', 'a fixed place'], ...nodeIds().map((n): [string, string] => [n, n])], of, (v) => commit(set(v ? { of: v } : 0))),
        typeof value === 'object'
          ? field(value.add, (d, v) => set(v === undefined ? { of } : { of, add: v })(d), { hint: '+0' })
          : field(value, (d, v) => set(v ?? 0)(d), { required: true }),
      )
    }
    const scroll = el('input', { type: 'checkbox' })
    scroll.checked = def.scroll !== false
    scroll.addEventListener('change', () => commit((d) => void (scroll.checked ? delete openingIn(d, id)!.scroll : (openingIn(d, id)!.scroll = false))))
    const setOpening = (key: 'pad' | 'when') => (d: FrameGraph, value: Num | undefined) => {
      const target = openingIn(d, id)!
      if (value === undefined) delete target[key]
      else target[key] = value
    }
    return [
      el('p', { class: 'note' }, 'A space the frame leaves for content. Its edges are measured from nodes, so it moves with the frame.'),
      row(
        'Slot',
        text(def.id, (d, v) => {
          if (!v) return 'An opening needs a slot name.'
          if (v !== id && d.openings.some((o) => o.id === v)) return `There is already an opening for "${v}".`
          openingIn(d, id)!.id = v
          if (selected?.kind === 'opening') selected = { kind: 'opening', id: v }
        }, { rebuild: true }),
      ),
      edge('Left', 'left'),
      edge('Right', 'right'),
      edge('Top', 'top'),
      edge('Bottom', 'bottom'),
      solved ? el('p', { class: 'readout' }, `${Math.round(solved.width)} × ${Math.round(solved.height)} px`) : el('p', { class: 'readout' }, 'not on this screen'),
      row('Padding', field(def.pad, setOpening('pad'), { hint: '0' }), el('span', { class: 'unit' }, 'm'), el('label', { class: 'check' }, scroll, 'scrolls inside')),
      row('Only when', field(def.when, setOpening('when'), { hint: 'always', wide: true })),
      el('div', { class: 'actions' }, button('Delete', () => drop({ kind: 'opening', id }))),
    ]
  }

  function paramsCard(): Child[] {
    const name = el('input', { type: 'text', placeholder: 'new name', spellcheck: 'false' })
    return [
      el('p', { class: 'note' }, 'Named values the whole frame shares. Each may use the screen (W, H in modules; w, h in pixels) and the ones above it.'),
      row('Module', field(doc.module, (d, v) => void (d.module = v ?? 12), { wide: true, required: true })),
      el('p', { class: 'readout' }, `1 m = ${show(frame.solved.m)} px · screen ${show(frame.solved.env.W ?? 0)} × ${show(frame.solved.env.H ?? 0)} m`),
      el('h3', {}, 'Parameters'),
      ...Object.entries(doc.params).map(([key, value]) =>
        row(
          key,
          field(value, (d, v) => void (d.params[key] = v ?? 0), { wide: true, required: true }),
          typeof value === 'string' ? el('span', { class: 'unit', 'data-value': key }, `= ${show(frame.solved.env[key] ?? 0)}`) : null,
        ),
      ),
      row(
        '',
        name,
        button('+ Add', () =>
          commit((d) => {
            const key = name.value.trim()
            if (!/^[A-Za-z_]\w*$/.test(key)) return 'A parameter name is letters, digits and underscores, starting with a letter.'
            if (key in d.params || key in frame.solved.env) return `"${key}" is already taken.`
            d.params[key] = 1
            return undefined
          }),
        ),
      ),
    ]
  }

  function rulesCard(): Child[] {
    const name = el('input', { type: 'text', placeholder: 'new rule name', spellcheck: 'false' })
    const out: Child[] = [
      el('p', { class: 'note' }, 'A rule is how a line moves aside from its spine as it goes: t runs 0 to 1 along it, s is the distance, len its length, n the whole cycles fitted. The first variant whose "when" holds is used.'),
    ]
    for (const [key, variants] of Object.entries(doc.rules ?? {})) {
      const users = doc.lines.filter((l) => l.rule === key)
      out.push(el('h3', {}, key), el('p', { class: 'note' }, users.length ? `Used by ${users.map((l) => l.id).join(', ')}` : 'Not used yet'), variantsEditor(variants, (d) => d.rules?.[key]))
    }
    out.push(
      row(
        '',
        name,
        button('+ Rule', () =>
          commit((d) => {
            const key = name.value.trim()
            if (!/^[A-Za-z_][\w-]*$/.test(key)) return 'A rule name is letters, digits and dashes, starting with a letter.'
            if (d.rules?.[key]) return `There is already a rule called "${key}".`
            ;(d.rules ??= {})[key] = [{ cycles: 'len / 4', offset: '0.5 * sin(tau * n * t) * ramp(2)' }]
            return undefined
          }),
        ),
      ),
    )
    return out
  }

  function treeCard(): Child[] {
    const depth = depths(doc)
    const levels = new Map<number, string[]>()
    for (const n of doc.nodes) levels.set(depth.get(n.id) ?? 1, [...(levels.get(depth.get(n.id) ?? 1) ?? []), n.id])
    const out: Child[] = [
      el('p', { class: 'note' }, 'Everything in the frame, by how many relationships separate it from the corners of the screen.'),
      el('h3', {}, 'Given'),
      el('div', { class: 'chips' }, ...['tl', 'tr', 'bl', 'br'].map((id) => chip({ kind: 'node', id }))),
    ]
    for (const level of [...levels.keys()].sort((a, b) => a - b)) out.push(el('h3', {}, `Nodes, step ${level}`), el('div', { class: 'chips' }, ...levels.get(level)!.map((id) => chip({ kind: 'node', id }))))
    out.push(el('h3', {}, 'Lines'))
    const followers = (id: string): Child[] => doc.lines.filter((l) => l.along === id).map((l) => el('div', { class: 'branch' }, chip({ kind: 'line', id: l.id }), ...followers(l.id)))
    for (const l of doc.lines.filter((l) => !l.along)) out.push(el('div', { class: 'branch root' }, chip({ kind: 'line', id: l.id }), ...followers(l.id)))
    out.push(
      el('h3', {}, 'Openings'),
      el('div', { class: 'chips' }, ...doc.openings.map((o) => chip({ kind: 'opening', id: o.id }))),
      el(
        'div',
        { class: 'actions' },
        button('+ Opening', () => {
          let made = ''
          if (commit((d) => void d.openings.push({ id: (made = unique('slot', d.openings.map((o) => o.id))), left: 'W * 0.3', right: 'W * 0.7', top: 'H * 0.3', bottom: 'H * 0.7' } satisfies OpeningDef))) select({ kind: 'opening', id: made })
        }),
      ),
    )
    return out
  }

  function issuesCard(): Child[] {
    const issues = frame.solved.issues
    if (!issues.length) return [el('p', { class: 'note' }, 'Nothing is wrong on this screen.')]
    return issues.map((issue) =>
      el('p', { class: 'problem' }, issue.kind === 'node' || issue.kind === 'line' || issue.kind === 'opening' ? chip({ kind: issue.kind, id: issue.id }) : el('strong', {}, `${issue.kind} ${issue.id}`), ` ${issue.message}`),
    )
  }

  function usedBy(ref: Ref): Child {
    const users = dependents(doc, ref)
    if (!users.length) return null
    return el('div', {}, el('h3', {}, 'Measured from this'), el('div', { class: 'chips' }, ...users.map(chip)))
  }

  function addFrom(id: string): void {
    let made = ''
    if (commit((d) => void (made = addNode(d, id).id))) select({ kind: 'node', id: made })
  }

  function rename(ref: Ref, to: string, d: FrameGraph): string | undefined {
    const refusal = ref.kind === 'node' ? renameNode(d, ref.id, to) : renameLine(d, ref.id, to)
    if (!refusal) selected = { kind: ref.kind, id: to }
    return refusal
  }

  function drop(ref: Ref): void {
    if (commit((d) => remove(d, ref))) select(undefined)
  }

  // The names an expression reads (anything that is not a number, operator or function call).
  function freeNames(src: string): string[] {
    const names: string[] = []
    for (const match of src.matchAll(/[A-Za-z_][\w.]*(?!\w*\s*\()/g)) if (!['pi', 'tau', 'phi'].includes(match[0])) names.push(match[0])
    return names
  }

  function drawCard(): void {
    card.hidden = !selected
    if (!selected) return
    const titles: Record<Panel, string> = { params: 'Parameters', rules: 'Rules', tree: 'The frame', issues: 'Problems' }
    const title = selected.kind === 'panel' ? titles[selected.id] : `${selected.kind} · ${selected.id}`
    const body = selected.kind === 'panel' ? { params: paramsCard, rules: rulesCard, tree: treeCard, issues: issuesCard }[selected.id]() : selected.kind === 'node' ? nodeCard(selected.id) : selected.kind === 'line' ? lineCard(selected.id) : openingCard(selected.id)
    const head = el('header', {}, el('div', { class: 'crumbs' }, el('span', { class: 'crumb here' }, title)), button('×', () => select(undefined), { class: 'icon', title: 'Close (Esc)' }))
    head.addEventListener('pointerdown', (event) => {
      if (event.target instanceof HTMLButtonElement) return
      const box = card.getBoundingClientRect()
      const dx = event.clientX - box.left
      const dy = event.clientY - box.top
      const move = (e: PointerEvent) => {
        cardAt = { x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dx)), y: Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dy)) }
        placeCard()
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    })
    const scroll = card.scrollTop
    card.replaceChildren(head, flash ? el('p', { class: 'problem' }, flash) : '', el('div', { class: 'live' }), ...body.filter((c): c is Node | string => !!c))
    card.scrollTop = scroll
    placeCard()
    drawLive()
  }

  function placeCard(): void {
    const at = cardAt ?? { x: window.innerWidth - 372, y: 16 }
    card.style.left = `${Math.max(0, Math.min(window.innerWidth - 60, at.x))}px`
    card.style.top = `${Math.max(0, at.y)}px`
  }

  // The parts of the card that follow the drawing: problems with the selection, live values.
  function drawLive(): void {
    const live = card.querySelector('.live')
    if (!live || !selected) return
    const issues = selected.kind === 'panel' ? [] : issuesFor(selected)
    const absent = selected.kind === 'node' ? !frame.solved.nodes.has(selected.id) : selected.kind === 'line' ? !frame.solved.lines.has(selected.id) : selected.kind === 'opening' ? !frame.solved.openings.some((o) => o.id === selected!.id) : false
    live.replaceChildren(...issues.map((i) => el('p', { class: 'problem' }, i.message)), absent && !issues.length ? el('p', { class: 'note' }, 'Not on this screen: its "only when" does not hold here, or something it is measured from is absent.') : '')
    for (const out of card.querySelectorAll<HTMLElement>('[data-value]')) out.textContent = `= ${show(frame.solved.env[out.dataset.value!] ?? 0)}`
  }

  // ── Toolbar ──────────────────────────────────────────────────────────────────────────────
  function drawToolbar(): void {
    const s = frame.solved
    const issues = s.issues.length
    const panel = (id: Panel, label: string, attrs: Record<string, string> = {}) =>
      button(label, () => select(selected?.kind === 'panel' && selected.id === id ? undefined : { kind: 'panel', id }), { 'aria-pressed': String(selected?.kind === 'panel' && selected.id === id), ...attrs })
    const what = hover ? describe(hover) : `${Math.round(s.w)} × ${Math.round(s.h)} px · ${show(s.env.W ?? 0)} × ${show(s.env.H ?? 0)} m · m ${show(s.m)}`
    toolbar.replaceChildren(
      el('strong', {}, 'ELOI'),
      panel('tree', doc.id, { title: 'Everything in this frame' }),
      el('span', { class: 'stat what' }, what),
      button('X-ray', () => setXray(!xray), { 'aria-pressed': String(xray), title: 'Show what the frame is made of (X)' }),
      panel('params', 'Parameters'),
      panel('rules', 'Rules'),
      issues ? panel('issues', `${issues} problem${issues === 1 ? '' : 's'}`, { class: 'warn' }) : '',
      button('↶', () => step(undoStack, redoStack), { class: 'icon', title: 'Undo (⌘Z)', ...(undoStack.length ? {} : { disabled: '' }) }),
      button('↷', () => step(redoStack, undoStack), { class: 'icon', title: 'Redo (⇧⌘Z)', ...(redoStack.length ? {} : { disabled: '' }) }),
      el('span', { class: `status ${status}` }, status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving…' : 'Not saved'),
    )
  }

  function describe(ref: Ref): string {
    if (ref.kind === 'node') {
      if (isCorner(ref.id)) return `${ref.id} · a corner of the screen`
      const def = nodeIn(doc, ref.id)
      if (!def) return ref.id
      const by = placedBy(def.at)
      return `${ref.id} · ${by.line ? `rides ${by.line}` : `${placeKind(def.at) === 'between' ? 'between' : 'from'} ${by.nodes.join(' and ')}`}`
    }
    if (ref.kind === 'line') {
      const def = lineIn(doc, ref.id)
      if (!def) return ref.id
      const rule = typeof def.rule === 'string' ? ` · rule ${def.rule}` : def.rule ? ' · its own rule' : ''
      return `${ref.id} · ${def.along ? `along ${def.along}` : `${lineNodes(def).join(' → ')}`}${rule}${def.draw === false ? ' · guide' : ''}`
    }
    return `${ref.id} · opening`
  }

  function setXray(on: boolean): void {
    xray = on
    localStorage.setItem(XRAY_KEY, String(on))
    drawXray()
    drawToolbar()
  }

  // ── Wiring ───────────────────────────────────────────────────────────────────────────────
  const stopSolved = frame.on(() => {
    drawXray()
    drawLive()
    if (!hover) drawToolbar()
  })
  const onKey = (event: KeyboardEvent) => {
    const typing = event.composedPath().some((t) => t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement)
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      if (typing) return
      event.preventDefault()
      if (event.shiftKey) step(redoStack, undoStack)
      else step(undoStack, redoStack)
    } else if (event.key === 'Escape') select(undefined)
    else if (!typing && !event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 'x') setXray(!xray)
  }
  window.addEventListener('keydown', onKey)

  drawXray()
  drawCard()
  drawToolbar()

  return {
    external(next) {
      const text = JSON.stringify(next)
      if (text === JSON.stringify(doc) || sent.has(text)) return
      doc = clone(next)
      frame.setDoc(doc)
      drawCard()
      drawToolbar()
    },
    dispose() {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      stopSolved()
      mountPoint.remove()
    },
  }
}

