// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { liveCounts, mount } from './index'
import type { FrameSpec, Skin } from './spec'

beforeAll(() => {
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', Observer)
  vi.stubGlobal('IntersectionObserver', Observer)
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('requestAnimationFrame', (fn: (t: number) => void) => setTimeout(() => fn(performance.now()), 0))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
})

const spec: FrameSpec = {
  id: 'test',
  classes: [{ name: 'all', min: 0 }],
  module: { from: [0, 8], to: [1000, 8] },
  plans: [
    {
      id: 'main',
      sheet: {
        split: 'cols',
        parts: [
          { id: 'a', size: { fr: 1 }, region: { opening: 'one' } },
          { id: 'b', size: { fr: 1 }, region: { opening: 'two' } },
        ],
      },
    },
  ],
}

const skin: Skin = { id: 'plain', tokens: {}, roles: {}, members: [] }

function makeHost(): HTMLElement {
  const host = document.createElement('div')
  host.innerHTML = '<section data-slot="one"><p>first</p><p>again</p></section><section data-slot="two"><em>second</em></section>'
  document.body.append(host)
  return host
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('mount', () => {
  it('builds the sheet and moves host slot content into the openings', async () => {
    const host = makeHost()
    const one = host.querySelector<HTMLElement>('[data-slot="one"]')!
    const frame = mount(host, spec, { skin })
    const sheet = host.querySelector('.eloi-sheet')!
    expect(sheet).toBeTruthy()
    expect(sheet.querySelectorAll('.eloi-opening').length).toBe(2)
    expect(frame.opening('one')).toBe(one)
    expect(one.parentElement?.classList.contains('eloi-sheet')).toBe(true)
    expect(one.textContent).toBe('firstagain')
    await frame.dispose()
  })

  it('throws on an invalid spec', () => {
    const bad: FrameSpec = {
      ...spec,
      plans: [
        {
          id: 'bad',
          sheet: {
            split: 'cols',
            parts: [
              { id: 'dup', size: { fr: 1 } },
              { id: 'dup', size: { fr: 1 } },
            ],
          },
        },
      ],
    }
    expect(() => mount(makeHost(), bad, { skin })).toThrow(/invalid frame spec/)
  })
})

describe('dispose', () => {
  it('restores the host slot children and removes engine DOM', async () => {
    const host = makeHost()
    const before = host.innerHTML
    const frame = mount(host, spec, { skin })
    await frame.dispose()
    expect(host.innerHTML).toBe(before)
    expect(host.querySelector('.eloi-sheet, svg, .eloi-opening')).toBeNull()
    expect(host.classList.contains('eloi-frame')).toBe(false)
  })

  it('unwraps boxes that had a runtime', async () => {
    const host = makeHost()
    const before = host.innerHTML
    const frame = mount(host, spec, {
      skin,
      boxes: { one: { runtime: { mount() {} }, when: 'load' } },
    })
    await frame.dispose()
    expect(host.innerHTML).toBe(before)
  })

  it('returns liveCounts to their pre-mount values', async () => {
    const before = liveCounts()
    const frame = mount(makeHost(), spec, { skin, boxes: { one: { runtime: { mount() {} } } } })
    expect(liveCounts()).not.toEqual(before)
    await frame.dispose()
    expect(liveCounts()).toEqual(before)
  })
})

describe('setSpec', () => {
  const three: FrameSpec = {
    ...spec,
    plans: [
      {
        id: 'main',
        sheet: {
          split: 'rows',
          parts: [
            { id: 'top', size: 'auto', region: { opening: 'two' } },
            { id: 'mid', size: { m: 2 } },
            { id: 'low', size: 'auto', region: { opening: 'three' } },
          ],
        },
      },
    ],
  }

  it('rebuilds the sheet and keeps the elements of openings that stay', async () => {
    const host = makeHost()
    const two = host.querySelector<HTMLElement>('[data-slot="two"]')!
    const frame = mount(host, spec, { skin })
    frame.setSpec(three)
    expect(frame.spec).toBe(three)
    expect(frame.opening('two')).toBe(two)
    expect(two.isConnected).toBe(true)
    expect(two.dataset.bay).toBe('top')
    expect(two.innerHTML).toBe('<em>second</em>')
    expect(frame.opening('one')?.isConnected).toBe(false)
    expect(frame.opening('three')?.isConnected).toBe(true)
    expect(host.querySelectorAll('.eloi-sheet').length).toBe(1)
    expect(Object.keys(frame.bays()).sort()).toEqual(['low', 'mid', 'sheet', 'top'])
    frame.setSpec(spec)
    expect(frame.opening('one')?.isConnected).toBe(true)
    expect(frame.opening('one')?.textContent).toBe('firstagain')
    await frame.dispose()
  })

  it('refuses an invalid spec and leaves the frame as it was', async () => {
    const host = makeHost()
    const frame = mount(host, spec, { skin })
    const bad: FrameSpec = { ...spec, plans: [{ id: 'x', sheet: { split: 'cols', parts: [{ id: 'a', size: 'auto' }, { id: 'a', size: 'auto' }] } }] }
    expect(() => frame.setSpec(bad)).toThrow(/duplicate part id/)
    expect(() => frame.setSpec({ ...spec, plans: [] })).toThrow(/at least one plan/)
    expect(frame.spec).toBe(spec)
    expect(host.querySelectorAll('.eloi-opening').length).toBe(2)
    await frame.dispose()
  })
})
