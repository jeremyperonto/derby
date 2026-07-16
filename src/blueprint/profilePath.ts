import { N, xAt, type CarveBuffers } from '../carve/buffers'
import { rdpIndices } from '../lib/math'

/**
 * Carve buffers → SVG path strings in MILLIMETER user units, so the
 * blueprint prints at true 1:1 scale (browsers honor mm in SVG). The
 * profiles ARE the blueprint — this is why carving is 2D heightfields.
 */

export const MM_PER_IN = 25.4
const RDP_TOL_IN = 0.008 // ≈ 0.2 mm

/** side profile outline (y up), origin at nose/bottom, closed path */
export function sideProfilePathMm(buffers: CarveBuffers): string {
  const keep = rdpIndices(
    Array.from({ length: N }, (_, i) => xAt(i)),
    buffers.yTop,
    RDP_TOL_IN,
  )
  const pts = keep.map((i) => `L ${mm(xAt(i))} ${mm(-buffers.yTop[i]!)}`)
  return `M 0 0 ${pts.join(' ')} L ${mm(7)} 0 Z`
}

/** top profile outline (symmetric about the centerline y=0), closed path */
export function topProfilePathMm(buffers: CarveBuffers): string {
  const keep = rdpIndices(
    Array.from({ length: N }, (_, i) => xAt(i)),
    buffers.halfWidth,
    RDP_TOL_IN,
  )
  const right = keep.map((i) => `L ${mm(xAt(i))} ${mm(buffers.halfWidth[i]!)}`)
  const left = [...keep].reverse().map((i) => `L ${mm(xAt(i))} ${mm(-buffers.halfWidth[i]!)}`)
  const first = keep[0]!
  return `M ${mm(xAt(first))} ${mm(buffers.halfWidth[first]!)} ${right.join(' ')} ${left.join(' ')} Z`
}

export function mm(inches: number): number {
  return Number((inches * MM_PER_IN).toFixed(2))
}

export function maxHeightIn(buffers: CarveBuffers): number {
  let max = 0
  for (let i = 0; i < N; i++) if (buffers.yTop[i]! > max) max = buffers.yTop[i]!
  return max
}
