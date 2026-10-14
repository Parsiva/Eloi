// Specimens bench: every piece of the hand-drawn sprite, with its hull (the knockout and
// text-wrap outline) and sockets (where strokes leave it, so tracks can continue them), plus
// the repeating tiles fitted to whole counts. Ported from the portfolio's /dev/ornaments page.
import { fitRepeat, retainSprite, type SpritePiece } from '@eloi/engine'
import { h } from '../dom'
import type { Page } from '../router'
import { benchHeader, button } from './common'
import { handDrawn } from '../frames/sprite'

const SVG = 'http://www.w3.org/2000/svg'
const MIRRORED = new Set(['corner-medallion', 'side-leaf', 'corner-flame'])

function svg(tag: string, attrs: Record<string, string | number>): SVGElement {
  const el = document.createElementNS(SVG, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
  return el
}

function art(id: string, p: SpritePiece, scale: number, show: { hull: boolean; sockets: boolean }, mirror = false): SVGElement {
  const w = p.width * scale
  const hh = p.height * scale
  const root = svg('svg', { width: w, height: hh, viewBox: `0 0 ${p.width} ${p.height}`, class: 'specimen__svg' })
  const g = svg('g', mirror ? { transform: `translate(${p.width} 0) scale(-1 1)` } : {})
  root.append(g)
  const hair = 0.8 / scale // keep lines near 0.8px whatever the scale
  g.append(svg('use', { href: `#${handDrawn.prefix}${id}`, width: p.width, height: p.height, style: `--eloi-weight:${hair / 0.5}` }))
  if (show.hull && p.hull?.length)
    g.append(svg('polygon', { points: p.hull.map(([x, y]) => `${x},${y}`).join(' '), fill: 'rgb(180 0 140 / 0.08)', stroke: '#b4008c', 'stroke-width': 1 / scale, 'stroke-dasharray': `${3 / scale} ${2 / scale}` }))
  if (show.sockets)
    for (const s of p.sockets ?? []) {
      const [x, y] = s.at
      const a = ((s.heading ?? 0) * Math.PI) / 180
      const len = 14 / scale
      g.append(svg('line', { x1: x, y1: y, x2: x + Math.cos(a) * len, y2: y + Math.sin(a) * len, stroke: '#0a7f8f', 'stroke-width': 1.2 / scale }))
      g.append(svg('circle', { cx: x, cy: y, r: 2.5 / scale, fill: '#0a7f8f' }))
    }
  return root
}

const page: Page = (outlet, signal) => {
  const release = retainSprite(handDrawn.prefix, handDrawn.svg)
  signal.addEventListener('abort', release)
  let scale = 1
  const show = { hull: true, sockets: true }
  const body = h('div', { class: 'specimens' })
  const pieces = Object.entries(handDrawn.pieces)

  const render = () => {
    const fixed = pieces.filter(([, p]) => p.kind === 'fixed')
    const tiles = pieces.filter(([, p]) => p.kind === 'tile')
    body.replaceChildren(
      h('h3', { class: 'specimens__heading' }, 'Fixed pieces · placed whole, scaled uniformly, never stretched'),
      h(
        'div',
        { class: 'specimens__grid' },
        ...fixed.map(([id, p]) =>
          h(
            'figure',
            { class: 'specimen' },
            h('div', { class: 'specimen__art' }, art(id, p, scale, show), MIRRORED.has(id) ? art(id, p, scale, show, true) : null),
            h(
              'figcaption',
              {},
              h('strong', {}, id),
              h('span', {}, `${p.width.toFixed(1)} × ${p.height.toFixed(1)} · ${p.sockets?.length ?? 0} sockets · ${p.hull?.length ?? 0}-point hull`),
              MIRRORED.has(id) ? h('span', {}, 'original + mirror') : null,
            ),
          ),
        ),
      ),
      h('h3', { class: 'specimens__heading' }, 'Tiles · fitted to a whole number of repeats'),
      ...tiles.map(([id, p]) => {
        const strips = [600, 611, 637].map((length) => {
          const cross = p.height * scale * 1.5
          const natural = (p.width / p.height) * cross
          const { count, each } = fitRepeat(length, natural)
          const s = svg('svg', { width: length, height: cross, class: 'specimen__strip' })
          for (let i = 0; i < count; i++) s.append(svg('use', { href: `#${handDrawn.prefix}${id}`, x: i * each, width: each, height: cross, preserveAspectRatio: 'none', style: `--eloi-weight:${0.6 / (0.5 * (cross / p.height))}` }))
          return h('div', { class: 'specimen__fit' }, s, h('span', {}, `${length}px → ${count} × ${each.toFixed(2)}px (natural ${natural.toFixed(2)})`))
        })
        return h(
          'figure',
          { class: 'specimen specimen--tile' },
          h('div', { class: 'specimen__art' }, art(id, p, scale * 3, { hull: false, sockets: false })),
          h('figcaption', {}, h('strong', {}, id), h('span', {}, `one repeat is ${p.width.toFixed(2)} wide; shown at 3× and fitted below`)),
          ...strips,
        )
      }),
    )
  }

  const scaleButtons = [2, 1, 0.75, 0.5].map((s) => {
    const b = button(`${s}×`, () => {
      scale = s
      for (const x of scaleButtons) x.setAttribute('aria-pressed', String(x === b))
      render()
    }, s === 1)
    return b
  })
  const toggle = (key: 'hull' | 'sockets') =>
    button(key, function (this: void) {
      show[key] = !show[key]
      toggles[key].setAttribute('aria-pressed', String(show[key]))
      render()
    }, true)
  const toggles = { hull: toggle('hull'), sockets: toggle('sockets') }

  outlet.append(benchHeader('specimens', h('span', {}, 'Scale'), ...scaleButtons, h('span', {}, 'Show'), toggles.hull, toggles.sockets), h('section', { class: 'panel' }, body))
  render()
}

export default page
