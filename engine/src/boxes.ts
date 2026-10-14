// Boxes: what lives in a frame's openings (docs/research/08, "Proposed box contract").
// A box without a runtime is static HTML and has no lifecycle. A box with a runtime is started
// by its trigger, gets a context from the frame, and is isolated: if it throws, it alone breaks
// and shows its fallback, and the rest of the frame keeps working.
import { effect, signal, type ReadonlySignal, type Signal } from '@preact/signals-core'
import { listen, live } from './debug'
import type { Job, Scheduler } from './scheduler'

export type When = 'load' | 'idle' | 'visible' | `media:${string}`
export type BoxState = 'static' | 'waiting' | 'loading' | 'live' | 'broken' | 'detached'

export interface BoxGeometry {
  inline: number // CSS px of the runtime's content box
  block: number
  dpr: number
  room: number // z = log_φ(inline / 320), quantised, with hysteresis
  variant: string // the frame's current plan
}

export interface BoxEvent<T = unknown> {
  from: string // box id, or '' for the host
  type: string
  detail: T
}

export interface BoxContext<I = unknown> {
  readonly id: string
  readonly signal: AbortSignal // aborted when the box stops, breaks, or its frame is disposed
  readonly geometry: ReadonlySignal<BoxGeometry> // pushed by the frame; never measure yourself
  readonly visible: ReadonlySignal<boolean>
  readonly reducedMotion: ReadonlySignal<boolean>
  readonly input: ReadonlySignal<I> // set by the host: frame.box(id).input(value)
  emit(type: string, detail?: unknown): void // to the frame: other boxes and the host hear it
  listen<T = unknown>(type: string, fn: (e: BoxEvent<T>) => void): void // events from other boxes
  channel<T>(name: string, initial: T): Signal<T> // a value shared by every box in the frame
  requestFrame(): void // coalescing: onFrame callbacks run once in the next frame
  onFrame(fn: (t: number, dt: number) => void): () => void
  effect(fn: () => void | (() => void)): void // a signals effect owned by this box
  listenTo(target: EventTarget, type: string, fn: (e: Event) => void, options?: AddEventListenerOptions): void
}

export interface BoxRuntime<I = unknown> {
  mount(el: HTMLElement, ctx: BoxContext<I>): void | Promise<void>
  dispose?(): void | Promise<void> // release what ctx.signal can't (e.g. a GL context)
}

export type RuntimeSource<I> = BoxRuntime<I> | (() => Promise<BoxRuntime<I> | { default: BoxRuntime<I> }>)

export interface BoxDef<I = unknown> {
  runtime: RuntimeSource<I>
  when?: When // default 'visible'
  input?: I
}

export interface BoxStats {
  id: string
  state: BoxState
  inline: number
  block: number
  room: number
  mounts: number
  frames: number
  error?: string
}

// What a box needs from its frame.
export interface FrameLink {
  readonly frameId: string
  readonly scheduler: Scheduler
  readonly reducedMotion: ReadonlySignal<boolean>
  readonly signal: AbortSignal // the frame's own lifetime
  emit(e: BoxEvent): void
  listen(type: string, fn: (e: BoxEvent) => void, signal: AbortSignal): void
  channel<T>(name: string, initial: T): Signal<T>
  observeVisible(el: Element, fn: (inView: boolean, visible: boolean) => void): () => void
  changed(): void // stats changed
}

export class Box {
  readonly state = signal<BoxState>('static')
  readonly geometry = signal<BoxGeometry>({ inline: 0, block: 0, dpr: 1, room: 0, variant: '' })
  readonly visible = signal(false) // in view and the page is showing: for animation
  readonly inView = signal(false) // intersecting the viewport (with margin): for the 'visible' trigger
  readonly input = signal<unknown>(undefined)
  mounts = 0
  frames = 0
  error?: string

