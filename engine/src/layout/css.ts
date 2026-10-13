// Compiling sizes and splits to CSS. Pure: the skeleton builder applies the results.
import type { Part, Plan, Region, Size, Split } from '../spec'

export const memberVar = (name: string) => `--eloi-member-${name}`

export function sizeToCss(size: Size): string {
  if (size === 'auto') return 'auto'
  if ('fr' in size) return `minmax(0, ${size.fr}fr)`
  if ('m' in size) return `calc(var(--m) * ${size.m})`
  if ('px' in size) return `${size.px}px`
  if ('member' in size)
    return size.plus ? `calc(var(${memberVar(size.member)}, 0px) + var(--m) * ${size.plus})` : `var(${memberVar(size.member)}, 0px)`
  return size.css
}

// Grid line names are datums (frame-engine.md §3.1): x-<part>-l / x-<part>-r for columns,
// y-<part>-t / y-<part>-b for rows. Adjacent parts share a line, so a line carries two names.
export function splitTemplate(split: Split): string {
  const [a, b] = split.split === 'cols' ? ['l', 'r'] : ['t', 'b']
  const axis = split.split === 'cols' ? 'x' : 'y'
  const out: string[] = []
  split.parts.forEach((part, i) => {
    const prev = split.parts[i - 1]
    const names = prev ? `${axis}-${prev.id}-${b} ${axis}-${part.id}-${a}` : `${axis}-${part.id}-${a}`
    out.push(`[${names}]`, sizeToCss(part.size))
  })
  const last = split.parts[split.parts.length - 1]
  if (last) out.push(`[${axis}-${last.id}-${b}]`)
  return out.join(' ')
}

export const isSplit = (r: Region | undefined): r is Split => !!r && 'split' in r
export const isOpening = (r: Region | undefined): r is Extract<Region, { opening: string }> => !!r && 'opening' in r

// Every part in a plan, depth first, with its parent split.
export function walkParts(plan: Plan, fn: (part: Part, parent: Split) => void): void {
  const visit = (split: Split) => {
    for (const part of split.parts) {
      fn(part, split)
      if (isSplit(part.region)) visit(part.region)
    }
  }
  visit(plan.sheet)
}

export function slotsOf(plan: Plan): string[] {
  const slots: string[] = []
  walkParts(plan, (part) => {
    if (isOpening(part.region)) slots.push(part.region.opening)
  })
  return slots
}

// Part ids must be unique within a plan (they are bay ids and datum names), and so must slots.
export function validatePlan(plan: Plan): string[] {
  const issues: string[] = []
  const ids = new Set<string>(['sheet'])
  const slots = new Set<string>()
  walkParts(plan, (part) => {
    if (ids.has(part.id)) issues.push(`plan "${plan.id}": duplicate part id "${part.id}"`)
    ids.add(part.id)
    if (!/^[\w.-]+$/.test(part.id)) issues.push(`plan "${plan.id}": part id "${part.id}" must be a word`)
    if (isOpening(part.region)) {
      if (slots.has(part.region.opening)) issues.push(`plan "${plan.id}": duplicate slot "${part.region.opening}"`)
      slots.add(part.region.opening)
    }
  })
  return issues
}
