// Drawing a skin's members into SVG markup from measured bay rects. Pure: no DOM access.
// Ported from sites/portfolio/src/frames/frameEngine.ts (rings, gaps, hatching, corner pieces)
// and extended with fills, sprite tiles and motifs, chevrons and station markers.
import type { Anchor, Corner, CornerTreatment, Member, Skin, Sprite, Stratum } from '../spec'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface DrawInput {
  skin: Skin
  m: number
  rects: Record<string, Rect> // bay id → rect relative to the frame
  sprite?: Sprite
  station?: Rect // the active station, for markers
  ids: string // unique prefix for pattern and clip ids
}

export interface Drawn {
  svg: string // inner markup of the ink layer
  marker?: { x: number } // where the station marker landed, for motion
}

const fmt = (n: number) => (Math.round(n * 100) / 100).toString()
const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// The depth of a profile in px: rule weights are px, everything else is in m.
export function profileDepth(profile: Stratum[], m: number): number {
  return profile.reduce((sum, s) => sum + (s.kind === 'rule' ? s.weight : s.depth * m), 0)
}

// Depths of every named member, for { member } sizes in the plan.
export function memberDepths(skin: Skin, m: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const member of skin.members) {
    if ((member.kind === 'ring' || member.kind === 'rule') && member.name) out[member.name] = profileDepth(member.profile, m)
  }
  return out
}

// Fit whole tiles of natural length `tile` into `length`: the count, and the stretched length.
export function fitRepeat(length: number, tile: number): { count: number; each: number } {
  if (length <= 0 || tile <= 0) return { count: 0, each: 0 }
  const count = Math.max(1, Math.round(length / tile))
  return { count, each: length / count }
}

export function drawMembers(input: DrawInput): Drawn {
  const out = new Painter(input)
  for (const member of input.skin.members) out.member(member)
  return out.result()
}

class Painter {
  private defs: string[] = []
  private body: string[] = []
  private patterns = new Set<string>()
  private clips = 0
  private marker?: { x: number }

  constructor(private input: DrawInput) {}

  result(): Drawn {
    const defs = this.defs.length ? `<defs>${this.defs.join('')}</defs>` : ''
    return { svg: defs + this.body.join(''), marker: this.marker }
  }

  private paint(role = 'ink'): string {
    return attr(this.input.skin.roles[role] ?? role)
  }

  member(member: Member) {
    const rect = this.input.rects[member.bay]
    if (!rect || rect.w <= 0 || rect.h <= 0) return
    switch (member.kind) {
      case 'ring':
        return this.ring(rect, member.profile, member.corners)
      case 'rule':
        return this.rule(rect, member.profile)
      case 'motif':
        if (member.minWidth && rect.w < member.minWidth) return
        return this.motif(rect, member)
      case 'repeat':
        return this.repeat(rect, member)
      case 'chevrons':
        return this.chevrons(rect, member)
      case 'marker':
        return this.stationMarker(rect, member)
    }
  }

  // ── Rings: a profile swept around the inside of a rect ──
  private ring(r: Rect, profile: Stratum[], corners?: CornerTreatment) {
    const { m } = this.input
    let o = 0
    for (const s of profile) {
      if (s.kind === 'gap') {
        o += s.depth * m
        continue
      }
      if (s.kind === 'rule') {
        const w = s.weight
        const x = r.x + o + w / 2
        const y = r.y + o + w / 2
        const dash = s.dash ? ` stroke-dasharray="${s.dash.join(',')}"` : ''
        this.body.push(
          `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(Math.max(0, r.w - 2 * o - w))}" height="${fmt(Math.max(0, r.h - 2 * o - w))}" fill="none" stroke="${this.paint(s.role)}" stroke-width="${fmt(w)}"${dash} shape-rendering="crispEdges"/>`,
        )
        o += w
        continue
      }
      const d = s.depth * m
      if (s.kind === 'fill') this.body.push(`<path d="${bandPath(r, o, d)}" fill="${this.paint(s.role)}" fill-rule="evenodd"/>`)
      if (s.kind === 'hatch') this.body.push(`<path d="${bandPath(r, o, d)}" fill="url(#${this.hatch(s)})" fill-rule="evenodd"/>`)
      if (s.kind === 'tile') this.ringTiles(r, o, d, s.tile, s.role)
      o += d
    }
    if (corners && corners.kind !== 'mitre') this.corners(r, o, corners)
  }