  private def?: BoxDef<any>
  private runtime?: BoxRuntime<any>
  private controller?: AbortController // the running runtime's lifetime
  private arming?: AbortController // the trigger's lifetime
  private callbacks = new Set<(t: number, dt: number) => void>()
  private job: Job
  private fallbackEl?: HTMLElement
  private runtimeEl?: HTMLElement
  private errorEl?: HTMLElement
  private stopVisible?: () => void
  private attached = false

  constructor(
    readonly id: string,
    readonly el: HTMLElement,
    private link: FrameLink,
  ) {
    live.boxes++
    this.job = {
      write: (t, dt) => {
        this.frames++
        for (const fn of [...this.callbacks]) fn(t, dt)
      },
      onError: (err) => this.fail(err),
    }
  }

  get hasRuntime(): boolean {
    return !!this.def
  }

  // Give the box a runtime. Its current children become the fallback, shown until it is live
  // and again if it breaks.
  define(def: BoxDef<any>): void {
    if (this.def) throw new Error(`Box "${this.id}" already has a runtime`)
    this.def = def
    if (def.input !== undefined) this.input.value = def.input
    this.fallbackEl = document.createElement('div')
    this.fallbackEl.className = 'eloi-fallback'
    this.fallbackEl.append(...this.el.childNodes)
    this.runtimeEl = document.createElement('div')
    this.runtimeEl.className = 'eloi-runtime'
    this.el.append(this.fallbackEl, this.runtimeEl)
    this.setState(this.attached ? 'waiting' : 'detached')
    if (this.attached) this.arm()
  }

  // The plan placed this box's opening in the frame.
  attach(): void {
    if (this.attached) return
    this.attached = true
    this.stopVisible = this.link.observeVisible(this.el, (inView, visible) => {
      this.inView.value = inView
      this.visible.value = visible
    })
    if (this.def && this.state.value !== 'broken') {
      this.setState('waiting')
      this.arm()
    }
  }

  // The plan no longer has this opening: stop the runtime; it restarts if the opening returns.
  detach(): void {
    if (!this.attached) return
    this.attached = false
    this.stopVisible?.()
    this.stopVisible = undefined
    this.visible.value = false
    this.inView.value = false
    this.disarm()
    void this.stop()
    if (this.def && this.state.value !== 'broken') this.setState('detached')
  }

  // The runtime element, where runtimes render (the opening itself for static boxes).
  get contentEl(): HTMLElement {
    return this.runtimeEl ?? this.el
  }

  stats(): BoxStats {
    const g = this.geometry.value
    return {
      id: this.id,
      state: this.state.value,
      inline: g.inline,
      block: g.block,
      room: g.room,
      mounts: this.mounts,
      frames: this.frames,
      error: this.error,
    }
  }

  async dispose(): Promise<void> {
    this.detach()
    await this.stop()
    live.boxes--
  }

  // Restart a broken box (from the dev panel or the host).
  retry(): void {
    if (this.state.value !== 'broken') return
    this.error = undefined
    this.errorEl?.remove()
    this.errorEl = undefined
    this.el.removeAttribute('data-error')
    if (this.attached) {
      this.setState('waiting')
      this.arm()
    } else this.setState('detached')
  }

  private setState(state: BoxState) {
    this.state.value = state
    if (this.def) this.el.dataset.state = state
    this.link.changed()
  }

  private arm() {
    this.disarm()
    const def = this.def!
    const arming = new AbortController()
    this.arming = arming
    const when = def.when ?? 'visible'
    const go = () => {
      if (arming.signal.aborted) return
      arming.abort()
      void this.start()
    }
    if (when === 'load') queueMicrotask(go)
    else if (when === 'idle') {
      if ('requestIdleCallback' in window) {
        const id = requestIdleCallback(go, { timeout: 1500 })
        arming.signal.addEventListener('abort', () => cancelIdleCallback(id))
      } else {
        const id = setTimeout(go, 200)
        arming.signal.addEventListener('abort', () => clearTimeout(id))
      }
    } else if (when === 'visible') {
      const stop = effect(() => {
        if (this.inView.value) queueMicrotask(go)
      })
      arming.signal.addEventListener('abort', stop)
    } else {
      const query = matchMedia(when.slice('media:'.length))
      if (query.matches) queueMicrotask(go)
      else listen(query, 'change', () => query.matches && go(), arming.signal)
    }
  }

