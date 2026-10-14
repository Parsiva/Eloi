// mount(): the host contract (system.md §7.5). The frame owns the page's geometry: it builds the
// chosen plan as nested CSS grids, puts each box's element in its opening, measures once per
// layout change, and draws the skin's members on an SVG layer above. Hosts own what goes in the
// openings. Everything the frame creates is released by dispose().
import { batch, effect, signal, type ReadonlySignal, type Signal } from '@preact/signals-core'
import { Box, type BoxDef, type BoxEvent, type BoxState, type BoxStats, type FrameLink } from './boxes'
import { listen, live } from './debug'
import { drawMembers, memberDepths, type Rect } from './draw/members'
import { isOpening, isSplit, memberVar, slotsOf, splitTemplate, sizeToCss, validatePlan, walkParts } from './layout/css'
import { choosePlan, moduleAt, roomLevel, widthClass } from './layout/room'
import { defaultScheduler, type Job, type Scheduler, type SchedulerStats } from './scheduler'
import type { FrameSpec, Plan, Skin, Split, Sprite } from './spec'
import { retainSprite, retainStyles } from './styles'

export interface MountOptions {
  skin: Skin
  sprite?: Sprite
  route?: string
  scheduler?: Scheduler
  reducedMotion?: 'auto' | boolean
  boxes?: Record<string, BoxDef<any>>
  transitions?: boolean // view transitions on plan changes (default true)
}

export interface Overlay {
  bays?: boolean
  openings?: boolean
  datums?: boolean
}

export interface FrameStats {
  width: number
  cls: string
  plan: string
  skin: string
  m: number
  solveMs: number
  draws: number
  scheduler: SchedulerStats
  boxes: BoxStats[]
}

export interface BoxHandle {
  readonly el: HTMLElement
  readonly state: ReadonlySignal<BoxState>
  input(value: unknown): void
  retry(): void
}

export interface FrameHandle {
  readonly el: HTMLElement
  readonly spec: FrameSpec
  readonly stats: ReadonlySignal<FrameStats>
  readonly route: ReadonlySignal<string | undefined>
  // Change route; `during` runs inside the view transition (update boxes' inputs there, so the
  // "before" snapshot still shows the old state).
  setRoute(route: string, during?: () => void): Promise<void>
  setSkin(skin: Skin): void
  setReducedMotion(value: 'auto' | boolean): void
  setOverlay(overlay: Overlay): void
  define(slot: string, def: BoxDef<any>): void
  box(slot: string): BoxHandle | undefined
  opening(slot: string): HTMLElement | undefined
  channel<T>(name: string, initial: T): Signal<T>
  emit(type: string, detail?: unknown): void
  on(type: string, fn: (e: BoxEvent) => void): () => void
  flush(): void
  dispose(): Promise<void>
}

let frameCount = 0

