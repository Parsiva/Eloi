// Chronicle bench (S3): a real page. The Victorian newspaper frame from the references, drawn
// with the owner's hand-drawn ornament, holding the portfolio's real content.
import { mount } from '@eloi/engine'
import { h } from '../dom'
import type { Page } from '../router'
import { attachDev } from '../devpanel/devtools'
import { benchHeader, stage } from './common'
import { chronicle } from '../frames/chronicle'
import { chronicleSlots } from '../frames/chronicle-content'
import { victorian } from '../frames/skins'
import { handDrawn } from '../frames/sprite'
import '../styles/chronicle.css'

const page: Page = (outlet, signal) => {
  const { wrap, stage: st } = stage()
  const host = h('div', {}, ...chronicleSlots())
  st.append(host)
  outlet.append(benchHeader('chronicle'), wrap)
  const frame = mount(host, chronicle, { skin: victorian, sprite: handDrawn })
  attachDev(frame, st, 'chronicle', signal)
  signal.addEventListener('abort', () => void frame.dispose())
}

export default page
