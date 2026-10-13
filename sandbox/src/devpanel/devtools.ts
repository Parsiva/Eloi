// The link between benches and the dev panel. A bench attaches its frame and the stage element
// the frame sits in; the panel then shows the frame's stats, drives the stage width and toggles
// overlays. Settings persist per browser (they are conveniences, not state).
import { effect, signal } from '@preact/signals-core'
import type { FrameHandle, Overlay } from '@eloi/engine'

export interface Attached {
  frame: FrameHandle
  stage: HTMLElement
  label: string
}

export const attached = signal<Attached | null>(null)
export const overlay = signal<Overlay>(load('eloi.devpanel.overlay', {}))
export const stageWidth = signal<number | null>(load('eloi.devpanel.stageWidth', null))

export function attachDev(frame: FrameHandle, stage: HTMLElement, label: string, sig: AbortSignal): void {
  attached.value = { frame, stage, label }
  sig.addEventListener('abort', () => {
    if (attached.value?.frame === frame) attached.value = null
  })
}

effect(() => {
  const a = attached.value
  if (a) a.frame.setOverlay(overlay.value)
  save('eloi.devpanel.overlay', overlay.value)
})

effect(() => {
  const a = attached.value
  const w = stageWidth.value
  if (a) {
    a.stage.style.width = w ? `${w}px` : ''
    a.stage.style.maxWidth = w ? 'none' : ''
  }
  save('eloi.devpanel.stageWidth', w)
})

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable; settings then last for this visit only.
  }
}
