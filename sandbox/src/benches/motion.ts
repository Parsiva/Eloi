// Motion bench: changing route animates the frame, not the content. Each route picks a plan;
// a route change is a box diff by stable id (kept boxes move and update in place, new ones mount,
// missing ones dispose), run inside a view transition. Chevrons run along the track on a CSS
// conveyor, and a marker travels to the active nav station. Reduced motion turns all of it off.
import { mount, type BoxRuntime, type FrameSpec, type Part, type Skin } from '@eloi/engine'
import { h } from '../dom'
import type { Page } from '../router'
import { attachDev } from '../devpanel/devtools'
import { benchHeader, button, filler, stage } from './common'
import { projects, marginaliaEntries } from '../content'

const ROUTES = ['front', 'projects', 'notes'] as const
type Route = (typeof ROUTES)[number]

const head: Part[] = [
  { id: 'nav', size: { m: 7 }, region: { opening: 'nav', fit: 'fixed' } },
  { id: 'track', size: { m: 3.2 } },
  { id: 'gap-top', size: { m: 3 } },
]
const foot: Part[] = [
  { id: 'gap-foot', size: { m: 3 } },
  { id: 'foot', size: { m: 5 }, region: { opening: 'foot', fit: 'fixed' } },
]
const g = (id: string): Part => ({ id, size: { m: 4 } })

const spec: FrameSpec = {
  id: 'motion',
  classes: [{ name: 'any', min: 0 }],
  module: { from: [768, 6], to: [1800, 9] },
  plans: [
    {
      id: 'front',
      when: { routes: ['front'] },
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 1 },
        parts: [
          ...head,
          {
            id: 'body',
            size: 'auto',
            region: {
              split: 'cols',
              parts: [
                { id: 'left', size: { fr: 1 }, region: { opening: 'left' } },
                g('g1'),
                { id: 'main', size: { fr: 2 }, region: { opening: 'main' } },
                g('g2'),
                { id: 'right', size: { fr: 1 }, region: { opening: 'right' } },
              ],
            },
          },
          ...foot,
        ],
      },
    },
    {
      id: 'projects',
      when: { routes: ['projects'] },
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 1 },
        parts: [
          ...head,
          {
            id: 'body',
            size: 'auto',
            region: {
              split: 'cols',
              parts: [
                { id: 'main', size: { fr: 2.618 }, region: { opening: 'main' } },
                g('g2'),
                { id: 'right', size: { fr: 1 }, region: { opening: 'right' } },
              ],
            },
          },
          ...foot,
        ],
      },
    },
    {
      id: 'notes',
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 1 },
        parts: [
          ...head,
          {
            id: 'body',
            size: 'auto',
            region: {
              split: 'cols',
              parts: [
                { id: 'left', size: { fr: 1 }, region: { opening: 'left' } },
                g('g1'),
                { id: 'main', size: { fr: 1.618 }, region: { opening: 'main' } },
              ],
            },
          },
          ...foot,
        ],
      },
    },
  ],
}

const teal = '#1d4657'
const skin: Skin = {
  id: 'motion-midcentury',
  tokens: { '--ink': teal, '--paper': '#f4e9cd', '--rule': 'color-mix(in srgb, #1d4657 40%, transparent)' },
  roles: { ink: teal, mid: '#2e6a78', sand: '#d9b370', ochre: '#b8863f', cream: '#f4e9cd' },
  members: [
    {
      kind: 'ring',
      name: 'border',
      bay: 'sheet',
      profile: [
        { kind: 'fill', depth: 0.8, role: 'ink' },
        { kind: 'fill', depth: 0.25, role: 'cream' },
        { kind: 'fill', depth: 0.6, role: 'sand' },
        { kind: 'fill', depth: 0.2, role: 'cream' },
        { kind: 'fill', depth: 0.35, role: 'mid' },
      ],
      corners: { kind: 'block', roles: ['ink', 'sand', 'ochre', 'cream'] },
    },
    { kind: 'ring', bay: 'track', profile: [{ kind: 'fill', depth: 3.2, role: 'ink' }] },
    { kind: 'chevrons', bay: 'track', size: 1.7, pitch: 3.4, role: 'sand', motion: 'conveyor' },
    { kind: 'marker', bay: 'nav', size: 1.6, role: 'ochre' },
    ...['g1', 'g2'].map((bay) => ({
      kind: 'rule' as const,
      bay,
      profile: [{ kind: 'fill' as const, depth: 0.25, role: 'mid' }, { kind: 'gap' as const, depth: 0.25 }, { kind: 'fill' as const, depth: 0.5, role: 'sand' }],
    })),
    { kind: 'ring', bay: 'foot', profile: [{ kind: 'fill', depth: 0.3, role: 'sand' }], pad: 0 },
  ],
}

