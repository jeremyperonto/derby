import { BLOCK, N_SAMPLES } from '../model/carDesign'

/**
 * Runtime carve state — a derived cache, never persisted (the op log is the
 * source of truth). Two orthogonal heightfields over x ∈ [0, 7in]:
 *   yTop[i]      top surface height (side profile), 0 → 1.25
 *   halfWidth[i] symmetric half-width from centerline (top profile), 0 → 0.875
 * Bottom stays flat at y = 0 in v1.
 */
export interface CarveBuffers {
  yTop: Float32Array
  halfWidth: Float32Array
  edgeRadius: number // inches, global fillet on the four long edges
}

export const N = N_SAMPLES
export const DX_IN = BLOCK.lengthIn / (N - 1)

/** x position (inches from nose) of sample i */
export const xAt = (i: number) => i * DX_IN

/** nearest sample index for x (clamped) */
export const idxAt = (x: number) => Math.max(0, Math.min(N - 1, Math.round(x / DX_IN)))

export function freshBlock(): CarveBuffers {
  return {
    yTop: new Float32Array(N).fill(BLOCK.heightIn),
    halfWidth: new Float32Array(N).fill(BLOCK.widthIn / 2),
    edgeRadius: 0,
  }
}

export function cloneBuffers(b: CarveBuffers): CarveBuffers {
  return {
    yTop: b.yTop.slice(),
    halfWidth: b.halfWidth.slice(),
    edgeRadius: b.edgeRadius,
  }
}