  private hatch(s: Extract<Stratum, { kind: 'hatch' }>): string {
    const pitch = s.pitch ?? 3
    const angle = s.angle ?? 45
    const weight = s.weight ?? 0.6
    const paint = this.paint(s.role)
    const id = `${this.input.ids}-hatch-${pitch}-${angle}-${weight}-${(s.role ?? 'ink').replace(/\W/g, '')}`
    if (!this.patterns.has(id)) {
      this.patterns.add(id)
      this.defs.push(
        `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${pitch}" height="${pitch}" patternTransform="rotate(${angle})"><line x1="0" y1="0" x2="0" y2="${pitch}" stroke="${paint}" stroke-width="${weight}"/></pattern>`,
      )
    }
    return id
  }

  // Sprite tiles along each side of a ring stratum, fitted to whole counts between the corners.
  private ringTiles(r: Rect, o: number, d: number, tile: string, role?: string) {
    const piece = this.input.sprite?.pieces[tile]
    if (!piece || d <= 0) return
    const natural = (piece.width / piece.height) * d
    const x0 = r.x + o
    const y0 = r.y + o
    const x1 = r.x + r.w - o
    const y1 = r.y + r.h - o
    // Each side runs between the corner squares of this stratum.
    this.tileRun(tile, x0 + d, y0, x1 - x0 - 2 * d, d, natural, 0, role)
    this.tileRun(tile, x1, y0 + d, y1 - y0 - 2 * d, d, natural, 90, role)
    this.tileRun(tile, x1 - d, y1, x1 - x0 - 2 * d, d, natural, 180, role)
    this.tileRun(tile, x0, y1 - d, y1 - y0 - 2 * d, d, natural, 270, role)
  }

  // A run of tiles starting at (x, y), heading at `angle` degrees, `cross` thick.
  private tileRun(tile: string, x: number, y: number, length: number, cross: number, natural: number, angle: number, role?: string) {
    const { count, each } = fitRepeat(length, natural)
    if (!count) return
    const href = `#${this.input.sprite!.prefix}${tile}`
    const uses: string[] = []
    for (let i = 0; i < count; i++)
      uses.push(`<use href="${href}" x="${fmt(i * each)}" y="0" width="${fmt(each)}" height="${fmt(cross)}" preserveAspectRatio="none"/>`)
    this.body.push(`<g transform="translate(${fmt(x)} ${fmt(y)}) rotate(${angle})" style="color:${this.paint(role)}">${uses.join('')}</g>`)
  }

  private corners(r: Rect, depth: number, c: Exclude<CornerTreatment, { kind: 'mitre' }>) {
    const all: Corner[] = ['tl', 'tr', 'bl', 'br']
    if (c.kind === 'block') {
      for (const corner of all) {
        const x = corner[1] === 'l' ? r.x : r.x + r.w - depth
        const y = corner[0] === 't' ? r.y : r.y + r.h - depth
        const n = c.roles.length
        c.roles.forEach((role, i) => {
          const inset = (i * depth) / (2 * n)
          const size = depth - 2 * inset
          this.body.push(`<rect x="${fmt(x + inset)}" y="${fmt(y + inset)}" width="${fmt(size)}" height="${fmt(size)}" fill="${this.paint(role)}"/>`)
        })
      }
      return
    }
    for (const corner of all) {
      const mirror = corner === 'tl' ? undefined : corner === 'tr' ? 'x' : corner === 'bl' ? 'y' : 'xy'
      this.motif(r, { kind: 'motif', piece: c.piece, bay: '', at: { corner }, width: c.width, role: c.role, offset: c.offset, mirror })
    }
  }

