// Boxes bench (S2): one frame, seven boxes, each a different kind of tenant. The static ones are
// plain HTML; the rest have runtimes started by triggers. Dispose the frame and the live counts
// must return to zero; mount it again and everything comes back.
import { effect, signal as makeSignal } from '@preact/signals-core'
import { liveCounts, mount, type FrameHandle, type FrameSpec, type Skin } from '@eloi/engine'
import { h } from '../dom'
import type { Page } from '../router'
import { attachDev } from '../devpanel/devtools'
import { benchHeader, button, stage } from './common'
import { createBroken, createClock, createDetail, createLate, createLedger } from '../boxes/dom-boxes'
import { createRosette } from '../boxes/rosette'

const gutter = { size: { m: 4 } } as const

const spec: FrameSpec = {
  id: 'boxes',
  classes: [
    { name: 'compact', min: 0 },
    { name: 'wide', min: 900 },
  ],
  module: { from: [768, 6], to: [1800, 9] },
  plans: [
    {
      id: 'wide',
      when: { classes: ['wide'] },
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 1 },
        parts: [
          { id: 'intro', size: 'auto', region: { opening: 'intro' } },
          { id: 'r1', size: { m: 3 } },
          {
            id: 'row-a',
            size: 'auto',
            region: {
              split: 'cols',
              parts: [
                { id: 'ledger', size: { fr: 1 }, region: { opening: 'ledger' } },
                { id: 'g1', ...gutter },
                { id: 'detail', size: { fr: 1.618 }, region: { opening: 'detail' } },
                { id: 'g2', ...gutter },
                { id: 'rosette', size: { fr: 1.618 }, region: { opening: 'rosette', fit: 'fixed' } },
              ],
            },
          },
          { id: 'r2', size: { m: 3 } },
          {
            id: 'row-b',
            size: 'auto',
            region: {
              split: 'cols',
              parts: [
                { id: 'clock', size: { fr: 1 }, region: { opening: 'clock' } },
                { id: 'g3', ...gutter },
                { id: 'broken', size: { fr: 1.618 }, region: { opening: 'broken' } },
              ],
            },
          },
          { id: 'r3', size: { m: 3 } },
          { id: 'spacer', size: { css: '110vh' }, region: { opening: 'spacer', fit: 'fixed' } },
          { id: 'late', size: 'auto', region: { opening: 'late' } },
        ],
      },
    },
    {
      id: 'compact',
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 0.5 },
        parts: [
          { id: 'intro', size: 'auto', region: { opening: 'intro' } },
          { id: 'ledger', size: 'auto', region: { opening: 'ledger' } },
          { id: 'detail', size: 'auto', region: { opening: 'detail' } },
          { id: 'rosette', size: { css: '70vw' }, region: { opening: 'rosette', fit: 'fixed' } },
          { id: 'clock', size: 'auto', region: { opening: 'clock' } },
          { id: 'broken', size: 'auto', region: { opening: 'broken' } },
          { id: 'spacer', size: { css: '110vh' }, region: { opening: 'spacer', fit: 'fixed' } },
          { id: 'late', size: 'auto', region: { opening: 'late' } },
        ],
      },
    },
  ],
}

const thin = [{ kind: 'rule', weight: 0.6 }, { kind: 'gap', depth: 0.25 }, { kind: 'rule', weight: 0.6 }] as const
const boxRing = (bay: string) => ({ kind: 'ring' as const, bay, profile: [{ kind: 'rule' as const, weight: 0.75 }], pad: 1.2 })

const skin: Skin = {
  id: 'ledger-rules',
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
    ...['r1', 'r2', 'r3', 'g1', 'g2', 'g3'].map((bay) => ({ kind: 'rule' as const, bay, profile: [...thin] })),
    ...['ledger', 'detail', 'rosette', 'clock', 'broken', 'late'].map(boxRing),
  ],
}

