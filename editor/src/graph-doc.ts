// Edits and questions over a frame graph. Pure functions (they change the document they are
// given; the editor always hands them a copy), so they can be tested without a browser. A
// returned string is a refusal, worded for the person editing.
import { isCorner, type End, type FrameGraph, type GraphEdge, type LineDef, type NodeDef, type Place } from '@eloi/engine'

export type Ref = { kind: 'node' | 'line' | 'opening'; id: string }

const endNode = (end: End | undefined): string | undefined => (typeof end === 'string' ? end : end?.node)
const edgeNode = (edge: GraphEdge): string | undefined => (typeof edge === 'object' ? edge.of : undefined)

// The nodes a placement is measured from, and the line it rides, if any.
export function placedBy(at: Place): { nodes: string[]; line?: string } {
  if ('from' in at) return { nodes: [at.from] }
  if ('between' in at) return { nodes: [...at.between] }
  if ('on' in at) return { nodes: [], line: at.on }
  return { nodes: [at.x, at.y] }
}

export const placeKind = (at: Place): 'from' | 'between' | 'on' | 'cross' => ('from' in at ? 'from' : 'between' in at ? 'between' : 'on' in at ? 'on' : 'cross')

export function lineNodes(line: LineDef): string[] {
  return [endNode(line.from), ...(line.via ?? []), endNode(line.to)].filter((id): id is string => !!id)
}

// Everything that would stop working if this node or line went away.
export function dependents(doc: FrameGraph, ref: Ref): Ref[] {
  const out: Ref[] = []
  if (ref.kind === 'node') {
    for (const n of doc.nodes) if (placedBy(n.at).nodes.includes(ref.id)) out.push({ kind: 'node', id: n.id })
    for (const l of doc.lines) if (lineNodes(l).includes(ref.id)) out.push({ kind: 'line', id: l.id })
    for (const o of doc.openings) if ([o.left, o.right, o.top, o.bottom].some((e) => edgeNode(e) === ref.id)) out.push({ kind: 'opening', id: o.id })
  } else if (ref.kind === 'line') {
    for (const n of doc.nodes) if (placedBy(n.at).line === ref.id) out.push({ kind: 'node', id: n.id })
    for (const l of doc.lines) if (l.along === ref.id) out.push({ kind: 'line', id: l.id })
  }
  return out
}

// How many steps of relationship separate a node from the corners (corners are 0).
export function depths(doc: FrameGraph): Map<string, number> {
  const nodes = new Map(doc.nodes.map((n) => [n.id, n]))
  const lines = new Map(doc.lines.map((l) => [l.id, l]))
  const memo = new Map<string, number>()
  const busy = new Set<string>()
  const ofNode = (id: string): number => {
    if (isCorner(id)) return 0
    const known = memo.get(id)
    if (known !== undefined) return known
    const def = nodes.get(id)
    if (!def || busy.has(id)) return 0
    busy.add(id)
    const by = placedBy(def.at)
    const depth = 1 + Math.max(0, ...by.nodes.map(ofNode), by.line ? ofLine(by.line) : 0)
    busy.delete(id)
    memo.set(id, depth)
    return depth
  }
  const ofLine = (id: string): number => {
    const key = `line:${id}`
    const def = lines.get(id)
    if (!def || busy.has(key)) return 0
    busy.add(key)
    const depth = def.along ? ofLine(def.along) : Math.max(0, ...lineNodes(def).map(ofNode))
    busy.delete(key)
    return depth
  }
  for (const n of doc.nodes) ofNode(n.id)
  return memo
}

export function unique(base: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  if (!used.has(base)) return base
  for (let i = 2; ; i++) if (!used.has(`${base}.${i}`)) return `${base}.${i}`
}

const validId = (id: string) => /^[A-Za-z][\w.-]*$/.test(id)

