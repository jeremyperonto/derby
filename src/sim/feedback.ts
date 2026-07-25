import type { LessonId } from '../content/lessons'
import {
  MAX_WEIGHT_OZ,
  PLUG_OZ,
  type CarDesign,
  type CarveOp,
  type WeightPlug,
} from '../model/carDesign'
import { deriveSimParams, type CarSimParams } from '../model/deriveSimParams'
import { runRace } from './simulate'
import type { Track } from './track'
import { CAR_LENGTH_M, TUNING, type Tuning } from './tuning'

/**
 * The counterfactual feedback engine (design.md §6.4): after a loss, re-run
 * the race with improved variants of the PLAYER'S OWN car — same rivals,
 * same seed — rank by time gained, and surface the single best tip. The tip
 * is always true, always specific, always one thing. Sub-millisecond per
 * variant; this is the game's soul, do not cut it.
 */

export interface FeedbackTip {
  lesson: LessonId
  /** seconds gained by the variant */
  gainS: number
  /** margin in car lengths the variant would have finished ahead of the actual car */
  gainLengths: number
  /** would the variant have beaten the target rival? */
  wouldBeatRival: boolean
  /** car lengths the variant would have finished ahead of the RIVAL (the true winning margin) */
  marginOverRival: number
}

interface Variant {
  lesson: LessonId
  build: (design: CarDesign) => CarDesign | null // null = not applicable
}

// rearmost first BY TRUE X: 7,8 are the rear-bumper slots (x=6.8), then 6 (6.45)…
// so "move the weights back" actually reaches the furthest-back holes.
const REAR_SLOTS = [7, 8, 6, 5, 4]

/** a plain wedge — the counterfactual for a still-uncarved block */
const WEDGE_OPS: CarveOp[] = [
  { t: 'slice', view: 'side', ax: 0, ay: 0.3, bx: 7, by: 1.2 },
  { t: 'round', r: 0.12 },
]
/** an aggressively sleek body — low deck + slim nose — the real aero win */
const SLEEK_OPS: CarveOp[] = [
  { t: 'slice', view: 'side', ax: 0, ay: 0.28, bx: 7, by: 0.62 },
  { t: 'slice', view: 'top', ax: 0, ay: 0.48, bx: 7, by: 0.875 },
  { t: 'round', r: 0.12 },
]

/** move every existing plug to the rearmost open slots */
function moveWeightsBack(design: CarDesign): CarDesign | null {
  if (!design.weights.length) return null
  const moved: WeightPlug[] = design.weights.map((plug, i) => ({
    kind: plug.kind,
    slot: REAR_SLOTS[Math.min(i, REAR_SLOTS.length - 1)]!,
  }))
  const changed = moved.some((p, i) => p.slot !== design.weights[i]!.slot)
  return changed ? { ...design, weights: moved } : null
}

/** top up with rear plugs until the 5 oz scale just says yes */
function topUpWeight(design: CarDesign, totalOz: number): CarDesign | null {
  if (totalOz >= MAX_WEIGHT_OZ - PLUG_OZ.steel) return null
  const weights = [...design.weights]
  let oz = totalOz
  for (const slot of REAR_SLOTS) {
    if (weights.some((w) => w.slot === slot)) continue
    while (oz + PLUG_OZ.tungsten <= MAX_WEIGHT_OZ && !weights.some((w) => w.slot === slot)) {
      weights.push({ slot, kind: 'tungsten' })
      oz += PLUG_OZ.tungsten
    }
    if (oz + PLUG_OZ.steel <= MAX_WEIGHT_OZ && !weights.some((w) => w.slot === slot)) {
      weights.push({ slot, kind: 'steel' })
      oz += PLUG_OZ.steel
    }
  }
  return weights.length > design.weights.length ? { ...design, weights } : null
}

const VARIANTS: Variant[] = [
  {
    lesson: 'placement',
    build: moveWeightsBack,
  },
  {
    lesson: 'weight',
    build: (design) => topUpWeight(design, deriveSimParams(design).totalOz),
  },
  {
    lesson: 'friction',
    build: (design) =>
      design.wheels.polish >= 3 && design.wheels.graphite >= 3
        ? null
        : { ...design, wheels: { ...design.wheels, polish: 3, graphite: 3 } },
  },
  {
    // a still-uncarved block: teach carving it into a car at all
    lesson: 'carve',
    build: (design) =>
      design.carve.ops.length === 0 ? { ...design, carve: { ops: [...WEDGE_OPS] } } : null,
  },
  {
    // already carved but not sleek: teach an aggressively lower, slimmer body
    lesson: 'aero',
    build: (design) =>
      design.carve.ops.length === 0
        ? null
        : { ...design, carve: { ops: [...design.carve.ops, ...SLEEK_OPS] } },
  },
]

/**
 * Rank counterfactuals for a lost race. `laneParams` are the actual heat's
 * cars; the player's lane is re-derived per variant; same seed = same wobble.
 */
export function bestTips(
  playerDesign: CarDesign,
  laneParams: CarSimParams[],
  playerLane: number,
  rivalLane: number,
  seed: number,
  t: Tuning = TUNING,
  track?: Track,
): FeedbackTip[] {
  const actual = runRace(laneParams, seed, t, track)
  const actualTime = actual.lanes[playerLane]!.finishTime
  const rivalTime = actual.lanes[rivalLane]!.finishTime
  const speed = actual.lanes[playerLane]!.finishSpeed || 4.5

  const tips: FeedbackTip[] = []
  for (const variant of VARIANTS) {
    const varied = variant.build(playerDesign)
    if (!varied) continue
    const derived = deriveSimParams(varied, t)
    if (derived.overweight) continue
    const params = laneParams.map((p, lane) => (lane === playerLane ? derived.params : p))
    const race = runRace(params, seed, t, track)
    const newTime = race.lanes[playerLane]!.finishTime
    const gainS = actualTime - newTime
    if (gainS <= 0.001) continue
    const gainLengths = (gainS * speed) / CAR_LENGTH_M
    const wouldBeatRival = newTime < rivalTime
    // drop noise-level tips that don't even flip the result — a "would've won
    // by a nose" that wouldn't have won breaks the "always true" promise
    if (gainLengths < 0.25 && !wouldBeatRival) continue
    tips.push({
      lesson: variant.lesson,
      gainS,
      gainLengths,
      wouldBeatRival,
      marginOverRival: ((rivalTime - newTime) * speed) / CAR_LENGTH_M,
    })
  }

  // prefer tips that would actually flip the result, then by raw gain
  tips.sort((a, b) =>
    a.wouldBeatRival !== b.wouldBeatRival
      ? Number(b.wouldBeatRival) - Number(a.wouldBeatRival)
      : b.gainS - a.gainS,
  )
  return tips
}

/** kid-facing margin phrase: "half a car", "2 whole cars" */
export function lengthsPhrase(lengths: number): string {
  if (lengths < 0.35) return 'a nose'
  if (lengths < 0.75) return 'half a car'
  if (lengths < 1.5) return 'a whole car'
  return `${Math.round(lengths)} whole cars`
}
