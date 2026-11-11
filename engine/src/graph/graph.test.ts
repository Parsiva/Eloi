import { describe, expect, it } from 'vitest'
import type { FrameGraph } from './doc'
import { compile, evaluate, problemWith } from './expr'
import { tangent } from './geom'
import { solve } from './solve'

describe('expressions', () => {
  it('does arithmetic with the usual precedence', () => {
    expect(evaluate('1 + 2 * 3 ^ 2', {})).toBe(19)
    expect(evaluate('-(2 + 3) * 2', {})).toBe(-10)
    expect(evaluate('10 % 4', {})).toBe(2)
  })

  it('reads names, compares and chooses', () => {
    expect(evaluate('W > 60 ? a : b', { W: 80, a: 1, b: 2 })).toBe(1)
    expect(evaluate('W > 60 && H > 60 ? 1 : 0', { W: 80, H: 40 })).toBe(0)
    expect(evaluate('W <= 80', { W: 80 })).toBe(1)
  })

  it('has waves and helpers', () => {
    expect(evaluate('sin(tau / 4)', {})).toBeCloseTo(1)
    expect(evaluate('tri(0.25)', {})).toBeCloseTo(1)
    expect(evaluate('clamp(5, 0, 2) + mix(0, 10, 0.5)', {})).toBe(7)
    // ramp is 0 at both ends of a line and 1 in the middle
    expect(evaluate('ramp(2)', { s: 0, len: 10 })).toBe(0)
    expect(evaluate('ramp(2)', { s: 5, len: 10 })).toBe(1)
    expect(evaluate('ramp(2)', { s: 10, len: 10 })).toBe(0)
  })

  it('says what is wrong', () => {
    expect(problemWith('1 +')).toMatch(/unexpected end/)
    expect(problemWith('nope(1)')).toMatch(/unknown function/)
    expect(() => evaluate('missing * 2', {})).toThrow(/not defined/)
    expect(compile('a + b').vars).toEqual(new Set(['a', 'b']))
  })
})

describe('tangent', () => {
  it('leaves the top of a clockwise circle heading for a point to the right', () => {
    const run = tangent({ x: 0, y: 0 }, 1, 1, { x: 10, y: 0 }, 0, 0)!
    expect(run.a.y).toBeLessThan(-0.9)
    expect(run.b).toEqual({ x: 10, y: 0 })
  })

  it('refuses bodies that overlap', () => {
    expect(tangent({ x: 0, y: 0 }, 5, 1, { x: 2, y: 0 }, 0, 0)).toBeUndefined()
  })
})

const base = (extra: Partial<FrameGraph>): FrameGraph => ({ id: 't', graph: 1, module: 10, params: {}, nodes: [], lines: [], openings: [], ...extra })

