import { describe, expect, it } from 'vitest'
import { drawMembers, fitRepeat, memberDepths, profileDepth } from './members'
import type { Skin } from '../spec'

describe('fitRepeat', () => {
  it('fits a whole number of tiles, stretching each slightly', () => {
    expect(fitRepeat(100, 21)).toEqual({ count: 5, each: 20 })
    expect(fitRepeat(10, 21)).toEqual({ count: 1, each: 10 })
    expect(fitRepeat(0, 21)).toEqual({ count: 0, each: 0 })
  })
})

const skin: Skin = {
  id: 't',
  tokens: {},
  roles: { ink: '#222', accent: 'teal' },
  members: [
    {
      kind: 'ring',
      name: 'border',
      bay: 'sheet',
      profile: [
        { kind: 'rule', weight: 2 },
        { kind: 'gap', depth: 1 },
        { kind: 'fill', depth: 0.5, role: 'accent' },
      ],
      corners: { kind: 'block', roles: ['ink', 'accent'] },
    },
    { kind: 'rule', name: 'gutter', bay: 'g1', profile: [{ kind: 'rule', weight: 1 }] },
    { kind: 'chevrons', bay: 'band', size: 1, pitch: 3, motion: 'conveyor' },
  ],
}

describe('profiles', () => {
  it('adds rule weights in px and depths in m', () => {
    const ring = skin.members[0]!
    expect(profileDepth(ring.kind === 'ring' ? ring.profile : [], 10)).toBe(17)
    expect(memberDepths(skin, 10)).toEqual({ border: 17, gutter: 1 })
  })
})

describe('drawMembers', () => {
  const rects = {
    sheet: { x: 0, y: 0, w: 400, h: 300 },
    g1: { x: 100, y: 20, w: 20, h: 200 },
    band: { x: 20, y: 0, w: 360, h: 20 },
  }
  const { svg } = drawMembers({ skin, m: 10, rects, ids: 'f' })

  it('draws rules, fills, corner blocks and gutters with role paints', () => {
    expect(svg).toContain('stroke="#222"')
    expect(svg).toContain('fill="teal"')
    expect(svg.match(/<rect [^>]*fill="teal"/g)).toHaveLength(4) // the inner square of each corner block
    expect(svg).toContain('<line x1="110" y1="20" x2="110" y2="220"') // vertical gutter rule, centred
  })
  it('conveys chevrons by one fitted pitch', () => {
    expect(svg).toContain('class="eloi-conveyor" style="--eloi-pitch:30px"')
  })
  it('skips members whose bay is missing', () => {
    expect(drawMembers({ skin, m: 10, rects: {}, ids: 'f' }).svg).toBe('')
  })
})
