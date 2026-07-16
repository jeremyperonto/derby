import { describe, expect, it } from 'vitest'
import { TEST_CARS } from '../src/content/testCars'
import { deriveSimParams } from '../src/model/deriveSimParams'
import { runRace } from '../src/sim/simulate'
import { buildTrack } from '../src/sim/track'
import { CAR_LENGTH_M, TUNING } from '../src/sim/tuning'

const SEED = 12345
const p = (id: keyof typeof TEST_CARS) => deriveSimParams(TEST_CARS[id]!).params

/** solo time-trial finish time for one car (wobble disabled via wobble-free tuning) */
function soloTime(id: keyof typeof TEST_CARS): number {
  const noWobble = { ...TUNING, wobble: 0 }
  return runRace([p(id)], SEED, noWobble).lanes[0]!.finishTime
}

/** margin between two cars in car lengths (positive = first arg wins) */
function marginLengths(a: keyof typeof TEST_CARS, b: keyof typeof TEST_CARS): number {
  const noWobble = { ...TUNING, wobble: 0 }
  const race = runRace([p(a), p(b)], SEED, noWobble)
  const gap = race.lanes[1]!.finishTime - race.lanes[0]!.finishTime
  return (gap * race.lanes[race.order[0]!]!.finishSpeed) / CAR_LENGTH_M
}

describe('track', () => {
  it('has a realistic start height (~1.2 m) and length', () => {
    const track = buildTrack()
    expect(track.startHeightM).toBeGreaterThan(1.0)
    expect(track.startHeightM).toBeLessThan(1.4)
    expect(track.elevationAt(track.lengthM)).toBeCloseTo(0, 3)
    expect(track.sinAt(0)).toBeCloseTo(Math.sin((24 * Math.PI) / 180), 5)
    expect(track.sinAt(track.lengthM)).toBeCloseTo(0, 5)
  })
})

describe('determinism', () => {
  it('same cars + same seed → bit-identical race', () => {
    const cars = [p('wedgeRacer'), p('brick'), p('squeakyWedge'), p('noseWedge')]
    const a = runRace(cars, SEED)
    const b = runRace(cars, SEED)
    expect(a.lanes.map((l) => l.finishTime)).toEqual(b.lanes.map((l) => l.finishTime))
    expect(Array.from(a.lanes[0]!.s)).toEqual(Array.from(b.lanes[0]!.s))
  })

  it('different seed → different (but close) times', () => {
    const cars = [p('wedgeRacer')]
    const a = runRace(cars, 1)
    const b = runRace(cars, 2)
    expect(a.lanes[0]!.finishTime).not.toBe(b.lanes[0]!.finishTime)
    expect(Math.abs(a.lanes[0]!.finishTime - b.lanes[0]!.finishTime)).toBeLessThan(0.1)
  })
})

describe('physics ordering invariants (must hold under ANY retune)', () => {
  it('a well-built car finishes in a realistic 2.5–3.5 s', () => {
    const t = soloTime('wedgeRacer')
    expect(t).toBeGreaterThan(2.5)
    expect(t).toBeLessThan(3.5)
  })

  it('rear weight beats nose weight (same mass, same everything)', () => {
    expect(soloTime('wedgeRacer')).toBeLessThan(soloTime('noseWedge'))
  })

  it('5 oz beats a featherweight', () => {
    expect(soloTime('wedgeRacer')).toBeLessThan(soloTime('featherWedge'))
  })

  it('polished + graphite beats squeaky', () => {
    expect(soloTime('wedgeRacer')).toBeLessThan(soloTime('squeakyWedge'))
  })

  it('wedge beats brick (same weights and prep)', () => {
    expect(soloTime('wedgeRacer')).toBeLessThan(soloTime('brickRacer'))
  })

  it('raised wheel beats four on the floor', () => {
    expect(soloTime('triWheel')).toBeLessThan(soloTime('wedgeRacer'))
  })

  it('rear weight pays off AT THE TRANSITION, not on the ramp (the teachable signature)', () => {
    const noWobble = { ...TUNING, wobble: 0 }
    const race = runRace([p('wedgeRacer'), p('noseWedge')], SEED, noWobble)
    const rampTick = Math.floor(0.8 / TUNING.dt) // still on the constant-slope ramp
    const rear = race.lanes[0]!
    const nose = race.lanes[1]!
    // identical acceleration on the ramp — the lesson is that the hill treats everyone the same…
    expect(nose.s[rampTick]!).toBeCloseTo(rear.s[rampTick]!, 4)
    // …but the rear-weighted car keeps its mass on the slope longer and wins
    expect(rear.finishTime).toBeLessThan(nose.finishTime)
    // and the gap keeps growing after the transition (rear car is simply faster from there on)
    // — measured just before the winner crosses, while both traces are still live
    const lateTick = Math.floor((rear.finishTime - 0.05) / TUNING.dt)
    const midGap = rear.s[Math.floor(1.6 / TUNING.dt)]! - nose.s[Math.floor(1.6 / TUNING.dt)]!
    const lateGap = rear.s[lateTick]! - nose.s[lateTick]!
    expect(midGap).toBeGreaterThan(0)
    expect(lateGap).toBeGreaterThan(midGap)
  })
})

describe('factor spreads (car lengths on a ~3 s heat — see tuning targets)', () => {
  it('reports the calibration table', () => {
    const rows = [
      ['weight (5 oz vs feather)', marginLengths('wedgeRacer', 'featherWedge'), 3, 6],
      ['placement (rear vs nose)', marginLengths('wedgeRacer', 'noseWedge'), 1.5, 4],
      ['friction (prep vs squeaky)', marginLengths('wedgeRacer', 'squeakyWedge'), 1.2, 3.5],
      ['aero (wedge vs brick)', marginLengths('wedgeRacer', 'brickRacer'), 0.5, 2],
      ['raised wheel', marginLengths('triWheel', 'wedgeRacer'), 0.1, 0.8],
    ] as const

    const report = rows
      .map(([name, lengths]) => `${name}: ${lengths.toFixed(2)} lengths`)
      .join('\n')
    console.log(`\n=== factor spreads ===\n${report}\n`)

    for (const [name, lengths, lo, hi] of rows) {
      expect(lengths, `${name} spread out of range`).toBeGreaterThan(lo)
      expect(lengths, `${name} spread out of range`).toBeLessThan(hi)
    }
  })
})

describe('golden times (lock the physics — update DELIBERATELY after retunes)', () => {
  it('reference heat finishes at exact recorded times', () => {
    const cars = [p('wedgeRacer'), p('brick'), p('squeakyWedge'), p('brickRacer')]
    const race = runRace(cars, SEED)
    const times = race.lanes.map((l) => Number(l.finishTime.toFixed(6)))
    expect(times).toEqual([3.255556, 3.588716, 3.33976, 3.293888])
  })
})
