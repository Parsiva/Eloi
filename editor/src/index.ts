// The Eloi editor: an x-ray over a live frame. It draws every bay of the current plan on top of
// the real page, opens a floating card for whatever you click, and writes each change to the
// frame at once and to its file through `save`. Nothing is docked: a panel beside the page would
// change the page's width, and the frame's layout depends on that width.
//
// Development only. Hosts load it with a dynamic import behind a dev check, so it never ships.
import type { FrameHandle, FrameSpec, Plan, Rect, Size, Skin, Split } from '@eloi/engine'
import { addPart, canDrag, convertSize, dragDivider, findPart, findSplit, kindOf, movePart, removePart, renamePart, setKind, setSlot, sizeKind, sizeLabel, allSlots, type Kind, type SizeKind } from './doc'
import { STYLES } from './styles'

export interface EditorOptions {
  save(spec: FrameSpec): Promise<void>
  skin?: () => Skin // the skin being drawn, for "what draws on this part" hints
}

export interface EditorHandle {
  // The frame's file changed outside the editor (a hand edit, a git checkout). Echoes of the
  // editor's own saves are ignored.
  external(spec: FrameSpec): void
  dispose(): void
}

type Child = Node | string | null | undefined | false

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value)
  for (const child of children) if (child) el.append(child)
  return el
}

const clone = <T>(value: T): T => structuredClone(value)
const XRAY_KEY = 'eloi.editor.xray'

