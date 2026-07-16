import { describe, expect, it } from 'vitest'
import { freshBlock, N } from '../src/carve/buffers'
import { measureBody } from '../src/carve/measure'
import { applyOp, decodeQuantized, encodeQuantized } from '../src/carve/ops'
import { compactOps, replayOps } from '../src/carve/replay'
import { BLOCK, MIN_THICKNESS_IN, type CarveOp } from '../src/model/carDesign'
import { TEMPLATES } from '../src/content/templates'

const wedgeOps = TEMPLATES.find((t) => t.id === 'wedge')!.ops

describe('fresh block', () => {
  it('measures like a real BSA pine block', () => {
    const m = measureBody(freshBlock())
    expect(m.volumeIn3).toBeCloseTo(7 * 1.75 * 1.25, 1) // 15.3 in³
    expect(m.bodyMassG).toBeGreaterThan(90)
    expect(m.bodyMassG).toBeLessThan(110)
    expect(m.comXIn).toBeCloseTo(3.5, 2)
    expect(m.dragCd).toBeCloseTo(1.0, 1) // blunt brick
  })
})

describe('slice', () => {
  it('carves a wedge: less volume, CoM moves rearward, better Cd', () => {
    const buffers = replayOps(wedgeOps)
    const m = measureBody(buffers)
    const brick = measureBody(freshBlock())
    expect(m.volumeIn3).toBeLessThan(brick.volumeIn3 * 0.75)
    expect(m.comXIn).toBeGreaterThan(3.8) // wedge mass sits toward the tail
    expect(m.dragCd).toBeLessThan(brick.dragCd - 0.2)
  })

  it('never cuts below the minimum body thickness', () => {
    const buffers = freshBlock()
    applyOp(buffers, { t: 'slice', view: 'side', ax: 0, ay: -1, bx: 7, by: -1 })
    for (let i = 0; i < N; i++) expect(buffers.yTop[i]).toBeCloseTo(MIN_THICKNESS_IN, 5)
  })

  it('only bites where the line dips below the surface', () => {
    const buffers = freshBlock()
    // steep cut at the nose only — tail should stay full height
    applyOp(buffers, { t: 'slice', view: 'side', ax: 0, ay: 0.3, bx: 1.5, by: 2.0 })
    expect(buffers.yTop[0]).toBeCloseTo(0.3, 3)
    expect(buffers.yTop[N - 1]).toBeCloseTo(BLOCK.heightIn, 5)
  })
})

describe('scoop & sand', () => {
  it('scoop removes material, never adds', () => {
    const before = replayOps(wedgeOps)
    const after = replayOps([
      ...wedgeOps,
      { t: 'scoop', view: 'side', stroke: [[3.5, 1.0]], r: 0.5 },
    ])
    let removed = 0
    for (let i = 0; i < N; i++) {
      expect(after.yTop[i]!).toBeLessThanOrEqual(before.yTop[i]! + 1e-6)
      removed += before.yTop[i]! - after.yTop[i]!
    }
    expect(removed).toBeGreaterThan(0)
  })

  it('sand knocks down peaks and never adds material', () => {
    // build a spiky profile: deep scoop leaves sharp shoulders
    const spiky: CarveOp[] = [{ t: 'scoop', view: 'side', stroke: [[3.5, 1.6]], r: 0.6 }]
    const before = replayOps(spiky)
    const after = replayOps([
      ...spiky,
      { t: 'sand', view: 'side', stroke: [[3.0, 1], [3.5, 1], [4.0, 1]], r: 0.6 },
    ])
    for (let i = 0; i < N; i++) {
      expect(after.yTop[i]!).toBeLessThanOrEqual(before.yTop[i]! + 1e-6)
    }
  })
})

describe('op log replay (undo model)', () => {
  it('is deterministic: same ops → identical buffers', () => {
    const a = replayOps(wedgeOps)
    const b = replayOps(wedgeOps)
    expect(Array.from(a.yTop)).toEqual(Array.from(b.yTop))
    expect(Array.from(a.halfWidth)).toEqual(Array.from(b.halfWidth))
    expect(a.edgeRadius).toBe(b.edgeRadius)
  })

  it('undo = shorter log: dropping the last op restores the prior shape exactly', () => {
    const withScoop: CarveOp[] = [
      ...wedgeOps,
      { t: 'scoop', view: 'side', stroke: [[2.5, 0.9]], r: 0.4 },
    ]
    const undone = replayOps(withScoop.slice(0, -1))
    const original = replayOps(wedgeOps)
    expect(Array.from(undone.yTop)).toEqual(Array.from(original.yTop))
  })
})

describe('op log compaction (baked ops)', () => {
  it('quantized encode/decode round-trips within 1/1000 inch', () => {
    const buffers = replayOps(wedgeOps)
    const decoded = decodeQuantized(encodeQuantized(buffers.yTop), BLOCK.heightIn)!
    for (let i = 0; i < N; i++) {
      expect(Math.abs(decoded[i]! - buffers.yTop[i]!)).toBeLessThanOrEqual(0.0005 + 1e-9)
    }
  })

  it('compacted log replays to the same shape within quantization', () => {
    // build a long log of little scoops
    const ops: CarveOp[] = [...wedgeOps]
    for (let k = 0; k < 300; k++) {
      ops.push({ t: 'scoop', view: 'side', stroke: [[0.5 + (k % 60) * 0.1, 1.3]], r: 0.15 })
    }
    const original = replayOps(ops)
    const compacted = compactOps(ops)
    expect(compacted.length).toBeLessThan(ops.length)
    expect(compacted[0]!.t).toBe('baked')
    const replayed = replayOps(compacted)
    for (let i = 0; i < N; i++) {
      expect(Math.abs(replayed.yTop[i]! - original.yTop[i]!)).toBeLessThanOrEqual(0.002)
      expect(Math.abs(replayed.halfWidth[i]! - original.halfWidth[i]!)).toBeLessThanOrEqual(0.002)
    }
  })
})
