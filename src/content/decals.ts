import type { DecalSlot } from '../model/carDesign'

/**
 * Sticker registry — emoji glyphs drawn onto small canvas textures: zero
 * asset work, instantly kid-readable. Some unlock via the rivals ladder.
 */
export interface Decal {
  id: string
  glyph: string
  name: string
}

export const DECALS: Decal[] = [
  { id: 'flame', glyph: '🔥', name: 'Flames' },
  { id: 'bolt', glyph: '⚡', name: 'Lightning' },
  { id: 'star', glyph: '⭐', name: 'Star' },
  { id: 'checker', glyph: '🏁', name: 'Checkers' },
  { id: 'rocket', glyph: '🚀', name: 'Rocket' },
  { id: 'heart', glyph: '❤️', name: 'Heart' },
  { id: 'eyes', glyph: '👀', name: 'Eyes' },
  { id: 'boom', glyph: '💥', name: 'Ka-boom' },
  { id: 'clover', glyph: '🍀', name: 'Lucky Clover' },
  { id: 'skull', glyph: '☠️', name: 'Jolly Roger' },
]

export const decalById = (id: string) => DECALS.find((d) => d.id === id)

export const SLOT_LABELS: Record<DecalSlot, string> = {
  hood: 'Hood',
  roof: 'Roof',
  sideFront: 'Front side',
  sideRear: 'Back side',
  tail: 'Tail',
}
