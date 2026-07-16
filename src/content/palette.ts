// Derby Dash vintage county-fair palette — see design.md §9.
// These are the ONLY colors in the game: UI panels and 3D materials both.

export const PALETTE = {
  paper: '#F5EBD8',
  kraft: '#C9A876',
  ink: '#211D16',
  navy: '#27335A',
  brickRed: '#BF3B2B',
  mustard: '#D9A03F',
  skyBlue: '#A9D3E0',
  orange: '#DD7A33',
  pine: '#E6C98F',
  forest: '#4A6B4F',
} as const

export type PaletteId = keyof typeof PALETTE

/** Car paint choices (some unlocked via the rivals ladder — see content/unlocks.ts). */
export const CAR_PAINTS: PaletteId[] = [
  'brickRed',
  'navy',
  'skyBlue',
  'mustard',
  'orange',
  'forest',
  'paper',
  'ink',
]
