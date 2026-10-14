// The bench index and the page shown for a bench that isn't built yet.
import { h } from '../dom'
import type { Page } from '../router'
import { articles, marginaliaEntries, projects } from '../content'
import { benches, type Bench } from './registry'

const statusLabel = { planned: 'Planned', building: 'Building', done: 'Done' } as const

export const indexPage: Page = (outlet) => {
  const rows = benches.map((b) =>
    h(
      'tr',
      {},
      h('td', { class: 'bench-step' }, b.step),
      h('td', {}, h('a', { href: `/bench/${b.id}` }, b.title)),
      h('td', {}, b.proves),
      h('td', { class: `bench-status bench-status--${b.status}` }, statusLabel[b.status]),
    ),
  )

  outlet.append(
    h(
      'section',
      { class: 'panel' },
      h('p', { class: 'eyebrow' }, 'The benches'),
      h(
        'p',
        { class: 'lede' },
        'Each bench is a page that proves one idea about Eloi. They are built in order; ',
        h('a', { href: 'https://github.com/Parsiva/Eloi/blob/main/docs/design/sandbox.md' }, 'docs/design/sandbox.md'),
        ' has the plan.',
      ),
      h(
        'table',
        { class: 'bench-table' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Step'), h('th', {}, 'Bench'), h('th', {}, 'Proves'), h('th', {}, 'Status'))),
        h('tbody', {}, ...rows),
      ),
    ),
    h(
      'section',
      { class: 'panel' },
      h('p', { class: 'eyebrow' }, 'Content snapshot'),
      h(
        'p',
        {},
        `${projects.length} projects, ${marginaliaEntries.length} marginalia entries and ${Object.keys(articles).length} articles, copied from the portfolio.`,
      ),
    ),
  )
}

export function plannedPage(bench: Bench): Page {
  return (outlet) => {
    outlet.append(
      h(
        'section',
        { class: 'panel' },
        h('p', { class: 'eyebrow' }, `${bench.step} · ${statusLabel[bench.status]}`),
        h('h2', {}, bench.title),
        h('p', { class: 'lede' }, bench.proves),
        h('h3', {}, 'Done when'),
        h('p', {}, bench.doneWhen),
        h('p', { class: 'muted' }, 'Not built yet.'),
      ),
    )
  }
}

export const notFoundPage: Page = (outlet) => {
  outlet.append(
    h('section', { class: 'panel' }, h('h2', {}, 'No such page'), h('p', {}, h('a', { href: '/' }, 'Back to the benches'))),
  )
}
