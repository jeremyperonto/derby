import { describe, expect, it } from 'vitest'
import { rivalById } from '../src/content/rivals'
import { TEMPLATES } from '../src/content/templates'
import { freshCarDesign, type CarDesign, type WeightPlug } from '../src/model/carDesign'
import { deriveSimParams } from '../src/model/deriveSimParams'
import { bestTips } from '../src/sim/feedback'

/**
 * Endgame-balance / feedback-truth guards (from the game-theory audit):
 * a Champion-tier loss must teach the lever that actually flips it, and the
 * "would have won" promise must never be a lie.
 */

const SEED = 20260724
const REAR = [7, 8, 6, 5, 4, 3, 2, 1, 0] // rearmost x first

/** greedily fill to the legal 5 oz limit, rearmost holes first */
function maxWeight(base: CarDesign): CarDesign {
  let d = base
  for (const slot of REAR) {
    const t: WeightPlug = { slot, kind: 'tungsten' }
    if (deriveSimParams({ ...d, weights: [...d.weights, t] }).totalOz <= 5.0) {
      d = { ...d, weights: [...d.weights, t] }
      continue
    }
    const s: WeightPlug = { slot, kind: 'steel' }
    if (deriveSimParams({ ...d, weights: [...d.weights, s] }).totalOz <= 5.0) d = { ...d, weights: [...d.weights, s] }
  }
  return d
}
const build = (ops: CarDesign['carve']['ops']): CarDesign =>
  maxWeight({ ...freshCarDesign('probe', 0), carve: { ops }, wheels: { polish: 3, graphite: 3 } })

const wedgeOps = TEMPLATES.find((t) => t.id === 'wedge')!.ops
const lena = rivalById('lena')!.design

describe('feedback teaches the lever that actually flips a Champion loss', () => {
  it('a maxed WEDGE that loses to Lena is told to make a sleeker shape — and it would really win', () => {
    const player = build(wedgeOps) // maxed + full prep but boxy: loses to Lena on shape
    const params = [player, lena].map((d) => deriveSimParams(d).params)
    const tips = bestTips(player, params, 0, 1, SEED)
    expect(tips[0]!.lesson).toBe('aero')
    expect(tips[0]!.wouldBeatRival).toBe(true)
  })

  it('a still-uncarved block that loses is told to CARVE it (not the aero tip)', () => {
    const player = build([]) // maxed + full prep but never carved
    const params = [player, lena].map((d) => deriveSimParams(d).params)
    const tips = bestTips(player, params, 0, 1, SEED)
    expect(tips[0]!.lesson).toBe('carve')
    expect(tips.some((t) => t.lesson === 'aero')).toBe(false)
  })

  it('never claims "would have won" unless the variant truly beats the rival', () => {
    const player = build(wedgeOps)
    const params = [player, lena].map((d) => deriveSimParams(d).params)
    for (const tip of bestTips(player, params, 0, 1, SEED)) {
      if (tip.wouldBeatRival) expect(tip.marginOverRival).toBeGreaterThan(0)
    }
  })
})
