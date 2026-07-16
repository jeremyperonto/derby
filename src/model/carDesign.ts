import { z } from 'zod'
import type { PaletteId } from '../content/palette'

/**
 * The CarDesign contract — every module hangs off this. The carve op log is
 * the source of truth for shape (never buffers/meshes; CLAUDE.md rule 3).
 * All carve coordinates are INCHES in block-local space:
 *   x: 0 (nose) → 7 (tail) · y: 0 (bottom) → 1.25 (top) · z: ±0.875
 */

// --- physical constants of the kit (real BSA dimensions) ---
export const BLOCK = { lengthIn: 7, widthIn: 1.75, heightIn: 1.25 } as const
export const MIN_THICKNESS_IN = 0.25 // tools refuse to carve thinner than this
export const MIN_HALF_WIDTH_IN = 0.2
export const MAX_WEIGHT_OZ = 5.0 // official derby limit, hard-blocked in UI
export const AXLE_X_IN = { front: 1.3, rear: 5.675 } as const // ≈ BSA slot spacing (4.375" apart)
export const N_SAMPLES = 512

/** Pre-drilled weight slots (x inches from nose, z inches from centerline). */
export interface WeightSlot {
  xIn: number
  zIn: number
}
export const WEIGHT_SLOTS: readonly WeightSlot[] = [
  // 7 along the bottom centerline
  { xIn: 0.75, zIn: 0 },
  { xIn: 1.7, zIn: 0 },
  { xIn: 2.65, zIn: 0 },
  { xIn: 3.6, zIn: 0 },
  { xIn: 4.55, zIn: 0 },
  { xIn: 5.5, zIn: 0 },
  { xIn: 6.45, zIn: 0 },
  // 2 rear-bumper slots
  { xIn: 6.8, zIn: -0.45 },
  { xIn: 6.8, zIn: 0.45 },
]

export const PLUG_OZ = { steel: 0.25, tungsten: 1.0 } as const

// --- carve operations ---
const point = z.tuple([z.number(), z.number()])

export const carveOpSchema = z.discriminatedUnion('t', [
  // one straight bandsaw cut: removes everything above (side) / outside (top) the line
  z.object({
    t: z.literal('slice'),
    view: z.enum(['side', 'top']),
    ax: z.number(),
    ay: z.number(),
    bx: z.number(),
    by: z.number(),
  }),
  // concave gouge following a finger stroke, disk radius r
  z.object({
    t: z.literal('scoop'),
    view: z.enum(['side', 'top']),
    stroke: z.array(point).min(1),
    r: z.number().positive(),
  }),
  // smoothing rub: knocks down high spots in the stroke neighborhood
  z.object({
    t: z.literal('sand'),
    view: z.enum(['side', 'top']),
    stroke: z.array(point).min(1),
    r: z.number().positive(),
  }),
  // global edge fillet (slider) — replaces any previous round op
  z.object({ t: z.literal('round'), r: z.number().min(0).max(0.5) }),
  // baked buffer snapshot (op-log compaction), quantized to 1/1000 inch
  z.object({
    t: z.literal('baked'),
    yTop: z.string(), // base64 Uint16Array, N_SAMPLES entries
    halfWidth: z.string(),
    edgeRadius: z.number().min(0).max(0.5),
  }),
])
export type CarveOp = z.infer<typeof carveOpSchema>

// --- the rest of the car ---
export const weightPlugSchema = z.object({
  slot: z.number().int().min(0).max(WEIGHT_SLOTS.length - 1),
  kind: z.enum(['steel', 'tungsten']),
})
export type WeightPlug = z.infer<typeof weightPlugSchema>

export const wheelSetupSchema = z.object({
  raised: z.enum(['none', 'frontLeft']),
  polish: z.number().int().min(0).max(3),
  graphite: z.number().int().min(0).max(3),
  // v2 "expert garage" reserves: alignment { steerDeg }
})
export type WheelSetup = z.infer<typeof wheelSetupSchema>

const paletteId = z.custom<PaletteId>((v) => typeof v === 'string')

export const decalPlacementSchema = z.object({
  decalId: z.string(),
  u: z.number().min(0).max(1),
  v: z.number().min(0).max(1),
  scale: z.number().positive(),
  rotationDeg: z.number(),
})
export type DecalPlacement = z.infer<typeof decalPlacementSchema>

export const carDesignSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  name: z.string().max(40),
  number: z.number().int().min(0).max(99),
  createdAt: z.number(),
  updatedAt: z.number(),
  carve: z.object({ ops: z.array(carveOpSchema).max(400) }),
  weights: z.array(weightPlugSchema).max(WEIGHT_SLOTS.length),
  wheels: wheelSetupSchema,
  paint: z.object({
    body: paletteId,
    accent: paletteId.optional(),
    wheels: paletteId,
  }),
  decals: z.array(decalPlacementSchema).max(8),
  thumbnail: z.string().optional(),
})
export type CarDesign = z.infer<typeof carDesignSchema>

/** A fresh, uncarved, unweighted car — the starting point in the garage. */
export function freshCarDesign(id: string, now: number): CarDesign {
  return {
    schemaVersion: 1,
    id,
    name: 'My Racer',
    number: 1,
    createdAt: now,
    updatedAt: now,
    carve: { ops: [] },
    weights: [],
    wheels: { raised: 'none', polish: 0, graphite: 0 },
    paint: { body: 'brickRed', wheels: 'ink' },
    decals: [],
  }
}

export function totalWeightOz(design: Pick<CarDesign, 'weights'>, bodyOz: number, hardwareOz: number): number {
  const plugsOz = design.weights.reduce((sum, p) => sum + PLUG_OZ[p.kind], 0)
  return bodyOz + hardwareOz + plugsOz
}
