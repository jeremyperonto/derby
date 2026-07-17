import type { DecalSlot } from '../model/carDesign'

/**
 * Sticker registry — every sticker is a hand-drawn canvas vector (see
 * garage/carDecals.ts), no emoji. Some unlock via the rivals ladder.
 */
export interface Decal {
  id: string
  name: string
}

export const DECALS: Decal[] = [
  { id: 'flame', name: 'Flames' },
  { id: 'bolt', name: 'Lightning' },
  { id: 'star', name: 'Star' },
  { id: 'heart', name: 'Heart' },
  { id: 'checker', name: 'Checkers' },
  { id: 'stripes', name: 'Racing Stripes' },
  { id: 'eyes', name: 'Googly Eyes' },
  { id: 'boom', name: 'Ka-boom' },
  { id: 'clover', name: 'Lucky Clover' },
  { id: 'arrow', name: 'Speed Arrows' },
  { id: 'wings', name: 'Racing Wings' },
  { id: 'crown', name: 'Crown' },
  { id: 'trophy', name: 'Trophy' },
]

export const decalById = (id: string) => DECALS.find((d) => d.id === id)

export const SLOT_LABELS: Record<DecalSlot, string> = {
  hood: 'Hood',
  roof: 'Roof',
  sideFront: 'Front side',
  sideRear: 'Back side',
  tail: 'Tail',
}
