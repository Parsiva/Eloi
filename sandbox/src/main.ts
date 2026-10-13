// The sandbox shell: masthead, bench nav, page outlet and the dev panel.
// At S0 the shell is plain HTML; from S1 the frame becomes its layout.
import './styles/theme.css'
import './styles/base.css'
import { effect } from '@preact/signals-core'
import { h } from './dom'
import { currentPath, startRouter, type Resolve } from './router'
import { benchById, benches } from './benches/registry'
import { indexPage, notFoundPage, plannedPage } from './benches/pages'
import { mountDevPanel } from './devpanel/devpanel'

const links = [h('a', { href: '/' }, 'Index'), ...benches.map((b) => h('a', { href: `/bench/${b.id}` }, b.title))]
const outlet = h('main', { class: 'outlet' })

document.querySelector('#app')!.append(
  h(
    'header',
    { class: 'masthead' },
    h('h1', { class: 'masthead__title' }, 'Eloi Sandbox'),
    h('p', { class: 'masthead__subtitle' }, 'A test bench for the frame engine'),
  ),
  h('nav', { class: 'nav-strip', 'aria-label': 'Benches' }, ...links),
  outlet,
)

effect(() => {
  const path = currentPath.value
  for (const a of links) {
    if (new URL(a.href).pathname === path) a.setAttribute('aria-current', 'page')
    else a.removeAttribute('aria-current')
  }
})

const resolve: Resolve = async (url) => {
  if (url.pathname === '/') return indexPage
  const match = /^\/bench\/([\w-]+)\/?$/.exec(url.pathname)
  const bench = match && benchById(match[1]!)
  if (!bench) return notFoundPage
  return bench.load ? (await bench.load()).default : plannedPage(bench)
}

startRouter(outlet, resolve)
mountDevPanel()
