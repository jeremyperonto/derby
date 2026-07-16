# CLAUDE.md — Derby Dash

Pinewood Derby simulator web game for a 6-year-old. Read `design.md` for the full game design; this file is the engineering contract.

## Commands

```bash
npm run dev        # Vite dev server
npm run build      # typecheck (tsc -b) + production build to dist/
npm run test       # vitest (sim golden tests, carve op tests, migrations)
npm run preview    # serve the production build locally
```

## Stack

Vite + React + TypeScript + react-three-fiber + drei. State: zustand. Save validation: zod. Camera damping: maath. Audio: Web Audio synth in `src/audio/audio.ts` — all SFX are generated oscillator/noise recipes, zero sound-asset files; iOS unlock on first pointer gesture.
**Deliberately absent — do not add:** physics engines, CSG/mesh-boolean libraries, 2D clippers, routers, postprocessing, zustand/persist, zundo.

## Architecture rules (load-bearing — do not violate)

1. **Purity boundary**: `src/sim/`, `src/carve/` (except `loft.ts` and `uv.ts`), and `src/model/` are pure TypeScript — **zero imports of React or three**. They must run headless under vitest.
2. **Determinism**: nothing in `src/sim/` may call `Math.random`, `Date.now`, or read globals. All randomness flows from the seeded RNG (`sim/rng.ts`, mulberry32) passed in explicitly. Races must replay bit-identically from `(designs, seed)`.
3. **The carve op log is the source of truth** for a car's shape — never persist buffers or meshes. Shape state = replay of `CarveOp[]` onto fresh buffers (`carve/replay.ts`, checkpoints every 10 ops). Undo = drop last op + replay. New tools = new op variants; never mutate existing op semantics (old saves must replay identically forever).
4. **Simulate-then-playback**: `runRace()` computes the entire heat (per-tick position arrays) before the race screen animates anything. The 3D scene is a replay, never a live sim.
5. **One pure mapping**: every garage choice affects physics only through `model/deriveSimParams.ts` (CarDesign → coefficients). Gameplay balance lives there and in `sim/tuning.ts` — nowhere else.
6. **All physics constants live in `sim/tuning.ts`** (including per-factor gain multipliers). Never inline a magic physics number elsewhere.
7. **Race-frame updates via refs only**: inside `useFrame`, read zustand with `store.getState()` and write to object refs. Zero React re-renders during a race.
8. **Saves never crash**: localStorage access goes through `lib/storage.ts` only — zod-parse, migrate via `model/migrations.ts`, quarantine corrupt blobs under `derby:corrupt:<ts>`, fall back to in-memory (Safari private mode). Bump `schemaVersion` + add a migration for any CarDesign/save change.

## Module map (`src/`)

| Dir | Contents |
|---|---|
| `app/` | screen state machine (`screens.ts`) + `ScreenRouter.tsx` — no URL router |
| `state/` | zustand stores: `garageStore`, `raceStore`, `progressStore`, `settingsStore` |
| `model/` | `carDesign.ts` (types + zod), `migrations.ts`, `deriveSimParams.ts` |
| `carve/` | `buffers.ts`, `ops.ts` (slice/scoop/sand/round), `replay.ts` (undo), `loft.ts` (mesh), `measure.ts` (mass/CoM/area/Cd), `uv.ts` (decal stamping) |
| `sim/` | `track.ts` (slope table), `simulate.ts` (`runRace`), `tuning.ts`, `rng.ts`, `feedback.ts` (counterfactuals) |
| `garage/` | garage screen, carve/weights/wheels/paint views, `CarBody.tsx` (shared with race) |
| `race/` | race screen, `TrackScene`, `RaceCars`, `CameraRig`, `PlaybackClock`, photo finish |
| `results/` | results screen, `PitCrewNotes` |
| `blueprint/` | print view, `profilePath.ts` (buffers → mm-unit SVG) |
| `content/` | rivals, lessons, unlocks, decals, `palette.ts`, name generator |
| `ui/` | retro-poster HTML components (buttons, panels, meters) |
| `audio/` | howler wrapper (iOS first-tap unlock), Web Speech narration (feature-detected) |
| `lib/` | `storage.ts`, `math.ts` (RDP, damp, catmull-rom) |

## Domain conventions

- **Units**: carve ops and buffers are in **inches**, block-local (x: 0–7, y: 0–1.25, z: ±0.875). The sim is **SI** (meters/kg/seconds); `deriveSimParams` does the conversion. Blueprint SVG uses **mm** user units for true print scale.
- Block: 7" × 1.75" × 1.25" (BSA kit). Weight cap: 5.0 oz, hard-blocked in UI. Min carved body thickness: 0.25".
- Sim timestep: fixed **dt = 1/240 s**, semi-implicit Euler. Finish times sub-tick interpolated.
- Buffers: 512 samples over x∈[0,7in]; `yTop` (side profile) and `halfWidth` (top profile, symmetric about centerline).
- Mesh: RDP-decimate buffers (~0.6 mm tol) → 24–48 stations → loft rounded-rect cross-sections (20 verts/ring) → flat normals. Rebuild whole geometry per op into a preallocated BufferGeometry.
- Paint/decals/number = one 1024×512 canvas texture per car, one draw call. UV seam along the bottom centerline.

## Tuning workflow

The physics *feel* is the hardest part. Use the dev-only tuning panel (dev route, not in prod nav): sliders over every `tuning.ts` constant + live finish-time table for the canonical test cars. Target margins (car lengths on a ~3 s heat): weight ~4, placement ~2–3, friction ~2, aero ~1, raised wheel ~0.3, seeded wobble ±0.3. After any retune, update the golden test snapshot deliberately — golden tests exist to make physics changes loud, not to forbid them.

## Testing

- **Golden sim tests**: fixed designs + fixed seed → exact finish times (6 decimals). Any refactor that shifts physics fails loudly.
- **Carve op tests**: slice/scoop/sand semantics, min-thickness floor, undo exactness (op-log replay ≡ original buffers), baked-op quantization.
- **Ordering invariants**: rear-CoM beats nose-CoM; 5 oz beats 3.5 oz; polished beats raw; wedge beats brick — these must hold under any retune.
- **Migration tests**: every historical save fixture parses and migrates.

## Performance budget (floor: iPad A10, 60 fps)

<60 k tris, <40 draw calls, **no shadow maps** (blob shadows), no postprocessing, dpr clamped [1, 1.75] with drei `PerformanceMonitor` step-down, `frameloop="demand"` in garage / always-on in race. One persistent `<Canvas>` for the whole app — never unmount it between screens.

## UX ground rules

- Touch-first: everything works with a fat finger on an iPad; no hover-dependent UI; pointer events (not mouse/touch pairs).
- Pre-reader-safe: icons + audio carry meaning; text is reinforcement. Destructive actions (reset, delete car) behind confirm or parent gate (3-second hold).
- Never punish: losses cost nothing, tips are warm, the kid's car is never called bad.

## Deploy

GitHub Pages project site under the user site's custom domain → `https://jeremyperonto.com/<repo>/`. Vite `base: '/<repo>/'` must match the repo name. Deploy via GitHub Actions (`.github/workflows/deploy.yml`, actions/deploy-pages). Static only — no backend, no env secrets.

## Roadmap notes (design for, don't build)

Public kid-safe leaderboard (Supabase) is planned: keep the sim deterministic (seeds recorded with results), keep `CarDesign` compact/serializable, never let UI depend on non-replayable state. Expert Garage (axle alignment) reserves the `wheels.alignment` field in v2.
