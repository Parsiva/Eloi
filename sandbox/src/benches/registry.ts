// The benches: one page per idea being proven (docs/design/sandbox.md §3).
// A bench without `load` is planned; its page shows what it will prove and when it is done.
import type { Page } from '../router'

export type BenchStatus = 'planned' | 'building' | 'done'

export interface Bench {
  id: string
  title: string
  step: string
  proves: string
  doneWhen: string
  status: BenchStatus
  load?: () => Promise<{ default: Page }>
}

export const benches: Bench[] = [
  {
    id: 'grid',
    title: 'Grid',
    step: 'S1',
    proves: 'A frame spec becomes a CSS grid with named boxes; width flows down and height flows up.',
    doneWhen:
      'Scrubbing 768 → 2560 never jumps or loops (narrower widths only need to not break); overlays show datums, bays and boxes; the room level of each box is shown live.',
    status: 'planned',
  },
  {
    id: 'boxes',
    title: 'Boxes',
    step: 'S2',
    proves: 'The box contract: each box holds its own content or runtime.',
    doneWhen:
      'One frame holds a static HTML box, a DOM box with live data, a WebGL2 canvas box, a box that starts when scrolled into view, a box that throws and shows its fallback while the others keep working, and two boxes that talk through the frame. Disposing the frame leaves nothing behind.',
    status: 'planned',
  },
  {
    id: 'chronicle',
    title: 'Chronicle',
    step: 'S3',
    proves: 'A real page: the Victorian newspaper layout filled with portfolio content.',
    doneWhen:
      'Masthead, dateline band, columns at about 1 : 3.5 : 1 and an "Upcoming projects" band, with drawn medallion corners and the crest placed from the sprite\'s sockets.',
    status: 'planned',
  },
  {
    id: 'specimens',
    title: 'Specimens',
    step: 'S3',
    proves: 'The ornament sprite: every piece, its hull and its sockets at several scales.',
    doneWhen: "The portfolio's /dev/ornaments page is ported and reads the sandbox's copy of the sprite.",
    status: 'planned',
  },
  {
    id: 'skins',
    title: 'Skins',
    step: 'after S3',
    proves: 'Structure and style are separate.',
    doneWhen: 'The same frame spec is drawn as the Victorian chronicle and as mid-century moulding.',
    status: 'planned',
  },
  {
    id: 'motion',
    title: 'Motion',
    step: 'after S3',
    proves: 'Changing route animates the frame, not the content.',
    doneWhen:
      'Route changes diff boxes by stable id; shared boxes update in place; chevrons run along a straight track; reduced motion works.',
    status: 'planned',
  },
]

export const benchById = (id: string) => benches.find((b) => b.id === id)
