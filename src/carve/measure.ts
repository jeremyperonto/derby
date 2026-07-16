import { clamp, IN_TO_M } from '../lib/math'
import { BLOCK } from '../model/carDesign'
import { TUNING, type Tuning } from '../sim/tuning'
import { DX_IN, N, xAt, type CarveBuffers } from './buffers'

/**
 * Physical measurements of a carved body, integrated over the 512-sample
 * buffers. Pure; recomputed live in the garage (sub-millisecond) so the
 * scale needle, balance bubble, and aero meter react as the kid carves.
 */
export interface BodyMeasure {
  volumeIn3: number
  bodyMassG: number
  /** body-only center of mass, inches from nose */
  comXIn: number
  /** projected frontal silhouette of the body (m²), wheels excluded */
  frontalAreaM2: number
  /** drag coefficient heuristic from the profile shape */
  dragCd: number
}

const IN3_TO_CM3 = 16.387064

export function measureBody(buffers: CarveBuffers, t: Tuning = TUNING): BodyMeasure {
  const { yTop, halfWidth, edgeRadius } = buffers

  // --- volume + CoM: cross-section area integrated along x ---
  let volume = 0
  let moment = 0
  let maxCross = 0
  for (let i = 0; i < N; i++) {
    const area = yTop[i]! * 2 * halfWidth[i]!
    volume += area * DX_IN
    moment += area * DX_IN * xAt(i)
    if (area > maxCross) maxCross = area
  }
  const comXIn = volume > 0 ? moment / volume : BLOCK.lengthIn / 2

  // --- frontal silhouette: union of cross-sections over a z-grid ---
  // for each |z| bin, the tallest yTop among stations wide enough to cover it
  const Z_BINS = 64
  const maxHW = BLOCK.widthIn / 2
  let silhouetteIn2 = 0
  const dz = maxHW / Z_BINS
  for (let zi = 0; zi < Z_BINS; zi++) {
    const z = (zi + 0.5) * dz
    let tallest = 0
    for (let i = 0; i < N; i++) {
      if (halfWidth[i]! > z && yTop[i]! > tallest) tallest = yTop[i]!
    }
    silhouetteIn2 += tallest * dz * 2 // both sides of the centerline
  }
  const frontalAreaM2 = silhouetteIn2 * IN_TO_M * IN_TO_M

  // --- Cd heuristic: bluntness penalty, tail-taper + rounded-edge credits ---
  const crossAt = (xFrac: number) => {
    const i = clamp(Math.round(xFrac * (N - 1)), 0, N - 1)
    return yTop[i]! * 2 * halfWidth[i]!
  }
  const frontFraction = maxCross > 0 ? crossAt(0.15) / maxCross : 1
  const rearFraction = maxCross > 0 ? crossAt(0.85) / maxCross : 1
  const dragCd = clamp(
    t.cdBase +
      t.cdBluntGain * frontFraction -
      t.cdTaperCredit * (1 - rearFraction) -
      t.cdEdgeCredit * (edgeRadius / 0.5),
    t.cdMin,
    t.cdMax,
  )

  return {
    volumeIn3: volume,
    bodyMassG: volume * IN3_TO_CM3 * t.pineDensityGcm3,
    comXIn,
    frontalAreaM2,
    dragCd,
  }
}
