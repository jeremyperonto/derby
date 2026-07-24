import { freshCarDesign, type CarDesign } from '../model/carDesign'
import { TEMPLATES } from './templates'

/**
 * Pre-built beauties that rotate on the title-screen turntable — a taste
 * of what a kid could make.
 */
const wedge = TEMPLATES.find((t) => t.id === 'wedge')!.ops
const speeder = TEMPLATES.find((t) => t.id === 'speeder')!.ops
const bathtub = TEMPLATES.find((t) => t.id === 'bathtub')!.ops
const lowboy = TEMPLATES.find((t) => t.id === 'lowboy')!.ops
const fastback = TEMPLATES.find((t) => t.id === 'fastback')!.ops

function show(partial: Partial<CarDesign>): CarDesign {
  return { ...freshCarDesign(`showcase-${partial.number}`, 0), ...partial }
}

// Eight distinct beauties — every one a unique body color across a spread of
// five silhouettes, with its own sticker + slot, so any shuffled window on the
// turntable reads as varied (see TitleShowcase's shuffle + silhouette spread).
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
    wheels: { polish: 3, graphite: 3 },
  }),
  show({
    name: 'Midnight Streak',
    number: 12,
    carve: { ops: wedge },
    paint: { body: 'navy', wheels: 'mustard' },
    decals: [{ slot: 'sideRear', decalId: 'stripes' }],
    weights: [{ slot: 6, kind: 'tungsten' }],
    wheels: { polish: 2, graphite: 2 },
  }),
  show({
    name: 'Tub Thumper',
    number: 3,
    carve: { ops: bathtub },
    paint: { body: 'skyBlue', wheels: 'ink' },
    decals: [{ slot: 'sideFront', decalId: 'eyes' }],
    weights: [{ slot: 5, kind: 'tungsten' }],
    wheels: { polish: 1, graphite: 1 },
  }),
  show({
    name: 'The Checker',
    number: 88,
    carve: { ops: fastback },
    paint: { body: 'mustard', wheels: 'navy' },
    decals: [
      { slot: 'hood', decalId: 'checker' },
      { slot: 'sideFront', decalId: 'bolt' },
    ],
    weights: [
      { slot: 6, kind: 'tungsten' },
      { slot: 7, kind: 'steel' },
    ],
    wheels: { polish: 3, graphite: 3 },
  }),
  show({
    name: 'Clover Cruiser',
    number: 5,
    carve: { ops: lowboy },
    paint: { body: 'forest', wheels: 'paper' },
    decals: [{ slot: 'roof', decalId: 'clover' }],
    weights: [{ slot: 6, kind: 'steel' }],
    wheels: { polish: 2, graphite: 3 },
  }),
  show({
    name: 'Orange Crush',
    number: 21,
    carve: { ops: wedge },
    paint: { body: 'orange', wheels: 'ink' },
    decals: [{ slot: 'sideRear', decalId: 'arrow' }],
    weights: [
      { slot: 6, kind: 'tungsten' },
      { slot: 7, kind: 'steel' },
    ],
    wheels: { polish: 2, graphite: 2 },
  }),
  show({
    name: 'Sky Dart',
    number: 9,
    carve: { ops: speeder },
    paint: { body: 'paper', wheels: 'brickRed' },
    decals: [{ slot: 'sideFront', decalId: 'wings' }],
    weights: [{ slot: 6, kind: 'tungsten' }],
    wheels: { polish: 3, graphite: 2 },
  }),
  show({
    name: 'Ink Bandit',
    number: 44,
    carve: { ops: fastback },
    paint: { body: 'ink', wheels: 'mustard' },
    decals: [{ slot: 'roof', decalId: 'crown' }],
    weights: [
      { slot: 6, kind: 'tungsten' },
      { slot: 5, kind: 'tungsten' },
    ],
    wheels: { polish: 3, graphite: 3 },
  }),
]
