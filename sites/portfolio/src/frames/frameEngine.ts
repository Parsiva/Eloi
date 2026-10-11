import type { CornerOrnament, FrameConfig, OrnamentAnchor, Ring } from './frameSettings'

type Side = 'top' | 'right' | 'bottom' | 'left'
type Insets = Record<Side, number>

type HatchKey = { size: number; gap: number; angle: number; ink: string }
type Point = { x: number; y: number }

function dashToString(d?: number | number[]) {
  if (d === undefined) return ''
  return Array.isArray(d) ? d.join(',') : `${d}`
}

function hatchId(key: HatchKey) {
  return `hatch-${key.size}-${key.gap}-${key.angle}-${key.ink.replace(/[^a-zA-Z0-9]/g, '')}`
}

function getSideRings(cfg: FrameConfig, side: Side): Ring[] {
  if (side === 'top') return cfg.ringsTop ?? cfg.rings
  if (side === 'right') return cfg.ringsRight ?? cfg.rings
  if (side === 'bottom') return cfg.ringsBottom ?? cfg.rings
  return cfg.ringsLeft ?? cfg.rings
}

function sideThickness(rings: Ring[]): number {
  return rings.reduce((acc, ring) => {
    if (ring.kind === 'gap') return acc + ring.size
    if (ring.kind === 'stroke') return acc + ring.width
    if (ring.kind === 'hatch') return acc + ring.width
    return acc
  }, 0)
}

function renderRings(cfg: FrameConfig, W: number, H: number) {
  const rings: string[] = []
  const defs: string[] = []
  const inset: Insets = { top: 0, right: 0, bottom: 0, left: 0 }
  const sides: Side[] = ['top', 'right', 'bottom', 'left']
  const sideBands: Record<Side, Ring[]> = {
    top: getSideRings(cfg, 'top'),
    right: getSideRings(cfg, 'right'),
    bottom: getSideRings(cfg, 'bottom'),
    left: getSideRings(cfg, 'left'),
  }
  const bounds: Insets = {
    top: sideThickness(sideBands.top),
    right: sideThickness(sideBands.right),
    bottom: sideThickness(sideBands.bottom),
    left: sideThickness(sideBands.left),
  }
  const hatchDefs = new Set<string>()

  const ensureHatchDef = (key: HatchKey) => {
    const pid = hatchId(key)
    if (hatchDefs.has(pid)) return pid
    hatchDefs.add(pid)
    defs.push(
      `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${key.size + key.gap}" height="${
        key.size + key.gap
      }" patternTransform="rotate(${key.angle})">
           <path d="M0 0 L ${key.size} 0" stroke="${cfg.ink}" stroke-width="0.75" stroke-opacity="0.5" vector-effect="non-scaling-stroke" />
         </pattern>`
    )
    return pid
  }

  sides.forEach((side) => {
    sideBands[side].forEach((ring) => {
      if (ring.kind === 'gap') {
        inset[side] += ring.size
        return
      }

      if (ring.kind === 'stroke') {
        const sw = ring.width
        if (side === 'top') {
          const y = inset.top + sw / 2
          rings.push(
            `<line x1="${bounds.left}" y1="${y}" x2="${W - bounds.right}" y2="${y}" stroke="${cfg.ink}" stroke-width="${sw}" vector-effect="non-scaling-stroke" shape-rendering="crispEdges" ${
              ring.dash ? `stroke-dasharray="${dashToString(ring.dash)}"` : ''
            } />`
          )
          inset.top += sw
        } else if (side === 'bottom') {
          const y = H - inset.bottom - sw / 2
          rings.push(
            `<line x1="${bounds.left}" y1="${y}" x2="${W - bounds.right}" y2="${y}" stroke="${cfg.ink}" stroke-width="${sw}" vector-effect="non-scaling-stroke" shape-rendering="crispEdges" ${
              ring.dash ? `stroke-dasharray="${dashToString(ring.dash)}"` : ''
            } />`
          )
          inset.bottom += sw
        } else if (side === 'left') {
          const x = inset.left + sw / 2
          rings.push(
            `<line x1="${x}" y1="${bounds.top}" x2="${x}" y2="${H - bounds.bottom}" stroke="${cfg.ink}" stroke-width="${sw}" vector-effect="non-scaling-stroke" shape-rendering="crispEdges" ${
              ring.dash ? `stroke-dasharray="${dashToString(ring.dash)}"` : ''
            } />`
          )
          inset.left += sw
        } else if (side === 'right') {
          const x = W - inset.right - sw / 2
          rings.push(
            `<line x1="${x}" y1="${bounds.top}" x2="${x}" y2="${H - bounds.bottom}" stroke="${cfg.ink}" stroke-width="${sw}" vector-effect="non-scaling-stroke" shape-rendering="crispEdges" ${
              ring.dash ? `stroke-dasharray="${dashToString(ring.dash)}"` : ''
            } />`
          )
          inset.right += sw
        }
        return
      }

      if (ring.kind === 'hatch') {
        const band = ring.width
        const angle = ring.hatchAngle ?? 45
        const key: HatchKey = { size: ring.hatchSize, gap: ring.hatchGap, angle, ink: cfg.ink }
        const pid = ensureHatchDef(key)
        if (side === 'top') {
          const w = Math.max(0, W - bounds.left - bounds.right)
          rings.push(
            `<rect x="${bounds.left}" y="${inset.top}" width="${w}" height="${band}" fill="url(#${pid})" />`
          )
          inset.top += band
        } else if (side === 'bottom') {
          const w = Math.max(0, W - bounds.left - bounds.right)
          rings.push(
            `<rect x="${bounds.left}" y="${H - inset.bottom - band}" width="${w}" height="${band}" fill="url(#${pid})" />`
          )
          inset.bottom += band
        } else if (side === 'left') {
          const h = Math.max(0, H - bounds.top - bounds.bottom)
          rings.push(
            `<rect x="${inset.left}" y="${bounds.top}" width="${band}" height="${h}" fill="url(#${pid})" />`
          )
          inset.left += band
        } else if (side === 'right') {
          const h = Math.max(0, H - bounds.top - bounds.bottom)
          rings.push(
            `<rect x="${W - inset.right - band}" y="${bounds.top}" width="${band}" height="${h}" fill="url(#${pid})" />`
          )
          inset.right += band
        }
      }
    })
  })
  return { rings, defs, bounds }
}

