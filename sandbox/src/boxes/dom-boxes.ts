// DOM box runtimes for the Boxes bench. Each is a factory, so every mount gets fresh state.
import type { BoxRuntime } from '@eloi/engine'
import { h } from '../dom'
import { projects } from '../content'

// A box with "live" data: it loads the project list after a simulated delay, and can be made to
// fail. A failed load is handled inside the box (it stays live and offers a retry); only a throw
// that escapes breaks a box. Picking a project writes the frame channel "selected" and emits
// "select" — the detail box and the rosette react.
export function createLedger(): BoxRuntime {
  return {
    mount(el, ctx) {
      const selected = ctx.channel<string | null>('selected', null)
      const list = h('ul', { class: 'ledger' })
      const status = h('p', { class: 'muted' }, 'Loading projects…')
      const failNext = h('input', { type: 'checkbox' })
      const reload = h('button', { type: 'button', class: 'btn' }, 'Reload')
      el.append(h('p', { class: 'eyebrow' }, 'Ledger · live data'), status, list, h('div', { class: 'controls' }, reload, h('label', {}, failNext, ' fail next load')))
      let items: { slug: string; title: string }[] = []
      const mark = (slug: string | null) => {
        for (const [i, li] of [...list.children].entries()) li.toggleAttribute('data-active', items[i]?.slug === slug)
      }
      ctx.effect(() => mark(selected.value))

      const load = async () => {
        status.textContent = 'Loading projects…'
        list.replaceChildren()
        try {
          items = await fakeFetch(ctx.signal, failNext.checked)
          failNext.checked = false
          status.textContent = `${items.length} projects · loaded ${new Date().toLocaleTimeString()}`
          for (const p of items) {
            const b = h('button', { type: 'button', class: 'ledger__item' }, p.title)
            ctx.listenTo(b, 'click', () => {
              selected.value = p.slug
              ctx.emit('select', { slug: p.slug, title: p.title })
            })
            list.append(h('li', {}, b))
          }
          mark(selected.peek())
        } catch (err) {
          if (ctx.signal.aborted) return
          status.textContent = `Couldn't load: ${(err as Error).message}. The box is still live; try Reload.`
        }
      }
      ctx.listenTo(reload, 'click', () => void load())
      void load()
    },
  }
}

function fakeFetch(signal: AbortSignal, fail: boolean): Promise<{ slug: string; title: string }[]> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      if (fail) reject(new Error('the server returned 503'))
      else resolve(projects.map((p) => ({ slug: p.slug, title: p.title })))
    }, 700)
    signal.addEventListener('abort', () => {
      clearTimeout(id)
      reject(new Error('aborted'))
    })
  })
}

// Shows whichever project the ledger picked, through the shared channel, and keeps a log of the
// "select" events it heard.
export function createDetail(): BoxRuntime {
  return {
    mount(el, ctx) {
      const selected = ctx.channel<string | null>('selected', null)
      const body = h('div', {})
      const log = h('ol', { class: 'event-log' })
      el.append(body, h('p', { class: 'eyebrow' }, 'Events heard from other boxes'), log)
      ctx.effect(() => {
        const p = projects.find((x) => x.slug === selected.value)
        if (!p) {
          body.replaceChildren(h('p', { class: 'eyebrow' }, 'Detail · listens to the ledger'), h('p', { class: 'muted' }, 'Pick a project in the ledger.'))
          return
        }
        body.replaceChildren(
          h('p', { class: 'eyebrow' }, 'Detail · listens to the ledger'),
          h('h3', {}, p.title),
          h('p', { class: 'lede' }, p.tagline),
          ...p.highlights.slice(0, 2).map((t) => h('p', {}, t)),
        )
      })
      ctx.listen<{ title: string }>('select', (e) => {
        log.prepend(h('li', {}, `${new Date().toLocaleTimeString()} · ${e.from} → select “${e.detail.title}”`))
        while (log.children.length > 4) log.lastElementChild!.remove()
      })
    },
  }
}

// A live box that can be broken on purpose: "Break" makes its next frame callback throw. The
// frame catches it, marks this box broken and shows its fallback; the others keep running.
export function createClock(): BoxRuntime {
  return {
    mount(el, ctx) {
      const time = h('p', { class: 'clock' })
      const ticks = h('p', { class: 'muted' })
      const breakIt = h('button', { type: 'button', class: 'btn' }, 'Break this box')
      el.append(h('p', { class: 'eyebrow' }, 'Clock · live, breakable'), time, ticks, breakIt)
      let broken = false
      let count = 0
      ctx.listenTo(breakIt, 'click', () => {
        broken = true
        ctx.requestFrame()
      })
      ctx.onFrame(() => {
        if (broken) throw new Error('the clock was broken on purpose')
        count++
        time.textContent = new Date().toLocaleTimeString()
        ticks.textContent = `${count} ticks, one frame each`
      })
      // One frame per second, not one per display refresh.
      const tick = () => {
        ctx.requestFrame()
        const id = setTimeout(tick, 1000)
        ctx.signal.addEventListener('abort', () => clearTimeout(id), { once: true })
      }
      tick()
    },
  }
}

// Throws while mounting. Its static fallback (the HTML the host put in the slot) stays.
export function createBroken(): BoxRuntime {
  return {
    mount() {
      throw new Error('this runtime throws while mounting, on purpose')
    },
  }
}

// Starts only when scrolled into view (when: 'visible'), and says how long it waited.
export function createLate(pageStart: number): BoxRuntime {
  return {
    mount(el) {
      const waited = ((performance.now() - pageStart) / 1000).toFixed(1)
      el.append(
        h('p', { class: 'eyebrow' }, 'Late box · when: visible'),
        h('p', { class: 'lede' }, `Mounted ${waited}s after the page opened, when it came within 200px of the viewport.`),
      )
    },
  }
}
