# Derby Dash — Game Design Document

*A Pinewood Derby simulator that teaches a six-year-old real racing physics — then hands you the blueprint to build the car for real.*

---

## 1. Vision

Derby Dash is a web game where a kid carves a virtual block of pine into a race car, decorates it, and races it down a 3D derby track against a cast of rival cars. Every choice in the garage — where the weights go, how polished the axles are, how the body is shaped — changes how the car performs, using the same physics that govern a real Pinewood Derby. When the kid builds a car they love, the game prints a true-to-scale shop blueprint so parent and kid can build it together in the real world.

**Design pillars:**

1. **The physics is real.** No fake stats. Rivals lose for the same reasons real derby cars lose. If the game says rear weight is faster, it's because the simulation — modeled on real derby dynamics — makes it faster.
2. **Losing is the lesson.** Every loss comes with one concrete, kid-sized tip derived from actually re-simulating the race with a better version of their car ("Moving your weights back would have won by half a car!").
3. **His car, not a menu choice.** The kid carves, paints, names, and numbers the car. Creative ownership is the emotional engine.
4. **Screen to workbench.** The blueprint export makes the game a rehearsal for a real build, not a substitute for one.
5. **Playable by a pre-reader.** Icons, audio, and big touch targets carry the game; text is garnish. A parent nearby makes it richer but isn't required to play.

**Player:** primarily one six-year-old race car fan (touch-first, iPad or desktop), with a parent as co-pilot. Secondary: any kid 5–10, and the grown-ups who wander past and can't resist one heat.

---

## 2. Core loop

```
GARAGE ──build/carve/decorate──▶ RACE (4 lanes, you vs 3) ──▶ RESULTS
   ▲                                                            │
   └────────── physics tip + unlocks + trophies ◀───────────────┘
```

- **Garage**: carve the block, add weights, prep wheels, paint and decorate.
- **Race**: pick a rival from the ladder (or rematch), watch the heat play out in 3D.
- **Results**: finish times, trophy or a "so close!" — and one physics tip if you lost, tied to what would have actually helped most.
- Wins climb the rivals ladder and unlock cosmetics. Losses cost nothing; retry is always free and instant.

A full loop takes under two minutes — tuned for a six-year-old's iteration appetite.

---

## 3. The Garage

The garage has five stations, arranged as big tap targets styled like a vintage tool wall. The car is always visible; every station edits the same car live.

### 3.1 Carve station

The kid starts with a **block of pine at real BSA kit dimensions: 7" long × 1.75" wide × 1.25" tall**, shown in side view or top view (toggle), with a live 3D preview.

**Tools** (all drag gestures, chunky cursors, satisfying sounds):

| Tool | Gesture | What it does |
|---|---|---|
| 🔪 **Slice** | drag a straight line | Removes everything above the line (side) / outside the line (top) — one clean bandsaw cut |
| 🥄 **Scoop** | drag a curve | Carves a concave groove following the finger, like a gouge |
| 🧽 **Sand** | rub back and forth | Smooths and rounds — knocks down high spots, fillets corners |
| ⭕ **Round edges** | slider | Rounds the four long edges of the body (also an aero factor) |

