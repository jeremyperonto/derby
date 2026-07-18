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

Vite + React + TypeScript + react-three-fiber + drei. State: zustand. Save validation: zod. Camera damping: maath. Audio: Web Audio synth in `src/audio/audio.ts` — all SFX are generated oscillator/noise recipes, zero sound-asset files; iOS unlock on first pointer gesture. Fonts (fontsource, self-hosted): **Anton** (display), **Oswald** (labels), **Yellowtail** (script), Georgia (prose).
**Deliberately absent — do not add:** physics engines, CSG/mesh-boolean libraries, 2D clippers, routers, postprocessing, zustand/persist, zundo, howler (removed — audio is Web Audio synth), emoji (see design system rule below).

## Design system (see design.md §9 — this is a hard contract)

Vintage letterpress, from Jeremy's Dribbble refs. Jeremy has twice rejected drift (Alfa Slab / "Della's Doll Company" look; then Rye as "carnival"). Rules:
- Type: Anton display (`--font-display`), Oswald letterspaced uppercase caps for every label (`.lp-label` / `--font-label`), Yellowtail script accents (`--font-script`), Georgia prose for read-aloud/values (`--font-prose`).
- Controls: ink-on-paper double-rule plaques — `ui/Btn.tsx`, `ui/Fieldset.tsx` (`Fieldset`/`Seg`/`Plaque`). Squared corners, filled-ink active states. NO rounded candy corners, NO fat offset shadows.
- **No emoji anywhere** — in UI, content, or car art. All iconography is the stroke-SVG set in `ui/icons.tsx` (+ `LessonIcon`); ornaments (flags, rules, stars) in `ui/ornaments.tsx`; car stickers / number roundels / place medals are canvas-drawn vector art in `garage/carDecals.ts` (`decalTexture`, `numberTexture`, `medalTexture`, `stickerDataURL`, `medalDataURL`).

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
| `app/` | screen state machine (`screens.ts`) + `ScreenRouter.tsx` (no URL router), `TitleScreen`, `TitleShowcase` (rotating car turntable), `TuningPanel` (dev), `devHooks.ts` (URL hooks for verification — see below) |
| `state/` | zustand stores: `appStore`, `garageStore`, `raceStore`, `progressStore`, `settingsStore` |
| `model/` | `carDesign.ts` (types + zod), `migrations.ts`, `deriveSimParams.ts` |
| `carve/` | `buffers.ts`, `ops.ts` (slice/scoop/sand/round), `replay.ts` (undo), `loft.ts` (mesh), `measure.ts` (mass/CoM/area/Cd) |
| `sim/` | `track.ts` (slope table), `simulate.ts` (`runRace`, coasts past finish), `tuning.ts`, `rng.ts`, `feedback.ts` (counterfactuals) |
| `garage/` | garage screen (folder-tab stations), carve/weights/wheels/paint views, `CarWall` (+ `MiniProfile`), `CarBody.tsx` (shared with race/showcase; `surfacePatch` decal draping), `carDecals.ts` (vector textures), `GarageScene` |
| `race/` | race screen, `RivalSelectScreen` (divisions), `TrackScene` (+ finish lights), `RaceCars` (medals pop on cross), `CameraRig` (finish choreography), `trackGeometry.ts` |
| `results/` | `ResultsScreen` (spec sheet, medals per row, Pit Crew Notes), `WinnersCircle` (3D winner turntable) |
| `blueprint/` | `BlueprintScreen` (print view), `profilePath.ts` (buffers → mm-unit SVG) |
| `content/` | `rivals` (3 divisions × 3), `lessons`, `unlocks`, `decals`, `palette.ts`, `templates`, `showcase`, `testCars`, name generator |
| `ui/` | `Btn`, `Fieldset`/`Seg`/`Plaque`, `icons.tsx` (stroke SVGs + `LessonIcon`), `ornaments.tsx` (flags/rules/stars) |
| `audio/` | `audio.ts` (Web Audio synth SFX, iOS first-tap unlock), `narration.ts` (Web Speech, feature-detected) |
| `lib/` | `storage.ts`, `math.ts` (RDP, damp, catmull-rom) |

## Domain conventions