export function attachEditor(frame: FrameHandle, options: EditorOptions): EditorHandle {
  const controller = new AbortController()
  const { signal } = controller

  // ── State ──
  let doc = clone(frame.spec)
  frame.setSpec(doc)
  const undo: FrameSpec[] = []
  const redo: FrameSpec[] = []
  let selected: string | null = null
  let xray = readXray()
  let problem = ''
  let status: 'saved' | 'saving' | 'failed' = 'saved'
  let dragging = false
  const sent = new Map<string, number>() // JSON of our own saves → when, to recognise echoes

  // ── Layers ──
  // The x-ray sits inside the frame so it scrolls and resizes with it; cards and the toolbar
  // sit over the viewport. Both are shadow roots, so site styles and editor styles never mix.
  const layerHost = h('div', { 'data-eloi-editor': 'xray' })
  layerHost.style.cssText = 'position:absolute;inset:0;z-index:20;pointer-events:none'
  const layer = h('div', { class: 'xray' })
  layerHost.attachShadow({ mode: 'open' }).append(h('style', {}, STYLES), layer)
  frame.el.append(layerHost)

  const uiHost = h('div', { 'data-eloi-editor': 'ui' })
  uiHost.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none'
  const ui = uiHost.attachShadow({ mode: 'open' })
  const toolbar = h('div', { class: 'toolbar' })
  const card = h('div', { class: 'card', hidden: '' })
  ui.append(h('style', {}, STYLES), card, toolbar)
  document.body.append(uiHost)
  let cardAt = { x: 24, y: 24 }

  const plan = (): Plan => doc.plans.find((p) => p.id === frame.plan) ?? doc.plans[0]!
  const moduleNow = () => parseFloat(getComputedStyle(frame.el).getPropertyValue('--m')) || 8

  // ── Changing the document ──
  // `mutate` works on a copy; returning a string refuses the change with that message. The frame
  // validates the result, so an invalid document never reaches the page or the file.
  function commit(mutate: (next: FrameSpec, plan: Plan) => string | void): boolean {
    const next = clone(doc)
    const target = next.plans.find((p) => p.id === frame.plan) ?? next.plans[0]!
    const refused = mutate(next, target)
    if (typeof refused === 'string') return fail(refused)
    if (JSON.stringify(next) === JSON.stringify(doc)) return true
    try {
      frame.setSpec(next)
    } catch (err) {
      return fail(err instanceof Error ? err.message : String(err))
    }
    undo.push(doc)
    redo.length = 0
    doc = next
    problem = ''
    queueSave()
    render()
    return true
  }

  function fail(message: string): false {
    problem = message
    render()
    return false
  }

  function step(from: FrameSpec[], to: FrameSpec[]) {
    const next = from.pop()
    if (!next) return
    to.push(doc)
    doc = next
    frame.setSpec(doc)
    problem = ''
    queueSave()
    render()
  }

  // Saves run one at a time; edits made while one is in flight are sent as one more save after.
  let timer = 0
  let saving = false
  let dirty = false
  function queueSave() {
    status = 'saving'
    clearTimeout(timer)
    timer = window.setTimeout(() => void flush(), 120)
  }
  async function flush() {
    if (saving) {
      dirty = true
      return
    }
    saving = true
    do {
      dirty = false
      const text = JSON.stringify(doc)
      const now = Date.now()
      for (const [key, at] of sent) if (now - at > 5000) sent.delete(key)
      sent.set(text, now)
      try {
        await options.save(doc)
        status = dirty ? 'saving' : 'saved'
      } catch (err) {
        console.error('Eloi editor: saving the frame failed', err)
        status = 'failed'
      }
    } while (dirty && !signal.aborted)
    saving = false
    drawToolbar()
  }

  // ── Selection ──
  function select(id: string | null, near?: { x: number; y: number }) {
    selected = id
    problem = ''
    if (id && near) cardAt = { x: near.x + 18, y: near.y + 12 }
    render()
  }

  function render() {
    if (selected && selected !== 'sheet' && !findPart(plan(), selected)) selected = null
    drawXray()
    drawCard()
    drawToolbar()
  }

  // ── X-ray ──
  // Elements are kept by key and moved, never rebuilt, so a line being dragged keeps the pointer.
  const marks = new Map<string, HTMLElement>()
  function drawXray() {
    layer.hidden = !xray
    if (!xray) return
    const rects = frame.bays()
    const used = new Set<string>()
    const place = (key: string, make: () => HTMLElement, r: Rect): HTMLElement => {
      let el = marks.get(key)
      if (!el) {
        el = make()
        marks.set(key, el)
      }
      // Re-appending keeps paint order (parents under their parts), but would drop the pointer
      // from a line being dragged, so the order is left alone until the drag ends.
      if (!dragging || !el.isConnected) layer.append(el)
      el.style.left = `${r.x}px`
      el.style.top = `${r.y}px`
      el.style.width = `${r.w}px`
      el.style.height = `${r.h}px`
      used.add(key)
      return el
    }
    const bay = (id: string, kind: Kind, label: string, r: Rect) => {
      const el = place(`bay:${id}`, () => {
        const made = h('div', { class: 'bay' }, h('span', { class: 'tag' }))
        made.addEventListener('click', (e) => select(id, { x: e.clientX, y: e.clientY }))
        return made
      }, r)
      el.dataset.kind = kind
      el.toggleAttribute('data-selected', id === selected)
      el.firstElementChild!.textContent = label
    }
    const walk = (split: Split, id: string) => {
      const here = rects[id]
      const axis = split.split
      split.parts.forEach((part) => {
        const r = rects[part.id]
        if (!r) return
        const kind = kindOf(part)
        const name = kind === 'opening' ? (part.region as { opening: string }).opening : part.id
        bay(part.id, kind, `${name} · ${sizeLabel(part.size)}`, r)
        if (kind === 'rows' || kind === 'cols') walk(part.region as Split, part.id)
      })
      // The lines between neighbours, where one of the two can take a drag.
      split.parts.forEach((part, i) => {
        const before = split.parts[i - 1]
        const a = before && rects[before.id]
        const b = rects[part.id]
        if (!before || !a || !b || !here || !canDrag(before, part)) return
        const at = axis === 'cols' ? (a.x + a.w + b.x) / 2 : (a.y + a.h + b.y) / 2
        const r = axis === 'cols' ? { x: at - 5, y: here.y, w: 10, h: here.h } : { x: here.x, y: at - 5, w: here.w, h: 10 }
        const key = `line:${id}:${part.id}`
        const el = place(key, () => {
          const made = h('div', { class: 'line', title: 'Drag to resize' })
          made.addEventListener('pointerdown', (e) => startDrag(e, made, id, part.id))
          return made
        }, r)
        el.dataset.axis = axis
      })
    }
    const sheet = rects.sheet
    if (sheet) bay('sheet', plan().sheet.split, 'sheet', sheet)
    walk(plan().sheet, 'sheet')
    for (const [key, el] of marks) {
      if (used.has(key)) continue
      el.remove()
      marks.delete(key)
    }
  }

  // Dragging a line previews on the live frame; letting go makes it one undo step and one save.
  function startDrag(e: PointerEvent, el: HTMLElement, splitId: string, partId: string) {
    if (e.button !== 0) return
    e.preventDefault()
    const base = doc
    const basePlan = plan()
    const split = findSplit(basePlan, splitId)
    if (!split) return
    const index = split.parts.findIndex((p) => p.id === partId)
    const rects = frame.bays()
    const axis = split.split
    const px = split.parts.map((p) => (axis === 'cols' ? rects[p.id]?.w : rects[p.id]?.h) ?? 0)
    const m = moduleNow()
    const origin = axis === 'cols' ? e.clientX : e.clientY
    let preview: FrameSpec | null = null
    dragging = true
    el.setPointerCapture(e.pointerId)
    el.setAttribute('data-active', '')
    const move = (ev: PointerEvent) => {
      const delta = (axis === 'cols' ? ev.clientX : ev.clientY) - origin
      const next = clone(base)
      const target = findSplit(next.plans.find((p) => p.id === basePlan.id)!, splitId)!
      if (!dragDivider(target, index, delta, px, m)) return
      try {
        frame.setSpec(next)
        preview = next
      } catch {
        // An invalid step of the drag is skipped; the frame keeps the last good one.
      }
    }
    const end = () => {
      el.removeEventListener('pointermove', move)
      el.removeAttribute('data-active')
      dragging = false
      if (preview && JSON.stringify(preview) !== JSON.stringify(base)) {
        undo.push(base)
        redo.length = 0
        doc = preview
        queueSave()
      }
      render()
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', end, { once: true })
    el.addEventListener('pointercancel', end, { once: true })
  }

  // ── The card ──
  function drawCard() {
    const focusKey = (ui.activeElement as HTMLElement | null)?.dataset?.k
    card.hidden = !selected
    if (!selected) return
    card.replaceChildren(...(selected === 'sheet' ? sheetCard() : partCard(selected)).filter((c): c is Node | string => !!c))
    // Keep the card on screen, wherever the click was.
    const w = card.offsetWidth
    const ht = card.offsetHeight
    cardAt.x = Math.max(8, Math.min(innerWidth - w - 8, cardAt.x))
    cardAt.y = Math.max(8, Math.min(innerHeight - ht - 64, cardAt.y))
    card.style.left = `${cardAt.x}px`
    card.style.top = `${cardAt.y}px`
    if (focusKey) card.querySelector<HTMLElement>(`[data-k="${focusKey}"]`)?.focus()
  }

  function header(trail: string[]): HTMLElement {
    const crumbs = trail.flatMap((id, i) => {
      const last = i === trail.length - 1
      const b = h('button', { type: 'button', class: last ? 'crumb here' : 'crumb' }, id)
      if (!last) b.addEventListener('click', () => select(id))
      return i ? [h('span', { class: 'sep' }, '›'), b] : [b]
    })
    const close = h('button', { type: 'button', class: 'icon', title: 'Close (Esc)' }, '×')
    close.addEventListener('click', () => select(null))
    const head = h('header', {}, h('div', { class: 'crumbs' }, ...crumbs), close)
    head.addEventListener('pointerdown', (e) => {
      if ((e.target as Element).closest('button')) return
      const start = { x: e.clientX - cardAt.x, y: e.clientY - cardAt.y }
      head.setPointerCapture(e.pointerId)
      const move = (ev: PointerEvent) => {
        cardAt = { x: ev.clientX - start.x, y: ev.clientY - start.y }
        card.style.left = `${cardAt.x}px`
        card.style.top = `${cardAt.y}px`
      }
      head.addEventListener('pointermove', move)
      head.addEventListener('pointerup', () => head.removeEventListener('pointermove', move), { once: true })
    })
    return head
  }

  const row = (label: string, ...controls: Child[]) => h('div', { class: 'row' }, h('label', {}, label), h('div', { class: 'controls' }, ...controls))
  const note = (text: string, cls = 'note') => h('p', { class: cls }, text)

  function text(key: string, value: string, onChange: (v: string) => void, list?: string[]): HTMLElement {
    const input = h('input', { type: 'text', value, 'data-k': key, spellcheck: 'false' })
    input.addEventListener('change', () => onChange(input.value))
    if (!list?.length) return input
    const id = `list-${key}`
    input.setAttribute('list', id)
    return h('span', { class: 'grow' }, input, h('datalist', { id }, ...list.map((v) => h('option', { value: v }))))
  }

  function number(key: string, value: number, onChange: (v: number) => void, stepBy = 1, min = 0): HTMLInputElement {
    const input = h('input', { type: 'number', value: String(value), step: String(stepBy), min: String(min), 'data-k': key })
    input.addEventListener('change', () => {
      const v = Number(input.value)
      if (Number.isFinite(v) && v >= min) onChange(v)
    })
    return input
  }

  function choose<T extends string>(key: string, value: T, choices: [T, string][], onChange: (v: T) => void): HTMLSelectElement {
    const el = h('select', { 'data-k': key }, ...choices.map(([v, label]) => h('option', v === value ? { value: v, selected: '' } : { value: v }, label)))
    el.addEventListener('change', () => onChange(el.value as T))
    return el
  }

  function segments<T extends string>(key: string, value: T, choices: [T, string][], onChange: (v: T) => void): HTMLElement {
    return h(
      'div',
      { class: 'segments' },
      ...choices.map(([v, label]) => {
        const b = h('button', { type: 'button', 'aria-pressed': String(v === value), 'data-k': `${key}:${v}` }, label)
        b.addEventListener('click', () => onChange(v))
        return b
      }),
    )
  }

  function action(label: string, run: () => void, title?: string): HTMLButtonElement {
    const b = h('button', { type: 'button', 'data-k': `act:${label}` }, label)
    if (title) b.title = title
    b.addEventListener('click', run)
    return b
  }

  const SIZE_KINDS: [SizeKind, string][] = [
    ['auto', 'Fit its content'],
    ['fr', 'Share of what is left'],
    ['m', 'Modules (scales with width)'],
    ['px', 'Pixels (never scales)'],
    ['member', 'Depth of a drawn border'],
    ['css', 'CSS expression'],
  ]

  // Controls for one size. `px` is the length on screen now, used when the kind changes so the
  // part stays about as big as it was. With `optional`, "none" removes the size.
  function sizeControls(key: string, size: Size | undefined, px: number, set: (next: Size | undefined) => void, optional = false): Child[] {
    const named = (options.skin?.().members ?? []).flatMap((mb) => ('name' in mb && mb.name ? [mb.name] : []))
    const kinds = (optional ? [['none', 'None'], ...SIZE_KINDS.filter(([k]) => k !== 'auto' && k !== 'fr')] : SIZE_KINDS) as [SizeKind | 'none', string][]
    const kind: SizeKind | 'none' = size === undefined ? 'none' : sizeKind(size)
    const out: Child[] = [
      choose(`${key}:kind`, kind, kinds, (k) => set(k === 'none' ? undefined : convertSize(k, px, moduleNow(), named[0]))),
    ]
    if (size === undefined || size === 'auto') return out
    if ('fr' in size) out.push(number(`${key}:v`, size.fr, (v) => set({ fr: v }), 0.25, 0.05))
    else if ('m' in size) out.push(number(`${key}:v`, size.m, (v) => set({ m: v }), 0.25), h('span', { class: 'unit' }, 'm'))
    else if ('px' in size) out.push(number(`${key}:v`, size.px, (v) => set({ px: v })), h('span', { class: 'unit' }, 'px'))
    else if ('member' in size) {
      out.push(
        text(`${key}:member`, size.member, (v) => set({ ...size, member: v.trim() || size.member }), named),
        h('span', { class: 'unit' }, '+'),
        number(`${key}:plus`, size.plus ?? 0, (v) => set(v ? { member: size.member, plus: v } : { member: size.member }), 0.25),
        h('span', { class: 'unit' }, 'm'),
      )
    } else out.push(text(`${key}:css`, size.css, (v) => v.trim() && set({ css: v.trim() })))
    return out
  }

  function planNote(): HTMLElement {
    const p = plan()
    const classes = p.when?.classes
    const mins = classes?.map((name) => doc.classes.find((c) => c.name === name)?.min).filter((v) => v !== undefined) as number[] | undefined
    const range = !classes ? 'used when no other plan applies' : `used for ${classes.join(', ')}${mins?.length ? ` (from ${Math.min(...mins)} px wide)` : ''}`
    const others = doc.plans.length - 1
    return note(`Editing plan “${p.id}”, ${range}.${others ? ` Resize the window to edit the other ${others === 1 ? 'plan' : `${others} plans`}.` : ''}`, 'foot')
  }

  function splitRows(id: string, split: Split, r: Rect | undefined): Child[] {
    const set = (key: 'gap' | 'pad') => (next: Size | undefined) =>
      commit((_d, p) => {
        const target = findSplit(p, id)!
        if (next === undefined) delete target[key]
        else target[key] = next
      })
    const add = action('+ Add a part inside', () =>
      commit((_d, p) => {
        const made = addPart(p, id, 'inside')
        if (typeof made === 'string') return made
        selected = made.id
      }),
    )
    const base = r ? Math.min(r.w, r.h) / 20 : 8
    return [row('Space between', ...sizeControls('gap', split.gap, base, set('gap'), true)), row('Inner padding', ...sizeControls('pad', split.pad, base, set('pad'), true)), h('div', { class: 'actions' }, add)]
  }

  function partCard(id: string): Child[] {
    const p = plan()
    const found = findPart(p, id)
    if (!found) return []
    const { part, parent } = found
    const kind = kindOf(part)
    const r = frame.bays()[id]
    const along = parent.split === 'cols' ? 'Width' : 'Height'
    const px = r ? (parent.split === 'cols' ? r.w : r.h) : 0
    const uses = (options.skin?.().members ?? []).filter((mb) => mb.bay === id).length
    const out: Child[] = [header(found.trail)]

    out.push(row('Name', text('name', part.id, (v) => commit((_d, pl) => {
      const refused = renamePart(pl, id, v)
      if (refused) return refused
      selected = v.trim()
    }))))
    if (uses) out.push(note(`The skin draws ${uses} ${uses === 1 ? 'thing' : 'things'} on “${id}”. Renaming or deleting it leaves them undrawn.`))

    out.push(row(along, ...sizeControls('size', part.size, px, (next) => commit((_d, pl) => {
      findPart(pl, id)!.part.size = next ?? 'auto'
    }))))
    if (r) out.push(note(`Now ${Math.round(r.w)} × ${Math.round(r.h)} px on screen.`, 'readout'))

    out.push(
      row(
        'Holds',
        segments('kind', kind, [['opening', 'Content'], ['band', 'Decoration'], ['rows', 'Rows'], ['cols', 'Columns']], (k) => commit((_d, pl) => setKind(pl, id, k))),
      ),
    )
    if (kind === 'opening') {
      const region = part.region as { opening: string; fit?: 'flow' | 'fixed' }
      const slots = [...new Set(doc.plans.flatMap((pl) => [...allSlots(pl)]))].filter((s) => !allSlots(p).has(s))
      out.push(row('Content slot', text('slot', region.opening, (v) => commit((_d, pl) => setSlot(pl, id, v)), slots)))
      out.push(
        row(
          'Its height',
          segments('fit', region.fit ?? 'flow', [['flow', 'From its content'], ['fixed', 'Set by the frame']], (fit) =>
            commit((_d, pl) => {
              const target = findPart(pl, id)!.part.region as { fit?: 'flow' | 'fixed' }
              if (fit === 'flow') delete target.fit
              else target.fit = fit
            }),
          ),
        ),
      )
      out.push(note(`The page's element with data-slot="${region.opening}" is placed here.`))
    } else if (kind === 'band') {
      out.push(note('Reserved for drawing: borders, rules and ornament. No page content goes here.'))
    } else out.push(...splitRows(id, part.region as Split, r))

    const [back, fwd] = parent.split === 'cols' ? ['←', '→'] : ['↑', '↓']
    out.push(
      h(
        'div',
        { class: 'actions' },
        action(`+ ${parent.split === 'cols' ? 'Left' : 'Above'}`, () => commit((_d, pl) => {
          const made = addPart(pl, id, 'before')
          if (typeof made === 'string') return made
          selected = made.id
        }), 'Add a part before this one'),
        action(`+ ${parent.split === 'cols' ? 'Right' : 'Below'}`, () => commit((_d, pl) => {
          const made = addPart(pl, id, 'after')
          if (typeof made === 'string') return made
          selected = made.id
        }), 'Add a part after this one'),
        action(back, () => commit((_d, pl) => movePart(pl, id, -1)), 'Move earlier'),
        action(fwd, () => commit((_d, pl) => movePart(pl, id, 1)), 'Move later'),
        action('Delete', () => commit((_d, pl) => {
          const refused = removePart(pl, id)
          if (refused) return refused
          selected = found.trail[found.trail.length - 2] ?? null
        })),
      ),
    )
    if (problem) out.push(note(problem, 'problem'))
    out.push(planNote())
    return out
  }

  function sheetCard(): Child[] {
    const p = plan()
    const r = frame.bays().sheet
    const out: Child[] = [header(['sheet'])]
    out.push(note('The whole frame. Its parts are the top-level rows or columns.'))
    out.push(
      row(
        'Split into',
        segments('dir', p.sheet.split, [['rows', 'Rows'], ['cols', 'Columns']], (dir) => commit((_d, pl) => {
          pl.sheet.split = dir
        })),
      ),
    )
    out.push(...splitRows('sheet', p.sheet, r))

    // The module: the unit every "m" size is measured in, growing with the frame's width.
    const [w0, m0] = doc.module.from
    const [w1, m1] = doc.module.to
    const setModule = (i: 0 | 1, j: 0 | 1) => (v: number) =>
      commit((d) => {
        const end = i === 0 ? d.module.from : d.module.to
        end[j] = v
        if (d.module.to[0] <= d.module.from[0]) return 'The second width must be larger than the first.'
      })
    out.push(h('h3', {}, 'Module (the “m” unit)'))
    out.push(row('Narrow', number('m00', m0, setModule(0, 1), 0.25, 1), h('span', { class: 'unit' }, 'px at'), number('m01', w0, setModule(0, 0), 10), h('span', { class: 'unit' }, 'px wide')))
    out.push(row('Wide', number('m10', m1, setModule(1, 1), 0.25, 1), h('span', { class: 'unit' }, 'px at'), number('m11', w1, setModule(1, 0), 10), h('span', { class: 'unit' }, 'px wide')))
    out.push(note(`Now ${moduleNow()} px. It grows evenly between the two widths and holds outside them.`, 'readout'))

    out.push(h('h3', {}, 'Width classes'))
    doc.classes.forEach((c, i) => {
      const used = doc.plans.filter((pl) => pl.when?.classes?.includes(c.name)).map((pl) => pl.id)
      const from = i === 0 ? h('span', { class: 'unit' }, 'any width') : number(`class${i}`, c.min, (v) => commit((d) => {
        d.classes[i]!.min = v
        if (d.classes.some((x, k) => k > 0 && x.min <= d.classes[k - 1]!.min)) return 'Each class must start wider than the one before it.'
      }), 10)
      out.push(row(c.name, i === 0 ? null : h('span', { class: 'unit' }, 'from'), from, i === 0 ? null : h('span', { class: 'unit' }, 'px'), h('span', { class: 'unit dim' }, used.length ? `→ plan ${used.join(', ')}` : '→ fallback plan')))
    })
    if (problem) out.push(note(problem, 'problem'))
    out.push(planNote())
    return out
  }

  // ── Toolbar ──
  function drawToolbar() {
    const focusKey = (ui.activeElement as HTMLElement | null)?.dataset?.k
    const width = Math.round(frame.el.getBoundingClientRect().width)
    const toggle = h('button', { type: 'button', 'aria-pressed': String(xray), 'data-k': 'xray', title: 'Show the frame’s structure (X)' }, 'X-ray')
    toggle.addEventListener('click', () => setXray(!xray))
    const back = h('button', { type: 'button', class: 'icon', 'data-k': 'undo', title: 'Undo (⌘Z)' }, '↶')
    const fwd = h('button', { type: 'button', class: 'icon', 'data-k': 'redo', title: 'Redo (⇧⌘Z)' }, '↷')
    back.disabled = !undo.length
    fwd.disabled = !redo.length
    back.addEventListener('click', () => step(undo, redo))
    fwd.addEventListener('click', () => step(redo, undo))
    const whole = h('button', { type: 'button', 'data-k': 'sheet', title: 'Frame settings: module, width classes' }, doc.id)
    whole.addEventListener('click', (e) => select('sheet', { x: e.clientX - 160, y: 80 }))
    const label = { saved: 'Saved', saving: 'Saving…', failed: 'Not saved' }[status]
    toolbar.replaceChildren(
      h('strong', {}, 'Eloi'),
      whole,
      h('span', { class: 'stat' }, `plan ${frame.plan}`),
      h('span', { class: 'stat' }, `${width} px`),
      h('span', { class: 'stat' }, `m ${moduleNow()}`),
      toggle,
      back,
      fwd,
      h('span', { class: `status ${status}` }, label),
    )
    if (focusKey) toolbar.querySelector<HTMLElement>(`[data-k="${focusKey}"]`)?.focus()
  }

  function setXray(on: boolean) {
    xray = on
    if (!on) selected = null
    try {
      localStorage.setItem(XRAY_KEY, String(on))
    } catch {
      // Storage can be unavailable; the choice then lasts for this visit only.
    }
    render()
  }

  // ── Wiring ──
  const stopSolved = frame.on('solved', () => {
    drawXray()
    drawToolbar()
    // A resize can change the plan, and so what the open card describes.
    if (!dragging && selected && cardPlan !== frame.plan) render()
    cardPlan = frame.plan
  })
  let cardPlan = frame.plan

  addEventListener(
    'keydown',
    (e) => {
      const target = e.composedPath()[0] as HTMLElement | undefined
      const typing = !!target?.matches?.('input, textarea, select, [contenteditable]')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault()
        if (e.shiftKey) step(redo, undo)
        else step(undo, redo)
      } else if (e.key === 'Escape' && selected) select(null)
      else if (e.key.toLowerCase() === 'x' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) setXray(!xray)
    },
    { signal },
  )

  render()

  return {
    external(spec) {
      const text = JSON.stringify(spec)
      if (text === JSON.stringify(doc) || sent.has(text)) return
      const next = clone(spec)
      try {
        frame.setSpec(next)
      } catch (err) {
        console.error('Eloi editor: the frame file is not valid, keeping the last good frame', err)
        return
      }
      undo.push(doc)
      redo.length = 0
      doc = next
      render()
    },
    dispose() {
      controller.abort()
      clearTimeout(timer)
      stopSolved()
      layerHost.remove()
      uiHost.remove()
    },
  }
}

function readXray(): boolean {
  try {
    return localStorage.getItem(XRAY_KEY) !== 'false'
  } catch {
    return true
  }
}

export { attachGraphEditor } from './graph'
export type { GraphEditorHandle, GraphEditorOptions } from './graph'
