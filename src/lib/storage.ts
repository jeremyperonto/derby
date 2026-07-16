import { z } from 'zod'
import { carDesignSchema, type CarDesign } from '../model/carDesign'
import { applyMigrations } from '../model/migrations'

/**
 * The ONLY module that touches localStorage (CLAUDE.md rule 8).
 * Load: parse → migrate → salvage what validates (invalid cars are dropped
 * individually, not the whole doc) → on hard failure quarantine the blob
 * and start fresh. A kid's game must never crash on load.
 * Save: debounced, quota-safe, with an in-memory fallback (private mode).
 */

const KEY = 'derby:v1'
const SCHEMA_VERSION = 1
const SAVE_DEBOUNCE_MS = 1000

export interface SaveDoc {
  schemaVersion: typeof SCHEMA_VERSION
  activeCarId: string | null
  cars: CarDesign[]
  /** rivalId → beaten (gold if margin ≥ 2 lengths) */
  progress: { defeated: string[]; gold: string[]; unlocked: string[] }
  /** carId → best finish time (s) */
  bestTimes: Record<string, number>
  settings: { muted: boolean; narration: boolean }
}

const settingsSchema = z
  .object({
    muted: z.boolean().catch(false),
    narration: z.boolean().catch(false),
  })
  .catch({ muted: false, narration: false })

const progressSchema = z
  .object({
    defeated: z.array(z.string()).catch([]),
    gold: z.array(z.string()).catch([]),
    unlocked: z.array(z.string()).catch([]),
  })
  .catch({ defeated: [], gold: [], unlocked: [] })

function defaultDoc(): SaveDoc {
  return {
    schemaVersion: SCHEMA_VERSION,
    activeCarId: null,
    cars: [],
    progress: { defeated: [], gold: [], unlocked: [] },
    bestTimes: {},
    settings: { muted: false, narration: false },
  }
}

let memoryFallback: string | null = null

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memoryFallback
  } catch {
    return memoryFallback
  }
}

function writeRaw(value: string): void {
  memoryFallback = value
  try {
    localStorage.setItem(KEY, value)
  } catch {
    // quota / private mode — memory fallback keeps the session alive
  }
}

function quarantine(raw: string): void {
  try {
    localStorage.setItem(`derby:corrupt:${Date.now()}`, raw.slice(0, 100_000))
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

function parseDoc(raw: string): SaveDoc {
  const json = JSON.parse(raw) as { schemaVersion?: number }
  const migrated = applyMigrations(json, SCHEMA_VERSION) as Record<string, unknown>

  // salvage cars one by one — a single corrupt car must not nuke the garage
  const cars: CarDesign[] = []
  if (Array.isArray(migrated.cars)) {
    for (const candidate of migrated.cars) {
      const result = carDesignSchema.safeParse(candidate)
      if (result.success) cars.push(result.data)
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    activeCarId: typeof migrated.activeCarId === 'string' ? migrated.activeCarId : null,
    cars,
    progress: progressSchema.parse(migrated.progress),
    bestTimes: z.record(z.string(), z.number()).catch({}).parse(migrated.bestTimes),
    settings: settingsSchema.parse(migrated.settings),
  }
}

let doc: SaveDoc | null = null

export function getDoc(): SaveDoc {
  if (doc) return doc
  const raw = readRaw()
  if (!raw) {
    doc = defaultDoc()
    return doc
  }
  try {
    doc = parseDoc(raw)
  } catch {
    quarantine(raw)
    doc = defaultDoc()
  }
  return doc
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    if (doc) writeRaw(JSON.stringify(doc))
  }, SAVE_DEBOUNCE_MS)
}

export function mutateDoc(fn: (doc: SaveDoc) => void): void {
  fn(getDoc())
  scheduleSave()
}

/** flush pending writes immediately (call on pagehide) */
export function flush(): void {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (doc) writeRaw(JSON.stringify(doc))
}

// --- convenience helpers ---

export function upsertCar(design: CarDesign): void {
  mutateDoc((d) => {
    const i = d.cars.findIndex((c) => c.id === design.id)
    if (i >= 0) d.cars[i] = design
    else d.cars.push(design)
    d.activeCarId = design.id
  })
}

export function deleteCar(id: string): void {
  mutateDoc((d) => {
    d.cars = d.cars.filter((c) => c.id !== id)
    if (d.activeCarId === id) d.activeCarId = d.cars[0]?.id ?? null
    delete d.bestTimes[id]
  })
}

export function recordBestTime(carId: string, time: number): boolean {
  const d = getDoc()
  const prev = d.bestTimes[carId]
  if (prev !== undefined && prev <= time) return false
  mutateDoc((dd) => {
    dd.bestTimes[carId] = time
  })
  return true
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush)
}
