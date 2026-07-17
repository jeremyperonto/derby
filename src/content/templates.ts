import type { CarveOp } from '../model/carDesign'

/**
 * One-tap starter shapes — each is just a pre-recorded carve op list, so a
 * template car can be re-carved freely afterwards. Coordinates in inches,
 * x = 0 at the nose.
 */
export interface Template {
  id: string
  name: string
  ops: CarveOp[]
}

export const TEMPLATES: Template[] = [
  {
    id: 'wedge',
    name: 'Wedge',
    ops: [
      { t: 'slice', view: 'side', ax: 0, ay: 0.3, bx: 7, by: 1.2 },
      { t: 'round', r: 0.12 },
    ],
  },
  {
    id: 'speeder',
    name: 'Speeder',
    ops: [
      // low sleek nose rising to a mid deck…
      { t: 'slice', view: 'side', ax: 0, ay: 0.28, bx: 3.4, by: 0.75 },
      { t: 'slice', view: 'side', ax: 3.4, ay: 0.75, bx: 7, by: 0.75 },
      // …with a scooped cockpit ahead of a tail fin
      {
        t: 'scoop',
        view: 'side',
        stroke: [
          [4.1, 1.05],
          [4.5, 1.0],
          [4.9, 1.05],
        ],
        r: 0.55,
      },
      // slimmed waist in top view
      { t: 'slice', view: 'top', ax: 0, ay: 0.55, bx: 7, by: 0.875 },
      { t: 'round', r: 0.2 },
    ],
  },
  {
    id: 'bathtub',
    name: 'Bathtub',
    ops: [
      // keep high walls, hollow out the middle like a classic bathtub racer
      {
        t: 'scoop',
        view: 'side',
        stroke: [
          [2.2, 1.65],
          [3.0, 1.55],
          [3.8, 1.55],
          [4.6, 1.65],
        ],
        r: 0.75,
      },
      { t: 'slice', view: 'side', ax: 0, ay: 0.55, bx: 1.6, by: 1.1 },
      { t: 'round', r: 0.15 },
    ],
  },
]
