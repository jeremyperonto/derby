import {
  freshCarDesign,
  type CarDesign,
  type CarveOp,
  type WeightPlug,
} from '../model/carDesign'
import type { Rng } from '../sim/rng'
import type { LessonId } from './lessons'
import { generateFillerName } from './names'
import type { PaletteId } from './palette'
import { TEMPLATES } from './templates'

/**
 * The rivals ladder. Every rival is a REAL CarDesign run through the real
 * sim — each one loses to exactly the lesson it teaches (design.md §5).
 * Beat the current rival to unlock the next.
 */
export interface Rival {
  id: string
  name: string
  tagline: string
  intro: string
  lesson: LessonId
  design: CarDesign
  /** unlock ids granted on first win (see content/unlocks.ts) */
  unlocks: string[]
}

const wedgeOps = TEMPLATES.find((t) => t.id === 'wedge')!.ops
const speederOps = TEMPLATES.find((t) => t.id === 'speeder')!.ops

function rivalDesign(
  id: string,
  name: string,
  number: number,
  body: PaletteId,
  carve: CarveOp[],
  weights: WeightPlug[],
  wheels: CarDesign['wheels'],
): CarDesign {
  return {
    ...freshCarDesign(`rival-${id}`, 0),
    name,
    number,
    carve: { ops: carve },
    weights,
    wheels,
    paint: { body, wheels: 'ink' },
  }
}

/** Bobby scooped decorative holes in his block and forgot the weights. */
const bobbyOps: CarveOp[] = [
  { t: 'scoop', view: 'side', stroke: [[1.6, 1.5]], r: 0.45 },
  { t: 'scoop', view: 'side', stroke: [[3.5, 1.5]], r: 0.45 },
  { t: 'scoop', view: 'side', stroke: [[5.4, 1.5]], r: 0.45 },
]

export const RIVALS: Rival[] = [
  {
    id: 'bobby',
    name: 'Brick Bobby',
    tagline: '“Carving is for quitters.”',
    intro: 'Bobby says his block is already perfect. Is a block a race car?',
    lesson: 'carve',
    design: rivalDesign('bobby', 'The Brick', 8, 'skyBlue', bobbyOps, [], {
      raised: 'none',
      polish: 0,
      graphite: 0,
    }),
    unlocks: ['paint-mustard', 'decal-checker'],
  },
  {
    id: 'flo',
    name: 'Featherweight Flo',
    tagline: '“Light as a feather, fast as a… feather?”',
    intro: 'Flo carved a beautiful car but skipped the weights. Heavy or light — which pushes harder down a hill?',
    lesson: 'weight',
    design: rivalDesign('flo', 'The Feather', 3, 'paper', [...wedgeOps], [], {
      raised: 'none',
      polish: 3,
      graphite: 3,
    }),
    unlocks: ['paint-orange', 'decal-rocket'],
  },
  {
    id: 'ned',
    name: 'Nose-Heavy Ned',
    tagline: '“The front is the fast part!”',
    intro: 'Ned crammed every weight into the nose. Does the front of the hill or the back of the hill push longer?',
    lesson: 'placement',
    design: rivalDesign(
      'ned',
      'The Sledgehammer',
      44,
      'forest',
      [...wedgeOps],
      [
        { slot: 0, kind: 'tungsten' },
        { slot: 1, kind: 'tungsten' },
      ],
      { raised: 'none', polish: 3, graphite: 3 },
    ),
    unlocks: ['paint-forest', 'decal-eyes'],
  },
  {
    id: 'pete',
    name: 'Squeaky Pete',
    tagline: '“You can hear me coming!”',
    intro: 'Pete never polishes anything. Listen to those axles squeak — where is his speed going?',
    lesson: 'friction',
    design: rivalDesign(
      'pete',
      'The Screamer',
      13,
      'mustard',
      [...wedgeOps],
      [
        { slot: 6, kind: 'tungsten' },
        { slot: 5, kind: 'tungsten' },
      ],
      { raised: 'none', polish: 0, graphite: 0 },
    ),
    unlocks: ['paint-paper', 'decal-boom'],
  },
  {
    id: 'barb',
    name: 'Barn-Door Barb',
    tagline: '“The air can move for ME.”',
    intro: 'Barb did everything right — except her car is a tall brick. Who has to shove more air out of the way?',
    lesson: 'aero',
    design: rivalDesign(
      'barb',
      'The Barn Door',
      66,
      'brickRed',
      [], // uncarved: full-height, full-width block
      [
        { slot: 6, kind: 'steel' },
        { slot: 7, kind: 'steel' },
        { slot: 8, kind: 'steel' },
      ],
      { raised: 'none', polish: 3, graphite: 3 },
    ),
    unlocks: ['paint-ink', 'decal-clover'],
  },
  {
    id: 'lena',
    name: 'Lightning Lena',
    tagline: '“Catch me if you can.”',
    intro: 'The champ. Sleek, heavy in the back, polished, graphited — and she rides on three wheels. Bring everything you know.',
    lesson: 'wheels',
    design: rivalDesign(
      'lena',
      'Lightning',
      1,
      'ink',
      [...speederOps],
      [
        { slot: 6, kind: 'tungsten' },
        { slot: 5, kind: 'tungsten' },
        { slot: 7, kind: 'steel' },
      ],
      { raised: 'frontLeft', polish: 3, graphite: 2 },
    ),
    unlocks: ['decal-skull'],
  },
]

export const rivalById = (id: string) => RIVALS.find((r) => r.id === id)

/** seeded mid-tier filler car for lanes 3–4 so heats feel populated */
export function generateFillerDesign(rng: Rng): CarDesign {
  const template = rng() < 0.5 ? wedgeOps : speederOps
  const paints: PaletteId[] = ['skyBlue', 'mustard', 'orange', 'forest', 'navy', 'paper']
  const weights: WeightPlug[] = []
  const plugCount = 1 + Math.floor(rng() * 3)
  for (let i = 0; i < plugCount; i++) {
    weights.push({ slot: 3 + Math.floor(rng() * 4), kind: rng() < 0.5 ? 'tungsten' : 'steel' })
  }
  const design = rivalDesign(
    `filler-${Math.floor(rng() * 1e9)}`,
    generateFillerName(rng),
    Math.floor(rng() * 100),
    paints[Math.floor(rng() * paints.length)]!,
    [...template],
    weights,
    {
      raised: 'none',
      polish: Math.floor(rng() * 3) as 0 | 1 | 2 | 3,
      graphite: Math.floor(rng() * 3) as 0 | 1 | 2 | 3,
    },
  )
  return design
}
