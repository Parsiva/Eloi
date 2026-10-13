// The frame document, written as TypeScript objects until the compiler exists (M0).
// Vocabulary follows docs/design/frame-engine.md §3: a plan is a tree of row and column splits;
// each part is a bay; a bay is an opening (real content goes there), a band (reserved for drawn
// members) or a nested split. Structure lives in the spec; decoration lives in the skin, so one
// structure can be drawn in several styles (sandbox Skins bench).

// ── Sizes ──────────────────────────────────────────────────────────────────────────────────
// Every size compiles to CSS (frame-engine.md §4.2). `m` is the module, set from width.
export type Size =
  | 'auto'
  | { fr: number }
  | { m: number }
  | { px: number }
  | { member: string; plus?: number } // the drawn depth of a named skin member (+ plus·m)
  | { css: string } // escape hatch, e.g. 'min(60vh, 520px)'

// ── Structure ──────────────────────────────────────────────────────────────────────────────
export interface Split {
  split: 'rows' | 'cols'
  parts: Part[]
  pad?: Size // inner padding of the split, e.g. room for a ring drawn around it
  gap?: Size
}

export interface Opening {
  opening: string // the slot name; also the box id
  // flow: height comes from content (the default). fixed: the frame sets both axes, so the box
  // is a relayout boundary and gets size containment (research/08, "hug or fixed").
  fit?: 'flow' | 'fixed'
}

export interface Band {
  band: true
}

export type Region = Split | Opening | Band

export interface Part {
  id: string
  size: Size
  region?: Region // absent: an empty band
}

export interface Plan {
  id: string
  // A plan applies when every listed condition holds. Earlier plans win.
  when?: { classes?: string[]; routes?: string[] }
  sheet: Split
}

export interface WidthClass {
  name: string
  min: number // CSS px of the frame's own width
}

export interface FrameSpec {
  id: string
  classes: WidthClass[] // ascending by min; the first is the fallback
  // m in px, interpolated linearly in frame width and clamped at both ends.
  module: { from: [width: number, m: number]; to: [width: number, m: number] }
  plans: Plan[]
}

// ── Skin: decoration and tokens ────────────────────────────────────────────────────────────
// Colour roles are names a skin maps to paints; members refer to roles, never to colours.
export interface Skin {
  id: string
  label?: string
  tokens: Record<string, string> // CSS custom properties set on the frame (e.g. '--ink')
  roles: Record<string, string> // role → paint (any CSS colour or var())
  members: Member[]
}

// A profile is a cross-section from the outside in (frame-engine.md §3.2). Depths are in m;
// rule weights are in CSS px ("hair") and don't grow with m.
export type Stratum =
  | { kind: 'rule'; weight: number; role?: string; dash?: number[] }
  | { kind: 'gap'; depth: number }
  | { kind: 'fill'; depth: number; role: string }
  | { kind: 'hatch'; depth: number; role?: string; pitch?: number; angle?: number; weight?: number }
  | { kind: 'tile'; depth: number; tile: string; role?: string }

export type Corner = 'tl' | 'tr' | 'bl' | 'br'
export type Edge = 'top' | 'right' | 'bottom' | 'left'

export type CornerTreatment =
  | { kind: 'mitre' }
  | { kind: 'block'; roles: string[] } // a square stud: nested squares, outside role first
  | { kind: 'motif'; piece: string; width: number; role?: string; offset?: [number, number] }

export type Anchor =
  | { corner: Corner }
  | { edge: Edge; u?: number } // u: 0..1 along the edge (left→right, top→bottom); default 0.5
  | { center: true }

export type Member =
  | {
      kind: 'ring' // a profile swept around a bay's edge, inside the bay
      name?: string // named rings publish their depth for { member } sizes
      bay: string // a part id, or 'sheet' for the whole plan
      profile: Stratum[]
      corners?: CornerTreatment
      pad?: number // when the bay is an opening: extra padding inside the ring, in m
    }
  | {
      kind: 'rule' // a profile laid along a band, centred across its short axis
      name?: string
      bay: string
      profile: Stratum[]
    }
  | {
      kind: 'motif' // one sprite piece, placed and scaled; never stretched
      piece: string
      bay: string
      at: Anchor
      width?: number // in m; or height
      height?: number
      offset?: [number, number] // in m
      mirror?: 'x' | 'y' | 'xy'
      role?: string
      minWidth?: number // hide below this bay width (px)
    }
  | {
      kind: 'repeat' // a sprite tile repeated along a bay edge, fitted to a whole number
      tile: string
      bay: string
      edge: Edge | 'middle'
      height: number // in m (tile's cross size)
      inset?: number // in m, from the edge toward the inside
      role?: string
    }
  | {
      kind: 'chevrons' // chevrons along a band's centre line; optionally conveyed
      bay: string
      size: number // in m
      pitch: number // in m
      role?: string
      motion?: 'conveyor'
      direction?: 1 | -1
    }
  | {
      kind: 'marker' // a mark under the active station: a [data-station][aria-current] element
      bay: string
      size: number // in m
      role?: string
    }

// ── Sprite ─────────────────────────────────────────────────────────────────────────────────
export interface SpritePiece {
  kind: 'fixed' | 'tile'
  width: number
  height: number
  hull?: [number, number][]
  sockets?: { edge: string; at: [number, number]; heading?: number; weight?: number }[]
}

export interface Sprite {
  svg: string // contains <symbol id="{prefix}{piece}">
  prefix: string // e.g. 'hd-'
  pieces: Record<string, SpritePiece>
}
