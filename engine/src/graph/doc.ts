// The frame graph: a frame described before any screen exists.
//
// Nodes are the decorations. Four of them are given on every screen, the corners `tl`, `tr`,
// `bl` and `br`; every other node is placed by its relationship to nodes already placed. Lines
// leave one node and are received by another, and their shape is a rule. A line may also run
// along another line, so there are leading lines and lines relative to them. Openings are the
// spaces the frame leaves for content. Given a screen size, solve() turns all of this into one
// drawing for that screen.
//
// Lengths are in modules (m) unless noted; one module is `module` pixels on this screen.
// Every number may be an expression (expr.ts) over:
//   w, h      the screen in pixels (only these in `module`)
//   W, H      the screen in modules
//   m         one module in pixels
//   …params   the document's own named values
// and, inside a line's rule:
//   t         0..1 along the line          s    distance along it
//   len       the line's length            n    the whole number of cycles that fits
//   easeIn, easeOut   the eases of the nodes it leaves and meets
//   …vars     the line's own values (e.g. phase)
import type { Num } from './expr'

export type Corner = 'tl' | 'tr' | 'bl' | 'br'
export const CORNERS: readonly Corner[] = ['tl', 'tr', 'bl', 'br']

// ── Nodes ──────────────────────────────────────────────────────────────────────────────────
// Where a node is, as a relationship. Offsets are in the node's own frame, which points inward
// from the corner it descends from: dx is "into the page" horizontally, dy vertically. The same
// numbers under `tl` and under `tr` therefore give mirror images.
export type Place =
  | { from: string; dx?: Num; dy?: Num } // a step from another node
  | { between: [string, string]; t?: Num; off?: Num } // along the way between two nodes
  | { x: string; y: string; dx?: Num; dy?: Num } // level with one node, in line with another
  | { on: string; t?: Num; off?: Num } // riding a line, t along it

// One drawn layer of a node. Radii are in multiples of the node's own r; angles in degrees in
// the node's frame (0 points inward horizontally, 90 inward vertically).
export type Layer = { ink?: string; weight?: Num; fill?: string } & (
  | { kind: 'circle'; r?: Num }
  | { kind: 'polygon'; sides: Num; r?: Num; turn?: Num }
  | { kind: 'petals'; n: Num; r0?: Num; r1?: Num; width?: Num; turn?: Num }
  | { kind: 'rays'; n: Num; r0?: Num; r1?: Num; a0?: Num; a1?: Num }
  | { kind: 'spiral'; turns?: Num; r0?: Num; r1?: Num; turn?: Num; dir?: 1 | -1 }
  | { kind: 'dots'; n: Num; r?: Num; size?: Num; turn?: Num }
)

export interface NodeDef {
  id: string
  at: Place
  r?: Num // the node's body: lines attach to it and wrap around it
  frame?: Corner // whose inward frame to use; default: inherited from the node it descends from
  turn?: Num // degrees, added to every layer
  glyph?: Layer[]
  when?: Num // drawn (and usable) only while this holds
  note?: string
}

// ── Lines ──────────────────────────────────────────────────────────────────────────────────
// How a line leaves or meets a node. A bare id means: at the node's edge, facing the way the
// line goes. `port` fixes the angle on the node's body. `wrap` winds around the body from the
// port until the line can leave on a tangent (or, when arriving, from the tangent to the port).
// `ease` is how the node lets go of the line, or takes it in: the distance over which the
// line's rule takes hold after leaving, or dies away before arriving. Rules read it as ramp().
export type End =
  | string
  | { node: string; port?: Num; wrap?: 'cw' | 'ccw'; gap?: Num; ease?: Num }

// One way of drawing a line. A rule is a list of these; the first whose `when` holds is used,
// so a rule can change its mind when the run is too short or too long.
export interface Variant {
  when?: Num
  cycles?: Num // how many cycles to aim for; rounded to a whole number as `n`
  offset: Num // sideways displacement from the spine (positive: to the right of travel)
  note?: string
}

export interface LineDef {
  id: string
  // The spine. Either its own run between nodes…
  from?: End
  to?: End
  via?: string[] // nodes to pass through on the way
  round?: Num // corner radius at each `via`
  // …or the finished curve of another line, the leader.
  along?: string
  span?: [Num, Num] // the part of the leader to follow, in t
  rule?: string | Variant[] // a named rule, or variants inline; absent: the spine itself
  vars?: Record<string, Num>
  draw?: boolean // false: a guide, there to be followed
  weave?: string // strands with the same weave pass over and under each other
  weight?: Num // px
  ink?: string
  dash?: Num[] // px
  when?: Num
  note?: string
}

// ── Openings ───────────────────────────────────────────────────────────────────────────────
// An edge of an opening: a fixed position, or a node's position plus a step. In `add`, `r` is
// that node's radius. Positive is rightward for left/right and downward for top/bottom.
export type Edge = Num | { of: string; add?: Num }

export interface OpeningDef {
  id: string // the slot name: the host's [data-slot] child goes here
  left: Edge
  right: Edge
  top: Edge
  bottom: Edge
  pad?: Num
  scroll?: boolean // default true: content longer than the opening scrolls inside it
  when?: Num
  note?: string
}

export interface FrameGraph {
  id: string
  graph: 1
  module: Num // px per module, from w and h
  params: Record<string, Num> // in order; later ones may use earlier ones
  inks?: Record<string, string> // ink name → CSS colour
  rules?: Record<string, Variant[]>
  nodes: NodeDef[]
  lines: LineDef[]
  openings: OpeningDef[]
}

export const isCorner = (id: string): id is Corner => (CORNERS as readonly string[]).includes(id)
