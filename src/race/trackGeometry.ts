import { BufferGeometry, Float32BufferAttribute } from 'three'
import { IN_TO_M } from '../lib/math'
import type { Track } from '../sim/track'

/**
 * Track world-space helpers. The RACE WORLD IS IN INCHES (same unit as the
 * car geometry): the sim's arc position s (meters) maps to world x/y via
 * the track profile. Cars run toward +x; lanes spread across z.
 */

export const LANE_SPACING_IN = 5.5
export const LANE_COUNT = 4
export const DECK_HALF_WIDTH_IN = (LANE_COUNT * LANE_SPACING_IN) / 2 + 1.5

export const laneZ = (lane: number) => (lane - (LANE_COUNT - 1) / 2) * LANE_SPACING_IN

/** track surface point (inches) for arc position s (meters) */
export function surfaceAt(track: Track, sM: number): { x: number; y: number } {
  return {
    x: track.horizontalAt(sM) / IN_TO_M,
    y: track.elevationAt(sM) / IN_TO_M,
  }
}

/**
 * Car pose at nose-arc s: position of the nose contact point plus the pitch
 * of the chord between nose and tail (avoids slope-sign guesswork).
 */
export function carPose(
  track: Track,
  sM: number,
  carLengthM: number,
): { x: number; y: number; pitch: number } {
  const nose = surfaceAt(track, sM)
  const tail = surfaceAt(track, sM - carLengthM)
  return {
    x: nose.x,
    y: nose.y,
    pitch: Math.atan2(nose.y - tail.y, nose.x - tail.x),
  }
}

/**
 * Ribbon geometry following the track profile — used for the deck and the
 * per-lane center guide strips. Width in inches; `lift` raises it off the
 * deck to avoid z-fighting.
 */
export function ribbonGeometry(
  track: Track,
  fromM: number,
  toM: number,
  centerZIn: number,
  widthIn: number,
  lift = 0,
): BufferGeometry {
  const STEP_M = 0.15
  const positions: number[] = []
  const halfW = widthIn / 2
  const n = Math.ceil((toM - fromM) / STEP_M)
  for (let i = 0; i <= n; i++) {
    const s = fromM + ((toM - fromM) * i) / n
    const p = surfaceAt(track, s)
    positions.push(p.x, p.y + lift, centerZIn - halfW, p.x, p.y + lift, centerZIn + halfW)
  }
  const indices: number[] = []
  for (let i = 0; i < n; i++) {
    const a = i * 2
    indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
