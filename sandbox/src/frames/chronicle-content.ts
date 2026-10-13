// The chronicle's openings, filled from the portfolio's content snapshot. Plain DOM: the frame
// decides where each section goes; the sections only know what they say.
import { h } from '../dom'
import { marginaliaEntries, projects } from '../content'

const longDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function chronicleSlots(): HTMLElement[] {
  const [lead, ...rest] = projects
  const notes = [...marginaliaEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  return [
    h(
      'header',
      { 'data-slot': 'masthead', class: 'chron-mast' },
      h('h1', { class: 'chron-mast__title' }, 'Parkington Programs Chronicle'),
      h('p', { class: 'chron-mast__sub' }, 'Reflections of a Future City Planner'),
    ),
    h(
      'div',
      { 'data-slot': 'dateline', class: 'chron-dateline' },
      h('span', {}, 'Vol. VI'),
      h('span', {}, longDate(new Date())),
      h('span', {}, 'No. 1 · Studio edition'),
    ),
    h(
      'article',
      { 'data-slot': 'main', class: 'chron-main' },
      h('h2', { class: 'chron-section' }, 'Current Projects & Municipal Developments'),
      h('h3', { class: 'chron-lead__title' }, lead!.title),
      h('p', { class: 'chron-lead__tagline' }, lead!.tagline),
      h('div', { class: 'chron-columns' }, ...lead!.body.map((p) => h('p', {}, p)), ...lead!.highlights.map((p) => h('p', {}, p))),
      h('h2', { class: 'chron-section' }, 'Also in the works'),
      h(
        'div',
        { class: 'chron-briefs' },
        ...rest.slice(0, 4).map((p) =>
          h('section', { class: 'chron-brief' }, h('h4', {}, p.title), h('p', { class: 'chron-brief__tagline' }, p.tagline), h('p', {}, p.body[0] ?? '')),
        ),
      ),
    ),
    h(
      'aside',
      { 'data-slot': 'left', class: 'chron-side' },
      h('h2', { class: 'chron-section' }, 'Marginalia'),
      h(
        'ol',
        { class: 'chron-ledger' },
        ...notes.map((n) => h('li', {}, h('span', { class: 'chron-ledger__date' }, shortDate(n.date)), h('span', { class: 'chron-ledger__title' }, n.title), h('span', { class: 'chron-ledger__summary' }, n.summary))),
      ),
    ),
    h(
      'aside',
      { 'data-slot': 'right', class: 'chron-side' },
      h('h2', { class: 'chron-section' }, 'Highlights'),
      h('ul', { class: 'chron-highlights' }, ...projects.map((p) => h('li', {}, h('strong', {}, p.title), h('span', {}, p.stack.slice(0, 2).join(' · '))))),
      h('h2', { class: 'chron-section' }, 'Statistics'),
      h(
        'dl',
        { class: 'chron-stats' },
        h('dt', {}, 'Projects'),
        h('dd', {}, String(projects.length)),
        h('dt', {}, 'Marginalia'),
        h('dd', {}, String(marginaliaEntries.length)),
        h('dt', {}, 'Next steps'),
        h('dd', {}, String(projects.reduce((n, p) => n + (p.nextSteps?.length ?? 0), 0))),
      ),
    ),
    h(
      'section',
      { 'data-slot': 'upcoming', class: 'chron-upcoming' },
      h('h2', { class: 'chron-section chron-section--centre' }, 'Upcoming Projects and Prospective Ideas'),
      h(
        'div',
        { class: 'chron-upcoming__grid' },
        ...projects.map((p) => h('section', {}, h('h4', {}, p.title), h('ul', {}, ...(p.nextSteps ?? []).map((s) => h('li', {}, s))))),
      ),
    ),
    h('footer', { 'data-slot': 'foot', class: 'chron-foot' }, h('span', {}, 'Parkington Programs Studio'), h('span', {}, 'Printed by Eloi')),
  ]
}
