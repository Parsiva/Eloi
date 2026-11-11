// The Parkington site: one screen, one frame. The frame is generated for the screen from
// frames/parkington.json (a graph of nodes, lines and rules); the page never scrolls, and the
// content lives in the openings the frame leaves, scrolling inside them when it is long.
//
// Two dev servers serve it. `npm run dev` (port 5180) attaches the editor; `npm run view`
// (port 5181) shows the same page clean. Both read the same file, so every edit saved on the
// first appears on the second without a reload. A production build has no editor.
import '../styles/theme.css'
import '../styles/base.css'
import '../styles/chronicle.css'
import './site.css'
import { effect } from '@preact/signals-core'
import { mountGraph, type FrameGraph } from '@eloi/engine'
import type { GraphEditorHandle } from '@eloi/editor'
import { h } from '../dom'
import { chronicleSlots } from '../frames/chronicle-content'
import { parkington } from '../frames/parkington'

// The old page's "upcoming" band has no opening of its own here: it closes the main column.
const slots = chronicleSlots()
const main = slots.find((el) => el.dataset.slot === 'main')!
const upcoming = slots.find((el) => el.dataset.slot === 'upcoming')!
upcoming.removeAttribute('data-slot')
main.append(upcoming)

const host = h('div', { class: 'site' }, ...slots.filter((el) => el !== upcoming))
document.querySelector('#site')!.append(host)
const frame = mountGraph(host, parkington.value)
if (import.meta.env.DEV) Object.assign(window, { eloi: frame }) // for the console

let editor: GraphEditorHandle | undefined
if (import.meta.env.DEV && import.meta.env.MODE !== 'view') {
  const { attachGraphEditor } = await import('@eloi/editor')
  editor = attachGraphEditor(frame, { save })
}

effect(() => {
  const doc = parkington.value
  if (editor) editor.external(doc)
  else if (doc !== frame.doc) frame.setDoc(doc)
})

async function save(doc: FrameGraph): Promise<void> {
  const res = await fetch(`/__eloi/frames/${doc.id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(doc),
  })
  if (!res.ok) throw new Error(`Saving the frame failed (${res.status}): ${await res.text()}`)
}