- **Units**: carve ops and buffers are in **inches**, block-local (x: 0–7, y: 0–1.25, z: ±0.875). The sim is **SI** (meters/kg/seconds); `deriveSimParams` does the conversion. Blueprint SVG uses **mm** user units for true print scale.
- Block: 7" × 1.75" × 1.25" (BSA kit). Weight cap: 5.0 oz, hard-blocked in UI. Min carved body thickness: 0.25".
- Sim timestep: fixed **dt = 1/240 s**, semi-implicit Euler. Finish times sub-tick interpolated.
- Buffers: 512 samples over x∈[0,7in]; `yTop` (side profile) and `halfWidth` (top profile, symmetric about centerline).
- Mesh: RDP-decimate buffers (~0.6 mm tol) → 24–48 stations → loft rounded-rect cross-sections (20 verts/ring) → flat normals. Rebuild whole geometry per op into a preallocated BufferGeometry.
- Stickers/number roundels are per-decal **draped patches** (`surfacePatch` in `CarBody.tsx`): a subdivided strip whose vertices follow the heightfield so art stays flush on scoops/slopes and never clips. Patches stay **square in world space** (both dims shrink together, never squash); side placements use a **level baseline** so circles stay circles, top placements drape the contour. Polygon-offset so they sit above the body.
- Blueprint is true 1:1 for the real cut: each SVG's `width` in mm MUST equal its viewBox width in units, or scale breaks. Print CSS (`index.css` @media print) stacks columns, whitens `.bp-line` fills, keeps black linework.
- Carve gestures: record the gesture BEFORE `setPointerCapture` (which can throw "no active pointer" on a first interaction and would otherwise kill the stroke). Capture is best-effort in a try/catch.

## Dev verification hooks (`app/devHooks.ts`, DEV only)

R3F/WebGL often won't initialize (or can't be screenshotted) in the automated Chrome extension on this Mac — verify 3D in a *real* browser window. URL params: `?screen=…`, `?carve=<template>`, `?race=<rivalId>`, `?report=<ms>` (POSTs race state), `?snap=name@ms,name2@ms` (POSTs canvas JPEGs to a local receiver on :5198). `window.__stores` exposes the zustand stores for console driving. Pattern: `open` a real browser window with a cache-buster nonce; a scratchpad `rcv.mjs` receiver saves the posts.

## Tuning workflow

The physics *feel* is the hardest part. Use the dev-only tuning panel (dev route, not in prod nav): sliders over every `tuning.ts` constant + live finish-time table for the canonical test cars. Target margins (car lengths on a ~3 s heat): weight ~4, placement ~2–3, friction ~2, aero ~1, seeded wobble ±0.3. After any retune, update the golden test snapshot deliberately — golden tests exist to make physics changes loud, not to forbid them.

## Progression & rivals

- 9 rivals in **3 divisions** (`content/rivals.ts`, `tier` 1/2/3 = Rookie/Challenger/Champion). Beat `winsToEnter` (2) racers in a division to unlock the next; any racer in an unlocked division is challengeable. Logic in `progressStore` (`isRivalAvailable`, `isDivisionUnlocked`, `defeatedInTier`).
- **"Winning" means winning the HEAT** (finishing 1st of 4), never a hidden 1v1 vs the rival — a kid watches all four cars. This holds because filler cars (lanes 3–4) are **capped below the rival**: `generateCappedFiller` degrades a repainted copy of the rival's own car until it's provably slower, so heat-winner ≡ rival-beaten.
- Every first victory grants an unlock (`rival.unlocks`, redeemed in `progressStore.recordWin`); unlocks/trophies/best-times persist in `storage.ts`.

## Testing

- **Golden sim tests**: fixed designs + fixed seed → exact finish times (6 decimals). Any refactor that shifts physics fails loudly.
- **Carve op tests**: slice/scoop/sand semantics, min-thickness floor, undo exactness (op-log replay ≡ original buffers), baked-op quantization.
- **Ordering invariants**: rear-CoM beats nose-CoM; 5 oz beats 3.5 oz; polished beats raw; wedge beats brick — these must hold under any retune.
- **Division/filler invariants**: every Rookie car slower than every Champion car; every capped filler slower than its heat rival across seeds; the boss is winnable by a mastery build.
- **Feedback engine**: counterfactual tips pick the right lesson; never suggest a >5 oz variant.
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
