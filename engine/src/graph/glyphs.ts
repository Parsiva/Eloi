// What a node looks like: a stack of generated layers, each a few numbers. Nothing is stored
// as artwork; change a number and the decoration is redrawn.
import type { Layer } from './doc'
import { evaluate, type Env } from './expr'
import { pathOf, type Pt } from './geom'
import type { SolvedNode } from './solve'

export interface Shape {
  d: string
  ink: string
  weight: number
  fill?: string
}

const rad = (deg: number) => (deg * Math.PI) / 180

export function glyph(node: SolvedNode, env: Env): Shape[] {
  const layers = node.def?.glyph
  if (!layers || node.r <= 0) return []
  const turn = evaluate(node.def?.turn, env, 0)
  const cos = Math.cos(node.rot)
  const sin = Math.sin(node.rot)
  // A point in the node's frame (radius in multiples of r, angle in degrees) on the screen.
  const at = (radius: number, deg: number): Pt => {
    const a = rad(deg + turn)
    const x = node.sx * radius * node.r * Math.cos(a)
    const y = node.sy * radius * node.r * Math.sin(a)
    return { x: node.x + x * cos - y * sin, y: node.y + x * sin + y * cos }
  }
  const ring = (radius: number, steps = 48): Pt[] => Array.from({ length: steps }, (_, k) => at(radius, (360 * k) / steps))
  const num = (v: Parameters<typeof evaluate>[0], fallback: number) => evaluate(v, env, fallback)

  return layers.map((layer): Shape => {
    let d = ''
    switch (layer.kind) {
      case 'circle':
        d = pathOf(ring(num(layer.r, 1)), true)
        break
      case 'polygon': {
        const sides = Math.max(3, Math.round(num(layer.sides, 4)))
        const t = num(layer.turn, 0)
        d = pathOf(Array.from({ length: sides }, (_, k) => at(num(layer.r, 1), t + (360 * k) / sides)), true)
        break
      }
      case 'petals': {
        const n = Math.max(1, Math.round(num(layer.n, 8)))
        const r0 = num(layer.r0, 0.3)
        const r1 = num(layer.r1, 1)
        const half = (num(layer.width, 0.8) * 180) / n
        const t = num(layer.turn, 0)
        for (let k = 0; k < n; k++) {
          const a = t + (360 * k) / n
          const base = at(r0, a)
          const tip = at(r1, a)
          const c1 = at((r0 + r1) / 2, a - half)
          const c2 = at((r0 + r1) / 2, a + half)
          d += `M${f(base)}Q${f(c1)} ${f(tip)}Q${f(c2)} ${f(base)}Z`
        }
        break
      }
      case 'rays': {
        const n = Math.max(1, Math.round(num(layer.n, 12)))
        const a0 = num(layer.a0, 0)
        const a1 = num(layer.a1, 360)
        const full = Math.abs(a1 - a0) >= 360
        for (let k = 0; k < n; k++) {
          const a = a0 + ((a1 - a0) * k) / (full ? n : Math.max(1, n - 1))
          d += `M${f(at(num(layer.r0, 0.5), a))}L${f(at(num(layer.r1, 1), a))}`
        }
        break
      }
      case 'spiral': {
        const turns = num(layer.turns, 1.5)
        const r0 = num(layer.r0, 0.1)
        const r1 = num(layer.r1, 1)
        const steps = Math.max(8, Math.ceil(Math.abs(turns) * 40))
        const t = num(layer.turn, 0)
        d = pathOf(Array.from({ length: steps + 1 }, (_, k) => at(r0 + ((r1 - r0) * k) / steps, t + ((layer.dir ?? 1) * 360 * turns * k) / steps)))
        break
      }
      case 'dots': {
        const n = Math.max(1, Math.round(num(layer.n, 8)))
        const size = num(layer.size, 0.08) * node.r
        const t = num(layer.turn, 0)
        for (let k = 0; k < n; k++) {
          const c = at(num(layer.r, 1), t + (360 * k) / n)
          d += `M${fix(c.x - size)} ${fix(c.y)}a${fix(size)} ${fix(size)} 0 1 0 ${fix(size * 2)} 0a${fix(size)} ${fix(size)} 0 1 0 ${fix(-size * 2)} 0Z`
        }
        break
      }
    }
    return { d, ink: layer.ink ?? 'ink', weight: num(layer.weight, 1), fill: layer.fill }
  })
}

const fix = (v: number) => (Math.round(v * 100) / 100).toString()
const f = (p: Pt) => `${fix(p.x)} ${fix(p.y)}`
