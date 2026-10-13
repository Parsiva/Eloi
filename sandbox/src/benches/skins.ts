// Skins bench: one structure, two styles. The chronicle frame spec is drawn as Victorian
// engraving or as mid-century flat-colour moulding. Switching skin redraws the members and
// re-tokens the type, but keeps every opening's element (and anything running in it).
import { mount, type Skin } from '@eloi/engine'
import { h } from '../dom'
import type { Page } from '../router'
import { attachDev } from '../devpanel/devtools'
import { benchHeader, button, stage } from './common'
import { chronicle } from '../frames/chronicle'
import { chronicleSlots } from '../frames/chronicle-content'
import { midcentury, victorian } from '../frames/skins'
import { handDrawn } from '../frames/sprite'
import '../styles/chronicle.css'

const page: Page = (outlet, signal) => {
  const { wrap, stage: st } = stage()
  const host = h('div', {}, ...chronicleSlots())
  st.append(host)
  const frame = mount(host, chronicle, { skin: victorian, sprite: handDrawn })
  attachDev(frame, st, 'skins', signal)
  signal.addEventListener('abort', () => void frame.dispose())

  const slots = ['masthead', 'dateline', 'main', 'left', 'right', 'upcoming', 'foot']
  const original = new Map(slots.map((s) => [s, frame.opening(s)]))
  let swaps = 0
  const report = h('span', { class: 'mono-note' })
  const check = () => {
    const kept = slots.filter((s) => frame.opening(s) === original.get(s) && original.get(s)?.isConnected).length
    report.textContent = `swaps ${swaps} · openings kept ${kept}/${slots.length} (same DOM nodes)`
  }
  const choose = (skin: Skin, self: HTMLButtonElement) => {
    if (frame.stats.value.skin === skin.id) return
    frame.setSkin(skin)
    swaps++
    for (const b of buttons) b.setAttribute('aria-pressed', String(b === self))
    check()
  }
  const buttons: HTMLButtonElement[] = []
  buttons.push(button(victorian.label!, () => choose(victorian, buttons[0]!), true))
  buttons.push(button(midcentury.label!, () => choose(midcentury, buttons[1]!), false))
  check()
  outlet.append(benchHeader('skins', ...buttons, report), wrap)
}

export default page