**Guardrails:** a giant always-visible UNDO button (exact, unlimited); the tools refuse to carve thinner than a minimum body thickness (0.25") so the car can never be destroyed; "Fresh block" reset behind a confirm. **Starter templates** (Wedge, Speeder, Bathtub) give a good-looking base in one tap for kids who want to skip to decorating — each is just a pre-recorded set of carve ops, so it can be re-carved freely.

Carving is symmetric about the centerline (carve one side of the top view, both sides change) — like folding paper to cut a heart. This keeps cars looking right, keeps the balance point on the centerline, and keeps the blueprint honest.

### 3.2 Weights station

Underside view of the car with **~9 pre-drilled weight slots** (7 along the centerline + 2 rear bumper slots). Tap a slot to drop in a plug:

- **Steel plug** (grey) = 0.25 oz
- **Tungsten plug** (silver) = 1.0 oz

Two live meters teach the two weight lessons:

- **The Official Scale** — a big vintage analog needle sweeping toward the **5.0 oz limit** (red zone). Overweight is simply blocked: the plug bounces out with a "too heavy for the official scale!" honk. (Real derby rule, real number.)
- **The Balance Bubble** — a marker riding along the car's side silhouette showing the balance point (center of mass), with a green target zone about 1–1.5" ahead of the rear axle. Kid-language: *"Put the heavy stuff in the back — the bubble shows where your car balances."*

### 3.3 Wheels station

Three big controls, each with a 0–3 level shown as icons:

- 🪵→✨ **Axle polish** (sandpaper grits, in fiction: "shine up the nails")
- 🌫️ **Graphite puffs** (the classic derby lube — puff animation + satisfying *pff* sound)
- 🎈 **Raised wheel** toggle — lift one front wheel so only three touch ("three shoes rub less than four!")

*(v2 "Expert Garage": axle alignment / rail-riding.)*

### 3.4 Paint & decals station

- **Paint**: body color, accent color, wheel color from the vintage palette (§9). More colors unlock via the rivals ladder.
- **Decals**: flames, lightning bolts, stars, checkers, pinstripes, eyes — drag onto the car in 3D, stamp where touched (max 8).
- **Racing number**: big two-digit number on the side, kid picks 0–99.
- **Name**: every car gets a name (type it, or tap the name-generator dice: "The Red Rocket", "Thunder Pickle"…).

### 3.5 Car wall

Saved cars hang on a garage wall (thumbnails). Build as many as you want; pick any to race. Best time and trophies shown per car.

---

## 4. The Race

### 4.1 Track & presentation

A regulation-style **42-foot, 4-lane derby track**: starting gate at the top of a ~4-foot ramp, curved transition, long flat run to a finish gantry with lane lights. Setting: a cheerful low-poly gymnasium/county-fair world — bunting, checkered flags, a crowd of simple shapes, sunburst backdrop — all tinted in the vintage palette.

### 4.2 The heat

Four cars per heat: **the player's car + the chosen rival + 2 filler cars** generated from the race seed (so heats feel like a real event and the rival isn't always the only competition).

**Camera choreography** (the race is pre-simulated, so the camera always knows the story):

1. **Gate ceremony** (~1.5 s): hero shot up the ramp, cars trembling against the pin, flag drop, *clack*.
2. **Follow cam**: floats above/behind the pack at ~45°, biased toward the player's car, banking naturally down the ramp and through the transition.
3. **Finish approach**: dollies to a trackside side-on view at the line.
4. **Photo finish**: when the margin is close, time eases into slow motion over the last stretch, freezes at the line with a white flash, and shows a film-strip frame with nose order and the margin in car lengths. Instant replay button.

Races run at real derby speed (~3 seconds gate to line — genuinely how fast these cars are, and great pacing for a kid). The drama comes from the choreography, not stretched time.

### 4.3 Results

- Finish times to the thousandth (derby tradition), lane order, margin in "car lengths".
- **Win**: trophy moment, confetti, any unlock presented like a prize ("New paint: Mustard Gold!").
- **Loss**: warm, zero-shame ("So close! Pit crew has an idea…") + the **top counterfactual tip** (§6.4).
- Buttons: Rematch (same rival, new seed) · Back to Garage · Next Rival.

---

## 5. Rivals ladder & progression

Six authored rivals, each a real car design run through the real simulation — each one *loses* to exactly the lesson it teaches:

| # | Rival | Their car | The lesson |
|---|---|---|---|
| 1 | **Brick Bobby** | A raw uncarved block, no weights | Carve it! Weigh it! (onboarding rival — almost anything beats him) |
| 2 | **Featherweight Flo** | Sleek shape but only 3 oz | **Weight**: heavier (up to the 5 oz limit) is faster |
| 3 | **Nose-Heavy Ned** | 5 oz, all in the nose | **Weight placement**: heavy in the back wins |
| 4 | **Squeaky Pete** | Good car, zero polish, zero graphite | **Friction**: smooth and slippery wins |
| 5 | **Barn-Door Barb** | Heavy and rear-weighted but tall and blunt | **Aerodynamics**: slice through the air |
| 6 | **Lightning Lena** | Near-optimal everything | The boss: needs every lesson + the raised wheel |

