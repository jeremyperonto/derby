export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const degToRad = (deg: number) => (deg * Math.PI) / 180

/** Inches ↔ SI. Carve space is inches; the sim is SI (see CLAUDE.md). */
export const IN_TO_M = 0.0254
export const OZ_TO_KG = 0.028349523125
export const G_TO_KG = 0.001

/**
 * Ramer–Douglas–Peucker polyline simplification over (x, y) points.
 * Used to decimate carve buffers into low-poly loft stations (M2) and
 * blueprint paths (M7). Returns indices of kept points, always including
 * the first and last.
 */
export function rdpIndices(xs: ArrayLike<number>, ys: ArrayLike<number>, tolerance: number): number[] {
  const n = xs.length
  if (n <= 2) return n === 2 ? [0, 1] : n === 1 ? [0] : []
  const keep = new Uint8Array(n)
  keep[0] = 1
  keep[n - 1] = 1
  const stack: [number, number][] = [[0, n - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()!
    if (b - a < 2) continue
    const ax = xs[a]!, ay = ys[a]!, bx = xs[b]!, by = ys[b]!
    const dx = bx - ax, dy = by - ay
    const len = Math.hypot(dx, dy) || 1
    let maxDist = -1
    let maxI = -1
    for (let i = a + 1; i < b; i++) {
      // perpendicular distance from point i to segment a-b
      const d = Math.abs(dy * (xs[i]! - ax) - dx * (ys[i]! - ay)) / len
      if (d > maxDist) {
        maxDist = d
        maxI = i
      }
    }
    if (maxDist > tolerance && maxI > 0) {
      keep[maxI] = 1
      stack.push([a, maxI], [maxI, b])
    }
  }
  const out: number[] = []
  for (let i = 0; i < n; i++) if (keep[i]) out.push(i)
  return out
}
