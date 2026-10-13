// The dev panel: present on every bench. At S0 it reports the route and viewport; the width
// scrubber and overlays arrive with the Grid bench (S1), per-box stats with the Boxes bench (S2).
// Toggle with the ` key or the tab at the bottom-right corner.
import { effect, signal } from '@preact/signals-core'
import { h } from '../dom'
import { currentPath } from '../router'

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

  addEventListener('resize', () => {
    viewport.value = { w: innerWidth, h: innerHeight, dpr: devicePixelRatio }
  })

  const route = h('dd', {})
  const size = h('dd', {})
  const dpr = h('dd', {})

  const panel = h(
    'aside',
    { class: 'devpanel', 'aria-label': 'Dev panel' },
    h('p', { class: 'devpanel__title' }, 'Dev panel'),
    h('dl', {}, h('dt', {}, 'Route'), route, h('dt', {}, 'Viewport'), size, h('dt', {}, 'Pixel ratio'), dpr),
    h('p', { class: 'devpanel__later' }, 'Width scrubber and overlays: S1'),
    h('p', { class: 'devpanel__later' }, 'Per-box stats: S2'),
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
    size.textContent = `${v.w} × ${v.h}`
    dpr.textContent = String(v.dpr)
  })

  document.body.append(panel, toggle)
}