// The static HTML each slot starts with. For boxes with runtimes it is the fallback: shown until
// the runtime is live, and again if it breaks.
function slots(): HTMLElement[] {
  const fallback = (slot: string, title: string, text: string) =>
    h('section', { 'data-slot': slot }, h('p', { class: 'eyebrow' }, title), h('p', { class: 'muted' }, text))
  return [
    h(
      'section',
      { 'data-slot': 'intro' },
      h('p', { class: 'eyebrow' }, 'Intro · static HTML, no runtime'),
      h(
        'p',
        { class: 'lede' },
        'Each box in this frame is a different kind of tenant. Open the dev panel (`) to watch their states, sizes, room levels, mounts and frames.',
      ),
    ),
    fallback('ledger', 'Ledger', 'Fallback: the project list loads when this box comes into view.'),
    fallback('detail', 'Detail', 'Fallback: waiting for its runtime.'),
    fallback('rosette', 'Rosette · WebGL2', 'Fallback: a static note shown before the canvas starts, or if WebGL2 is missing.'),
    fallback('clock', 'Clock', 'Fallback: the clock is not running.'),
    fallback('broken', 'Broken box · static fallback', 'This text is the box’s static fallback. Its runtime throws while mounting, so this stays, with the error below. Every other box keeps working.'),
    h(
      'section',
      { 'data-slot': 'spacer', class: 'spacer' },
      h('p', { class: 'eyebrow' }, 'Spacer · static'),
      h('p', { class: 'lede' }, 'Keep scrolling. The box below has when: visible, so it mounts only when it comes into view; the dev panel shows it as “waiting” until then.'),
    ),
    fallback('late', 'Late box', 'Fallback: not mounted yet.'),
  ]
}

const page: Page = (outlet, sig) => {
  const pageStart = performance.now()
  const { wrap, stage: st } = stage()
  let frame: FrameHandle | null = null
  const mounted = makeSignal(false)
  const counts = h('span', { class: 'mono-note' })
  let local: AbortController | null = null

  const start = () => {
    if (frame) return
    local = new AbortController()
    const host = h('div', {}, ...slots())
    st.replaceChildren(host)
    const paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()
    frame = mount(host, spec, {
      skin,
      boxes: {
        ledger: { runtime: async () => createLedger(), when: 'visible' },
        detail: { runtime: async () => createDetail(), when: 'load' },
        rosette: { runtime: async () => createRosette(), when: 'visible', input: { paper: hexToRgb(paper) } },
        clock: { runtime: async () => createClock(), when: 'idle' },
        broken: { runtime: async () => createBroken(), when: 'load' },
        late: { runtime: async () => createLate(pageStart), when: 'visible' },
      },
    })
    attachDev(frame, st, 'boxes', AbortSignal.any([sig, local.signal]))
    mounted.value = true
  }
  const stop = async () => {
    if (!frame) return
    const f = frame
    frame = null
    local?.abort()
    await f.dispose()
    st.replaceChildren(h('p', { class: 'muted disposed-note' }, 'The frame is disposed. Every count above should be zero.'))
    mounted.value = false
  }

  const toggle = button('Dispose frame', () => void (mounted.value ? stop() : start()))
  const stopEffect = effect(() => {
    toggle.textContent = mounted.value ? 'Dispose frame' : 'Mount again'
  })
  const poll = setInterval(() => {
    const c = liveCounts()
    counts.textContent = `live: frames ${c.frames} · boxes ${c.boxes} · observers ${c.observers} · listeners ${c.listeners} · frame callbacks ${c.frameCallbacks} · effects ${c.effects}`
  }, 300)

  outlet.append(benchHeader('boxes', toggle, counts), wrap)
  start()
  sig.addEventListener('abort', () => {
    clearInterval(poll)
    stopEffect()
    void stop()
  })
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) return [0.9, 0.86, 0.76]
  return [parseInt(m[1]!, 16) / 255, parseInt(m[2]!, 16) / 255, parseInt(m[3]!, 16) / 255]
}

export default page
