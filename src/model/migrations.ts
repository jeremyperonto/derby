/**
 * Save-document migration registry. When the save schema changes, bump
 * schemaVersion in storage.ts and add `n: (doc) => doc'` here mapping
 * version n → n+1. Every historical save fixture in test/ must keep
 * migrating cleanly (CLAUDE.md rule 8).
 */
export const MIGRATIONS: Record<number, (doc: unknown) => unknown> = {
  // none yet — v1 is the first released schema
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
