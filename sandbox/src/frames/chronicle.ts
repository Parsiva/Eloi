// The chronicle frame: the Victorian newspaper layout from docs/references (masthead between
// two medallion pavilions, a dateline band, three columns at about 1 : 3.5 : 1, an "Upcoming
// projects" band, a footer). Structure only; skins draw it.
import type { FrameSpec, Part } from '@eloi/engine'

const masthead: Part = {
  id: 'mast',
  size: { m: 15 },
  region: {
    split: 'cols',
    parts: [
      { id: 'pav-l', size: { m: 24 } },
      { id: 'title', size: { fr: 1 }, region: { opening: 'masthead', fit: 'fixed' } },
      { id: 'pav-r', size: { m: 24 } },
    ],
  },
}

const dateline: Part = { id: 'dateline', size: { m: 5 }, region: { opening: 'dateline', fit: 'fixed' } }

export const chronicle: FrameSpec = {
  id: 'chronicle',
  classes: [
    { name: 'compact', min: 0 },
    { name: 'medium', min: 768 },
    { name: 'wide', min: 1180 },
  ],
  module: { from: [768, 6], to: [1800, 10] },
  plans: [
    {
      id: 'wide',
      when: { classes: ['wide'] },
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 2 },
        parts: [
          masthead,
          dateline,
          {
            id: 'body',
            size: 'auto',
            region: {
              split: 'cols',
              parts: [
                { id: 'left', size: { fr: 1 }, region: { opening: 'left' } },
                { id: 'g1', size: { m: 4 } },
                { id: 'main', size: { fr: 3.5 }, region: { opening: 'main' } },
                { id: 'g2', size: { m: 4 } },
                { id: 'right', size: { fr: 1 }, region: { opening: 'right' } },
              ],
            },
          },
          { id: 'sep', size: { m: 5 } },
          { id: 'upcoming', size: 'auto', region: { opening: 'upcoming' } },
          { id: 'foot', size: { m: 9 }, region: { opening: 'foot', fit: 'fixed' } },
        ],
      },
    },
    {
      // Medium: the main column takes the width; the two side columns sit side by side below it.
      id: 'medium',
      when: { classes: ['medium'] },
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 2 },
        parts: [
          { ...masthead, region: { split: 'cols', parts: [{ id: 'pav-l', size: { m: 18 } }, { id: 'title', size: { fr: 1 }, region: { opening: 'masthead', fit: 'fixed' } }, { id: 'pav-r', size: { m: 18 } }] } },
          dateline,
          { id: 'main', size: 'auto', region: { opening: 'main' } },
          { id: 'sep0', size: { m: 5 } },
          {
            id: 'sides',
            size: 'auto',
            region: {
              split: 'cols',
              parts: [
                { id: 'left', size: { fr: 1 }, region: { opening: 'left' } },
                { id: 'g1', size: { m: 4 } },
                { id: 'right', size: { fr: 1 }, region: { opening: 'right' } },
              ],
            },
          },
          { id: 'sep', size: { m: 5 } },
          { id: 'upcoming', size: 'auto', region: { opening: 'upcoming' } },
          { id: 'foot', size: { m: 9 }, region: { opening: 'foot', fit: 'fixed' } },
        ],
      },
    },
    {
      // Phones aren't first-class (docs/design/sandbox.md §6): one column so nothing breaks.
      id: 'compact',
      sheet: {
        split: 'rows',
        pad: { member: 'border', plus: 0.5 },
        parts: [
          { id: 'title', size: 'auto', region: { opening: 'masthead' } },
          { id: 'dateline', size: 'auto', region: { opening: 'dateline' } },
          { id: 'main', size: 'auto', region: { opening: 'main' } },
          { id: 'left', size: 'auto', region: { opening: 'left' } },
          { id: 'right', size: 'auto', region: { opening: 'right' } },
          { id: 'upcoming', size: 'auto', region: { opening: 'upcoming' } },
          { id: 'foot', size: 'auto', region: { opening: 'foot' } },
        ],
      },
    },
  ],
}