export function mount(host: HTMLElement, spec: FrameSpec, options: MountOptions): FrameHandle {
  for (const plan of spec.plans) {
    const issues = validatePlan(plan)
    if (issues.length) throw new Error(`Eloi: invalid frame spec "${spec.id}":\n${issues.join('\n')}`)
  }

  const n = ++frameCount
  const ids = `eloi${n}`
  const scheduler = options.scheduler ?? defaultScheduler
  const controller = new AbortController()
  const releaseStyles = retainStyles()
  const releaseSprite = options.sprite ? retainSprite(options.sprite.prefix, options.sprite.svg) : () => {}
  live.frames++

  // ── State ──
  let skin = options.skin
  let width = 0
  let cls = ''
  let m = 0
  let plan: Plan | undefined
  let overlay: Overlay = {}
  let solveMs = 0
  let draws = 0
  let lastInk = ''
  let markerX: number | undefined
  let disposed = false
  const route = signal<string | undefined>(options.route)
  const reducedMotionSetting = signal<'auto' | boolean>(options.reducedMotion ?? 'auto')
  const mediaReduced = signal(matchMedia('(prefers-reduced-motion: reduce)').matches)
  const reducedMotion = signal(false)
  const stats = signal<FrameStats>(emptyStats())
  const channels = new Map<string, Signal<unknown>>()
  const subscribers = new Map<string, Set<(e: BoxEvent) => void>>()

  // Frame jobs; the functions they call are declared below.
  const restructureJob: Job = {
    write: () => restructure(),
    onError: (err) => console.error('Eloi: restructure failed', err),
  }
  const geometryJob: Job = { write: () => pushGeometry() }
  const statsJob: Job = { write: () => publishStats() }

  // ── DOM ──
  host.classList.add('eloi-frame')
  host.dataset.frame = spec.id
  const ink = svgEl('eloi-ink')
  const over = svgEl('eloi-overlay')
  let sheet = document.createElement('div')
  const bays = new Map<string, HTMLElement>() // part id → element, current plan
  const axisOf = new Map<string, 'cols' | 'rows'>() // part id → its parent split's axis
  const slotOfBay = new Map<string, string>() // part id → slot, current plan

  // Boxes: host children with data-slot become the openings' elements, keeping their content as
  // the static fallback. Slots no host element names get an empty element.
  const boxes = new Map<string, Box>()
  const link: FrameLink = {
    frameId: spec.id,
    scheduler,
    reducedMotion,
    signal: controller.signal,
    emit: (e) => dispatch(e),
    listen: (type, fn, sig) => subscribe(type, fn, sig),
    channel: (name, initial) => channel(name, initial),
    observeVisible: (el, fn) => observeVisible(el, fn),
    changed: () => scheduler.request(statsJob),
  }
  const hostSlots = [...host.children].filter((c): c is HTMLElement => c instanceof HTMLElement && !!c.dataset.slot)
  for (const el of hostSlots) {
    el.remove()
    addBox(el.dataset.slot!, el)
  }
  for (const p of spec.plans) for (const slot of slotsOf(p)) if (!boxes.has(slot)) addBox(slot, document.createElement('div'))
  for (const [slot, def] of Object.entries(options.boxes ?? {})) boxFor(slot).define(def)
  host.append(sheet, ink, over)

  function addBox(slot: string, el: HTMLElement): Box {
    el.classList.add('eloi-opening')
    el.dataset.slot = slot
    el.style.setProperty('view-transition-name', `${ids}-${slot}`)
    const box = new Box(slot, el, link)
    boxes.set(slot, box)
    return box
  }

  function boxFor(slot: string): Box {
    const box = boxes.get(slot)
    if (!box) throw new Error(`Eloi: frame "${spec.id}" has no slot "${slot}"`)
    return box
  }

  // ── Events and channels between boxes ──
  function dispatch(e: BoxEvent) {
    for (const fn of [...(subscribers.get(e.type) ?? [])]) fn(e)
    for (const fn of [...(subscribers.get('*') ?? [])]) fn(e)
  }
  function subscribe(type: string, fn: (e: BoxEvent) => void, sig: AbortSignal) {
    if (sig.aborted) return
    let set = subscribers.get(type)
    if (!set) subscribers.set(type, (set = new Set()))
    set.add(fn)
    live.listeners++
    sig.addEventListener(
      'abort',
      () => {
        set.delete(fn)
        live.listeners--
      },
      { once: true },
    )
  }
  function channel<T>(name: string, initial: T): Signal<T> {
    let ch = channels.get(name)
    if (!ch) channels.set(name, (ch = signal<unknown>(initial)))
    return ch as Signal<T>
  }

  // ── Reduced motion ──
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  listen(media, 'change', () => (mediaReduced.value = media.matches), controller.signal)
  const stopReduced = effect(() => {
    const setting = reducedMotionSetting.value
    reducedMotion.value = setting === 'auto' ? mediaReduced.value : setting
    host.toggleAttribute('data-reduced-motion', reducedMotion.value)
  })

  // ── Visibility: one IntersectionObserver for every box ──
  const visibleFns = new Map<Element, (inView: boolean, visible: boolean) => void>()
  const intersecting = new Map<Element, boolean>()
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        intersecting.set(e.target, e.isIntersecting)
        visibleFns.get(e.target)?.(e.isIntersecting, e.isIntersecting && !document.hidden)
      }
    },
    { rootMargin: '200px' },
  )
  live.observers++
  listen(
    document,
    'visibilitychange',
    () => {
      for (const [el, fn] of visibleFns) fn(!!intersecting.get(el), !!intersecting.get(el) && !document.hidden)
    },
    controller.signal,
  )
  function observeVisible(el: Element, fn: (inView: boolean, visible: boolean) => void) {
    visibleFns.set(el, fn)
    io.observe(el)
    return () => {
      visibleFns.delete(el)
      intersecting.delete(el)
      io.unobserve(el)
    }
  }

  // ── Size: one ResizeObserver for the host and every bay ──
  const ro = new ResizeObserver((entries) => {
    if (disposed) return
    let hostWidth: number | undefined
    for (const e of entries) if (e.target === host) hostWidth = e.contentRect.width
    if (hostWidth !== undefined && hostWidth !== width) {
      width = hostWidth
      const nextCls = widthClass(spec.classes, width, cls || undefined)
      const nextM = moduleAt(spec, width)
      const nextPlan = choosePlan(spec.plans, nextCls, route.value)
      if (nextCls !== cls || nextM !== m || nextPlan !== plan) {
        cls = nextCls
        // Writing structure inside a ResizeObserver callback would re-enter it, so it waits for
        // the next frame; the observer then reports the new layout and the frame is drawn.
        scheduler.request(restructureJob)
        return
      }
    }
    layoutNow()
  })
  live.observers++


  // ── Structure: build the plan as nested grids ──
  function restructure() {
    if (disposed) return
    m = moduleAt(spec, width)
    const nextPlan = choosePlan(spec.plans, cls, route.value)
    host.style.setProperty('--m', `${m}px`)
    applySkinVars()
    if (nextPlan !== plan) {
      const previous = plan
      plan = nextPlan
      buildSheet(nextPlan)
      host.dataset.plan = nextPlan.id
      if (previous) dispatch({ from: '', type: 'variant', detail: { plan: nextPlan.id, from: previous.id } })
    }
    applyPadding()
    scheduler.request(statsJob)
  }

  function buildSheet(p: Plan) {
    const next = document.createElement('div')
    for (const el of bays.values()) ro.unobserve(el)
    bays.clear()
    axisOf.clear()
    slotOfBay.clear()
    const inPlan = new Set(slotsOf(p))
    build(p.sheet, next)
    next.classList.add('eloi-sheet')
    next.dataset.bay = 'sheet'
    bays.set('sheet', next)
    sheet.replaceWith(next)
    sheet = next
    for (const el of bays.values()) ro.observe(el)
    for (const [slot, box] of boxes) {
      if (inPlan.has(slot)) box.attach()
      else {
        box.detach()
        if (box.el.isConnected && !next.contains(box.el)) box.el.remove()
      }
    }
  }

  function build(split: Split, el: HTMLElement) {
    el.classList.add('eloi-split')
    el.dataset.split = split.split
    if (split.split === 'cols') {
      el.style.gridTemplateColumns = splitTemplate(split)
      el.style.gridTemplateRows = 'minmax(0, 1fr)'
    } else {
      el.style.gridTemplateRows = splitTemplate(split)
      el.style.gridTemplateColumns = 'minmax(0, 1fr)'
    }
    if (split.pad) el.style.padding = sizeToCss(split.pad)
    if (split.gap) el.style.gap = sizeToCss(split.gap)
    for (const part of split.parts) {
      let child: HTMLElement
      const region = part.region
      if (isOpening(region)) {
        const box = boxFor(region.opening)
        child = box.el
        child.dataset.fit = region.fit ?? 'flow'
        slotOfBay.set(part.id, region.opening)
      } else if (isSplit(region)) {
        child = document.createElement('div')
        build(region, child)
      } else {
        child = document.createElement('div')
        child.className = 'eloi-band'
      }
      child.dataset.bay = part.id
      axisOf.set(part.id, split.split)
      bays.set(part.id, child)
      el.append(child)
    }
  }

  // Member depths become CSS custom properties; skin tokens are set on the host.
  let skinVars: string[] = []
  function applySkinVars() {
    for (const name of skinVars) host.style.removeProperty(name)
    skinVars = []
    const set = (name: string, value: string) => {
      host.style.setProperty(name, value)
      skinVars.push(name)
    }
    for (const [name, value] of Object.entries(skin.tokens)) set(name, value)
    for (const [name, depth] of Object.entries(memberDepths(skin, m))) set(memberVar(name), `${depth}px`)
    host.dataset.skin = skin.id
  }

  // A ring drawn around an opening pads it, so content sits inside the ring.
  function applyPadding() {
    const pads = new Map<string, number>()
    for (const member of skin.members) {
      if (member.kind !== 'ring' || !slotOfBay.has(member.bay)) continue
      const depth = memberDepths({ ...skin, members: [{ ...member, name: '_' }] }, m)._ ?? 0
      pads.set(member.bay, depth + (member.pad ?? 0.75) * m)
    }
    for (const [bay, slot] of slotOfBay) {
      const pad = pads.get(bay)
      boxFor(slot).el.style.padding = pad ? `${pad}px` : ''
    }
  }

  // ── Measure and draw ──
  const rects: Record<string, Rect> = {}
  let stationRect: Rect | undefined

  function measure() {
    const origin = host.getBoundingClientRect()
    const rel = (r: DOMRect): Rect => ({ x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height })
    for (const key of Object.keys(rects)) delete rects[key]
    for (const [id, el] of bays) rects[id] = rel(el.getBoundingClientRect())
    const station = sheet.querySelector<HTMLElement>('[data-station][aria-current="page"], [data-station].is-active')
    stationRect = station ? rel(station.getBoundingClientRect()) : undefined
    return { w: origin.width, h: origin.height }
  }

  function layoutNow() {
    if (disposed || !plan) return
    const start = performance.now()
    const size = measure()
    const drawn = drawMembers({ skin, m, rects, sprite: options.sprite, station: stationRect, ids })
    if (drawn.svg !== lastInk) {
      lastInk = drawn.svg
      ink.setAttribute('viewBox', `0 0 ${size.w} ${size.h}`)
      ink.innerHTML = drawn.svg
      draws++
      animateMarker(drawn.marker?.x)
    }
    drawOverlay(size)
    solveMs = performance.now() - start
    scheduler.request(geometryJob)
    scheduler.request(statsJob)
    dispatch({ from: '', type: 'solved', detail: { plan: plan.id, width } })
  }

  function animateMarker(x: number | undefined) {
    const from = markerX
    markerX = x
    if (x === undefined || from === undefined || from === x || reducedMotion.value) return
    const el = ink.querySelector('[data-eloi-marker]')
    el?.animate([{ transform: `translateX(${from - x}px)` }, { transform: 'translateX(0)' }], {
      duration: 480,
      easing: 'cubic-bezier(.2,.7,.2,1)',
    })
  }

  // Push each box its content size and room level (a frame after layout, outside the observer).
  function pushGeometry() {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    batch(() => {
      for (const box of boxes.values()) {
        if (!box.el.isConnected) continue
        const r = box.contentEl.getBoundingClientRect()
        const prev = box.geometry.value
        const room = roomLevel(r.width, prev.inline ? prev.room : undefined)
        if (prev.inline !== r.width || prev.block !== r.height || prev.dpr !== dpr || prev.room !== room || prev.variant !== plan?.id)
          box.geometry.value = { inline: r.width, block: r.height, dpr, room, variant: plan?.id ?? '' }
      }
    })
    scheduler.request(statsJob)
  }

  function drawOverlay(size: { w: number; h: number }) {
    if (!overlay.bays && !overlay.openings && !overlay.datums) {
      if (over.firstChild) over.replaceChildren()
      return
    }
    const out: string[] = []
    const label = (x: number, y: number, text: string, fill: string) =>
      `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="10" font-family="ui-monospace, monospace" fill="${fill}" paint-order="stroke" stroke="white" stroke-width="3">${text}</text>`
    if (overlay.datums) {
      const xs = new Map<number, string[]>()
      const ys = new Map<number, string[]>()
      for (const [id, r] of Object.entries(rects)) {
        const axis = axisOf.get(id)
        if (axis === 'cols') {
          push(xs, r.x, `x-${id}-l`)
          push(xs, r.x + r.w, `x-${id}-r`)
        } else if (axis === 'rows') {
          push(ys, r.y, `y-${id}-t`)
          push(ys, r.y + r.h, `y-${id}-b`)
        }
      }
      for (const [x, names] of xs) {
        out.push(`<line x1="${x}" y1="0" x2="${x}" y2="${size.h}" stroke="#0a7f8f" stroke-width="0.75" stroke-dasharray="2 3"/>`)
        out.push(label(x + 2, 12 + (Math.round(x) % 3) * 11, names.join(' '), '#0a7f8f'))
      }
      for (const [y, names] of ys) {
        out.push(`<line x1="0" y1="${y}" x2="${size.w}" y2="${y}" stroke="#0a7f8f" stroke-width="0.75" stroke-dasharray="2 3"/>`)
        out.push(label(2, y - 3, names.join(' '), '#0a7f8f'))
      }
    }
    if (overlay.bays) {
      for (const [id, r] of Object.entries(rects)) {
        if (id === 'sheet' || slotOfBay.has(id)) continue
        out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="rgb(200 120 0 / 0.08)" stroke="#c87800" stroke-width="1"/>`)
        out.push(label(r.x + 3, r.y + 11, id, '#a05f00'))
      }
    }
    if (overlay.openings) {
      for (const [id, slot] of slotOfBay) {
        const r = rects[id]
        if (!r) continue
        const g = boxes.get(slot)!.geometry.value
        out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="rgb(180 0 140 / 0.06)" stroke="#b4008c" stroke-width="1.25"/>`)
        out.push(label(r.x + 3, r.y + r.h - 4, `${slot} ${Math.round(r.w)}×${Math.round(r.h)} z${g.room}`, '#b4008c'))
      }
    }
    over.setAttribute('viewBox', `0 0 ${size.w} ${size.h}`)
    over.innerHTML = out.join('')
  }

  function publishStats() {
    stats.value = {
      width: Math.round(width),
      cls,
      plan: plan?.id ?? '',
      skin: skin.id,
      m,
      solveMs,
      draws,
      scheduler: scheduler.snapshot(),
      boxes: [...boxes.values()].map((b) => b.stats()),
    }
  }

  function emptyStats(): FrameStats {
    return { width: 0, cls: '', plan: '', skin: options.skin.id, m: 0, solveMs: 0, draws: 0, scheduler: scheduler.snapshot(), boxes: [] }
  }

  // ── Plan changes: a box diff by stable id, inside a view transition where available ──
  async function changeStructure(apply: () => void) {
    const nextPlan = () => choosePlan(spec.plans, cls, route.value)
    const before = plan
    const run = () => {
      apply()
      restructure()
      layoutNow()
    }
    const useTransition =
      (options.transitions ?? true) && !reducedMotion.value && before && 'startViewTransition' in document && nextPlan() !== before
    if (useTransition) {
      const t = document.startViewTransition(run)
      await t.finished.catch(() => {})
    } else run()
  }

  // Build the first plan now, so the content is in place before the first frame (and in a
  // background tab, which runs no frames). This is the one forced layout at mount.
  width = host.getBoundingClientRect().width
  cls = widthClass(spec.classes, width)
  restructure()
  ro.observe(host)

  const handle: FrameHandle = {
    el: host,
    spec,
    stats,
    route,
    setRoute: (next, during) =>
      changeStructure(() => {
        route.value = next
        during?.()
      }),
    setSkin(next) {
      skin = next
      lastInk = ''
      restructure()
      layoutNow()
    },
    setReducedMotion(value) {
      reducedMotionSetting.value = value
    },
    setOverlay(next) {
      overlay = { ...next }
      if (plan) layoutNow()
    },
    define(slot, def) {
      boxFor(slot).define(def)
    },
    box(slot) {
      const box = boxes.get(slot)
      if (!box) return undefined
      return {
        el: box.el,
        state: box.state,
        input: (value) => (box.input.value = value),
        retry: () => box.retry(),
      }
    },
    opening: (slot) => boxes.get(slot)?.el,
    channel,
    emit: (type, detail) => dispatch({ from: '', type, detail }),
    on(type, fn) {
      const sig = new AbortController()
      subscribe(type, fn, AbortSignal.any([sig.signal, controller.signal]))
      return () => sig.abort()
    },
    flush: () => {
      if (plan) layoutNow()
      scheduler.flush()
    },
    async dispose() {
      if (disposed) return
      disposed = true
      ro.disconnect()
      io.disconnect()
      live.observers -= 2
      stopReduced()
      for (const job of [restructureJob, geometryJob, statsJob]) scheduler.cancel(job)
      // Boxes stop in reverse order of creation.
      for (const box of [...boxes.values()].reverse()) await box.dispose()
      controller.abort()
      sheet.remove()
      ink.remove()
      over.remove()
      for (const name of [...skinVars, '--m']) host.style.removeProperty(name)
      host.classList.remove('eloi-frame')
      for (const a of ['frame', 'plan', 'skin']) delete host.dataset[a]
      host.removeAttribute('data-reduced-motion')
      releaseSprite()
      releaseStyles()
      live.frames--
    },
  }
  return handle
}

function svgEl(className: string): SVGSVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  el.setAttribute('class', className)
  el.setAttribute('aria-hidden', 'true')
  el.setAttribute('preserveAspectRatio', 'none')
  return el
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}
