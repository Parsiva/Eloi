// The engine's own CSS, injected once into a cascade layer so a host's styles stay in charge
// inside openings (system.md decision 6).
const CSS = `
@layer eloi {
  .eloi-frame { position: relative; display: block; }
  .eloi-split { display: grid; min-width: 0; min-height: 0; }
  .eloi-band { min-width: 0; min-height: 0; }
  .eloi-opening { position: relative; min-width: 0; min-height: 0; }
  .eloi-opening[data-fit="flow"] { container-type: inline-size; }
  .eloi-opening[data-fit="fixed"] { container-type: size; overflow: hidden; display: grid; }
  .eloi-opening[data-fit="fixed"] > * { grid-area: 1 / 1; min-width: 0; min-height: 0; }
  .eloi-opening[data-state="live"] > .eloi-fallback { display: none; }
  .eloi-opening[data-state="broken"] > .eloi-runtime { display: none; }
  .eloi-opening:not([data-state="live"]) > .eloi-runtime:empty { display: none; }
  .eloi-ink, .eloi-overlay {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; overflow: visible;
  }
  .eloi-ink { z-index: 1; }
  .eloi-overlay { z-index: 3; }
  .eloi-box-error { margin: 0.5em 0 0; font: italic 0.85em/1.4 system-ui, sans-serif; color: #8a2b1d; }
  .eloi-conveyor { animation: eloi-conveyor var(--eloi-conveyor-duration, 2.4s) linear infinite; }
  .eloi-frame[data-reduced-motion] .eloi-conveyor { animation: none; }
  @keyframes eloi-conveyor { from { transform: translateX(0); } to { transform: translateX(var(--eloi-pitch)); } }
}
`

let injected: HTMLStyleElement | null = null
let users = 0

export function retainStyles(): () => void {
  users++
  if (!injected) {
    injected = document.createElement('style')
    injected.dataset.eloi = ''
    injected.textContent = CSS
    document.head.prepend(injected)
  }
  return () => {
    users--
    if (users === 0) {
      injected?.remove()
      injected = null
    }
  }
}

// Sprites are shared by prefix: one hidden <svg> of symbols per document, reference counted.
const sprites = new Map<string, { el: Element; users: number }>()

export function retainSprite(prefix: string, svg: string): () => void {
  let entry = sprites.get(prefix)
  if (!entry) {
    const holder = document.createElement('div')
    holder.innerHTML = svg
    const el = holder.firstElementChild!
    el.setAttribute('aria-hidden', 'true')
    ;(el as SVGElement).style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
    document.body.append(el)
    entry = { el, users: 0 }
    sprites.set(prefix, entry)
  }
  entry.users++
  const e = entry
  return () => {
    e.users--
    if (e.users === 0) {
      e.el.remove()
      sprites.delete(prefix)
    }
  }
}
