export type Dash = number | number[]

export type Ring =
  | {
      kind: 'stroke'
      width: number
      dash?: Dash
    }
  | {
      kind: 'gap'
      size: number
    }
  | {
      kind: 'hatch'
      width: number
      hatchSize: number
      hatchGap: number
      hatchAngle?: number
    }

export type CornerOrnament = {
  size: number
  outerStrokeWidth?: number
  outerDash?: Dash
  innerStrokeWidth?: number
  innerGap?: number
  innerDash?: Dash
  inset?: number
  enabled?: boolean
  cornerPlacement?: 'outer' | 'inner'
  // Backward-compat fallback fields
  strokeWidth?: number
  dash?: Dash
}

export type OrnamentAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'right-top'
  | 'right-center'
  | 'right-bottom'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'left-top'
  | 'left-center'
  | 'left-bottom'

export type OrnamentPlacement = {
  symbol: string
  anchor: OrnamentAnchor
  width: number
  height: number
  offsetX?: number
  offsetY?: number
  rotate?: number
  flipX?: boolean
  flipY?: boolean
  opacity?: number
}

export type FrameConfig = {
  ink: string
  background?: string
  rings: Ring[]
  ringsTop?: Ring[]
  ringsRight?: Ring[]
  ringsBottom?: Ring[]
  ringsLeft?: Ring[]
  corner: CornerOrnament
  innerPad?: number
  ornaments?: OrnamentPlacement[]
}

const panelRings: Ring[] = [
  { kind: 'stroke', width: 1 },
  { kind: 'gap', size: 10 },
  { kind: 'stroke', width: 1 },
]

const columnRings: Ring[] = [
  { kind: 'stroke', width: 2 },
  { kind: 'gap', size: 8 },
  { kind: 'stroke', width: 1 },
]

export const defaultFrame: FrameConfig = {
  ink: '#2c2419',
  background: 'transparent',
  rings: panelRings,
  innerPad: 14,
  corner: {
    size: 12,
    outerStrokeWidth: 1,
    innerGap: 4,
    enabled: false,
  },
  ornaments: [],
}

  // rings: [
  //   { kind: 'stroke', width: 3 },
  //   { kind: 'gap', size: 8 },
  //   { kind: 'stroke', width: 2 },
  //   { kind: 'gap', size: 4 },
  //   { kind: 'stroke', width: 2, dash: [6, 4] },
  //   { kind: 'gap', size: 6 },
  //   { kind: 'hatch', width: 6, hatchSize: 4, hatchGap: 4, hatchAngle: 45 },
  // ],

