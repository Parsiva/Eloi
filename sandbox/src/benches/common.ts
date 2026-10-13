// Shared pieces for bench pages: the heading, the stage a frame sits in, real text for filler,
// and a counter for ResizeObserver loop warnings (the Grid bench's "never loops" check).
import { signal } from '@preact/signals-core'
import { h } from '../dom'
import { articles } from '../content'
import type { Bench } from './registry'
import { benchById } from './registry'

export function benchHeader(id: string, ...controls: (Node | string)[]): HTMLElement {
  const bench = benchById(id) as Bench
  return h(
    'section',
    { class: 'panel' },
    h('div', { class: 'bench-head' }, h('div', {}, h('p', { class: 'eyebrow' }, `${bench.step} bench`), h('h2', {}, bench.title)), h('div', { class: 'controls' }, ...controls)),
    h('p', { class: 'lede' }, bench.proves),
    h('p', { class: 'check' }, h('strong', {}, 'Done when: '), bench.doneWhen),
  )
}

export function stage(): { wrap: HTMLElement; stage: HTMLElement } {
  const s = h('div', { class: 'stage' })
  return { wrap: h('div', { class: 'stage-wrap' }, s), stage: s }
}

export function button(label: string, onClick: () => void, pressed?: boolean): HTMLButtonElement {
  const b = h('button', { type: 'button' }, label)
  if (pressed !== undefined) b.setAttribute('aria-pressed', String(pressed))
  b.addEventListener('click', onClick)
  return b
}

// Paragraphs of real writing from the content snapshot, front matter removed.
export const paragraphs: string[] = Object.values(articles)
  .flatMap((text) => text.replace(/^---[\s\S]*?---/, '').split(/\n\s*\n/))
  .map((p) => p.trim())
  .filter((p) => p.length > 80)

export function filler(count: number, offset = 0): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => h('p', {}, paragraphs[(i + offset) % paragraphs.length]!))
}

// Counts "ResizeObserver loop" errors the browser reports while a bench is open.
export const loopWarnings = signal(0)
addEventListener('error', (e) => {
  if (String(e.message).includes('ResizeObserver loop')) loopWarnings.value++
})
