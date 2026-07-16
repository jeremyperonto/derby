import { freshCarDesign, type CarDesign, type WeightPlug } from '../model/carDesign'
import { TEMPLATES } from './templates'

/**
 * Canonical cars used by the tuning panel and the golden/invariant tests.
 * Each isolates one physics factor against `wedgeRacer` (the reference car:
 * wedge body, ~5 oz rear weight, full prep).
 */

const wedgeOps = TEMPLATES.find((t) => t.id === 'wedge')!.ops

function car(
  id: string,
  name: string,
  mods: Partial<Pick<CarDesign, 'carve' | 'weights' | 'wheels'>>,
): CarDesign {
  return {
    ...freshCarDesign(id, 0),
    name,
    ...mods,
  }
}

/** rear-loaded plugs: 2 tungsten in the rearmost centerline slots + bumpers */
const REAR_PLUGS: WeightPlug[] = [
  { slot: 6, kind: 'tungsten' }, // x=6.45
  { slot: 5, kind: 'tungsten' }, // x=5.5
  { slot: 7, kind: 'steel' }, // rear bumper
  { slot: 8, kind: 'steel' }, // rear bumper
]

/** same total mass, jammed in the nose */
const NOSE_PLUGS: WeightPlug[] = [
  { slot: 0, kind: 'tungsten' }, // x=0.75
  { slot: 1, kind: 'tungsten' }, // x=1.7
  { slot: 2, kind: 'steel' },
  { slot: 2, kind: 'steel' }, // doubled slot is fine for test purposes
]

const FULL_PREP = { raised: 'none', polish: 3, graphite: 3 } as const

export const TEST_CARS: Record<string, CarDesign> = {
  /** the reference: wedge, rear-weighted toward 5 oz, full prep */
  wedgeRacer: car('t-wedge', 'Wedge Racer', {
    carve: { ops: wedgeOps },
    weights: REAR_PLUGS,
    wheels: { ...FULL_PREP },
  }),

  /** raw block, no weights, no prep — Brick Bobby's car */
  brick: car('t-brick', 'Raw Brick', {}),

  /** weight factor: same wedge/prep, no plugs (~2.4 oz total) */
  featherWedge: car('t-feather', 'Feather Wedge', {
    carve: { ops: wedgeOps },
    weights: [],
    wheels: { ...FULL_PREP },
  }),

  /** placement factor: same mass as wedgeRacer, plugs in the nose */
  noseWedge: car('t-nose', 'Nose-Heavy Wedge', {
    carve: { ops: wedgeOps },
    weights: NOSE_PLUGS,
    wheels: { ...FULL_PREP },
  }),

  /** friction factor: no polish, no graphite */
  squeakyWedge: car('t-squeaky', 'Squeaky Wedge', {
    carve: { ops: wedgeOps },
    weights: REAR_PLUGS,
    wheels: { raised: 'none', polish: 0, graphite: 0 },
  }),

  /** aero factor: uncarved brick but same weights/prep as the reference */
  brickRacer: car('t-brickracer', 'Weighted Brick', {
    weights: REAR_PLUGS,
    wheels: { ...FULL_PREP },
  }),

  /** wheel-setup factor: reference + raised front wheel */
  triWheel: car('t-triwheel', 'Tri-Wheel', {
    carve: { ops: wedgeOps },
    weights: REAR_PLUGS,
    wheels: { ...FULL_PREP, raised: 'frontLeft' },
  }),
}