  // ── Rules: a profile across a band's short axis ──
  private rule(r: Rect, profile: Stratum[]) {
    const { m } = this.input
    const vertical = r.h > r.w
    const depth = profileDepth(profile, m)
    let o = (vertical ? r.w : r.h) / 2 - depth / 2
    for (const s of profile) {
      const d = s.kind === 'rule' ? s.weight : s.depth * m
      if (s.kind === 'rule') {
        const c = o + d / 2
        const [x1, y1, x2, y2] = vertical ? [r.x + c, r.y, r.x + c, r.y + r.h] : [r.x, r.y + c, r.x + r.w, r.y + c]
        const dash = s.dash ? ` stroke-dasharray="${s.dash.join(',')}"` : ''
        this.body.push(
          `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" stroke="${this.paint(s.role)}" stroke-width="${fmt(d)}"${dash} shape-rendering="crispEdges"/>`,
        )
      } else if (s.kind === 'fill' || s.kind === 'hatch') {
        const box = vertical ? { x: r.x + o, y: r.y, w: d, h: r.h } : { x: r.x, y: r.y + o, w: r.w, h: d }
        const fill = s.kind === 'fill' ? this.paint(s.role) : `url(#${this.hatch(s)})`
        this.body.push(`<rect x="${fmt(box.x)}" y="${fmt(box.y)}" width="${fmt(box.w)}" height="${fmt(box.h)}" fill="${fill}"/>`)
      } else if (s.kind === 'tile') {
        const piece = this.input.sprite?.pieces[s.tile]
        if (piece) {
          const natural = (piece.width / piece.height) * d
          if (vertical) this.tileRun(s.tile, r.x + o + d, r.y, r.h, d, natural, 90, s.role)
          else this.tileRun(s.tile, r.x, r.y + o, r.w, d, natural, 0, s.role)
        }
      }
      o += d
    }
  }

  // ── Motifs: one sprite piece, scaled uniformly, placed at an anchor ──
  private motif(r: Rect, mo: Extract<Member, { kind: 'motif' }>) {
    const piece = this.input.sprite?.pieces[mo.piece]
    if (!piece) return
    const { m } = this.input
    const aspect = piece.width / piece.height
    const w = mo.width !== undefined ? mo.width * m : (mo.height ?? 4) * m * aspect
    const h = w / aspect
    let [x, y] = anchorPoint(r, mo.at, w, h)
    if (mo.offset) {
      // Offsets point inward from the anchor, so mirrored corners mirror the offset too.
      const sx = mo.mirror?.includes('x') ? -1 : 1
      const sy = mo.mirror?.includes('y') ? -1 : 1
      x += mo.offset[0] * m * sx
      y += mo.offset[1] * m * sy
    }
    const cx = x + w / 2
    const cy = y + h / 2
    const scale = mo.mirror === 'x' ? '-1 1' : mo.mirror === 'y' ? '1 -1' : mo.mirror === 'xy' ? '-1 -1' : ''
    const transform = scale ? ` transform="translate(${fmt(cx)} ${fmt(cy)}) scale(${scale}) translate(${fmt(-cx)} ${fmt(-cy)})"` : ''
    this.body.push(
      `<use href="#${this.input.sprite!.prefix}${mo.piece}" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" style="color:${this.paint(mo.role)}"${transform}/>`,
    )
  }

  // ── Repeats: a tile along one edge of a bay ──
  private repeat(r: Rect, re: Extract<Member, { kind: 'repeat' }>) {
    const piece = this.input.sprite?.pieces[re.tile]
    if (!piece) return
    const { m } = this.input
    const cross = re.height * m
    const inset = (re.inset ?? 0) * m
    const natural = (piece.width / piece.height) * cross
    switch (re.edge) {
      case 'top':
        return this.tileRun(re.tile, r.x, r.y + inset, r.w, cross, natural, 0, re.role)
      case 'bottom':
        return this.tileRun(re.tile, r.x, r.y + r.h - inset - cross, r.w, cross, natural, 0, re.role)
      case 'left':
        return this.tileRun(re.tile, r.x + inset + cross, r.y, r.h, cross, natural, 90, re.role)
      case 'right':
        return this.tileRun(re.tile, r.x + r.w - inset, r.y, r.h, cross, natural, 90, re.role)
      case 'middle':
        if (r.h > r.w) return this.tileRun(re.tile, r.x + (r.w + cross) / 2, r.y, r.h, cross, natural, 90, re.role)
        return this.tileRun(re.tile, r.x, r.y + (r.h - cross) / 2, r.w, cross, natural, 0, re.role)
    }
  }

