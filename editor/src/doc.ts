// Edits to a frame document. Pure functions over a plan (they change the plan they are given;
// the editor always hands them a copy), so every edit the popups offer can be tested without a
// browser. A returned string is a refusal, worded for the person editing.
import type { Part, Plan, Region, Size, Split } from '@eloi/engine'

export type Kind = 'opening' | 'band' | 'rows' | 'cols'
export type SizeKind = 'auto' | 'fr' | 'm' | 'px' | 'member' | 'css'

export interface Found {
  part: Part
  parent: Split
  index: number
  trail: string[] // ids from the sheet down to this part, e.g. ['sheet', 'body', 'main']
}

const isSplit = (r: Region | undefined): r is Split => !!r && 'split' in r
const isOpening = (r: Region | undefined): r is Extract<Region, { opening: string }> => !!r && 'opening' in r

export function findPart(plan: Plan, id: string): Found | undefined {
  const visit = (split: Split, trail: string[]): Found | undefined => {
    for (let index = 0; index < split.parts.length; index++) {
      const part = split.parts[index]!
      const here = [...trail, part.id]
      if (part.id === id) return { part, parent: split, index, trail: here }
      if (isSplit(part.region)) {
        const found = visit(part.region, here)
        if (found) return found
      }
    }
    return undefined
  }
  return visit(plan.sheet, ['sheet'])
}

// The split a bay id names: the sheet itself, or a part whose region is a split.
export function findSplit(plan: Plan, id: string): Split | undefined {
  if (id === 'sheet') return plan.sheet
  const region = findPart(plan, id)?.part.region
  return isSplit(region) ? region : undefined
}

export function kindOf(part: Part): Kind {
  if (isSplit(part.region)) return part.region.split
  return isOpening(part.region) ? 'opening' : 'band'
}

export function allIds(plan: Plan): Set<string> {
  const ids = new Set<string>(['sheet'])
  const visit = (split: Split) => {
    for (const part of split.parts) {
      ids.add(part.id)
      if (isSplit(part.region)) visit(part.region)
    }
  }
  visit(plan.sheet)
  return ids
}

export function allSlots(plan: Plan): Set<string> {
  const slots = new Set<string>()
  const visit = (split: Split) => {
    for (const part of split.parts) {
      if (isOpening(part.region)) slots.add(part.region.opening)
      if (isSplit(part.region)) visit(part.region)
    }
  }
  visit(plan.sheet)
  return slots
}

export function unique(taken: Set<string>, base: string): string {
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) if (!taken.has(`${base}${n}`)) return `${base}${n}`
}

// ── Sizes ──
export function sizeKind(size: Size): SizeKind {
  if (size === 'auto') return 'auto'
  if ('fr' in size) return 'fr'
  if ('m' in size) return 'm'
  if ('px' in size) return 'px'
  if ('member' in size) return 'member'
  return 'css'
}

export function sizeLabel(size: Size | undefined): string {
  if (size === undefined) return 'none'
  if (size === 'auto') return 'fit'
  if ('fr' in size) return `${size.fr} share`
  if ('m' in size) return `${size.m} m`
  if ('px' in size) return `${size.px} px`
  if ('member' in size) return size.plus ? `${size.member} + ${size.plus} m` : size.member
  return size.css
}

const round = (n: number, step: number) => Math.round(n / step) * step

// A size of another kind that keeps the part about as big as it is now (`px` on screen).
export function convertSize(kind: SizeKind, px: number, m: number, member = 'border'): Size {
  switch (kind) {
    case 'auto':
      return 'auto'
    case 'fr':
      return { fr: 1 }
    case 'm':
      return { m: Math.max(0.25, round(px / (m || 1), 0.25)) }
    case 'px':
      return { px: Math.max(1, Math.round(px)) }
    case 'member':
      return { member }
    case 'css':
      return { css: `${Math.max(1, Math.round(px))}px` }
  }
}

// ── Structure ──
export function renamePart(plan: Plan, id: string, next: string): string | void {
  next = next.trim()
  if (next === id) return
  if (!/^[\w.-]+$/.test(next)) return 'A name is letters, digits, dashes, dots or underscores, with no spaces.'
  if (allIds(plan).has(next)) return `"${next}" is already used in this plan.`
  const found = findPart(plan, id)
  if (!found) return `No part "${id}".`
  found.part.id = next
}

