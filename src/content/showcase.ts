import { freshCarDesign, type CarDesign } from '../model/carDesign'
import { TEMPLATES } from './templates'

/**
 * Pre-built beauties that rotate on the title-screen turntable — a taste
 * of what a kid could make.
 */
const wedge = TEMPLATES.find((t) => t.id === 'wedge')!.ops
const speeder = TEMPLATES.find((t) => t.id === 'speeder')!.ops
const bathtub = TEMPLATES.find((t) => t.id === 'bathtub')!.ops

function show(partial: Partial<CarDesign>): CarDesign {
  return { ...freshCarDesign(`showcase-${partial.number}`, 0), ...partial }
}

export const SHOWCASE_CARS: CarDesign[] = [
  show({
    name: 'The Red Rocket',
    number: 7,
    carve: { ops: speeder },
    paint: { body: 'brickRed', wheels: 'ink' },
    decals: [{ slot: 'hood', decalId: 'flame' }],
    weights: [
      { slot: 6, kind: 'tungsten' },
      { slot: 5, kind: 'tungsten' },
    ],
    wheels: { raised: 'none', polish: 3, graphite: 3 },
  }),
  show({
    name: 'Midnight Streak',
    number: 12,
    carve: { ops: wedge },
    paint: { body: 'navy', wheels: 'brickRed' },
    decals: [{ slot: 'sideRear', decalId: 'stripes' }],
    weights: [{ slot: 6, kind: 'tungsten' }],
    wheels: { raised: 'none', polish: 2, graphite: 2 },
  }),
  show({
    name: 'Tub Thumper',
    number: 3,
    carve: { ops: bathtub },
    paint: { body: 'skyBlue', wheels: 'ink' },
    decals: [{ slot: 'sideFront', decalId: 'eyes' }],
    weights: [{ slot: 5, kind: 'tungsten' }],
    wheels: { raised: 'none', polish: 1, graphite: 1 },
  }),
  show({
    name: 'The Checker',
    number: 88,
    carve: { ops: wedge },
    paint: { body: 'mustard', wheels: 'navy' },
    decals: [
      { slot: 'hood', decalId: 'checker' },
      { slot: 'sideFront', decalId: 'bolt' },
    ],
    weights: [
      { slot: 6, kind: 'tungsten' },
      { slot: 7, kind: 'steel' },
    ],
    wheels: { raised: 'frontLeft', polish: 3, graphite: 3 },
  }),
  show({
    name: 'Clover Cruiser',
    number: 5,
    carve: { ops: speeder },
    paint: { body: 'forest', wheels: 'paper' },
    decals: [{ slot: 'roof', decalId: 'star' }],
    weights: [{ slot: 6, kind: 'steel' }],
    wheels: { raised: 'none', polish: 2, graphite: 3 },
  }),
]