export function renameNode(doc: FrameGraph, from: string, to: string): string | undefined {
  if (from === to) return undefined
  if (!validId(to)) return 'A name starts with a letter and uses letters, digits, dots and dashes.'
  if (isCorner(to) || doc.nodes.some((n) => n.id === to)) return `There is already a node called "${to}".`
  const swap = (id: string) => (id === from ? to : id)
  const swapEnd = (end: End | undefined): End | undefined => (end === undefined ? end : typeof end === 'string' ? swap(end) : { ...end, node: swap(end.node) })
  const swapEdge = (edge: GraphEdge): GraphEdge => (typeof edge === 'object' ? { ...edge, of: swap(edge.of) } : edge)
  for (const n of doc.nodes) {
    if (n.id === from) n.id = to
    const at = n.at
    if ('from' in at) at.from = swap(at.from)
    else if ('between' in at) at.between = [swap(at.between[0]), swap(at.between[1])]
    else if (!('on' in at)) {
      at.x = swap(at.x)
      at.y = swap(at.y)
    }
  }
  for (const l of doc.lines) {
    l.from = swapEnd(l.from)
    l.to = swapEnd(l.to)
    if (l.via) l.via = l.via.map(swap)
  }
  for (const o of doc.openings) {
    o.left = swapEdge(o.left)
    o.right = swapEdge(o.right)
    o.top = swapEdge(o.top)
    o.bottom = swapEdge(o.bottom)
  }
  return undefined
}

export function renameLine(doc: FrameGraph, from: string, to: string): string | undefined {
  if (from === to) return undefined
  if (!validId(to)) return 'A name starts with a letter and uses letters, digits, dots and dashes.'
  if (doc.lines.some((l) => l.id === to)) return `There is already a line called "${to}".`
  for (const l of doc.lines) {
    if (l.id === from) l.id = to
    if (l.along === from) l.along = to
  }
  for (const n of doc.nodes) if ('on' in n.at && n.at.on === from) n.at.on = to
  return undefined
}

export function remove(doc: FrameGraph, ref: Ref): string | undefined {
  const users = dependents(doc, ref)
  if (users.length) return `Still used by ${users.map((u) => `${u.kind} "${u.id}"`).join(', ')}. Change or delete those first.`
  if (ref.kind === 'node') doc.nodes = doc.nodes.filter((n) => n.id !== ref.id)
  else if (ref.kind === 'line') doc.lines = doc.lines.filter((l) => l.id !== ref.id)
  else doc.openings = doc.openings.filter((o) => o.id !== ref.id)
  return undefined
}

// A new node one step from an existing one, in that node's frame.
export function addNode(doc: FrameGraph, from: string): NodeDef {
  const node: NodeDef = {
    id: unique('node', doc.nodes.map((n) => n.id)),
    at: { from, dx: 3, dy: 3 },
    r: 1,
    glyph: [{ kind: 'circle', weight: 1, fill: 'paper' }],
  }
  doc.nodes.push(node)
  return node
}

// A new line: a strand along a leader, or a run between two nodes.
export function addLine(doc: FrameGraph, start: Ref, to = 'br'): LineDef {
  const ids = doc.lines.map((l) => l.id)
  const line: LineDef = start.kind === 'line' ? { id: unique(`${start.id}.strand`, ids), along: start.id, rule: [{ offset: 0.5 }], weight: 1 } : { id: unique('line', ids), from: start.id, to, weight: 1 }
  doc.lines.push(line)
  return line
}

// Switch how a node is placed, keeping what carries over.
export function setPlaceKind(node: NodeDef, kind: ReturnType<typeof placeKind>, fallbackLine: string | undefined): string | undefined {
  const by = placedBy(node.at)
  const a = by.nodes[0] ?? 'tl'
  const b = by.nodes[1] ?? 'br'
  if (kind === 'from') node.at = { from: a, dx: 0, dy: 0 }
  else if (kind === 'between') node.at = { between: [a, b], t: 0.5 }
  else if (kind === 'cross') node.at = { x: a, y: b }
  else {
    if (!fallbackLine) return 'There is no line to ride yet.'
    node.at = { on: by.line ?? fallbackLine, t: 0.5 }
  }
  return undefined
}
