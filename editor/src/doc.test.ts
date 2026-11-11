import { describe, expect, it } from 'vitest'
import type { Plan, Split } from '@eloi/engine'
import { addPart, canDrag, convertSize, dragDivider, findPart, findSplit, kindOf, movePart, removePart, renamePart, setKind, setSlot, sizeLabel } from './doc'
import { formatFrame } from './format'

const make = (): Plan => ({
  id: 'p',
  sheet: {
    split: 'rows',
    parts: [
      { id: 'head', size: { m: 10 }, region: { opening: 'head' } },
      {
        id: 'body',
        size: 'auto',
        region: {
          split: 'cols',
          parts: [
            { id: 'left', size: { fr: 1 }, region: { opening: 'left' } },
            { id: 'gutter', size: { m: 4 } },
            { id: 'main', size: { fr: 3 }, region: { opening: 'main' } },
          ],
        },
      },
    ],
  },
})

describe('finding', () => {
  it('finds a part with its trail and parent', () => {
    const found = findPart(make(), 'main')!
    expect(found.trail).toEqual(['sheet', 'body', 'main'])
    expect(found.index).toBe(2)
    expect(found.parent.split).toBe('cols')
    expect(findSplit(make(), 'sheet')?.split).toBe('rows')
    expect(findSplit(make(), 'left')).toBeUndefined()
  })
})

describe('structure edits', () => {
  it('renames, refusing clashes and spaces', () => {
    const plan = make()
    expect(renamePart(plan, 'left', 'main')).toMatch(/already used/)
    expect(renamePart(plan, 'left', 'two words')).toMatch(/no spaces/)
    expect(renamePart(plan, 'left', 'aside')).toBeUndefined()
    expect(findPart(plan, 'aside')).toBeTruthy()
  })

  it('turns a band into content with a free slot name, and back', () => {
    const plan = make()
    setKind(plan, 'gutter', 'opening')
    expect(findPart(plan, 'gutter')!.part.region).toEqual({ opening: 'gutter' })
    expect(setSlot(plan, 'gutter', 'main')).toMatch(/already placed/)
    setKind(plan, 'gutter', 'band')
    expect(kindOf(findPart(plan, 'gutter')!.part)).toBe('band')
  })

  it('splits a part, keeping its content in the first half', () => {
    const plan = make()
    setKind(plan, 'main', 'rows')
    const split = findSplit(plan, 'main')!
    expect(split.parts.map((p) => p.id)).toEqual(['main-a', 'main-b'])
    expect(split.parts[0]!.region).toEqual({ opening: 'main' })
    setKind(plan, 'main', 'cols')
    expect(findSplit(plan, 'main')!.split).toBe('cols')
  })

  it('adds, moves and removes parts', () => {
    const plan = make()
    const added = addPart(plan, 'left', 'before')
    expect(typeof added).toBe('object')
    const body = findSplit(plan, 'body')!
    expect(body.parts.map((p) => p.id)).toEqual(['part', 'left', 'gutter', 'main'])
    movePart(plan, 'part', 1)
    expect(body.parts.map((p) => p.id)).toEqual(['left', 'part', 'gutter', 'main'])
    removePart(plan, 'part')
    expect(body.parts.length).toBe(3)
    expect(addPart(plan, 'left', 'inside')).toMatch(/not split/)
    const lone: Plan = { id: 'x', sheet: { split: 'rows', parts: [{ id: 'only', size: 'auto' }] } }
    expect(removePart(lone, 'only')).toMatch(/only part/)
  })
})

describe('sizes', () => {
  it('converts keeping about the same length', () => {
    expect(convertSize('m', 81, 8)).toEqual({ m: 10.25 })
    expect(convertSize('px', 80.6, 8)).toEqual({ px: 81 })
    expect(convertSize('auto', 80, 8)).toBe('auto')
    expect(sizeLabel({ member: 'border', plus: 2 })).toBe('border + 2 m')
  })

  it('drags between two shares by trading them', () => {
    const split: Split = { split: 'cols', parts: [{ id: 'a', size: { fr: 1 } }, { id: 'b', size: { fr: 3 } }] }
    expect(dragDivider(split, 1, 100, [100, 300], 8)).toBe(true)
    expect(split.parts.map((p) => p.size)).toEqual([{ fr: 2 }, { fr: 2 }])
  })

  it('drags a fixed part in modules and leaves a share to follow', () => {
    const split: Split = { split: 'cols', parts: [{ id: 'a', size: { fr: 1 } }, { id: 'g', size: { m: 4 } }] }
    expect(dragDivider(split, 1, -16, [200, 32], 8)).toBe(true)
    expect(split.parts[1]!.size).toEqual({ m: 6 })
    expect(split.parts[0]!.size).toEqual({ fr: 1 })
  })

  it('cannot drag between two parts that fit their content', () => {
    expect(canDrag({ id: 'a', size: 'auto' }, { id: 'b', size: 'auto' })).toBe(false)
    expect(canDrag({ id: 'a', size: 'auto' }, { id: 'b', size: { px: 10 } })).toBe(true)
  })
})

describe('formatFrame', () => {
  it('round-trips and keeps small values on one line', () => {
    const plan = make()
    const text = formatFrame(plan)
    expect(JSON.parse(text)).toEqual(plan)
    expect(text).toContain('{ "id": "gutter", "size": { "m": 4 } }')
    expect(text.endsWith('\n')).toBe(true)
  })
})
