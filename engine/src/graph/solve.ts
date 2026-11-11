// solve(): a frame graph and a screen size in, one drawing out. Pure: no DOM.
//
// Things are solved on demand and remembered, so the order in the document does not matter:
// a node asks for the nodes (or line) it is placed by, a line asks for its end nodes or its
// leader. Something whose `when` fails is absent, and so is everything that depends on it.
import { CORNERS, isCorner, type Corner, type End, type FrameGraph, type LineDef, type NodeDef, type OpeningDef, type Variant } from './doc'
import { evaluate, type Env, type Num } from './expr'
import { arc, cut, densify, fillet, lengths, lerp, normals, pointAt, sharp, simplify, slice, tangent, type Pt } from './geom'

export interface SolvedNode {
  id: string
  def?: NodeDef // absent for the four corners
  x: number
  y: number
  r: number // px
  sx: 1 | -1 // the node's frame: which way "inward" points
  sy: 1 | -1
  rot: number // radians; the direction of the line a node rides on
  parents: string[] // what it was placed by (node ids; a line id is prefixed "line:")
}

export interface SolvedLine {
  id: string
  def: LineDef
  pts: Pt[] // the finished curve
  cum: number[]
  len: number // px
  parts: Pt[][] // what is drawn: the curve, simplified, minus where it passes under another
  offsets: number[] // sideways displacement at each point, in modules
  n: number // cycles fitted
  variant: number // which variant of its rule was used (-1: none)
  from?: string // node ids at its ends
  to?: string
  leader?: string
  easeIn: number // modules: how its first node lets go of it, and its last takes it in
  easeOut: number
}

export interface SolvedOpening {
  id: string
  def: OpeningDef
  x: number
  y: number
  width: number
  height: number
}

export interface Issue {
  kind: 'frame' | 'param' | 'node' | 'line' | 'opening'
  id: string
  message: string
}

export interface Solved {
  w: number
  h: number
  m: number
  env: Env
  nodes: Map<string, SolvedNode>
  lines: Map<string, SolvedLine>
  openings: SolvedOpening[]
  issues: Issue[]
}

// Thrown for something that is absent by design (its `when` failed), not broken.
class Absent extends Error {}

type Sign = 1 | -1
const FRAMES: Record<Corner, readonly [Sign, Sign]> = { tl: [1, 1], tr: [-1, 1], bl: [1, -1], br: [-1, -1] }
const frameOf = (def: NodeDef, inherit?: SolvedNode): readonly [Sign, Sign] => (def.frame ? FRAMES[def.frame] : inherit ? [inherit.sx, inherit.sy] : [1, 1])
const rad = (deg: number) => (deg * Math.PI) / 180
const message = (err: unknown) => (err instanceof Error ? err.message : String(err))

