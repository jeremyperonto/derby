import { degToRad } from '../lib/math'
import { TUNING, type Tuning } from './tuning'

/**
 * Track profile: straight ramp at rampAngleDeg → circular transition arc →
 * flat run to the finish. Precomputed as a lookup table over arc length s
 * (1 cm steps) so the integrator does zero transcendentals and results are
 * bit-stable across engines (future leaderboard). s = 0 at the starting
 * gate; the table extends startPadM behind the gate (a car's CoM trails
 * its nose) and 2 m past the finish.
 */
export interface Track {
  /** total race distance, gate → finish line (m) */
  lengthM: number
  /** start elevation above the flat (m), at s = 0 */
  startHeightM: number
  /** elevation above the flat at arc position s (lerped) */
  elevationAt(s: number): number
  /** sin of the slope angle at s (positive = downhill) */
  sinAt(s: number): number
  /** cos of the slope angle at s */
  cosAt(s: number): number
  /** horizontal distance from the gate at s (for 3D placement) */
  horizontalAt(s: number): number
}

const STEP = 0.01

export function buildTrack(t: Tuning = TUNING): Track {
  const theta0 = degToRad(t.rampAngleDeg)
  const arcLen = t.transitionRadiusM * theta0
  const rampEnd = t.rampLengthM
  const flatStart = rampEnd + arcLen

  const s0 = -t.startPadM
  const s1 = t.trackLengthM + 2
  const n = Math.ceil((s1 - s0) / STEP) + 1

  const sin = new Float32Array(n)
  const cos = new Float32Array(n)
  const y = new Float32Array(n)
  const xh = new Float32Array(n)

  // slope angle at arc position s (measured from the gate)
  const phiAt = (s: number) => {
    if (s < rampEnd) return theta0
    if (s < flatStart) return theta0 * (1 - (s - rampEnd) / arcLen)
    return 0
  }

  // integrate elevation drop and horizontal run from the gate downward
  let yAcc = 0
  let xAcc = 0
  let prevPhi = phiAt(s0)
  for (let i = 0; i < n; i++) {
    const s = s0 + i * STEP
    const phi = phiAt(s)
    const midPhi = (phi + prevPhi) / 2
    if (i > 0) {
      yAcc -= Math.sin(midPhi) * STEP
      xAcc += Math.cos(midPhi) * STEP
    }
    prevPhi = phi
    sin[i] = Math.sin(phi)
    cos[i] = Math.cos(phi)
    y[i] = yAcc
    xh[i] = xAcc
  }

  // shift elevations so the flat sits at 0
  const yFlat = y[n - 1]!
  let startHeightM = 0
  for (let i = 0; i < n; i++) y[i] = y[i]! - yFlat
  {
    const i0 = Math.round((0 - s0) / STEP)
    startHeightM = y[i0]!
  }

  const lookup = (arr: Float32Array, s: number) => {
    const f = (s - s0) / STEP
    const i = Math.floor(f)
    if (i < 0) return arr[0]!
    if (i >= n - 1) return arr[n - 1]!
    const frac = f - i
    return arr[i]! * (1 - frac) + arr[i + 1]! * frac
  }

  return {
    lengthM: t.trackLengthM,
    startHeightM,
    elevationAt: (s) => lookup(y, s),
    sinAt: (s) => lookup(sin, s),
    cosAt: (s) => lookup(cos, s),
    horizontalAt: (s) => lookup(xh, s),
  }
}