- Each rival has a poster-style portrait card, a tagline, and an intro that hints at their flaw ("Ned says the front is the fast part. Is he right?").
- **Beating a rival** earns a trophy and unlocks cosmetics (paints, decals, wheel colors). Rivals stay available for rematches; silver→gold trophies for winning by a bigger margin.
- **Losing** always routes through the feedback engine — the ladder is beatable *only* by applying the lessons, which is the curriculum working.
- Filler cars are seeded mid-tier randoms with generated names ("Gary's Comet", "The Waffle Wagon").

---

## 6. The physics (and how it's taught)

### 6.1 The four factors — kid version

| Factor | Kid explanation | Icon |
|---|---|---|
| **Weight & placement** | "Heavy cars push harder down the hill. Heavy **in the back** rides the hill longer — like scooting back on a slide." | ⚖️🔙 |
| **Friction** | "Rough and squeaky rubs the speed away. Smooth and slippery keeps it." | ✨ |
| **Aerodynamics** | "The air is in the way! Pointy cars sneak through; brick cars push it." | 🌬️ |
| **Wheel setup** | "Three shoes rub less than four — lift one wheel and lose less speed." | 🎈 |

### 6.2 The actual model

A custom deterministic 1D simulation along the track path (no physics engine). For each car, integrated at a fixed 1/240 s timestep:

```
m_eff · dv/dt =   m·g·(slope at the CENTER OF MASS)          ← gravity term
                − (μ_axle·(r_axle/r_wheel) + μ_roll)·m·g·cosφ ← friction term
                − ½·ρ·Cd·A·v²                                  ← air drag
m_eff = m + (spinning wheels)·I_wheel/r_wheel²                 ← wheels steal energy to spin
```

The crucial detail: **gravity is evaluated where the center of mass is on the track curve**, not at the nose. A rear-weighted car starts its mass higher and keeps it on the slope longer through the ramp-to-flat transition — so it extracts more potential energy and releases it later. That single geometric fact reproduces the real rear-weight advantage (slightly slower off the gate, pulling ahead at the bottom) with no hacks, and it's exactly the story the post-race feedback tells.

Garage choices map to physical coefficients via one pure function (`deriveSimParams`): carved shape → mass, center of mass, frontal area, drag coefficient (bluntness penalty, tail-taper and rounded-edge credits); wheel prep → axle friction; raised wheel → one less spinning wheel. Track: 24° ramp, circular transition, flat run; ~1.19 m start height; finish ≈ 2.9–3.1 s — matching real aluminum-track times.

### 6.3 Tuning targets

All constants live in one tuning file with per-factor gain multipliers, adjusted so every factor is *noticeable* but weight dominates (as in reality). Target win margins on a ~3 s heat, in car lengths:

| Factor (worst → best) | Margin |
|---|---|
| Total weight (3.5 → 5 oz) | ~4 lengths |
| Weight placement (nose → rear) | ~2–3 lengths |
| Friction prep (0/0 → 3/3) | ~2 lengths |
| Aerodynamics (brick → wedge) | ~1 length (gain boosted ~2–3× reality so kids can feel it) |
| Raised wheel | ~0.3 lengths |
| Per-race wobble (seeded) | ±0.3 lengths — keeps rematches alive |

### 6.4 The feedback engine (the game's soul)

After a loss, the game silently re-runs the race with 3–4 modified versions of the player's car — weights moved to the rear zone, wheel prep maxed, body slimmed a drag band, weight topped up to 5 oz — ranks the time gained, and surfaces the single best tip, concretely: *"Try moving your weights back — that alone would've won by half a car!"* Because the sim runs in under a millisecond, this costs nothing. The tip is always true, always specific, always one thing.

