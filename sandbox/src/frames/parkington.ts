// The Parkington frame: a frame graph (nodes, lines, rules). The document is
// frames/parkington.json, which the editor writes. This module is its one importer and accepts
// its hot updates, so a save reaches every open page as a new value of the signal.
import { signal } from '@preact/signals-core'
import type { FrameGraph } from '@eloi/engine'
import data from '../../frames/parkington.json'

export const parkington = signal(data as unknown as FrameGraph)

if (import.meta.hot) {
  import.meta.hot.accept('../../frames/parkington.json', (next) => {
    if (next) parkington.value = next.default as unknown as FrameGraph
  })
}
