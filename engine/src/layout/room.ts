// Width classes, the module and room levels: the inputs every layout decision reads.
// All pure; x-typed values here depend only on width (frame-engine.md §4.1).
import type { FrameSpec, Plan, WidthClass } from '../spec'

export const PHI = (1 + Math.sqrt(5)) / 2

// The width class for width w. Switching down needs w to fall `band` px below the class's
// minimum, so a scrollbar or a 1px wobble can't flip the plan back and forth.
export function widthClass(classes: WidthClass[], w: number, previous?: string, band = 16): string {
  if (classes.length === 0) return 'default'
  let index = 0
  for (let i = 0; i < classes.length; i++) if (w >= classes[i]!.min) index = i
  const prev = classes.findIndex((c) => c.name === previous)
  if (prev > index && w >= classes[prev]!.min - band) index = prev
  return classes[index]!.name
}

// The module m in px at width w: linear between two anchors, clamped outside them.
export function moduleAt(spec: FrameSpec, w: number): number {
  const [w0, m0] = spec.module.from
  const [w1, m1] = spec.module.to
  const t = Math.min(1, Math.max(0, (w - w0) / (w1 - w0)))
  return Math.round((m0 + (m1 - m0) * t) * 100) / 100
}

// Room level z = log_φ(size / sRef), quantised to `step`, with hysteresis: it only moves once
// the raw value is more than `band` steps away from the current level.
export function roomLevel(size: number, previous?: number, sRef = 320, step = 0.25, band = 0.6): number {
  const raw = Math.log(Math.max(size, 1) / sRef) / Math.log(PHI)
  if (previous !== undefined && Math.abs(raw - previous) < step * band + step / 2) return previous
  return Math.round(raw / step) * step
}

// The first plan whose conditions all hold. Plans are listed most specific first.
export function choosePlan(plans: Plan[], cls: string, route?: string): Plan {
  for (const plan of plans) {
    const when = plan.when
    if (!when) return plan
    if (when.classes && !when.classes.includes(cls)) continue
    if (when.routes && (route === undefined || !when.routes.includes(route))) continue
    return plan
  }
  const last = plans[plans.length - 1]
  if (!last) throw new Error('A frame spec needs at least one plan')
  return last
}
