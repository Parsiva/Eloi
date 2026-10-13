// A small router: the Navigation API where the browser has it, History API otherwise.
// Each page renders into the outlet with an AbortSignal; navigating away aborts it, and the
// page uses that signal to remove its listeners, observers and contexts. Boxes follow the
// same rule from S2 (docs/research/08, "Proposed box contract").
import { signal } from '@preact/signals-core'

// A page may return an `update` hook: navigating between URLs that resolve to the same page then
// calls it instead of re-rendering, so the page can diff instead of rebuild (the Motion bench).
export interface PageInstance {
  update?(url: URL): void | Promise<void>
}
export type Page = (outlet: HTMLElement, signal: AbortSignal, url: URL) => void | PageInstance | Promise<void | PageInstance>
export type Resolve = (url: URL) => Page | Promise<Page>

// The current path, for the shell's nav and the dev panel.
export const currentPath = signal(location.pathname)

// Local types: the Navigation API is newer than some TypeScript DOM libs.
interface NavigateEventLike extends Event {
  canIntercept: boolean
  hashChange: boolean
  downloadRequest: string | null
  formData: FormData | null
  destination: { url: string }
  intercept(options: { handler: () => Promise<void> }): void
}
interface NavigationLike {
  addEventListener(type: 'navigate', listener: (e: NavigateEventLike) => void): void
}

export function startRouter(outlet: HTMLElement, resolve: Resolve): void {
  let current: AbortController | null = null
  let currentPage: Page | null = null
  let instance: PageInstance | void = undefined

  async function render(url: URL) {
    currentPath.value = url.pathname
    const page = await resolve(url)
    if (page === currentPage && instance?.update) {
      await instance.update(url)
      return
    }
    current?.abort()
    const controller = new AbortController()
    current = controller
    currentPage = page
    instance = undefined
    if (controller.signal.aborted) return
    outlet.replaceChildren()
    try {
      instance = await page(outlet, controller.signal, url)
    } catch (err) {
      if (controller.signal.aborted) return
      console.error('Page failed to render:', err)
      const p = document.createElement('p')
      p.className = 'page-error'
      p.textContent = `This page failed to render: ${err instanceof Error ? err.message : String(err)}`
      outlet.replaceChildren(p)
    }
  }

  const navigation = (globalThis as { navigation?: NavigationLike }).navigation
  if (navigation) {
    navigation.addEventListener('navigate', (e) => {
      if (!e.canIntercept || e.hashChange || e.downloadRequest !== null || e.formData) return
      const url = new URL(e.destination.url)
      if (url.origin !== location.origin) return
      e.intercept({ handler: () => render(url) })
    })
  } else {
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest('a')
      if (!a || a.target || a.hasAttribute('download')) return
      const url = new URL(a.href)
      if (url.origin !== location.origin) return
      e.preventDefault()
      if (url.href === location.href) return
      history.pushState(null, '', url)
      void render(url)
    })
    addEventListener('popstate', () => void render(new URL(location.href)))
  }

  void render(new URL(location.href))
}
