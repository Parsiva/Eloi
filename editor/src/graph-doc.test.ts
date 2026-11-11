import { describe, expect, it } from 'vitest'
import type { FrameGraph } from '@eloi/engine'
import { addLine, addNode, dependents, depths, placedBy, remove, renameLine, renameNode, setPlaceKind } from './graph-doc'

const make = (): FrameGraph => ({
  id: 'g',
  graph: 1,
  module: 10,
  params: {},
  nodes: [
    { id: 'med', at: { from: 'tl', dx: 5, dy: 5 }, r: 3 },
    { id: 'foot', at: { from: 'bl', dx: 5, dy: 5 } },
    { id: 'waist', at: { on: 'lead', t: 0.5 } },
    { id: 'col', at: { x: 'waist', y: 'med' } },
  ],
  lines: [
    { id: 'lead', from: { node: 'med', port: 0, wrap: 'ccw' }, to: 'foot', draw: false },
    { id: 'strand', along: 'lead', rule: [{ offset: 1 }] },
  ],
  openings: [{ id: 'main', left: { of: 'col', add: 1 }, right: 'W - 5', top: { of: 'med' }, bottom: { of: 'foot' } }],
})

describe('relationships', () => {
  it('knows what a node is placed by', () => {
    const doc = make()
    expect(placedBy(doc.nodes[0]!.at)).toEqual({ nodes: ['tl'] })
    expect(placedBy(doc.nodes[2]!.at)).toEqual({ nodes: [], line: 'lead' })
    expect(placedBy(doc.nodes[3]!.at)).toEqual({ nodes: ['waist', 'med'] })
  })

  it('lists everything measured from a node or a line', () => {
    const doc = make()
    expect(dependents(doc, { kind: 'node', id: 'med' })).toEqual([
      { kind: 'node', id: 'col' },
      { kind: 'line', id: 'lead' },
      { kind: 'opening', id: 'main' },
    ])
    expect(dependents(doc, { kind: 'line', id: 'lead' })).toEqual([
      { kind: 'node', id: 'waist' },
      { kind: 'line', id: 'strand' },
    ])
  })

  it('counts steps from the corners, through lines', () => {
    const d = depths(make())
    expect(d.get('med')).toBe(1)
    expect(d.get('waist')).toBe(2) // rides a line strung between step-1 nodes
    expect(d.get('col')).toBe(3)
  })
})

describe('edits', () => {
  it('renames a node everywhere it is used', () => {
    const doc = make()
    expect(renameNode(doc, 'med', 'medallion')).toBeUndefined()
    expect(doc.lines[0]!.from).toEqual({ node: 'medallion', port: 0, wrap: 'ccw' })
    expect(doc.nodes[3]!.at).toEqual({ x: 'waist', y: 'medallion' })
    expect(doc.openings[0]!.top).toEqual({ of: 'medallion' })
    expect(renameNode(doc, 'foot', 'tl')).toMatch(/already/)
    expect(renameNode(doc, 'foot', '9lives')).toMatch(/starts with a letter/)
  })

  it('renames a line for its followers and riders', () => {
    const doc = make()
    expect(renameLine(doc, 'lead', 'side')).toBeUndefined()
    expect(doc.lines[1]!.along).toBe('side')
    expect(doc.nodes[2]!.at).toEqual({ on: 'side', t: 0.5 })
  })

  it('refuses to delete what others are measured from', () => {
    const doc = make()
    expect(remove(doc, { kind: 'node', id: 'med' })).toMatch(/Still used by/)
    expect(remove(doc, { kind: 'line', id: 'strand' })).toBeUndefined()
    expect(doc.lines.map((l) => l.id)).toEqual(['lead'])
  })

  it('adds nodes and lines with fresh names', () => {
    const doc = make()
    expect(addNode(doc, 'med').at).toEqual({ from: 'med', dx: 3, dy: 3 })
    expect(addNode(doc, 'med').id).toBe('node.2')
    expect(addLine(doc, { kind: 'line', id: 'lead' })).toMatchObject({ id: 'lead.strand', along: 'lead' })
    expect(addLine(doc, { kind: 'node', id: 'med' })).toMatchObject({ from: 'med', to: 'br' })
  })

  it('changes how a node is placed, keeping its references', () => {
    const doc = make()
    const col = doc.nodes[3]!
    setPlaceKind(col, 'between', 'lead')
    expect(col.at).toEqual({ between: ['waist', 'med'], t: 0.5 })
    setPlaceKind(col, 'on', 'lead')
    expect(col.at).toEqual({ on: 'lead', t: 0.5 })
  })
})
