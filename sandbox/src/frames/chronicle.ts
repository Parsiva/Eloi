// The chronicle frame: the Victorian newspaper layout from docs/references (masthead between
// two medallion pavilions, a dateline band, three columns at about 1 : 3.5 : 1, an "Upcoming
// projects" band, a footer). Structure only; skins draw it.
//
// The document itself is frames/chronicle.json, which the editor writes. This module is its one
// importer and accepts its hot updates, so a save reaches every open page (the editing one and
// the clean view) as a new value of the signal, without a reload.
import { effect, signal } from '@preact/signals-core'
import type { FrameHandle, FrameSpec } from '@eloi/engine'
import data from '../../frames/chronicle.json'

export const chronicle = signal(data as unknown as FrameSpec)

if (import.meta.hot) {
  import.meta.hot.accept('../../frames/chronicle.json', (next) => {
    if (next) chronicle.value = next.default as unknown as FrameSpec
  })
}

// Keep a mounted frame on the latest document until `sig` aborts.
export function follow(frame: FrameHandle, sig: AbortSignal): void {
  const stop = effect(() => {
    const spec = chronicle.value
    if (spec !== frame.spec) frame.setSpec(spec)
  })
  sig.addEventListener('abort', stop, { once: true })
}
