// Skins for the chronicle structure. Members refer to bays by part id and to colour roles.
import type { Skin } from '@eloi/engine'

// Victorian engraving: rules, hatching and the owner's drawn ornament (frame-engine.md §6.3).
export const victorian: Skin = {
  id: 'victorian',
  label: 'Victorian engraving',
  tokens: {
    '--ink': '#2c2419',
    '--paper': '#e6dcc3',
    '--font-display': '"Old London", "Libre Baskerville", Georgia, serif',
    '--font-text': '"Libre Baskerville", Georgia, serif',
    '--rule': 'color-mix(in srgb, #2c2419 40%, transparent)',
  },
  roles: { ink: '#2c2419', soft: 'color-mix(in srgb, #2c2419 55%, transparent)' },
  members: [
    {
      kind: 'ring',
      name: 'border',
      bay: 'sheet',
      profile: [
        { kind: 'rule', weight: 1.6 },
        { kind: 'gap', depth: 0.35 },
        { kind: 'rule', weight: 0.6 },
        { kind: 'tile', depth: 0.95, tile: 'tile-lattice', weight: 0.55 },
        { kind: 'rule', weight: 0.6 },
        { kind: 'gap', depth: 0.5 },
        { kind: 'hatch', depth: 0.45, pitch: 2.6, weight: 0.5, role: 'soft' },
        { kind: 'gap', depth: 0.3 },
        { kind: 'rule', weight: 1 },
      ],
    },
    // The owner's drawn corners: medallions at the top, flames at the bottom.
    { kind: 'motif', piece: 'corner-medallion', bay: 'sheet', at: { corner: 'tl' }, width: 25, weight: 0.9, knockout: true },
    { kind: 'motif', piece: 'corner-medallion', bay: 'sheet', at: { corner: 'tr' }, width: 25, mirror: 'x', weight: 0.9, knockout: true },
    { kind: 'motif', piece: 'corner-flame', bay: 'sheet', at: { corner: 'bl' }, height: 15, offset: [0.4, 0], weight: 0.9, knockout: true },
    { kind: 'motif', piece: 'corner-flame', bay: 'sheet', at: { corner: 'br' }, height: 15, mirror: 'x', offset: [0.4, 0], weight: 0.9, knockout: true },
    { kind: 'motif', piece: 'crest', bay: 'sheet', at: { edge: 'top' }, width: 9, offset: [0, -0.05], weight: 0.8, knockout: true },
    { kind: 'motif', piece: 'side-leaf', bay: 'sheet', at: { edge: 'left', u: 0.5 }, height: 19, offset: [-0.2, 0], weight: 0.8, knockout: true },
    { kind: 'motif', piece: 'side-leaf', bay: 'sheet', at: { edge: 'right', u: 0.5 }, height: 19, mirror: 'x', offset: [-0.2, 0], weight: 0.8, knockout: true },
    { kind: 'motif', piece: 'tailpiece', bay: 'foot', at: { center: true }, height: 7, weight: 0.8 },
    // Dateline: a double rule above and below, beads along the top, a jewel in the middle.
    { kind: 'ring', bay: 'dateline', profile: [{ kind: 'rule', weight: 0.8 }, { kind: 'gap', depth: 0.25 }, { kind: 'rule', weight: 0.5 }], pad: 0 },
    { kind: 'repeat', tile: 'tile-bead', bay: 'mast', edge: 'bottom', height: 0.9, inset: 0.4, weight: 0.6 },
    // Column rules in the gutters, and a lattice cartouche over the upcoming band.
    { kind: 'rule', bay: 'g1', profile: [{ kind: 'rule', weight: 0.6 }, { kind: 'gap', depth: 0.3 }, { kind: 'rule', weight: 0.6 }] },
    { kind: 'rule', bay: 'g2', profile: [{ kind: 'rule', weight: 0.6 }, { kind: 'gap', depth: 0.3 }, { kind: 'rule', weight: 0.6 }] },
    { kind: 'rule', bay: 'sep0', profile: [{ kind: 'rule', weight: 0.6 }, { kind: 'gap', depth: 0.3 }, { kind: 'rule', weight: 0.6 }] },
    { kind: 'repeat', tile: 'tile-lattice', bay: 'sep', edge: 'middle', height: 0.9, weight: 0.55 },
    { kind: 'motif', piece: 'lattice-cartouche', bay: 'sep', at: { center: true }, height: 4.6, weight: 0.8, knockout: true },
    {
      kind: 'ring',
      bay: 'upcoming',
      profile: [{ kind: 'rule', weight: 1 }, { kind: 'gap', depth: 0.3 }, { kind: 'rule', weight: 0.5 }],
      pad: 1.5,
    },
  ],
}

