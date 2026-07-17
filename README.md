# 🏁 Derby Dash

**Carve it. Race it. Learn why it won.**

Derby Dash is a Pinewood Derby simulator for kids — a web game where you carve a virtual block of pine into a race car, decorate it with paint, decals, and a racing number, and race it down a 3D four-lane derby track against a cast of rival cars. Every choice matters, because under the hood the game runs the real physics of a real Pinewood Derby.

> 🖨️ **The best part:** when you build a car you love, Derby Dash prints a true-to-scale shop blueprint — profiles, weight placement, wheel prep checklist — so you can build the real thing together.

**Play it:** https://jeremyperonto.com/derby/

![Derby Dash screenshot](docs/screenshot.png) <!-- TODO: replace with a real screenshot at v1 -->

## Why it exists

I built this to teach my six-year-old son the physics of racing. In a Pinewood Derby, every real speed trick is a physics lesson a kid can feel:

- ⚖️ **Weight & placement** — heavy cars push harder down the hill, and weight in the *back* rides the hill longer (potential energy, released late).
- ✨ **Friction** — rough and squeaky rubs speed away; polished axles and graphite keep it.
- 🌬️ **Aerodynamics** — the air is in the way; pointy cars sneak through it.
- 🎈 **Wheel setup** — three wheels rub less than four.

The rivals each lose to exactly one of these lessons, and when you lose, the game re-simulates the race with a better version of *your* car and tells you the one change that would have won it. No fake stats — losing is the lesson.

Designed for pre-readers: icons, audio, and big touch targets carry the game (iPad or desktop), with optional "Pit Crew Notes" for grown-ups to read aloud.

## Tech

TypeScript · React · react-three-fiber (Three.js) · Vite · zustand · a custom deterministic physics simulation (no physics engine — every race is replayable from a seed). See [`design.md`](design.md) for the full game design and [`CLAUDE.md`](CLAUDE.md) for architecture.

## Local development

```bash
npm install
npm run dev      # dev server
npm run test     # physics + carve test suite
npm run build    # production build to dist/
```

## Credits

Built by [Jeremy Peronto](https://jeremyperonto.com) with his son — chief playtester, art director, and reason for being.

Art direction inspired by vintage pinewood derby posters. Not affiliated with BSA/Scouting America; "Pinewood Derby" refers to the classic gravity-racing tradition.
