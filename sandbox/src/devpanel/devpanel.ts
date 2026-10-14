// The dev panel: on every bench. Route and viewport always; with a frame attached, its plan,
// class, module and solve time, a width scrubber for the stage, overlay toggles, a row per box,
// and the engine's live resource counts. Toggle with the ` key or the tab at the bottom right.
import { computed, effect, signal } from '@preact/signals-core'
import { liveCounts, type LiveCounts } from '@eloi/engine'
import { h } from '../dom'
import { currentPath } from '../router'
import { attached, overlay, stageWidth } from './devtools'

const STORAGE_KEY = 'eloi.devpanel.open'

function readOpen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function mountDevPanel(): void {
  const open = signal(readOpen())
  const viewport = signal({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio })
  const counts = signal<LiveCounts>(liveCounts())
  const stats = computed(() => attached.value?.frame.stats.value ?? null)

  addEventListener('resize', () => {
    viewport.value = { w: innerWidth, h: innerHeight, dpr: devicePixelRatio }
  })
  // Live counts are polled only while the panel is open.
  let poll = 0
  effect(() => {
    clearInterval(poll)
    if (open.value) poll = window.setInterval(() => (counts.value = liveCounts()), 500)
  })

  const dd = () => h('dd', {})
  const route = dd()
  const size = dd()
  const frameRows = { frame: dd(), plan: dd(), width: dd(), m: dd(), solve: dd(), frames: dd() }

  // Width scrubber
  const range = h('input', { type: 'range', min: '320', max: '2560', step: '10', 'aria-label': 'Stage width' })
  const widthOut = h('output', {})
  const auto = h('input', { type: 'checkbox', 'aria-label': 'Fit the stage to the window' })
  range.addEventListener('input', () => (stageWidth.value = Number(range.value)))
  auto.addEventListener('change', () => (stageWidth.value = auto.checked ? null : Number(range.value)))
  const presets = [768, 1024, 1280, 1440, 1920].map((w) => {
    const b = h('button', { type: 'button' }, String(w))
    b.addEventListener('click', () => (stageWidth.value = w))
    return b
  })

  // Overlays
  const toggles = (['bays', 'openings', 'datums'] as const).map((key) => {
    const input = h('input', { type: 'checkbox' })
    input.addEventListener('change', () => (overlay.value = { ...overlay.value, [key]: input.checked }))
    effect(() => {
      input.checked = !!overlay.value[key]
    })
    return h('label', {}, input, ` ${key}`)
  })

  const boxRows = h('tbody', {})
  const resources = h('p', { class: 'devpanel__mono' })

  const frameSection = h(
    'section',
    {},
    h('p', { class: 'devpanel__heading' }, 'Frame'),
    h(
      'dl',
      {},
      h('dt', {}, 'Frame'),
      frameRows.frame,
      h('dt', {}, 'Plan · class'),
      frameRows.plan,
      h('dt', {}, 'Width'),
      frameRows.width,
      h('dt', {}, 'Module m'),
      frameRows.m,
      h('dt', {}, 'Last solve'),
      frameRows.solve,
      h('dt', {}, 'Frames run'),
      frameRows.frames,
    ),
    h('p', { class: 'devpanel__heading' }, 'Stage width'),
    h('div', { class: 'devpanel__row' }, range, widthOut),
    h('div', { class: 'devpanel__row devpanel__presets' }, ...presets),
    h('label', {}, auto, ' fit window'),
    h('p', { class: 'devpanel__heading' }, 'Overlays'),
    h('div', { class: 'devpanel__row' }, ...toggles),
    h('p', { class: 'devpanel__heading' }, 'Boxes'),
    h(
      'table',
      { class: 'devpanel__boxes' },
      h('thead', {}, h('tr', {}, h('th', {}, 'box'), h('th', {}, 'state'), h('th', {}, 'size'), h('th', {}, 'z'), h('th', {}, 'mnt'), h('th', {}, 'frm'))),
      boxRows,
    ),
  )

  const panel = h(
    'aside',
    { class: 'devpanel', 'aria-label': 'Dev panel' },
    h('p', { class: 'devpanel__title' }, 'Dev panel'),
    h('dl', {}, h('dt', {}, 'Route'), route, h('dt', {}, 'Viewport'), size),
    frameSection,
    h('p', { class: 'devpanel__heading' }, 'Live engine resources'),
    resources,
  )
  const toggle = h('button', { class: 'devpanel__toggle', type: 'button', title: 'Toggle dev panel (`)' }, 'dev')

  const setOpen = (value: boolean) => {
    open.value = value
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
      // Storage can be unavailable (private windows); the panel still works for this visit.
    }
  }
  toggle.addEventListener('click', () => setOpen(!open.value))
  addEventListener('keydown', (e) => {
    if (e.key !== '`' || (e.target as Element | null)?.closest('input, textarea, [contenteditable]')) return
    setOpen(!open.value)
  })

  effect(() => {
    panel.hidden = !open.value
    toggle.setAttribute('aria-pressed', String(open.value))
  })
  effect(() => {
    route.textContent = currentPath.value
  })
  effect(() => {
    const v = viewport.value
    size.textContent = `${v.w} × ${v.h} @${v.dpr}x`
  })
  effect(() => {
    const w = stageWidth.value
    auto.checked = w === null
    if (w !== null) range.value = String(w)
    widthOut.textContent = w === null ? 'window' : `${w}px`
  })
  effect(() => {
    const a = attached.value
    const s = stats.value
    frameSection.hidden = !a
    if (!a || !s) return
    frameRows.frame.textContent = `${a.label} · ${s.skin}`
    frameRows.plan.textContent = `${s.plan || '—'} · ${s.cls || '—'}`
    frameRows.width.textContent = `${s.width}px`
    frameRows.m.textContent = `${s.m}px`
    frameRows.solve.textContent = `${s.solveMs.toFixed(2)} ms · ${s.draws} draws`
    frameRows.frames.textContent = `${s.scheduler.frames}${s.scheduler.pending ? ' · pending' : ' · idle'}`
    boxRows.replaceChildren(
      ...s.boxes.map((b) => {
        const state = h('td', { class: `devpanel__state devpanel__state--${b.state}`, title: b.error ?? '' }, b.state)
        if (b.state === 'broken') {
          const retry = h('button', { type: 'button', class: 'devpanel__retry' }, 'retry')
          retry.addEventListener('click', () => a.frame.box(b.id)?.retry())
          state.append(' ', retry)
        }
        return h(
          'tr',
          {},
          h('td', {}, b.id),
          state,
          h('td', {}, b.inline ? `${Math.round(b.inline)}×${Math.round(b.block)}` : '—'),
          h('td', {}, b.inline ? String(b.room) : '—'),
          h('td', {}, String(b.mounts)),
          h('td', {}, String(b.frames)),
        )
      }),
    )
  })
  effect(() => {
    const c = counts.value
    resources.textContent = `frames ${c.frames} · boxes ${c.boxes} · observers ${c.observers} · listeners ${c.listeners} · frame callbacks ${c.frameCallbacks} · effects ${c.effects}`
  })

  document.body.append(panel, toggle)
}
