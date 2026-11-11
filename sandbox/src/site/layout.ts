// The chronicle as a site of its own: one frame, the page's content in its openings, and nothing
// from the sandbox around it. It is the page the editor works on.
//
// Two dev servers serve it. `npm run dev` (port 5180) attaches the editor; `npm run view`
// (port 5181) shows the same page clean. Both read frames/chronicle.json, so every edit saved
// on the first appears on the second without a reload. A production build has no editor.
import '../styles/theme.css'
import '../styles/base.css'
import '../styles/chronicle.css'
import './layout.css'
import { effect } from '@preact/signals-core'
import { mount, type FrameSpec } from '@eloi/engine'
import type { EditorHandle } from '@eloi/editor'
import { h } from '../dom'
import { chronicle } from '../frames/chronicle'
import { chronicleSlots } from '../frames/chronicle-content'
import { victorian } from '../frames/skins'
import { handDrawn } from '../frames/sprite'

const host = h('div', {}, ...chronicleSlots())
document.querySelector('#site')!.append(host)
const frame = mount(host, chronicle.value, { skin: victorian, sprite: handDrawn })

let editor: EditorHandle | undefined
if (import.meta.env.DEV && import.meta.env.MODE !== 'view') {
  const { attachEditor } = await import('@eloi/editor')
  editor = attachEditor(frame, { save, skin: () => victorian })
}

effect(() => {
  const spec = chronicle.value
  if (editor) editor.external(spec)
  else if (spec !== frame.spec) frame.setSpec(spec)
})

async function save(spec: FrameSpec): Promise<void> {
  const res = await fetch(`/__eloi/frames/${spec.id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(spec),
  })
  if (!res.ok) throw new Error(`Saving the frame failed (${res.status}): ${await res.text()}`)
}
