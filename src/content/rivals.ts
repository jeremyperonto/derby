import {
  freshCarDesign,
  type CarDesign,
  type CarveOp,
  type WeightPlug,
} from '../model/carDesign'
import { deriveSimParams } from '../model/deriveSimParams'
import type { Rng } from '../sim/rng'
import { runRace } from '../sim/simulate'
import { TUNING, type Tuning } from '../sim/tuning'
import type { LessonId } from './lessons'
import { generateFillerName } from './names'
import type { PaletteId } from './palette'
import { TEMPLATES } from './templates'

/**
 * The rivals roster, organized into DIVISIONS of similar-strength cars.
 * Every rival is a REAL CarDesign run through the real sim — each one
 * loses to exactly the lesson it teaches (design.md §5). Race anyone in
 * your division; beat enough of them to move up.
 */
export interface Rival {
  id: string
  name: string
  tagline: string
  intro: string
  lesson: LessonId
  /** division tier: 1 = Rookie, 2 = Challenger, 3 = Champion */
  tier: 1 | 2 | 3
  design: CarDesign
  /** unlock ids granted on first win (see content/unlocks.ts) */
  unlocks: string[]
}

export interface Division {
  tier: 1 | 2 | 3
  name: string
  motto: string
  /** wins in the previous division needed to enter */
  winsToEnter: number
}

export const DIVISIONS: Division[] = [
  { tier: 1, name: 'Rookie Division', motto: 'everyone starts here', winsToEnter: 0 },
  { tier: 2, name: 'Challenger Division', motto: 'the pits get serious', winsToEnter: 2 },
  { tier: 3, name: 'Champion Division', motto: 'bring everything you know', winsToEnter: 2 },
]

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
    tier: 1,
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
    tier: 1,
    design: rivalDesign('flo', 'The Feather', 3, 'paper', [...wedgeOps], [], {
      raised: 'none',
      polish: 3,
      graphite: 3,
    }),
    unlocks: ['paint-orange', 'decal-rocket'],
  },
  {
    id: 'paula',
    name: 'Plank Paula',
    tagline: '“Sandpaper? Never met her.”',
    intro: 'Paula sawed her block into a plank and called it done — those axles have never seen polish. Hear the squeak?',
    lesson: 'friction',
    tier: 1,
    design: rivalDesign(
      'paula',
      'The Plank',
      22,
      'orange',
      [
        { t: 'slice', view: 'side', ax: 0, ay: 0.5, bx: 7, by: 0.5 },
      ],
      [
        { slot: 6, kind: 'steel' },
        { slot: 5, kind: 'steel' },
      ],
      { raised: 'none', polish: 0, graphite: 0 },
    ),
    unlocks: ['decal-eyes'],
  },
  {
    id: 'ned',
    name: 'Nose-Heavy Ned',
    tagline: '“The front is the fast part!”',
    intro: 'Ned crammed every weight into the nose. Does the front of the hill or the back of the hill push longer?',
    lesson: 'placement',
    tier: 2,
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
    unlocks: ['paint-forest', 'decal-boom'],
  },
  {
    id: 'pete',
    name: 'Squeaky Pete',
    tagline: '“You can hear me coming!”',
    intro: 'Pete never polishes anything. Listen to those axles squeak — where is his speed going?',
    lesson: 'friction',
    tier: 2,
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
    unlocks: ['paint-paper', 'decal-clover'],
  },
  {
    id: 'mel',
    name: 'Middleweight Mel',
    tagline: '“Right in the middle — perfectly balanced!”',
    intro: 'Mel put every weight dead center. Balanced sounds smart… but which end of the car should ride the hill longest?',
    lesson: 'placement',
    tier: 2,
    design: rivalDesign(
      'mel',
      'The Seesaw',
      50,
      'skyBlue',
      [...wedgeOps],
      [
        { slot: 2, kind: 'tungsten' },
        { slot: 3, kind: 'tungsten' },
      ],
      { raised: 'none', polish: 2, graphite: 1 },
    ),
    unlocks: ['decal-wings'],
  },
  {
    id: 'barb',
    name: 'Barn-Door Barb',
    tagline: '“The air can move for ME.”',
    intro: 'Barb did everything right — except her car is a tall brick. Who has to shove more air out of the way?',
    lesson: 'aero',
    tier: 3,
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
    unlocks: ['paint-ink', 'decal-skull'],
  },
  {
    id: 'tina',
    name: 'Tailfin Tina',
    tagline: '“All four on the floor.”',
    intro: 'Tina’s car is nearly perfect — sleek, heavy in the back, polished. But all four wheels rub the track. Can you find the last trick?',
    lesson: 'wheels',
    tier: 3,
    design: rivalDesign(
      'tina',
      'The Tailfin',
      21,
      'navy',
      [...speederOps],
      [
        { slot: 6, kind: 'tungsten' },
        { slot: 5, kind: 'tungsten' },
        { slot: 8, kind: 'steel' },
      ],
      { raised: 'none', polish: 3, graphite: 2 },
    ),
    unlocks: ['decal-crown'],
  },
  {
    id: 'lena',
    name: 'Lightning Lena',
    tagline: '“Catch me if you can.”',
    intro: 'The champ. Sleek, heavy in the back, polished, graphited — and she rides on three wheels. Bring everything you know.',
    lesson: 'wheels',
    tier: 3,
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
    unlocks: ['decal-trophy'],
  },
]

