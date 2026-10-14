import { describe, expect, it } from 'vitest'
import { choosePlan, moduleAt, roomLevel, widthClass } from './room'
import { sizeToCss, slotsOf, splitTemplate, validatePlan } from './css'
import type { FrameSpec, Plan } from '../spec'

const classes = [
  { name: 'compact', min: 0 },
  { name: 'medium', min: 768 },
  { name: 'wide', min: 1280 },
]

describe('widthClass', () => {
  it('picks the largest class whose minimum fits', () => {
    expect(widthClass(classes, 500)).toBe('compact')
    expect(widthClass(classes, 768)).toBe('medium')
    expect(widthClass(classes, 2000)).toBe('wide')
  })
  it('holds the previous class within the hysteresis band', () => {
    expect(widthClass(classes, 1270, 'wide')).toBe('wide')
    expect(widthClass(classes, 1263, 'wide')).toBe('medium')
    // Never holds a smaller class: going up switches at the minimum.
    expect(widthClass(classes, 1280, 'medium')).toBe('wide')
  })
})

describe('moduleAt', () => {
  const spec = { module: { from: [768, 6], to: [1600, 10] } } as FrameSpec
  it('interpolates and clamps', () => {
    expect(moduleAt(spec, 500)).toBe(6)
    expect(moduleAt(spec, 1184)).toBe(8)
    expect(moduleAt(spec, 3000)).toBe(10)
  })
})

describe('roomLevel', () => {
  it('is log base phi of size over the reference, quantised', () => {
    expect(roomLevel(320)).toBe(0)
    expect(roomLevel(320 * 1.618034)).toBe(1)
    expect(roomLevel(320 * 1.618034 ** 2)).toBe(2)
  })
  it('keeps the previous level for small changes', () => {
    const z = roomLevel(518)
    expect(roomLevel(530, z)).toBe(z)
    expect(roomLevel(700, z)).not.toBe(z)
  })
})

describe('choosePlan', () => {
  const plans: Plan[] = [
    { id: 'projects-wide', when: { classes: ['wide'], routes: ['projects'] }, sheet: { split: 'rows', parts: [] } },
    { id: 'wide', when: { classes: ['wide'] }, sheet: { split: 'rows', parts: [] } },
    { id: 'fallback', sheet: { split: 'rows', parts: [] } },
  ]
  it('takes the first plan whose conditions hold', () => {
    expect(choosePlan(plans, 'wide', 'projects').id).toBe('projects-wide')
    expect(choosePlan(plans, 'wide', 'front').id).toBe('wide')
    expect(choosePlan(plans, 'compact').id).toBe('fallback')
  })
})

describe('css', () => {
  it('compiles sizes', () => {
    expect(sizeToCss('auto')).toBe('auto')
    expect(sizeToCss({ fr: 3.5 })).toBe('minmax(0, 3.5fr)')
    expect(sizeToCss({ m: 2 })).toBe('calc(var(--m) * 2)')
    expect(sizeToCss({ member: 'border' })).toBe('var(--eloi-member-border, 0px)')
  })
  it('names grid lines after datums', () => {
    expect(
      splitTemplate({
        split: 'cols',
        parts: [
          { id: 'left', size: { fr: 1 } },
          { id: 'main', size: { fr: 2 } },
        ],
      }),
    ).toBe('[x-left-l] minmax(0, 1fr) [x-left-r x-main-l] minmax(0, 2fr) [x-main-r]')
  })
  it('lists slots and catches duplicates', () => {
    const plan: Plan = {
      id: 'p',
      sheet: {
        split: 'rows',
        parts: [
          { id: 'a', size: 'auto', region: { opening: 'main' } },
          { id: 'b', size: 'auto', region: { split: 'cols', parts: [{ id: 'a', size: 'auto', region: { opening: 'main' } }] } },
        ],
      },
    }
    expect(slotsOf(plan)).toEqual(['main', 'main'])
    expect(validatePlan(plan)).toHaveLength(2)
  })
})
