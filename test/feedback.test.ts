import { describe, expect, it } from 'vitest'
import { generateCappedFiller, RIVALS, rivalById } from '../src/content/rivals'
import { TEST_CARS } from '../src/content/testCars'
import { deriveSimParams } from '../src/model/deriveSimParams'
import { bestTips } from '../src/sim/feedback'
import { mulberry32 } from '../src/sim/rng'
import { runRace } from '../src/sim/simulate'
import { TUNING } from '../src/sim/tuning'

const SEED = 424242

describe('counterfactual feedback engine', () => {
  it('tells a nose-heavy player that placement is the top fix', () => {
    const player = TEST_CARS.noseWedge! // full prep, weight all in the nose
    const rival = rivalById('pete')!.design // squeaky but rear-weighted
    const params = [player, rival].map((d) => deriveSimParams(d).params)

    const tips = bestTips(player, params, 0, 1, SEED)
    expect(tips.length).toBeGreaterThan(0)
    expect(tips[0]!.lesson).toBe('placement')
    expect(tips[0]!.gainS).toBeGreaterThan(0)
  })

  it('tells a squeaky player to polish up', () => {
    const player = { ...TEST_CARS.squeakyWedge! }
    const rival = rivalById('ned')!.design
    const params = [player, rival].map((d) => deriveSimParams(d).params)

    const tips = bestTips(player, params, 0, 1, SEED)
    expect(tips[0]!.lesson).toBe('friction')
  })

  it('never suggests a variant that breaks the 5 oz limit', () => {
    const player = TEST_CARS.wedgeRacer! // already ~4.9 oz
    const rival = rivalById('lena')!.design
    const params = [player, rival].map((d) => deriveSimParams(d).params)
    const tips = bestTips(player, params, 0, 1, SEED)
    expect(tips.every((t) => t.lesson !== 'weight')).toBe(true)
  })
})

describe('rivals ladder', () => {
  it('every rival design is race-legal (≤ 5 oz)', () => {
    for (const rival of RIVALS) {
      const derived = deriveSimParams(rival.design)
      expect(derived.overweight, `${rival.name} is overweight at ${derived.totalOz}oz`).toBe(false)
    }
  })

  it('divisions are ordered: every Rookie racer is slower than every Champion racer', () => {
    const noWobble = { ...TUNING, wobble: 0 }
    const solo = (design: Parameters<typeof deriveSimParams>[0]) =>
      runRace([deriveSimParams(design, noWobble).params], 1, noWobble).lanes[0]!.finishTime
    const tier1 = RIVALS.filter((r) => r.tier === 1).map((r) => ({ name: r.name, t: solo(r.design) }))
    const tier3 = RIVALS.filter((r) => r.tier === 3).map((r) => ({ name: r.name, t: solo(r.design) }))
    for (const rookie of tier1) {
      for (const champ of tier3) {
        expect(rookie.t, `${champ.name} should out-race ${rookie.name}`).toBeGreaterThan(champ.t)
      }
    }
  })

  it('the ladder is roughly ascending: Bobby slowest, Lena fastest', () => {
    const noWobble = { ...TUNING, wobble: 0 }
    const times = RIVALS.map(
      (rival) =>
        runRace([deriveSimParams(rival.design, noWobble).params], SEED, noWobble).lanes[0]!
          .finishTime,
    )
    expect(Math.max(...times)).toBe(times[0])
    expect(Math.min(...times)).toBe(times[times.length - 1])
  })

  it('filler cars are always slower than their heat rival — they never decide the heat', () => {
    const noWobble = { ...TUNING, wobble: 0 }
    const solo = (design: Parameters<typeof deriveSimParams>[0]) =>
      runRace([deriveSimParams(design, noWobble).params], 1, noWobble).lanes[0]!.finishTime
    for (const rival of RIVALS) {
      const rivalTime = solo(rival.design)
      for (let seed = 1; seed <= 8; seed++) {
        const filler = generateCappedFiller(mulberry32(seed * 977), rival.design)
        expect(
          solo(filler),
          `filler (seed ${seed}) out-raced ${rival.name}`,
        ).toBeGreaterThan(rivalTime + 0.03)
      }
    }
  })

  it('a mastery build can beat Lena (the boss is winnable, but demands a real carve)', () => {
    const noWobble = { ...TUNING, wobble: 0 }
    const player = TEST_CARS.champion! // low+slim+rounded, max legal rear weight, raised
    const derived = deriveSimParams(player, noWobble)
    expect(derived.overweight, `champion must be race-legal, is ${derived.totalOz}oz`).toBe(false)
    const lena = rivalById('lena')!.design
    const params = [derived.params, deriveSimParams(lena, noWobble).params]
    const race = runRace(params, SEED, noWobble)
    expect(race.lanes[0]!.finishTime).toBeLessThan(race.lanes[1]!.finishTime)
  })
})