export const rivalById = (id: string) => RIVALS.find((r) => r.id === id)

/**
 * Filler car for lanes 3–4, guaranteed SLOWER than the heat's rival.
 * Fillers make the heat feel populated but must never decide it — the rival
 * is the bar, so winning the heat and beating the rival stay the same
 * story on the results screen (a kid watches all four cars).
 *
 * Construction: a repainted copy of the rival's own car, degraded one notch
 * at a time (strip a plug → dull the prep → gouge sloppy scoops) and
 * re-simulated until it is provably slower. Every degradation is monotone
 * in the sim, so this converges for any rung — even Bobby, who is slower
 * than a raw block.
 */
export function generateCappedFiller(rng: Rng, rival: CarDesign, t: Tuning = TUNING): CarDesign {
  const noWobble = { ...t, wobble: 0 }
  const soloTime = (design: CarDesign) =>
    runRace([deriveSimParams(design, noWobble).params], 1, noWobble).lanes[0]!.finishTime
  const target = soloTime(rival) + 0.04 // ≥ ~1 car length back, beyond wobble reach

  const paints: PaletteId[] = ['skyBlue', 'mustard', 'orange', 'forest', 'navy', 'paper']
  let filler: CarDesign = {
    ...rival,
    id: `filler-${Math.floor(rng() * 1e9)}`,
    name: generateFillerName(rng),
    number: Math.floor(rng() * 100),
    paint: { body: paints[Math.floor(rng() * paints.length)]!, wheels: 'ink' },
    decals: [],
    carve: { ops: [...rival.carve.ops] },
    weights: [...rival.weights],
    wheels: { ...rival.wheels },
  }

  let deck = 1.25 // progressive whittling height for the last-resort degrade
  for (let guard = 0; guard < 24; guard++) {
    if (soloTime(filler) > target) return filler
    if (filler.weights.length > 0) {
      filler = { ...filler, weights: filler.weights.slice(0, -1) }
    } else if (filler.wheels.graphite > 0) {
      filler = {
        ...filler,
        wheels: { ...filler.wheels, graphite: (filler.wheels.graphite - 1) as 0 | 1 | 2 | 3 },
      }
    } else if (filler.wheels.polish > 0) {
      filler = {
        ...filler,
        wheels: { ...filler.wheels, polish: (filler.wheels.polish - 1) as 0 | 1 | 2 | 3 },
      }
    } else {
      // out of hardware to strip: whittle the whole deck lower — strictly
      // less wood every step (lighter ⇒ slower for a prep-less cruiser)
      deck -= 0.06 + rng() * 0.04
      filler = {
        ...filler,
        carve: {
          ops: [
            ...filler.carve.ops,
            { t: 'slice', view: 'side', ax: 0, ay: deck, bx: 7, by: deck },
          ],
        },
      }
    }
  }
  return filler
}

/** seeded mid-tier filler car (uncapped; use generateCappedFiller for heats) */
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