  // ── Chevrons along a horizontal band; the conveyor moves the whole run by one pitch ──
  private chevrons(r: Rect, ch: Extract<Member, { kind: 'chevrons' }>) {
    const { m } = this.input
    const s = ch.size * m
    const { count, each: pitch } = fitRepeat(r.w, ch.pitch * m)
    if (!count) return
    const dir = ch.direction ?? 1
    const cy = r.y + r.h / 2
    const t = s * 0.28 // stroke thickness of a chevron arm
    const paths: string[] = []
    for (let i = -1; i <= count; i++) {
      const x = r.x + i * pitch + (pitch - s / 2) / 2
      const tip = dir > 0 ? x + s / 2 : x
      const back = dir > 0 ? x : x + s / 2
      const inner = dir > 0 ? -t : t
      paths.push(
        `M${fmt(back)} ${fmt(cy - s / 2)}L${fmt(tip)} ${fmt(cy)}L${fmt(back)} ${fmt(cy + s / 2)}L${fmt(back + inner)} ${fmt(cy + s / 2)}L${fmt(tip + inner)} ${fmt(cy)}L${fmt(back + inner)} ${fmt(cy - s / 2)}Z`,
      )
    }
    const clip = `${this.input.ids}-clip-${this.clips++}`
    this.defs.push(`<clipPath id="${clip}"><rect x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(r.h)}"/></clipPath>`)
    const conveyor = ch.motion === 'conveyor' ? ` class="eloi-conveyor" style="--eloi-pitch:${fmt(pitch * dir)}px"` : ''
    this.body.push(`<g clip-path="url(#${clip})"><g${conveyor}><path d="${paths.join('')}" fill="${this.paint(ch.role)}"/></g></g>`)
  }

  // ── A marker under the active station (a diamond on the band's lower edge) ──
  private stationMarker(r: Rect, mk: Extract<Member, { kind: 'marker' }>) {
    const station = this.input.station
    if (!station) return
    const s = mk.size * this.input.m
    const x = station.x + station.w / 2
    const y = r.y + r.h - s / 2
    this.marker = { x }
    this.body.push(
      `<path data-eloi-marker d="M${fmt(x)} ${fmt(y - s / 2)}L${fmt(x + s / 2)} ${fmt(y)}L${fmt(x)} ${fmt(y + s / 2)}L${fmt(x - s / 2)} ${fmt(y)}Z" fill="${this.paint(mk.role)}"/>`,
    )
  }
}

// The band between an outer rect inset by o and an inner one inset by o + d.
function bandPath(r: Rect, o: number, d: number): string {
  const ox = r.x + o
  const oy = r.y + o
  const ow = Math.max(0, r.w - 2 * o)
  const oh = Math.max(0, r.h - 2 * o)
  const iw = Math.max(0, ow - 2 * d)
  const ih = Math.max(0, oh - 2 * d)
  return `M${fmt(ox)} ${fmt(oy)}h${fmt(ow)}v${fmt(oh)}h${fmt(-ow)}Z M${fmt(ox + d)} ${fmt(oy + d)}h${fmt(iw)}v${fmt(ih)}h${fmt(-iw)}Z`
}

function anchorPoint(r: Rect, at: Anchor, w: number, h: number): [number, number] {
  if ('corner' in at) {
    const x = at.corner[1] === 'l' ? r.x : r.x + r.w - w
    const y = at.corner[0] === 't' ? r.y : r.y + r.h - h
    return [x, y]
  }
  if ('edge' in at) {
    const u = at.u ?? 0.5
    switch (at.edge) {
      case 'top':
        return [r.x + u * r.w - w / 2, r.y]
      case 'bottom':
        return [r.x + u * r.w - w / 2, r.y + r.h - h]
      case 'left':
        return [r.x, r.y + u * r.h - h / 2]
      case 'right':
        return [r.x + r.w - w, r.y + u * r.h - h / 2]
    }
  }
  return [r.x + (r.w - w) / 2, r.y + (r.h - h) / 2]
}
