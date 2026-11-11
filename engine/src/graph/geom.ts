// Geometry for frame graphs. Curves are dense polylines in screen pixels (y down), so every
// rule, however it is written, reduces to "move each point sideways by this much".

export interface Pt {
  x: number
  y: number
}

export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y)
export const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
const unit = (x: number, y: number): Pt => {
  const d = Math.hypot(x, y)
  return d < 1e-9 ? { x: 0, y: 0 } : { x: x / d, y: y / d }
}

// Cumulative length at each point.
export function lengths(pts: Pt[]): number[] {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1]! + dist(pts[i - 1]!, pts[i]!))
  return cum
}

// Split every segment so none is longer than `step`. Existing points stay, so corners stay sharp.
export function densify(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!
    if (i > 0) {
      const a = pts[i - 1]!
      const d = dist(a, p)
      if (d < 1e-6) continue
      const n = Math.ceil(d / step)
      for (let k = 1; k < n; k++) out.push(lerp(a, p, k / n))
    }
    out.push(p)
  }
  return out
}

// Points along a circle from angle a0, sweeping `sweep` radians (signed; positive is clockwise
// on screen).
export function arc(c: Pt, r: number, a0: number, sweep: number, step: number): Pt[] {
  const n = Math.max(1, Math.ceil((Math.abs(sweep) * r) / step))
  const out: Pt[] = []
  for (let k = 0; k <= n; k++) {
    const a = a0 + (sweep * k) / n
    out.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) })
  }
  return out
}

// The straight run between two bodies, touching each on a tangent. A body is a circle with a
// turning sense (s: +1 clockwise on screen, -1 anticlockwise) or a point (r = 0). The line
// leaves the first body travelling in its sense and joins the second travelling in its sense.
// Undefined when the bodies are too close for such a line.
export function tangent(c1: Pt, r1: number, s1: number, c2: Pt, r2: number, s2: number): { a: Pt; b: Pt } | undefined {
  const dx = c2.x - c1.x
  const dy = c2.y - c1.y
  const d = Math.hypot(dx, dy)
  const k = s1 * r1 - s2 * r2
  if (d < 1e-6 || Math.abs(k) >= d) return undefined
  const beta = Math.asin(k / d)
  const cos = Math.cos(beta)
  const sin = Math.sin(beta)
  const ux = (dx * cos - dy * sin) / d
  const uy = (dx * sin + dy * cos) / d
  // The radius to each touching point is the travel direction turned a quarter, against the sense.
  return {
    a: { x: c1.x + s1 * r1 * uy, y: c1.y - s1 * r1 * ux },
    b: { x: c2.x + s2 * r2 * uy, y: c2.y - s2 * r2 * ux },
  }
}

// Replace the corner at b with a curve that starts and ends `radius` away from it.
export function fillet(a: Pt, b: Pt, c: Pt, radius: number, step: number): Pt[] {
  const reach = Math.min(radius, dist(a, b) / 2, dist(b, c) / 2)
  if (reach < 0.5) return [b]
  const p0 = lerp(b, a, reach / dist(a, b))
  const p1 = lerp(b, c, reach / dist(b, c))
  const n = Math.max(2, Math.ceil((reach * 2) / step))
  const out: Pt[] = []
  for (let k = 0; k <= n; k++) {
    const t = k / n
    const u = 1 - t
    out.push({ x: u * u * p0.x + 2 * u * t * b.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * b.y + t * t * p1.y })
  }
  return out
}

export const isClosed = (pts: Pt[]) => pts.length > 3 && dist(pts[0]!, pts[pts.length - 1]!) < 1e-3

// At every point: the unit normal to the right of travel, scaled so that moving by it keeps a
// constant distance from both neighbouring segments (a mitre at corners).
export function normals(pts: Pt[]): Pt[] {
  const n = pts.length
  const closed = isClosed(pts)
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    let prev = pts[i - 1]
    let next = pts[i + 1]
    if (closed && i === 0) prev = pts[n - 2]
    if (closed && i === n - 1) next = pts[1]
    const p = pts[i]!
    const d1 = prev ? unit(p.x - prev.x, p.y - prev.y) : undefined
    const d2 = next ? unit(next.x - p.x, next.y - p.y) : undefined
    const a = d1 ?? d2 ?? { x: 1, y: 0 }
    const b = d2 ?? d1 ?? { x: 1, y: 0 }
    let t = unit(a.x + b.x, a.y + b.y)
    if (t.x === 0 && t.y === 0) t = a
    const cosHalf = Math.max(0.3, t.x * a.x + t.y * a.y)
    out.push({ x: -t.y / cosHalf, y: t.x / cosHalf })
  }
  return out
}

