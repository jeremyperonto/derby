/**
 * Save-document migration registry. When the save schema changes, bump
 * schemaVersion in storage.ts and add `n: (doc) => doc'` here mapping
 * version n → n+1. Every historical save fixture in test/ must keep
 * migrating cleanly (CLAUDE.md rule 8).
 */
export const MIGRATIONS: Record<number, (doc: unknown) => unknown> = {
  // v1 → v2: the "raised wheel" setup was removed (it modeled a benefit the
  // 1-D sim couldn't fairly price — a corner wheel lifted off-center just
  // shifts weight and steers). Strip the dead `wheels.raised` field so old
  // saves keep loading cleanly.
  1: (doc) => {
    const d = doc as { cars?: { wheels?: Record<string, unknown> }[] }
    for (const car of d.cars ?? []) {
      if (car.wheels && 'raised' in car.wheels) delete car.wheels.raised
    }
    return doc
  },
}

export function applyMigrations(doc: { schemaVersion?: number }, targetVersion: number): unknown {
  let current: unknown = doc
  let version = doc.schemaVersion ?? 1
  while (version < targetVersion) {
    const migrate = MIGRATIONS[version]
    if (!migrate) throw new Error(`no migration from save schema v${version}`)
    current = migrate(current)
    version++
  }
  return current
}