export function solve(doc: FrameGraph, w: number, h: number): Solved {
  const issues: Issue[] = []
  const env: Env = { w, h }
  let m = 12
  try {
    m = Math.max(1, evaluate(doc.module, env))
  } catch (err) {
    issues.push({ kind: 'frame', id: doc.id, message: `module: ${message(err)}` })
  }
  env.m = m
  env.W = w / m
  env.H = h / m
  for (const [name, value] of Object.entries(doc.params ?? {})) {
    try {
      env[name] = evaluate(value, env)
    } catch (err) {
      issues.push({ kind: 'param', id: name, message: message(err) })
      env[name] = 0
    }
  }
  const step = Math.min(5, Math.max(2.5, m * 0.3))

  const nodeDefs = new Map(doc.nodes.map((def) => [def.id, def]))
  const lineDefs = new Map(doc.lines.map((def) => [def.id, def]))
  const nodes = new Map<string, SolvedNode | Error>()
  const lines = new Map<string, SolvedLine | Error>()
  const busy = new Set<string>()

  const holds = (when: Num | undefined) => when === undefined || evaluate(when, env) !== 0

  // Solve once; remember the result or the failure.
  function once<T>(memo: Map<string, T | Error>, key: string, id: string, make: () => T): T {
    const known = memo.get(id)
    if (known instanceof Error) throw known
    if (known !== undefined) return known
    if (busy.has(key)) throw new Error(`"${id}" depends on itself`)
    busy.add(key)
    try {
      const made = make()
      memo.set(id, made)
      return made
    } catch (err) {
      const failure = err instanceof Error ? err : new Error(String(err))
      memo.set(id, failure)
      throw failure
    } finally {
      busy.delete(key)
    }
  }

  // Something this depends on: absent stays absent, broken is named.
  function need<T>(get: () => T, what: string): T {
    try {
      return get()
    } catch (err) {
      if (err instanceof Absent) throw new Absent(err.message)
      throw new Error(err instanceof Error && err.message.startsWith('needs ') ? err.message : `needs ${what}, which has a problem`)
    }
  }

  function node(id: string): SolvedNode {
    return once(nodes, `node:${id}`, id, () => {
      if (isCorner(id)) {
        const [sx, sy] = FRAMES[id]
        return { id, x: sx === 1 ? 0 : w, y: sy === 1 ? 0 : h, r: 0, sx, sy, rot: 0, parents: [] }
      }
      const def = nodeDefs.get(id)
      if (!def) throw new Error(`there is no node "${id}"`)
      if (!holds(def.when)) throw new Absent(id)
      const at = def.at
      const dep = (other: string) => need(() => node(other), `node "${other}"`)
      let x: number
      let y: number
      let rot = 0
      let inherit: SolvedNode | undefined
      let parents: string[]
      if ('from' in at) {
        const p = (inherit = dep(at.from))
        parents = [at.from]
        const [sx, sy] = frameOf(def, p)
        x = p.x + sx * evaluate(at.dx, env, 0) * m
        y = p.y + sy * evaluate(at.dy, env, 0) * m
      } else if ('between' in at) {
        const a = (inherit = dep(at.between[0]))
        const b = dep(at.between[1])
        parents = [...at.between]
        const p = lerp(a, b, evaluate(at.t, env, 0.5))
        const d = Math.hypot(b.x - a.x, b.y - a.y) || 1
        const off = evaluate(at.off, env, 0) * m
        x = p.x - ((b.y - a.y) / d) * off
        y = p.y + ((b.x - a.x) / d) * off
      } else if ('on' in at) {
        const leader = need(() => line(at.on), `line "${at.on}"`)
        parents = [`line:${at.on}`]
        const p = pointAt(leader.pts, leader.cum, evaluate(at.t, env, 0.5) * leader.len)
        const off = evaluate(at.off, env, 0) * m
        x = p.x - Math.sin(p.angle) * off
        y = p.y + Math.cos(p.angle) * off
        rot = p.angle
      } else {
        const px = (inherit = dep(at.x))
        const py = dep(at.y)
        parents = [at.x, at.y]
        const [sx, sy] = frameOf(def, px)
        x = px.x + sx * evaluate(at.dx, env, 0) * m
        y = py.y + sy * evaluate(at.dy, env, 0) * m
      }
      const [sx, sy] = frameOf(def, inherit)
      return { id, def, x, y, r: Math.max(0, evaluate(def.r, env, 0)) * m, sx, sy, rot, parents }
    })
  }

  // An end of a line as a body to leave or meet: a circle with a turning sense, or a point.
  interface Station {
    id: string
    c: Pt
    r: number
    sense: number
    port?: number // screen angle
    trim: number // for a plain end: how far from the centre the line stops
  }

  function station(end: End): Station {
    const ref = typeof end === 'string' ? { node: end } : end
    const n = need(() => node(ref.node), `node "${ref.node}"`)
    const gap = evaluate(ref.gap, env, 0) * m
    const reach = n.r + gap
    const port = ref.port === undefined ? undefined : Math.atan2(n.sy * Math.sin(rad(evaluate(ref.port, env))), n.sx * Math.cos(rad(evaluate(ref.port, env))))
    if (ref.wrap && reach > 0) return { id: n.id, c: n, r: reach, sense: (ref.wrap === 'cw' ? 1 : -1) * n.sx * n.sy, port, trim: 0 }
    if (port !== undefined) return { id: n.id, c: { x: n.x + reach * Math.cos(port), y: n.y + reach * Math.sin(port) }, r: 0, sense: 0, trim: 0 }
    return { id: n.id, c: n, r: 0, sense: 0, trim: reach }
  }

  // A line's own spine: from one body, through any waypoints, to the other.
  function spine(def: LineDef): Pt[] {
    if (!def.from || !def.to) throw new Error('needs both "from" and "to", or "along"')
    const a = station(def.from)
    const b = station(def.to)
    const via = (def.via ?? []).map((id) => need(() => node(id), `node "${id}"`))
    const first: Pt = via[0] ?? b.c
    const last: Pt = via[via.length - 1] ?? a.c
    const pts: Pt[] = []

    // Leaving: around the body from the port to where the tangent lifts off.
    let leave: Pt = a.c
    if (a.r > 0) {
      const run = via.length ? tangent(a.c, a.r, a.sense, first, 0, 0) : tangent(a.c, a.r, a.sense, b.c, b.r, b.sense)
      if (run) {
        leave = run.a
        if (a.port !== undefined) {
          const off = Math.atan2(leave.y - a.c.y, leave.x - a.c.x)
          const sweep = (((off - a.port) * a.sense) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
          pts.push(...arc(a.c, a.r, a.port, sweep * a.sense, step).slice(0, -1))
        }
      }
    }
    pts.push(leave)

    const corners: Pt[] = [leave, ...via]
    // Arriving: where the tangent touches down, then around the body to the port.
    let arrive: Pt = b.c
    let landing: Pt[] = []
    if (b.r > 0) {
      const run = via.length ? tangent(last, 0, 0, b.c, b.r, b.sense) : tangent(a.c, a.r > 0 ? a.r : 0, a.sense, b.c, b.r, b.sense)
      if (run) {
        arrive = run.b
        if (b.port !== undefined) {
          const on = Math.atan2(arrive.y - b.c.y, arrive.x - b.c.x)
          const sweep = (((b.port - on) * b.sense) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
          landing = arc(b.c, b.r, on, sweep * b.sense, step).slice(1)
        }
      }
    }
    corners.push(arrive)

    // Plain ends stop at the edge of their node, facing the way the line goes.
    const pull = (p: Pt, toward: Pt, by: number): Pt => {
      const d = Math.hypot(toward.x - p.x, toward.y - p.y)
      return by > 0 && d > by * 1.5 ? lerp(p, toward, by / d) : p
    }
    if (a.trim) pts[pts.length - 1] = corners[0] = pull(corners[0]!, corners[1]!, a.trim)
    if (b.trim) corners[corners.length - 1] = pull(corners[corners.length - 1]!, corners[corners.length - 2]!, b.trim)

    const round = evaluate(def.round, env, 0) * m
    for (let i = 1; i < corners.length; i++) {
      const p = corners[i]!
      const next = corners[i + 1]
      if (next && round > 0) pts.push(...fillet(corners[i - 1]!, p, next, round, step))
      else pts.push(p)
    }
    pts.push(...landing)
    return densify(pts, step)
  }

  function line(id: string): SolvedLine {
    return once(lines, `line:${id}`, id, () => {
      const def = lineDefs.get(id)
      if (!def) throw new Error(`there is no line "${id}"`)
      if (!holds(def.when)) throw new Absent(id)

      let base: Pt[]
      let from: string | undefined
      let to: string | undefined
      let easeIn = 0
      let easeOut = 0
      if (def.along) {
        const leader = need(() => line(def.along!), `line "${def.along}"`)
        from = leader.from
        to = leader.to
        easeIn = leader.easeIn
        easeOut = leader.easeOut
        if (def.span) {
          const t0 = Math.min(1, Math.max(0, evaluate(def.span[0], env)))
          const t1 = Math.min(1, Math.max(0, evaluate(def.span[1], env)))
          if (t1 <= t0) throw new Error('its span is empty')
          base = slice(leader.pts, leader.cum, t0 * leader.len, t1 * leader.len)
        } else base = leader.pts
      } else {
        base = spine(def)
        from = typeof def.from === 'string' ? def.from : def.from?.node
        to = typeof def.to === 'string' ? def.to : def.to?.node
        if (typeof def.from === 'object') easeIn = evaluate(def.from.ease, env, 0)
        if (typeof def.to === 'object') easeOut = evaluate(def.to.ease, env, 0)
      }
      if (base.length < 2) throw new Error('it has no length')

      const cum = lengths(base)
      const len = cum[cum.length - 1]!
      const variants: Variant[] | undefined = typeof def.rule === 'string' ? doc.rules?.[def.rule] : def.rule
      if (typeof def.rule === 'string' && !variants) throw new Error(`there is no rule "${def.rule}"`)

      // The line's own values, then the first variant whose condition holds.
      const local: Env = { ...env, len: len / m, t: 0, s: 0, n: 1, easeIn, easeOut }
      for (const [name, value] of Object.entries(def.vars ?? {})) local[name] = evaluate(value, local)
      const index = variants ? variants.findIndex((v) => v.when === undefined || evaluate(v.when, local) !== 0) : -1
      const variant = index >= 0 ? variants![index] : undefined
      let pts = base
      let n = 1
      const offsets = new Array<number>(base.length).fill(0)
      if (variant) {
        if (variant.cycles !== undefined) n = Math.max(1, Math.round(evaluate(variant.cycles, local)))
        local.n = n
        const side = normals(base)
        pts = base.map((p, i) => {
          local.s = cum[i]! / m
          local.t = len > 0 ? cum[i]! / len : 0
          const off = evaluate(variant.offset, local)
          offsets[i] = off
          return off === 0 ? p : { x: p.x + side[i]!.x * off * m, y: p.y + side[i]!.y * off * m }
        })
        // On the inside of a sharp corner the displaced points would fold back over each other;
        // gather them onto the corner's mitre instead.
        for (const corner of sharp(base)) {
          const c = base[corner.index]!
          for (const dir of [1, -1]) {
            for (let i = corner.index + dir; i >= 0 && i < base.length; i += dir) {
              const off = offsets[i]!
              if (off * corner.sign <= 0 || Math.abs(cum[i]! - cum[corner.index]!) >= Math.abs(off) * m * Math.min(4, corner.tan)) break
              pts[i] = { x: c.x + side[corner.index]!.x * off * m, y: c.y + side[corner.index]!.y * off * m }
            }
          }
        }
      }
      const out = variant ? lengths(pts) : cum
      return { id, def, pts, cum: out, len: out[out.length - 1]!, parts: [], offsets, n, variant: index, from, to, leader: def.along, easeIn, easeOut }
    })
  }

  // Solve everything, collecting what is absent and what is broken.
  const solved: Solved = { w, h, m, env, nodes: new Map(), lines: new Map(), openings: [], issues }
  const attempt = <T>(kind: Issue['kind'], id: string, get: () => T): T | undefined => {
    try {
      return get()
    } catch (err) {
      if (!(err instanceof Absent)) issues.push({ kind, id, message: message(err) })
      return undefined
    }
  }
  for (const id of CORNERS) solved.nodes.set(id, node(id))
  for (const def of doc.nodes) {
    const made = attempt('node', def.id, () => node(def.id))
    if (made) solved.nodes.set(def.id, made)
  }
  for (const def of doc.lines) {
    const made = attempt('line', def.id, () => line(def.id))
    if (made) solved.lines.set(def.id, made)
  }
  for (const def of doc.openings) {
    const made = attempt('opening', def.id, () => opening(def))
    if (made) solved.openings.push(made)
  }

  function opening(def: OpeningDef): SolvedOpening {
    if (!holds(def.when)) throw new Absent(def.id)
    const edge = (value: OpeningDef['left'], axis: 'x' | 'y'): number => {
      if (typeof value !== 'object') return evaluate(value, env) * m
      const n = need(() => node(value.of), `node "${value.of}"`)
      return n[axis] + evaluate(value.add, { ...env, r: n.r / m }, 0) * m
    }
    const left = edge(def.left, 'x')
    const right = edge(def.right, 'x')
    const top = edge(def.top, 'y')
    const bottom = edge(def.bottom, 'y')
    if (right - left < 1 || bottom - top < 1) throw new Absent(def.id)
    return { id: def.id, def, x: left, y: top, width: right - left, height: bottom - top }
  }

  weave(solved, m)
  for (const l of solved.lines.values()) if (l.parts.length === 0) l.parts = [simplify(l.pts, 0.12)]
  return solved
}

// Strands that share a weave and a spine pass over and under each other in turn: at each
// crossing, the one going under is cut back a little either side.
function weave(solved: Solved, m: number): void {
  const groups = new Map<string, SolvedLine[]>()
  for (const l of solved.lines.values()) {
    if (!l.def.weave || l.def.draw === false) continue
    const key = `${l.def.weave}|${l.leader ?? l.id}|${l.pts.length}`
    groups.set(key, [...(groups.get(key) ?? []), l])
  }
  for (const strands of groups.values()) {
    const gaps = new Map<SolvedLine, [number, number][]>(strands.map((l) => [l, []]))
    for (let i = 0; i < strands.length; i++) {
      for (let j = i + 1; j < strands.length; j++) {
        const a = strands[i]!
        const b = strands[j]!
        const clear = (px(a, solved.env) + px(b, solved.env)) / 2 + Math.max(1.5, m * 0.14)
        let last = 0
        let count = 0
        for (let k = 0; k < a.offsets.length; k++) {
          const diff = a.offsets[k]! - b.offsets[k]!
          const sign = Math.abs(diff) < 1e-6 ? 0 : Math.sign(diff)
          if (sign === 0) continue
          if (last !== 0 && sign !== last && k > 0) {
            const under = (count + i + j) % 2 === 0 ? b : a
            const before = a.offsets[k - 1]! - b.offsets[k - 1]!
            const f = Math.abs(before) / (Math.abs(before) + Math.abs(diff))
            const at = under.cum[k - 1]! + (under.cum[k]! - under.cum[k - 1]!) * f
            // A shallow crossing needs a longer cut to show the same clearance.
            const ds = Math.max(1e-6, a.cum[k]! - a.cum[k - 1]!)
            const slope = (Math.abs(diff - before) * m) / ds
            const half = clear / Math.max(0.3, Math.sin(Math.atan(slope)))
            gaps.get(under)!.push([at - half, at + half])
            count++
          }
          last = sign
        }
      }
    }
    for (const [l, cuts] of gaps) l.parts = cut(l.pts, l.cum, cuts).map((piece) => simplify(piece, 0.12))
  }
}

const px = (l: SolvedLine, env: Env): number => {
  try {
    return evaluate(l.def.weight, env, 1)
  } catch {
    return 1
  }
}