// Mid-century flat-colour moulding: nested bands and stud corner blocks, after the county map
// references and the owner's websiteOutline.svg trace (frame-engine.md §6.4).
const teal = '#1d4657'
const tealMid = '#2e6a78'
const tealPale = '#7fa7a8'
const sand = '#d9b370'
const ochre = '#b8863f'
const cream = '#f4e9cd'

export const midcentury: Skin = {
  id: 'midcentury',
  label: 'Mid-century moulding',
  tokens: {
    '--ink': teal,
    '--paper': cream,
    '--font-display': '"Futura", "Avenir Next", "Century Gothic", "Trebuchet MS", sans-serif',
    '--font-text': '"Avenir Next", "Segoe UI", system-ui, sans-serif',
    '--rule': `color-mix(in srgb, ${teal} 45%, transparent)`,
  },
  roles: { ink: teal, mid: tealMid, pale: tealPale, sand, ochre, cream },
  members: [
    {
      kind: 'ring',
      name: 'border',
      bay: 'sheet',
      profile: [
        { kind: 'fill', depth: 0.9, role: 'ink' },
        { kind: 'fill', depth: 0.25, role: 'cream' },
        { kind: 'fill', depth: 0.5, role: 'sand' },
        { kind: 'fill', depth: 0.15, role: 'ochre' },
        { kind: 'fill', depth: 0.6, role: 'sand' },
        { kind: 'fill', depth: 0.25, role: 'cream' },
        { kind: 'fill', depth: 0.45, role: 'mid' },
        { kind: 'fill', depth: 0.2, role: 'cream' },
        { kind: 'fill', depth: 0.3, role: 'pale' },
        { kind: 'rule', weight: 1.5, role: 'ink' },
      ],
      corners: { kind: 'block', roles: ['ink', 'sand', 'ochre', 'cream', 'mid'] },
    },
    { kind: 'chevrons', bay: 'dateline', size: 1.6, pitch: 3.2, role: 'sand', motion: 'conveyor' },
    { kind: 'ring', bay: 'dateline', profile: [{ kind: 'fill', depth: 0.3, role: 'ink' }], pad: 0 },
    { kind: 'rule', bay: 'g1', profile: [{ kind: 'fill', depth: 0.25, role: 'mid' }, { kind: 'gap', depth: 0.2 }, { kind: 'fill', depth: 0.6, role: 'sand' }, { kind: 'gap', depth: 0.2 }, { kind: 'fill', depth: 0.25, role: 'mid' }] },
    { kind: 'rule', bay: 'g2', profile: [{ kind: 'fill', depth: 0.25, role: 'mid' }, { kind: 'gap', depth: 0.2 }, { kind: 'fill', depth: 0.6, role: 'sand' }, { kind: 'gap', depth: 0.2 }, { kind: 'fill', depth: 0.25, role: 'mid' }] },
    { kind: 'rule', bay: 'sep0', profile: [{ kind: 'fill', depth: 0.4, role: 'mid' }, { kind: 'gap', depth: 0.2 }, { kind: 'fill', depth: 0.4, role: 'sand' }] },
    { kind: 'rule', bay: 'sep', profile: [{ kind: 'fill', depth: 0.4, role: 'mid' }, { kind: 'gap', depth: 0.2 }, { kind: 'fill', depth: 0.4, role: 'sand' }] },
    {
      kind: 'ring',
      bay: 'upcoming',
      profile: [{ kind: 'fill', depth: 0.45, role: 'mid' }, { kind: 'fill', depth: 0.2, role: 'cream' }, { kind: 'fill', depth: 0.2, role: 'sand' }],
      corners: { kind: 'block', roles: ['ink', 'sand', 'cream'] },
      pad: 1.5,
    },
    {
      kind: 'ring',
      bay: 'title',
      profile: [{ kind: 'fill', depth: 0.3, role: 'sand' }, { kind: 'gap', depth: 0.2 }, { kind: 'fill', depth: 0.15, role: 'mid' }],
      corners: { kind: 'block', roles: ['ink', 'sand'] },
      pad: 0.5,
    },
  ],
}

export const skins = { victorian, midcentury }