// The main box stays mounted across every route; it re-renders from its input in place.
function createMain(): BoxRuntime<Route> {
  return {
    mount(el, ctx) {
      const mountedAt = new Date().toLocaleTimeString()
      ctx.effect(() => {
        const route = ctx.input.value
        const title = route === 'projects' ? 'Projects' : route === 'notes' ? 'Marginalia' : 'Front page'
        const list =
          route === 'projects'
            ? projects.map((p) => h('li', {}, h('strong', {}, p.title), ` — ${p.tagline}`))
            : route === 'notes'
              ? marginaliaEntries.slice(0, 6).map((n) => h('li', {}, h('strong', {}, n.title), ` — ${n.summary}`))
              : []
        el.replaceChildren(
          h('p', { class: 'eyebrow' }, `main · mounted once at ${mountedAt} · now showing “${route}”`),
          h('h2', { class: 'motion-title' }, title),
          ...(list.length ? [h('ul', { class: 'motion-list' }, ...list)] : filler(1)),
        )
      })
    },
  }
}

// Side boxes mount when their route's plan has them and dispose when it doesn't.
function createSide(label: string): BoxRuntime {
  return {
    mount(el) {
      el.append(h('p', { class: 'eyebrow' }, `${label} · mounted ${new Date().toLocaleTimeString()}`), ...filler(1, label.length))
    },
  }
}

const routeOf = (url: URL): Route => {
  const seg = url.pathname.split('/')[3] as Route | undefined
  return seg && ROUTES.includes(seg) ? seg : 'front'
}

const page: Page = (outlet, signal, url) => {
  const { wrap, stage: st } = stage()
  const links = ROUTES.map((r) => h('a', { href: `/bench/motion/${r}`, 'data-station': r, class: 'motion-nav__link' }, r))
  const host = h(
    'div',
    {},
    h('nav', { 'data-slot': 'nav', class: 'motion-nav', 'aria-label': 'Motion bench routes' }, ...links),
    h('footer', { 'data-slot': 'foot', class: 'motion-foot' }, 'Chevrons ride the track; the ochre marker follows the active station.'),
  )
  st.append(host)
  let route = routeOf(url)
  const setCurrent = () => {
    for (const a of links) {
      if (a.dataset.station === route) a.setAttribute('aria-current', 'page')
      else a.removeAttribute('aria-current')
    }
  }
  setCurrent()

  const frame = mount(host, spec, {
    skin,
    route,
    boxes: {
      main: { runtime: async () => createMain(), when: 'load', input: route },
      left: { runtime: async () => createSide('left'), when: 'load' },
      right: { runtime: async () => createSide('right'), when: 'load' },
    },
  })
  attachDev(frame, st, 'motion', signal)
  signal.addEventListener('abort', () => void frame.dispose())

  let reduced: 'auto' | boolean = 'auto'
  const motionButton = button('Reduced motion: auto', () => {
    reduced = reduced === 'auto' ? true : reduced === true ? false : 'auto'
    motionButton.textContent = `Reduced motion: ${reduced === 'auto' ? 'auto' : reduced ? 'on' : 'off'}`
    frame.setReducedMotion(reduced)
  })
  outlet.append(benchHeader('motion', motionButton), wrap)

  return {
    async update(next) {
      route = routeOf(next)
      await frame.setRoute(route, () => {
        setCurrent()
        frame.box('main')?.input(route)
      })
    },
  }
}

export default page
