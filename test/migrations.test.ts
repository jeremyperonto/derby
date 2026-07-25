import { describe, expect, it } from 'vitest'
import { carDesignSchema, freshCarDesign } from '../src/model/carDesign'
import { applyMigrations } from '../src/model/migrations'

/**
 * Migration / save-compat coverage (CLAUDE.md rule 8): every historical save
 * fixture must keep parsing and migrating cleanly, and additive-optional
 * cosmetic fields must round-trip without a bump.
 */

/** a v1 car exactly as old saves stored it — note the dead `wheels.raised` field */
const v1Car = {
  schemaVersion: 1,
  id: 'old-timer',
  name: 'Old Timer',
  number: 7,
  createdAt: 0,
  updatedAt: 0,
  carve: { ops: [] },
  weights: [{ slot: 6, kind: 'tungsten' }],
  wheels: { polish: 3, graphite: 3, raised: 2 },
  paint: { body: 'brickRed', wheels: 'ink' },
  decals: [],
}

const v1Doc = {
  schemaVersion: 1,
  activeCarId: 'old-timer',
  cars: [v1Car],
  progress: { defeated: ['bobby'], gold: [], unlocked: ['paint-mustard'] },
  bestTimes: { 'old-timer': 3.21 },
  settings: { muted: false, narration: true },
}

describe('save migrations', () => {
  it('v1 → v2 strips the dead wheels.raised field', () => {
    const migrated = applyMigrations(structuredClone(v1Doc), 2) as { cars: { wheels: object }[] }
    expect('raised' in migrated.cars[0]!.wheels).toBe(false)
  })

  it('a migrated v1 car still validates against the current schema', () => {
    const migrated = applyMigrations(structuredClone(v1Doc), 2) as { cars: unknown[] }
    const result = carDesignSchema.safeParse(migrated.cars[0])
    expect(result.success).toBe(true)
  })

  it('treats a doc with no schemaVersion as v1 and migrates it', () => {
    const noVersion = { ...structuredClone(v1Doc), schemaVersion: undefined }
    const migrated = applyMigrations(noVersion, 2) as { cars: { wheels: object }[] }
    expect('raised' in migrated.cars[0]!.wheels).toBe(false)
  })

  it('is a no-op when the doc is already at the target version', () => {
    const v2 = { ...structuredClone(v1Doc), schemaVersion: 2 }
    const out = applyMigrations(v2, 2) as { cars: { wheels: object }[] }
    // still-present raised (no migration ran) proves nothing was applied
    expect('raised' in out.cars[0]!.wheels).toBe(true)
  })

  it('throws when no migration path exists (caller quarantines + resets)', () => {
    expect(() => applyMigrations({ schemaVersion: 0 }, 2)).toThrow()
  })
})

describe('accent is additive-optional (no migration needed)', () => {
  it('a car WITHOUT accent parses (backward compatible)', () => {
    const car = freshCarDesign('no-accent', 0)
    expect(carDesignSchema.safeParse(car).success).toBe(true)
    expect(car.paint.accent).toBeUndefined()
  })

  it('a car WITH accent round-trips through the schema', () => {
    const car = { ...freshCarDesign('with-accent', 0), paint: { body: 'navy', accent: 'mustard', wheels: 'ink' } }
    const result = carDesignSchema.safeParse(car)
    expect(result.success).toBe(true)
    expect(result.success && result.data.paint.accent).toBe('mustard')
  })
})