// The sharp corners of a curve: where it turns by more than about 25 degrees at one point.
// `sign` is +1 for a turn to the right; `tan` is the tangent of half the turn.
export function sharp(pts: Pt[]): { index: number; sign: number; tan: number }[] {
  const n = pts.length
  const closed = isClosed(pts)
  const out: { index: number; sign: number; tan: number }[] = []
  for (let i = 0; i < n; i++) {
    let prev = pts[i - 1]
    let next = pts[i + 1]
    if (closed && i === 0) prev = pts[n - 2]
    if (closed && i === n - 1) next = pts[1]
    if (!prev || !next) continue
    const p = pts[i]!
    const a = unit(p.x - prev.x, p.y - prev.y)
    const b = unit(next.x - p.x, next.y - p.y)
    const dot = a.x * b.x + a.y * b.y
    if (dot > 0.9) continue
    const cross = a.x * b.y - a.y * b.x
    out.push({ index: i, sign: cross >= 0 ? 1 : -1, tan: Math.tan(Math.acos(Math.max(-1, dot)) / 2) })
  }
  return out
}

// The point at distance s along a curve, with the direction of travel there.
export function pointAt(pts: Pt[], cum: number[], s: number): Pt & { angle: number } {
  const total = cum[cum.length - 1]!
  const at = Math.min(total, Math.max(0, s))
  let lo = 0
  let hi = cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid]! <= at) lo = mid
    else hi = mid
  }
  const a = pts[lo]!
  const b = pts[hi] ?? a
  const span = cum[hi]! - cum[lo]!
  const p = span > 0 ? lerp(a, b, (at - cum[lo]!) / span) : a
  return { ...p, angle: Math.atan2(b.y - a.y, b.x - a.x) }
}

// The part of a curve between distances s0 and s1, keeping the points in between.
export function slice(pts: Pt[], cum: number[], s0: number, s1: number): Pt[] {
  const out: Pt[] = []
  const first = pointAt(pts, cum, s0)
  out.push({ x: first.x, y: first.y })
  for (let i = 0; i < pts.length; i++) if (cum[i]! > s0 + 1e-6 && cum[i]! < s1 - 1e-6) out.push(pts[i]!)
  const last = pointAt(pts, cum, s1)
  out.push({ x: last.x, y: last.y })
  return out
}

// A curve with stretches removed: `gaps` are [from, to] distances along it. Returns the pieces
// that remain.
export function cut(pts: Pt[], cum: number[], gaps: [number, number][]): Pt[][] {
  if (gaps.length === 0) return [pts]
  const total = cum[cum.length - 1]!
  const sorted = [...gaps].sort((a, b) => a[0] - b[0])
  const pieces: Pt[][] = []
  let at = 0
  for (const [from, to] of sorted) {
    if (from > at + 0.5) pieces.push(slice(pts, cum, at, Math.min(from, total)))
    at = Math.max(at, to)
  }
  if (at < total - 0.5) pieces.push(slice(pts, cum, at, total))
  return pieces
}

// Drop points that lie within `tolerance` of the line through their neighbours (Douglas-Peucker).
export function simplify(pts: Pt[], tolerance: number): Pt[] {
  if (pts.length < 3) return pts
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack: [number, number][] = [[0, pts.length - 1]]
  while (stack.length) {
    const [i0, i1] = stack.pop()!
    const a = pts[i0]!
    const b = pts[i1]!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const d = Math.hypot(dx, dy)
    let worst = 0
    let index = -1
    for (let i = i0 + 1; i < i1; i++) {
      const p = pts[i]!
      const off = d < 1e-9 ? dist(a, p) : Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / d
      if (off > worst) {
        worst = off
        index = i
      }
    }
    if (worst > tolerance && index > 0) {
      keep[index] = 1
      stack.push([i0, index], [index, i1])
    }
  }
  return pts.filter((_, i) => keep[i])
}

const fix = (v: number) => (Math.round(v * 100) / 100).toString()

export function pathOf(pts: Pt[], close = false): string {
  if (pts.length === 0) return ''
  let d = `M${fix(pts[0]!.x)} ${fix(pts[0]!.y)}`
  for (let i = 1; i < pts.length; i++) d += `L${fix(pts[i]!.x)} ${fix(pts[i]!.y)}`
  return close ? d + 'Z' : d
}