describe('solve', () => {
  it('puts the four corners on the screen and mirrors steps from them', () => {
    const s = solve(
      base({
        nodes: [
          { id: 'a', at: { from: 'tl', dx: 2, dy: 3 } },
          { id: 'b', at: { from: 'br', dx: 2, dy: 3 } },
        ],
      }),
      800,
      600,
    )
    expect(s.nodes.get('tr')).toMatchObject({ x: 800, y: 0 })
    expect(s.nodes.get('a')).toMatchObject({ x: 20, y: 30 })
    expect(s.nodes.get('b')).toMatchObject({ x: 780, y: 570 })
    expect(s.issues).toEqual([])
  })

  it('places nodes by other nodes and on lines, whatever the order', () => {
    const s = solve(
      base({
        nodes: [
          { id: 'rider', at: { on: 'top', t: 0.5 } },
          { id: 'mid', at: { between: ['tl', 'br'] } },
          { id: 'cross', at: { x: 'mid', y: 'tl', dy: 1 } },
        ],
        lines: [{ id: 'top', from: 'tl', to: 'tr' }],
      }),
      800,
      600,
    )
    expect(s.nodes.get('rider')).toMatchObject({ x: 400, y: 0 })
    expect(s.nodes.get('mid')).toMatchObject({ x: 400, y: 300 })
    expect(s.nodes.get('cross')).toMatchObject({ x: 400, y: 10 })
  })

  it('fits whole cycles so a wave meets its far node on the spine', () => {
    const s = solve(
      base({
        rules: { wave: [{ cycles: 'len / 7', offset: 'sin(tau * n * t)' }] },
        lines: [{ id: 'l', from: 'tl', to: 'tr', rule: 'wave' }],
      }),
      800,
      600,
    )
    const l = s.lines.get('l')!
    expect(l.n).toBe(11) // 80 modules / 7, rounded
    const last = l.pts[l.pts.length - 1]!
    expect(last.x).toBeCloseTo(800)
    expect(last.y).toBeCloseTo(0)
    expect(Math.max(...l.pts.map((p) => p.y))).toBeCloseTo(10, 0)
  })

  it('uses the first variant whose condition holds', () => {
    const doc = base({
      rules: { r: [{ when: 'len < 50', offset: 0 }, { offset: 1 }] },
      lines: [{ id: 'l', from: 'tl', to: 'tr', rule: 'r' }],
    })
    expect(solve(doc, 400, 300).lines.get('l')!.variant).toBe(0)
    expect(solve(doc, 800, 300).lines.get('l')!.variant).toBe(1)
  })

  it('runs a line along its leader, keeping its distance round corners', () => {
    const s = solve(
      base({
        lines: [
          { id: 'border', from: 'tl', via: ['tr', 'br', 'bl'], to: 'tl' },
          { id: 'inner', along: 'border', rule: [{ offset: 2 }] },
        ],
      }),
      800,
      600,
    )
    const xs = s.lines.get('inner')!.pts.map((p) => p.x)
    const ys = s.lines.get('inner')!.pts.map((p) => p.y)
    expect(Math.min(...xs)).toBeCloseTo(20)
    expect(Math.max(...xs)).toBeCloseTo(780)
    expect(Math.min(...ys)).toBeCloseTo(20)
    expect(Math.max(...ys)).toBeCloseTo(580)
  })

  it('winds around a node before leaving on a tangent', () => {
    const s = solve(
      base({
        nodes: [{ id: 'med', at: { from: 'tl', dx: 10, dy: 10 }, r: 4 }],
        lines: [{ id: 'l', from: { node: 'med', port: 0, wrap: 'ccw' }, to: 'bl' }],
      }),
      800,
      600,
    )
    const pts = s.lines.get('l')!.pts
    expect(pts[0]!.x).toBeCloseTo(140) // starts at the right of the medallion
    expect(Math.min(...pts.map((p) => p.y))).toBeCloseTo(60, 0) // goes over the top
    expect(Math.min(...pts.map((p) => p.x))).toBeLessThan(61) // and round the left
  })

  it('cuts the strand passing under at each crossing of a weave', () => {
    const s = solve(
      base({
        rules: { twist: [{ cycles: 3, offset: 'sin(tau * (n * t + phase))' }] },
        lines: [
          { id: 'lead', from: 'tl', to: 'tr', draw: false },
          { id: 'a', along: 'lead', rule: 'twist', vars: { phase: 0 }, weave: 'w' },
          { id: 'b', along: 'lead', rule: 'twist', vars: { phase: 0.5 }, weave: 'w' },
        ],
      }),
      800,
      600,
    )
    const pieces = s.lines.get('a')!.parts.length + s.lines.get('b')!.parts.length
    expect(pieces).toBeGreaterThan(5)
  })

  it('leaves out what a threshold removes, and what depends on it, without complaint', () => {
    const s = solve(
      base({
        nodes: [
          { id: 'a', at: { from: 'tl', dx: 1 }, when: 'W > 100' },
          { id: 'b', at: { from: 'a', dx: 1 } },
        ],
        lines: [{ id: 'l', from: 'b', to: 'tr' }],
        openings: [{ id: 'o', left: { of: 'b' }, right: 10, top: 0, bottom: 10 }],
      }),
      800,
      600,
    )
    expect(s.nodes.has('a') || s.nodes.has('b') || s.lines.has('l') || s.openings.length > 0).toBe(false)
    expect(s.issues).toEqual([])
  })

  it('reports what is broken and still draws the rest', () => {
    const s = solve(
      base({
        nodes: [
          { id: 'bad', at: { from: 'nowhere' } },
          { id: 'loop', at: { on: 'ring' } },
          { id: 'ok', at: { from: 'tl', dx: 1 } },
        ],
        lines: [{ id: 'ring', from: 'loop', to: 'tr' }],
      }),
      800,
      600,
    )
    expect(s.nodes.has('ok')).toBe(true)
    expect(s.issues.map((i) => i.id).sort()).toEqual(['bad', 'loop', 'ring'])
  })

  it('measures openings from nodes', () => {
    const s = solve(
      base({
        nodes: [{ id: 'a', at: { from: 'tl', dx: 5, dy: 5 }, r: 2 }],
        openings: [{ id: 'main', left: { of: 'a', add: 'r + 1' }, right: 'W - 5', top: { of: 'a' }, bottom: 'H - 5' }],
      }),
      800,
      600,
    )
    expect(s.openings[0]).toMatchObject({ x: 80, y: 50, width: 670, height: 500 })
  })
})