// Per-frame overrides keyed by configKey or id
export const frameOverrides: Record<string, Partial<FrameConfig>> = {
  // Example overrides; tweak or add your own:
  // 'page-frame': { ink: '#2a2417' },
  // 'header-frame': { rings: [{ kind: 'stroke', width: 4 }] },
  // 'col-left': { corner: { size: 14, strokeWidth: 2 } },

  // Page: richest banding with heavier top/bottom emphasis
  'page-frame': {
    ringsTop: [
      { kind: 'stroke', width: 4 },
      { kind: 'gap', size: 10 },
      { kind: 'stroke', width: 1 },
      { kind: 'gap', size: 12 },
      { kind: 'stroke', width: 2 },
      { kind: 'gap', size: 10 },
      { kind: 'hatch', width: 5, hatchSize: 2, hatchGap: 8, hatchAngle: 45 },
      { kind: 'gap', size: 10 },
      { kind: 'stroke', width: 1 },
    ],
    ringsBottom: [
      { kind: 'stroke', width: 4 },
      { kind: 'gap', size: 10 },
      { kind: 'stroke', width: 1 },
      { kind: 'gap', size: 12 },
      { kind: 'stroke', width: 2 },
      { kind: 'gap', size: 10 },
      { kind: 'hatch', width: 5, hatchSize: 2, hatchGap: 8, hatchAngle: 45 },
      { kind: 'gap', size: 10 },
      { kind: 'stroke', width: 1 },
    ],
    ringsLeft: [
      { kind: 'stroke', width: 3 },
      { kind: 'gap', size: 12 },
      { kind: 'stroke', width: 1 },
    ],
    ringsRight: [
      { kind: 'stroke', width: 3 },
      { kind: 'gap', size: 12 },
      { kind: 'stroke', width: 1 },
    ],
    innerPad: 4,
    corner: {
      size: 34,
      outerStrokeWidth: 2,
      innerStrokeWidth: 1,
      innerGap: 7,
      inset: 0,
      enabled: true,
      cornerPlacement: 'outer',
    },
    ornaments: [
      {
        symbol: 'frame_top_center_flourish_boxy',
        anchor: 'top-center',
        width: 360,
        height: 46,
      },
      {
        symbol: 'frame_bottom_center_flourish_boxy',
        anchor: 'bottom-center',
        width: 360,
        height: 46,
      },
    ],
  },

  // Body frame: medium weight for legacy uses
  'body-frame': {
    rings: columnRings,
    innerPad: 12,
    corner: { size: 12, outerStrokeWidth: 1, enabled: false },
  },

  // Header/navbar band with wrapped feel
  'header-band-frame': {
    ringsTop: [
      { kind: 'stroke', width: 3 },
      { kind: 'gap', size: 12 },
      { kind: 'stroke', width: 1 },
    ],
    ringsBottom: [
      { kind: 'stroke', width: 3 },
      { kind: 'gap', size: 12 },
      { kind: 'stroke', width: 1 },
    ],
    ringsLeft: [{ kind: 'stroke', width: 1 }],
    ringsRight: [{ kind: 'stroke', width: 1 }],
    innerPad: 10,
    corner: { size: 10, enabled: false },
    ornaments: [
      {
        symbol: 'divider_boxy_small',
        anchor: 'top-center',
        width: 220,
        height: 24,
        offsetY: 0,
      },
    ],
  },
  'header-frame': {
    ringsTop: [
      { kind: 'stroke', width: 3 },
      { kind: 'gap', size: 12 },
      { kind: 'stroke', width: 1 },
    ],
    ringsBottom: [
      { kind: 'stroke', width: 3 },
      { kind: 'gap', size: 12 },
      { kind: 'stroke', width: 1 },
    ],
    ringsLeft: [{ kind: 'stroke', width: 1 }],
    ringsRight: [{ kind: 'stroke', width: 1 }],
    innerPad: 10,
    corner: { size: 10, enabled: false },
    ornaments: [
      {
        symbol: 'divider_boxy_small',
        anchor: 'top-center',
        width: 200,
        height: 22,
      },
    ],
  },

  // Columns (left/center/right)
  'column-frame': {
    rings: columnRings,
    innerPad: 12,
    corner: { size: 12, outerStrokeWidth: 1, enabled: false },
  },
  'col-left': {
    rings: columnRings,
    innerPad: 12,
    corner: { size: 12, outerStrokeWidth: 1, enabled: false },
  },
  'col-center': {
    rings: columnRings,
    innerPad: 12,
    corner: { size: 12, outerStrokeWidth: 1, enabled: false },
  },
  'col-right': {
    rings: columnRings,
    innerPad: 12,
    corner: { size: 12, outerStrokeWidth: 1, enabled: false },
  },

  // Panels / interior boxes
  'panel-frame': {
    rings: panelRings,
    innerPad: 10,
    corner: { size: 10, outerStrokeWidth: 1, enabled: false },
  },

  // Nav strip inset box
  'nav-strip-frame': {
    ringsTop: [
      { kind: 'stroke', width: 2 },
      { kind: 'gap', size: 10 },
      { kind: 'stroke', width: 1.5 },
    ],
    ringsBottom: [
      { kind: 'stroke', width: 2 },
      { kind: 'gap', size: 10 },
      { kind: 'stroke', width: 1.5 },
    ],
    ringsLeft: [{ kind: 'stroke', width: 1.5 }],
    ringsRight: [{ kind: 'stroke', width: 1.5 }],
    innerPad: 8,
    corner: { size: 8, outerStrokeWidth: 1, enabled: false },
    ornaments: [
      {
        symbol: 'divider_boxy_small',
        anchor: 'top-center',
        width: 200,
        height: 20,
        opacity: 0.92,
      },
    ],
  },
}

function thicknessForSide(rings?: Ring[]) {
  return (rings || []).reduce((acc, ring) => {
    if (ring.kind === 'gap') return acc + ring.size
    if (ring.kind === 'stroke') return acc + ring.width
    if (ring.kind === 'hatch') return acc + ring.width
    return acc
  }, 0)
}

export function getFrameThickness(cfg: FrameConfig): number {
  const top = thicknessForSide(cfg.ringsTop ?? cfg.rings)
  const right = thicknessForSide(cfg.ringsRight ?? cfg.rings)
  const bottom = thicknessForSide(cfg.ringsBottom ?? cfg.rings)
  const left = thicknessForSide(cfg.ringsLeft ?? cfg.rings)
  return Math.max(top, right, bottom, left)
}

// Helper to merge default + override
export function resolveFrameConfig(id?: string, configKey?: string, custom?: Partial<FrameConfig>): FrameConfig {
  const base: FrameConfig = JSON.parse(JSON.stringify(defaultFrame))

  const applyCorner = (incoming: CornerOrnament) => {
    const normalized: CornerOrnament = {
      ...base.corner,
      ...incoming,
    }
    // Backward-compat mapping
    if (incoming.strokeWidth !== undefined) {
      normalized.outerStrokeWidth = incoming.strokeWidth
    }
    if (incoming.dash !== undefined) {
      normalized.outerDash = incoming.dash
    }
    base.corner = normalized
  }

  const apply = (o?: Partial<FrameConfig>) => {
    if (!o) return
    if (o.rings) base.rings = o.rings
    if (o.ringsTop) base.ringsTop = o.ringsTop
    if (o.ringsRight) base.ringsRight = o.ringsRight
    if (o.ringsBottom) base.ringsBottom = o.ringsBottom
    if (o.ringsLeft) base.ringsLeft = o.ringsLeft
    if (o.corner) applyCorner(o.corner)
    if (o.ink) base.ink = o.ink
    if (o.background !== undefined) base.background = o.background
    if (o.innerPad !== undefined) base.innerPad = o.innerPad
    if (o.ornaments !== undefined) base.ornaments = o.ornaments
  }
  if (configKey) apply(frameOverrides[configKey])
  if (id) apply(frameOverrides[id])
  apply(custom)
  return base
}

/* README (quick):
   - Adjust defaults in defaultFrame to change look everywhere.
   - Add a key to frameOverrides to tweak a specific frame by id or configKey.
   - Each Frame can also pass a configKey or a custom override object.
*/