function anchorPosition(anchor: OrnamentAnchor, bounds: Insets, W: number, H: number, w: number, h: number): Point {
  const contentW = Math.max(0, W - bounds.left - bounds.right)
  const contentH = Math.max(0, H - bounds.top - bounds.bottom)
  const xLeft = Math.max(0, bounds.left / 2 - w / 2)
  const xCenter = bounds.left + (contentW - w) / 2
  const xRight = Math.max(0, W - bounds.right / 2 - w / 2)
  const yTop = Math.max(0, bounds.top / 2 - h / 2)
  const yCenter = bounds.top + (contentH - h) / 2
  const yBottom = Math.max(0, H - bounds.bottom / 2 - h / 2)

  switch (anchor) {
    case 'top-left':
      return { x: xLeft, y: yTop }
    case 'top-center':
      return { x: xCenter, y: yTop }
    case 'top-right':
      return { x: xRight, y: yTop }
    case 'right-top':
      return { x: xRight, y: yTop }
    case 'right-center':
      return { x: xRight, y: yCenter }
    case 'right-bottom':
      return { x: xRight, y: yBottom }
    case 'bottom-left':
      return { x: xLeft, y: yBottom }
    case 'bottom-center':
      return { x: xCenter, y: yBottom }
    case 'bottom-right':
      return { x: xRight, y: yBottom }
    case 'left-top':
      return { x: xLeft, y: yTop }
    case 'left-center':
      return { x: xLeft, y: yCenter }
    case 'left-bottom':
      return { x: xLeft, y: yBottom }
    default:
      return { x: xCenter, y: yCenter }
  }
}

function renderOrnaments(cfg: FrameConfig, bounds: Insets, W: number, H: number) {
  if (!cfg.ornaments || cfg.ornaments.length === 0) return ''
  return cfg.ornaments
    .map((orn) => {
      const w = orn.width
      const h = orn.height
      const base = anchorPosition(orn.anchor, bounds, W, H, w, h)
      const x = base.x + (orn.offsetX ?? 0)
      const y = base.y + (orn.offsetY ?? 0)
      const cx = x + w / 2
      const cy = y + h / 2
      const transforms: string[] = []
      if (orn.flipX || orn.flipY) {
        const sx = orn.flipX ? -1 : 1
        const sy = orn.flipY ? -1 : 1
        transforms.push(`translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`)
      }
      if (orn.rotate) {
        transforms.push(`rotate(${orn.rotate} ${cx} ${cy})`)
      }
      const transformAttr = transforms.length ? ` transform="${transforms.join(' ')}"` : ''
      const opacityAttr = orn.opacity !== undefined ? ` opacity="${orn.opacity}"` : ''
      return `<use href="#${orn.symbol}" x="${x}" y="${y}" width="${w}" height="${h}"${transformAttr}${opacityAttr} />`
    })
    .join('')
}

