// Live resource counts, so "nothing is left behind after dispose" can be checked instead of
// assumed (sandbox Boxes bench). Every observer, listener and frame callback the engine creates
// is counted here and uncounted when it is released.
export const live = {
  frames: 0,
  boxes: 0,
  observers: 0,
  listeners: 0,
  frameCallbacks: 0,
  effects: 0,
}

export type LiveCounts = typeof live

export function liveCounts(): LiveCounts {
  return { ...live }
}

// addEventListener tied to an AbortSignal, and counted.
export function listen<K extends string>(
  target: EventTarget,
  type: K,
  fn: (e: Event) => void,
  signal: AbortSignal,
  options?: AddEventListenerOptions,
): void {
  if (signal.aborted) return
  target.addEventListener(type, fn, { ...options, signal })
  live.listeners++
  signal.addEventListener('abort', () => live.listeners--, { once: true })
}