  private disarm() {
    this.arming?.abort()
    this.arming = undefined
  }

  private async start(): Promise<void> {
    const def = this.def!
    const controller = new AbortController()
    this.controller = controller
    this.mounts++
    this.setState('loading')
    try {
      let runtime: BoxRuntime<any>
      if (typeof def.runtime === 'function') {
        const loaded = await def.runtime()
        runtime = 'default' in loaded ? loaded.default : loaded
      } else runtime = def.runtime
      if (controller.signal.aborted) return
      this.runtime = runtime
      await runtime.mount(this.runtimeEl!, this.context(controller.signal))
      if (controller.signal.aborted) return
      this.setState('live')
    } catch (err) {
      if (!controller.signal.aborted) this.fail(err)
    }
  }

  private async stop(): Promise<void> {
    const controller = this.controller
    const runtime = this.runtime
    this.controller = undefined
    this.runtime = undefined
    if (!controller) return
    controller.abort()
    this.link.scheduler.cancel(this.job)
    try {
      await runtime?.dispose?.()
    } catch (err) {
      console.error(`Eloi: box "${this.id}" failed to dispose`, err)
    }
    this.runtimeEl?.replaceChildren()
  }

  fail(err: unknown): void {
    if (this.state.value === 'broken') return
    this.error = err instanceof Error ? err.message : String(err)
    console.error(`Eloi: box "${this.id}" broke`, err)
    void this.stop()
    this.disarm()
    this.errorEl = document.createElement('p')
    this.errorEl.className = 'eloi-box-error'
    this.errorEl.textContent = `This box stopped working: ${this.error}`
    this.el.dataset.error = this.error
    this.el.append(this.errorEl)
    this.setState('broken')
    this.link.emit({ from: this.id, type: 'box-error', detail: { id: this.id, error: this.error } })
  }

  // Wrap a callback so a throw breaks this box instead of escaping into someone else's code.
  private guard<A extends unknown[]>(fn: (...args: A) => void): (...args: A) => void {
    return (...args: A) => {
      try {
        fn(...args)
      } catch (err) {
        this.fail(err)
      }
    }
  }

  private context(sig: AbortSignal): BoxContext<any> {
    const box = this
    return {
      id: box.id,
      signal: sig,
      geometry: box.geometry,
      visible: box.visible,
      reducedMotion: box.link.reducedMotion,
      input: box.input,
      emit(type, detail) {
        if (!sig.aborted) box.link.emit({ from: box.id, type, detail })
      },
      listen(type, fn) {
        box.link.listen(type, box.guard(fn as (e: BoxEvent) => void), sig)
      },
      channel(name, initial) {
        return box.link.channel(name, initial)
      },
      requestFrame() {
        if (!sig.aborted) box.link.scheduler.request(box.job)
      },
      onFrame(fn) {
        if (sig.aborted) return () => {}
        box.callbacks.add(fn)
        live.frameCallbacks++
        let removed = false
        const remove = () => {
          if (removed) return
          removed = true
          box.callbacks.delete(fn)
          live.frameCallbacks--
        }
        sig.addEventListener('abort', remove, { once: true })
        return remove
      },
      effect(fn) {
        if (sig.aborted) return
        live.effects++
        const stop = effect(() => {
          try {
            return fn()
          } catch (err) {
            queueMicrotask(() => box.fail(err))
          }
        })
        sig.addEventListener(
          'abort',
          () => {
            stop()
            live.effects--
          },
          { once: true },
        )
      },
      listenTo(target, type, fn, options) {
        listen(target, type, box.guard(fn), sig, options)
      },
    }
  }
}