function renderCorner(
  corner: CornerOrnament,
  pos: 'tl' | 'tr' | 'br' | 'bl',
  inset: Insets,
  outerInset: Insets,
  W: number,
  H: number,
  ink: string
) {
  if (corner.enabled === false) return ''
  const s = corner.size
  if (!s) return ''
  const outerStroke = corner.outerStrokeWidth ?? corner.strokeWidth ?? 0
  const outerDash = corner.outerDash ?? corner.dash
  const innerStroke = corner.innerStrokeWidth ?? outerStroke
  const innerGap = corner.innerGap ?? 4
  const offset = corner.inset ?? 0
  const placeOuter = corner.cornerPlacement === 'outer'
  let x = placeOuter ? outerInset.left + offset : inset.left + offset
  let y = placeOuter ? outerInset.top + offset : inset.top + offset
  if (pos === 'tr') {
    x = placeOuter ? W - outerInset.right - s - offset : W - inset.right - s - offset
    y = placeOuter ? outerInset.top + offset : inset.top + offset
  } else if (pos === 'br') {
    x = placeOuter ? W - outerInset.right - s - offset : W - inset.right - s - offset
    y = placeOuter ? H - outerInset.bottom - s - offset : H - inset.bottom - s - offset
  } else if (pos === 'bl') {
    x = placeOuter ? outerInset.left + offset : inset.left + offset
    y = placeOuter ? H - outerInset.bottom - s - offset : H - inset.bottom - s - offset
  }

  let pieces = ''
  if (outerStroke > 0) {
    pieces += `<rect x="${x + outerStroke / 2}" y="${y + outerStroke / 2}" width="${Math.max(
      0,
      s - outerStroke
    )}" height="${Math.max(0, s - outerStroke)}" fill="none" stroke="${ink}" stroke-width="${outerStroke}" ${
      outerDash ? `stroke-dasharray="${dashToString(outerDash)}"` : ''
    } vector-effect="non-scaling-stroke" shape-rendering="crispEdges" />`
  }

  const innerSize = Math.max(0, s - innerGap * 2)
  if (innerStroke > 0 && innerSize > 0) {
    pieces += `<rect x="${x + innerGap + innerStroke / 2}" y="${
      y + innerGap + innerStroke / 2
    }" width="${Math.max(0, innerSize - innerStroke)}" height="${Math.max(
      0,
      innerSize - innerStroke
    )}" fill="none" stroke="${ink}" stroke-width="${innerStroke}" ${
      corner.innerDash ? `stroke-dasharray="${dashToString(corner.innerDash)}"` : ''
    } vector-effect="non-scaling-stroke" shape-rendering="crispEdges" />`
  }
  return pieces
}

export function renderFrameSvg(cfg: FrameConfig, W: number, H: number): string {
  const { rings, defs, bounds } = renderRings(cfg, W, H)
  const outerInset: Insets = { top: 0, right: 0, bottom: 0, left: 0 }
  const ornaments = [
    renderCorner(cfg.corner, 'tl', bounds, outerInset, W, H, cfg.ink),
    renderCorner(cfg.corner, 'tr', bounds, outerInset, W, H, cfg.ink),
    renderCorner(cfg.corner, 'br', bounds, outerInset, W, H, cfg.ink),
    renderCorner(cfg.corner, 'bl', bounds, outerInset, W, H, cfg.ink),
  ].join('')
  const ornamentUses = renderOrnaments(cfg, bounds, W, H)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" shape-rendering="crispEdges" aria-hidden="true">
    ${defs.length ? `<defs>${defs.join('')}</defs>` : ''}
    ${rings.join('')}
    <g style="color: ${cfg.ink}; fill: currentColor; stroke: currentColor;">
      ${ornaments}
      ${ornamentUses}
    </g>
  </svg>`
}
