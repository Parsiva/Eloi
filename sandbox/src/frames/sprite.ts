// The hand-drawn sprite (cut from the owner's pencil drawing) as an Eloi Sprite.
import type { Sprite, SpritePiece } from '@eloi/engine'
import svg from '../content/ornaments/hand-drawn.svg?raw'
import manifest from '../content/ornaments/hand-drawn.json'

export const handDrawn: Sprite = {
  svg,
  prefix: 'hd-',
  pieces: manifest as unknown as Record<string, SpritePiece>,
}