### 6.5 Pit Crew Notes (the parent layer)

Each lesson has an optional **Pit Crew Notes** panel — a short script written for a grown-up to read aloud and discuss, one level deeper than the kid line (potential vs. kinetic energy, why the transition matters, what graphite actually does), plus a "try this at home" seed (balance a real toy car on a finger to find its center of mass). Surfaced on rival intro cards, a "?" in the garage, and results. Optional **voice narration** (Web Speech) reads kid-facing lines aloud for solo play.

---

## 7. Blueprint export

When a car is worth building for real, one tap produces a **print-ready shop blueprint** (browser print → paper):

- **1:1-scale side profile and top profile** of the carved body with dimension callouts (overall length/height, axle positions per BSA spec) — tape it to a real block and cut.
- **Weight plan**: hole positions with ounces per hole and the target balance point marked ("your real car should balance here").
- **Wheel prep checklist**: polish steps, graphite, which wheel to raise.
- **Paint scheme**: swatches with palette names, decal thumbnails and placement, the car's name and number in the big display face.
- **Calibration ruler**: a printed bar that must measure exactly 1 inch, with "print at 100%" instructions.

On screen it's styled as a vintage kraft-paper blueprint; in print it swaps to clean toner-friendly linework. Letter landscape, fits a 7" car at true scale.

---

## 8. Screens map

```
TITLE ──▶ GARAGE ◀──────────────┐
            │  (5 stations + car wall)
            ├─▶ RIVAL SELECT (ladder poster wall)
            │        └─▶ RACE ──▶ RESULTS ──▶ (rematch / garage / next rival)
            ├─▶ BLUEPRINT (print view)
            └─▶ SETTINGS (mute, narration, reset — behind a parent gate: "hold 3 seconds")
DEV: /tuning panel (dev-only route — sliders over all physics constants, live finish-time table)
```

No URL router — a screen state machine (also avoids GitHub Pages SPA-refresh 404s).

---

## 9. Art direction

**Theme: vintage county-fair derby poster.** Sourced from five reference posters (Bow Market Pine-Car Derby, Soda Springs, Knotty Pine Derby, Wood & Thumb, Big Sky): limited warm inks on aged paper, hand-made charm, mid-century race energy.

### Palette

| Name | Hex | Use |
|---|---|---|
| Paper Cream | `#F5EBD8` | backgrounds, light text |
| Kraft | `#C9A876` | blueprint paper, panels |
| Ink Black | `#211D16` | outlines, dark text |
| Navy Ink | `#27335A` | secondary ink, sky-dark accents |
| Brick Red | `#BF3B2B` | primary accent, CTAs, player color |
| Mustard Gold | `#D9A03F` | trophies, highlights, sunbursts |
| Sky Blue | `#A9D3E0` | sky, cool panels |
| Hot-Rod Orange | `#DD7A33` | flames, energy accents |
| Pine | `#E6C98F` | raw wood (the block, the track) |
| Forest Green | `#4A6B4F` | unlockable paint |

Car paints draw from the same family (several unlockable). The 3D world uses these as flat material colors — no realistic texturing; the vintage tint IS the lighting mood.

### Type & letterpress system

Reference boards: Dustin Commer's *1st Annual Pinewood Derby* badge, Commence Studio's *Derby Barber* tearsheet, James David Horton's *RedBull Soap Box Racer* illustration. One-ink letterpress discipline throughout:

