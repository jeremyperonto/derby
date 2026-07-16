import { BufferGeometry, Float32BufferAttribute } from 'three'
import { rdpIndices } from '../lib/math'
import { N, xAt, type CarveBuffers } from './buffers'

/**
 * Buffers → low-poly flat-shaded mesh. The ONLY carve module allowed to
 * import three (CLAUDE.md rule 1). Pipeline:
 *   1. RDP-decimate yTop and halfWidth (the decimation IS the chunky toy
 *      look; the 512-sample buffers stay the truth for physics/blueprint)
 *   2. at each kept station, build a rounded-rect cross-section ring
 *      (top corners filleted by edgeRadius; bottom stays flat)
 *   3. loft consecutive rings with quads, fan-cap nose and tail
 * Geometry is in INCHES, origin at the nose / bottom / centerline.
 */

const RDP_TOL_IN = 0.024 // ≈ 0.6 mm
const ARC_STEPS = 4 // verts per filleted top corner

export function loftGeometry(buffers: CarveBuffers): BufferGeometry {
  const { yTop, halfWidth, edgeRadius } = buffers

  // union of stations kept by either profile
  const sideKeep = rdpIndices(
    Array.from({ length: N }, (_, i) => xAt(i)),
    yTop,
    RDP_TOL_IN,
  )
  const topKeep = rdpIndices(
    Array.from({ length: N }, (_, i) => xAt(i)),
    halfWidth,
    RDP_TOL_IN,
  )
  const stations = Array.from(new Set([...sideKeep, ...topKeep])).sort((a, b) => a - b)

  const rings = stations.map((i) => ringPoints(yTop[i]!, halfWidth[i]!, edgeRadius))
  const M = rings[0]!.length

  const positions: number[] = []
  const push = (x: number, p: [number, number]) => positions.push(x, p[1], p[0])

  // loft quads between consecutive rings
  for (let s = 0; s < stations.length - 1; s++) {
    const xa = xAt(stations[s]!)
    const xb = xAt(stations[s + 1]!)
    const ra = rings[s]!
    const rb = rings[s + 1]!
    for (let k = 0; k < M; k++) {
      const k2 = (k + 1) % M
      // two triangles, wound so normals face outward (checked: bottom → −y, top → +y)
      push(xa, ra[k]!)
      push(xb, rb[k]!)
      push(xa, ra[k2]!)
      push(xa, ra[k2]!)
      push(xb, rb[k]!)
      push(xb, rb[k2]!)
    }
  }

  // fan caps (rings are convex): nose faces −x, tail faces +x
  capFan(positions, xAt(stations[0]!), rings[0]!, true)
  capFan(positions, xAt(stations[stations.length - 1]!), rings[rings.length - 1]!, false)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals() // non-indexed ⇒ flat facet normals
  return geometry
}

/**
 * Cross-section ring in the (z, y) plane, counterclockwise seen from +x,
 * starting at the bottom-left corner. Fixed vertex count so rings always
 * pair up for lofting. Top corners are filleted by edgeRadius.
 */
function ringPoints(h: number, hw: number, edgeRadius: number): [number, number][] {
  const r = Math.max(0.001, Math.min(edgeRadius, hw * 0.9, h * 0.45))
  const pts: [number, number][] = []

  // bottom edge (flat on the ground): left → right
  pts.push([-hw, 0], [hw, 0])
  // right wall up to the fillet
  pts.push([hw, h - r])
  // top-right fillet: from (hw, h−r) arcing to (hw−r, h)
  for (let a = 1; a <= ARC_STEPS; a++) {
    const t = (a / ARC_STEPS) * (Math.PI / 2)
    pts.push([hw - r + r * Math.cos(t), h - r + r * Math.sin(t)])
  }
  // top edge right → left
  pts.push([-hw + r, h])
  // top-left fillet: from (−hw+r, h) arcing to (−hw, h−r)
  for (let a = 1; a <= ARC_STEPS; a++) {
    const t = Math.PI / 2 + (a / ARC_STEPS) * (Math.PI / 2)
    pts.push([-hw + r + r * Math.cos(t), h - r + r * Math.sin(t)])
  }
  return pts // left wall closes implicitly (last point → first point)
}

function capFan(positions: number[], x: number, ring: [number, number][], nose: boolean) {
  let cy = 0
  let cz = 0
  for (const [z, y] of ring) {
    cz += z
    cy += y
  }
  cz /= ring.length
  cy /= ring.length
  const M = ring.length
  for (let k = 0; k < M; k++) {
    const a = ring[k]!
    const b = ring[(k + 1) % M]!
    if (nose) {
      // faces −x: wind clockwise seen from +x
      positions.push(x, cy, cz, x, a[1], a[0], x, b[1], b[0])
    } else {
      positions.push(x, cy, cz, x, b[1], b[0], x, a[1], a[0])
    }
  }
}
