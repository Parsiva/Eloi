// Grid bench (S1): a frame spec becomes nested CSS grids with named boxes. Width flows down
// (class, module, plan); content height flows up (rows are auto, the frame closes around them).
// Use the dev panel's width scrubber and overlays; add or remove paragraphs to push heights.
import { effect } from '@preact/signals-core'
import { mount, type FrameSpec, type Skin } from '@eloi/engine'
import { h } from '../dom'
import type { Page } from '../router'
import { attachDev } from '../devpanel/devtools'
import { benchHeader, button, filler, loopWarnings, stage } from './common'

const spec: FrameSpec = {
  id: 'grid',
  classes: [
    { name: 'compact', min: 0 },
    { name: 'medium', min: 768 },
    { name: 'wide', min: 1200 },
  ],
  module: { from: [768, 6], to: [1800, 10] },
  plans: [
    {
      id: 'wide',
      when: { classes: ['wide'] },
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 1 },
        parts: [
          { id: 'head', size: { m: 9 }, region: { opening: 'head', fit: 'fixed' } },
          { id: 'rule-h', size: { m: 3 } },
          {
            id: 'body',
            size: 'auto',
            region: {
              split: 'cols',
              parts: [
                { id: 'nav', size: { m: 26 }, region: { opening: 'nav' } },
                { id: 'g1', size: { m: 4 } },
                { id: 'main', size: { fr: 2.618 }, region: { opening: 'main' } },
                { id: 'g2', size: { m: 4 } },
                { id: 'aside', size: { fr: 1 }, region: { opening: 'aside' } },
              ],
            },
          },
          { id: 'rule-f', size: { m: 3 } },
          { id: 'foot', size: 'auto', region: { opening: 'foot' } },
        ],
      },
    },
    {
      id: 'medium',
      when: { classes: ['medium'] },
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 1 },
        parts: [
          { id: 'head', size: { m: 9 }, region: { opening: 'head', fit: 'fixed' } },
          { id: 'rule-h', size: { m: 3 } },
          {
            id: 'body',
            size: 'auto',
            region: {
              split: 'cols',
              parts: [
                { id: 'nav', size: { m: 24 }, region: { opening: 'nav' } },
                { id: 'g1', size: { m: 4 } },
                {
                  id: 'stack',
                  size: { fr: 1 },
                  region: {
                    split: 'rows',
                    parts: [
                      { id: 'main', size: 'auto', region: { opening: 'main' } },
                      { id: 'g2', size: { m: 4 } },
                      { id: 'aside', size: 'auto', region: { opening: 'aside' } },
                    ],
                  },
                },
              ],
            },
          },
          { id: 'rule-f', size: { m: 3 } },
          { id: 'foot', size: 'auto', region: { opening: 'foot' } },
        ],
      },
    },
    {
      id: 'compact',
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 0.5 },
        parts: [
          { id: 'head', size: 'auto', region: { opening: 'head' } },
          { id: 'main', size: 'auto', region: { opening: 'main' } },
          { id: 'nav', size: 'auto', region: { opening: 'nav' } },
          { id: 'aside', size: 'auto', region: { opening: 'aside' } },
          { id: 'foot', size: 'auto', region: { opening: 'foot' } },
        ],
      },
    },
  ],
}

const double = [{ kind: 'rule', weight: 0.75 }, { kind: 'gap', depth: 0.3 }, { kind: 'rule', weight: 0.75 }] as const

const skin: Skin = {
  id: 'plain-rules',
  tokens: {},
  roles: { ink: 'var(--ink)', paper: 'var(--paper)' },
  members: [
    {
      kind: 'ring',
      name: 'border',
      bay: 'sheet',
      profile: [{ kind: 'rule', weight: 1.5 }, { kind: 'gap', depth: 0.4 }, { kind: 'rule', weight: 0.6 }],
      corners: { kind: 'block', roles: ['ink', 'paper'] },
    },
    { kind: 'rule', bay: 'g1', profile: [...double] },
    { kind: 'rule', bay: 'g2', profile: [...double] },
    { kind: 'rule', bay: 'rule-h', profile: [...double] },
    { kind: 'rule', bay: 'rule-f', profile: [...double] },
  ],
}

const page: Page = (outlet, signal) => {
  const counts: Record<string, number> = { nav: 1, main: 3, aside: 2, foot: 1 }
  const host = h('div', {})
  const sections: Record<string, HTMLElement> = {}
  for (const slot of ['nav', 'main', 'aside', 'foot']) {
    sections[slot] = h('section', { 'data-slot': slot })
    host.append(sections[slot]!)
  }
  host.append(
    h(
      'header',
      { 'data-slot': 'head', class: 'grid-head' },
      h('h2', { class: 'grid-head__title' }, 'The frame is the layout'),
      h('p', { class: 'eyebrow' }, 'Every box below is an opening in one frame spec'),
    ),
  )

  const fill = (slot: string) => {
    const el = sections[slot]!
    el.replaceChildren(h('p', { class: 'eyebrow' }, `${slot} · ${counts[slot]} ¶`), ...filler(counts[slot]!, slot.length))
  }
  for (const slot of Object.keys(counts)) fill(slot)

  const adjust = (slot: string, delta: number) => () => {
    counts[slot] = Math.max(0, Math.min(12, counts[slot]! + delta))
    fill(slot)
  }
  const controls = Object.keys(counts).flatMap((slot) => [
    h('span', {}, slot),
    button('−', adjust(slot, -1)),
    button('+', adjust(slot, +1)),
  ])
  const warnings = h('span', {})
  const before = loopWarnings.value
  const stopWarn = effect(() => {
    warnings.textContent = `ResizeObserver loop warnings: ${loopWarnings.value - before}`
  })
  signal.addEventListener('abort', stopWarn)

  const { wrap, stage: st } = stage()
  st.append(host)
  outlet.append(benchHeader('grid', ...controls, warnings), wrap)

  const frame = mount(host, spec, { skin })
  attachDev(frame, st, 'grid', signal)
  signal.addEventListener('abort', () => void frame.dispose())
}

export default page