- **Display**: Rye (woodtype carnival serif) — titles, headers, car numbers. Brick red with a thin ink shadow for heroes; plain ink elsewhere.
- **Labels/UI**: Oswald, uppercase, letterspaced 0.12–0.14em (the `lp-label` class) — every button, tab, legend, and chip.
- **Script accents**: Yellowtail — taglines and rival quips ("so close!", "carve it · race it").
- **Prose**: Georgia/serif italic — read-aloud text (intros, Pit Crew Notes, balance hints).
- **Controls**: ink-on-paper plaques with double-rule borders (2px ink + inner hairline), squared corners, filled-ink active states, segmented option groups inside legended fieldsets. Primary action = brick-red plaque. NO chunky rounded corners, NO fat offset shadows, NO emoji anywhere — all iconography is the hand-drawn stroke SVG set (`ui/icons.tsx`), stickers/medals are canvas-drawn vectors (`garage/carDecals.ts`).
- **Ornaments**: crossed checkered wing flags, arched SVG text, triple speed rules, diamond rules, EST plaques (`ui/ornaments.tsx`).

### Motion & feel

Presses nudge 1px (letterpress, not squash); the title showcase car squash-swaps between builds; cars bounce softly when placed; confetti on wins; the flag-drop snaps. Nothing hovers-only; everything responds to touch with sound + motion.

### 3D style

Low-poly flat-shaded ("toy world"). The car mesh is deliberately faceted — like it was carved with a few confident knife cuts. No shadow maps (soft blob shadows), no postprocessing; hemisphere + one directional light, palette-tinted fog.

---

## 10. Audio

- **SFX**: saw/scrape (carve), sanding shuffle, graphite *pff*, plug *thunk*, scale *boing*, gate *clack*, rolling rumble that pitches with speed, crowd swell at the finish, trophy fanfare. Playful, retro, slightly woody.
- **Music**: one cheerful vintage-fair loop in the garage, tenser roll for race, fanfare sting for wins. Mute toggle always one tap away (parents' sanity).
- **Narration** (optional, settings): Web Speech reads kid-facing lines aloud. Feature-detected; pure garnish.
- iOS: all audio unlocks on first tap (standard workaround).

---

## 11. Technical summary

- **Stack**: Vite + React + TypeScript + react-three-fiber + drei; zustand (state), zod (save validation), maath (camera damping), howler (audio). No physics engine, no CSG library, no router.
- **Carving** = two 2D heightfield profiles (`yTop(x)`, `halfWidth(x)`) edited by a replayable operation log; the 3D mesh is a decimated loft of rounded-rect cross-sections. Undo is exact; saves are ~2 KB; the blueprint is the profiles.
- **Racing** = simulate-then-playback: the deterministic sim computes the entire heat before the gate drops; the 3D scene replays position arrays. Seeded RNG → any race replays exactly.
- **Saves**: localStorage, zod-validated, versioned migrations, corruption quarantined (never crash a kid's game).
- **Performance floor**: iPad (A10) at 60 fps — <60 k triangles, <40 draw calls, no shadows.
- **Deploy**: static build → GitHub Pages project site → `jeremyperonto.com/derby/`.

Full conventions and architecture rules: see `CLAUDE.md`.

---

## 12. v1 scope

**In v1:** carve/sand/scoop/round + templates · weights + scale + balance bubble · wheel prep + raised wheel · paint/decals/number/name · car wall (multi-save) · 4-lane 3D race with follow-cam + photo finish · 6-rival ladder + filler cars · trophies + cosmetic unlocks · counterfactual feedback · Pit Crew Notes · SFX/music/mute · optional narration · blueprint print export · local best times.

**Roadmap (post-v1):**

- **Public kid-safe leaderboard** (Supabase): share a car code, ghost-race friends' cars, curated name list only — no free text, no chat. Determinism groundwork (seeds, fixed timestep, table-driven track) is already in place.
- **Expert Garage**: axle alignment & rail-riding, wheel-well sculpting.
- **Seasons**: new rival casts, themed decal packs, night race.
- Derby-day mode: bracket tournament with 8+ cars.
- PWA/offline for the car ride.
- PNG/PDF blueprint download (v1 uses browser print).

---

## 13. Success criteria

1. A six-year-old can carve, decorate, and race a car with no reading and no help — and wants to do it again immediately.
2. After a week of play, he can explain *why* a car is fast ("heavy in the back, smooth wheels, pointy front") — unprompted.
3. At least one blueprint gets printed, taped to a real block of pine, and cut.
