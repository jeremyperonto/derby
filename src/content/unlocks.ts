import type { PaletteId } from './palette'

/**
 * Cosmetic unlock registry — rivals grant these on first defeat.
 * Everything not listed here is available from the start.
 */
export interface Unlock {
  id: string
  kind: 'paint' | 'decal'
  itemId: string
  label: string
}

export const UNLOCKS: Unlock[] = [
  { id: 'paint-mustard', kind: 'paint', itemId: 'mustard', label: 'Mustard Gold paint' },
  { id: 'paint-orange', kind: 'paint', itemId: 'orange', label: 'Hot-Rod Orange paint' },
  { id: 'paint-forest', kind: 'paint', itemId: 'forest', label: 'Forest Green paint' },
  { id: 'paint-paper', kind: 'paint', itemId: 'paper', label: 'Cream White paint' },
  { id: 'paint-ink', kind: 'paint', itemId: 'ink', label: 'Midnight Black paint' },
  { id: 'decal-checker', kind: 'decal', itemId: 'checker', label: 'Checkered flag sticker' },
  { id: 'decal-rocket', kind: 'decal', itemId: 'rocket', label: 'Rocket sticker' },
  { id: 'decal-eyes', kind: 'decal', itemId: 'eyes', label: 'Googly eyes sticker' },
  { id: 'decal-boom', kind: 'decal', itemId: 'boom', label: 'Ka-boom sticker' },
  { id: 'decal-clover', kind: 'decal', itemId: 'clover', label: 'Lucky clover sticker' },
  { id: 'decal-skull', kind: 'decal', itemId: 'skull', label: 'Jolly Roger sticker' },
]

/** paints/decals available before any wins */
export const BASE_PAINTS: PaletteId[] = ['brickRed', 'navy', 'skyBlue']
export const BASE_DECALS = ['flame', 'bolt', 'star', 'heart']

export const unlockById = (id: string) => UNLOCKS.find((u) => u.id === id)