export function setKind(plan: Plan, id: string, kind: Kind): string | void {
  const found = findPart(plan, id)
  if (!found) return `No part "${id}".`
  const { part } = found
  if (kindOf(part) === kind) return
  if (kind === 'band') delete part.region
  else if (kind === 'opening') part.region = { opening: unique(allSlots(plan), part.id) }
  else if (isSplit(part.region)) part.region.split = kind
  else {
    // The part's content (if any) becomes the first part of the new split.
    const ids = allIds(plan)
    const first: Part = { id: unique(ids, `${part.id}-a`), size: { fr: 1 } }
    if (part.region) first.region = part.region
    ids.add(first.id)
    part.region = { split: kind, parts: [first, { id: unique(ids, `${part.id}-b`), size: { fr: 1 } }] }
  }
}

export function setSlot(plan: Plan, id: string, slot: string): string | void {
  slot = slot.trim()
  const found = findPart(plan, id)
  if (!found || !isOpening(found.part.region)) return `"${id}" does not hold content.`
  if (slot === found.part.region.opening) return
  if (!/^[\w.-]+$/.test(slot)) return 'A slot name is letters, digits, dashes, dots or underscores, with no spaces.'
  if (allSlots(plan).has(slot)) return `The slot "${slot}" is already placed in this plan.`
  found.part.region.opening = slot
}

// Add a decoration band beside a part (in its parent split), or inside a split.
export function addPart(plan: Plan, id: string, where: 'before' | 'after' | 'inside'): string | Part {
  const fresh: Part = { id: unique(allIds(plan), 'part'), size: { fr: 1 } }
  if (where === 'inside') {
    const split = findSplit(plan, id)
    if (!split) return `"${id}" is not split, so nothing can go inside it.`
    split.parts.push(fresh)
    return fresh
  }
  const found = findPart(plan, id)
  if (!found) return `No part "${id}".`
  found.parent.parts.splice(found.index + (where === 'after' ? 1 : 0), 0, fresh)
  return fresh
}

export function removePart(plan: Plan, id: string): string | void {
  const found = findPart(plan, id)
  if (!found) return `No part "${id}".`
  if (found.parent.parts.length === 1) return 'This is the only part here. Change what its parent holds instead.'
  found.parent.parts.splice(found.index, 1)
}

export function movePart(plan: Plan, id: string, by: -1 | 1): string | void {
  const found = findPart(plan, id)
  if (!found) return `No part "${id}".`
  const to = found.index + by
  if (to < 0 || to >= found.parent.parts.length) return
  found.parent.parts.splice(found.index, 1)
  found.parent.parts.splice(to, 0, found.part)
}

// ── Dragging the line between two neighbouring parts ──
// `px` are the parts' measured lengths along the split, `delta` how far the line moved toward
// the later part. Fixed sizes (m, px) change by the drag; two shares trade between themselves.
// Returns false when neither side can take the change (both fit their content, say).
export function canDrag(a: Part, b: Part): boolean {
  const ka = sizeKind(a.size)
  const kb = sizeKind(b.size)
  const fixed = (k: SizeKind) => k === 'm' || k === 'px'
  return fixed(ka) || fixed(kb) || (ka === 'fr' && kb === 'fr')
}

export function dragDivider(split: Split, index: number, delta: number, px: number[], m: number): boolean {
  const a = split.parts[index - 1]
  const b = split.parts[index]
  const pa = px[index - 1]
  const pb = px[index]
  if (!a || !b || pa === undefined || pb === undefined || !canDrag(a, b)) return false
  const d = Math.max(-(pa - 4), Math.min(pb - 4, delta)) // neither side collapses
  const resize = (part: Part, to: number): boolean => {
    if (part.size !== 'auto' && 'm' in part.size) part.size = { m: Math.max(0.25, round(to / (m || 1), 0.25)) }
    else if (part.size !== 'auto' && 'px' in part.size) part.size = { px: Math.max(1, Math.round(to)) }
    else return false
    return true
  }
  const ka = sizeKind(a.size)
  const kb = sizeKind(b.size)
  if (ka === 'fr' && kb === 'fr') {
    const total = (a.size as { fr: number }).fr + (b.size as { fr: number }).fr
    const share = round((total * (pa + d)) / (pa + pb), 0.05)
    const fa = Math.min(total - 0.05, Math.max(0.05, share))
    a.size = { fr: Number(fa.toFixed(2)) }
    b.size = { fr: Number((total - fa).toFixed(2)) }
    return true
  }
  // Prefer changing the fixed side the pointer is working against; a share or fit side follows.
  if (resize(a, pa + d)) {
    if (kb === 'm' || kb === 'px') resize(b, pb - d)
    return true
  }
  return resize(b, pb - d)
}
