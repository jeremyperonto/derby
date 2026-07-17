import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { CarveBuffers } from '../carve/buffers'
import { idxAt } from '../carve/buffers'
import { loftGeometry } from '../carve/loft'
import { PALETTE } from '../content/palette'
import {
  AXLE_X_IN,
  WEIGHT_SLOTS,
  type CarDesign,
  type DecalSlot,
} from '../model/carDesign'
import { decalTexture, numberTexture } from './carDecals'

/**
 * Sticker patch that DRAPES over the carved surface like a real decal:
 * a strip subdivided along x whose vertices follow the heightfield, so it
 * stays flush through scoops and slopes instead of clipping into them.
 * It also shrinks to the local surface so it never overhangs an edge.
 *  - kind 'top':  lies on yTop, width limited by the local half-width
 *  - kind 'side': lies on halfWidth (z), height limited by the local yTop
 */
function surfacePatch(
  buffers: CarveBuffers,
  kind: 'top' | 'side',
  xCenter: number,
  size: number,
  side: 1 | -1 = 1,
): BufferGeometry {
  const SEG = 16
  const LIFT = 0.02
  const half = size / 2
  const x0 = Math.max(0.05, xCenter - half)
  const x1 = Math.min(6.95, xCenter + half)

  const sampleY = (x: number) => buffers.yTop[idxAt(x)]!
  const sampleHW = (x: number) => buffers.halfWidth[idxAt(x)]!

  // shrink to the tightest cross-section under the footprint
  let minY = Infinity
  let minHW = Infinity
  for (let i = 0; i <= SEG; i++) {
    const x = x0 + ((x1 - x0) * i) / SEG
    minY = Math.min(minY, sampleY(x))
    minHW = Math.min(minHW, sampleHW(x))
  }

  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  if (kind === 'top') {
    const halfW = Math.min(half, minHW * 0.8)
    for (let i = 0; i <= SEG; i++) {
      const x = x0 + ((x1 - x0) * i) / SEG
      const y = sampleY(x) + LIFT
      positions.push(x, y, -halfW, x, y, halfW)
      // texture top faces the nose, like real hood art
      const v = 1 - i / SEG
      uvs.push(0, v, 1, v)
    }
  } else {
    const halfH = Math.min(half, minY * 0.4)
    for (let i = 0; i <= SEG; i++) {
      const x = x0 + ((x1 - x0) * i) / SEG
      const z = (sampleHW(x) + LIFT) * side
      const yMid = sampleY(x) * 0.5
      positions.push(x, yMid - halfH, z, x, yMid + halfH, z)
      const u = side > 0 ? i / SEG : 1 - i / SEG // keep glyphs unmirrored on both flanks
      uvs.push(u, 0, u, 1)
    }
  }

  for (let i = 0; i < SEG; i++) {
    const a = i * 2
    indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * The one car renderer, shared by garage preview, race scene, and thumbnails.
 * Geometry in inches; group origin at nose / body-bottom / centerline. Wheels
 * hang below y=0 — parents position the group so wheels touch the ground
 * (offset +WHEEL_DROP_IN if the ground is at y=0).
 */

export const WHEEL_RADIUS_IN = 0.59
export const AXLE_Y_IN = 0.3
export const WHEEL_DROP_IN = WHEEL_RADIUS_IN - AXLE_Y_IN // how far wheels hang below the body
const WHEEL_WIDTH_IN = 0.32
const RAISED_LIFT_IN = 0.09

export function CarBody({
  design,
  buffers,
}: {
  design: CarDesign
  buffers: CarveBuffers
}) {
  const geometry = useMemo(() => loftGeometry(buffers), [buffers])

  const bodyColor = PALETTE[design.paint.body] ?? PALETTE.brickRed
  const wheelColor = PALETTE[design.paint.wheels] ?? PALETTE.ink

  const wheels = useMemo(() => {
    const out: { x: number; z: number; raised: boolean }[] = []
    for (const axle of ['front', 'rear'] as const) {
      const x = AXLE_X_IN[axle]
      const hw = buffers.halfWidth[idxAt(x)]!
      for (const side of [-1, 1]) {
        out.push({
          x,
          z: side * (hw + WHEEL_WIDTH_IN / 2 + 0.02),
          raised: axle === 'front' && side === -1 && design.wheels.raised === 'frontLeft',
        })
      }
    }
    return out
  }, [buffers, design.wheels.raised])

  return (
    <group>
      <mesh geometry={geometry} castShadow={false} receiveShadow={false}>
        <meshStandardMaterial color={bodyColor} flatShading roughness={0.8} />
      </mesh>

      {wheels.map((w, i) => (
        /* wrapper group spins about z (the axle direction); RaceCars drives it */
        <group
          key={i}
          position={[w.x, AXLE_Y_IN + (w.raised ? RAISED_LIFT_IN : 0), w.z]}
          userData={{ isWheel: true, raised: w.raised }}
        >
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[WHEEL_RADIUS_IN, WHEEL_RADIUS_IN, WHEEL_WIDTH_IN, 14]} />
            <meshStandardMaterial color={wheelColor} flatShading roughness={0.9} />
          </mesh>
          {/* hub dot makes the spin visible */}
          <mesh position={[WHEEL_RADIUS_IN * 0.55, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, WHEEL_WIDTH_IN + 0.02, 8]} />
            <meshStandardMaterial color={PALETTE.paper} flatShading />
          </mesh>
        </group>
      ))}

      {/* weight plugs, sunk into the flat bottom like drilled-and-filled holes */}
      {design.weights.map((plug, i) => {
        const slot = WEIGHT_SLOTS[plug.slot]!
        return (
          <mesh key={`plug-${i}`} position={[slot.xIn, 0.02, slot.zIn]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 10]} />
            <meshStandardMaterial
              color={plug.kind === 'tungsten' ? '#b9bec7' : '#5a5e66'}
              flatShading
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        )
      })}

      {/* racing number roundels on both flanks */}
      <NumberPlates design={design} buffers={buffers} />

      {/* stickers */}
      {design.decals.map((d) => (
        <DecalQuad key={d.slot} slot={d.slot} decalId={d.decalId} buffers={buffers} />
      ))}
    </group>
  )
}

const yTopAt = (buffers: CarveBuffers, x: number) => buffers.yTop[idxAt(x)]!

function NumberPlates({ design, buffers }: { design: CarDesign; buffers: CarveBuffers }) {
  const texture = numberTexture(design.number)
  const geometries = useMemo(
    () =>
      ([1, -1] as const).map((side) => surfacePatch(buffers, 'side', 3.1, 0.85, side)),
    [buffers],
  )
  return (
    <>
      {geometries.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <StickerMaterial texture={texture} />
        </mesh>
      ))}
    </>
  )
}

/** stickers drape over the carved surface via surfacePatch — never clipped */
function DecalQuad({
  slot,
  decalId,
  buffers,
}: {
  slot: DecalSlot
  decalId: string
  buffers: CarveBuffers
}) {
  const texture = decalTexture(decalId)
  const geometries = useMemo(() => {
    if (slot === 'hood' || slot === 'roof') {
      return [surfacePatch(buffers, 'top', slot === 'hood' ? 1.5 : 4.7, 0.9)]
    }
    if (slot === 'tail') return null // flat cap, handled below
    const x = slot === 'sideFront' ? 1.5 : 4.9
    return ([1, -1] as const).map((side) => surfacePatch(buffers, 'side', x, 0.68, side))
  }, [slot, buffers])

  if (!texture) return null

  if (slot === 'tail') {
    const h = yTopAt(buffers, 6.9)
    const size = Math.min(0.6, h * 0.8)
    return (
      <mesh position={[7.01, h * 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[size, size]} />
        <StickerMaterial texture={texture} />
      </mesh>
    )
  }

  return (
    <>
      {geometries!.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <StickerMaterial texture={texture} />
        </mesh>
      ))}
    </>
  )
}

/** shared decal material: double-sided (patch winding varies with side) and
 * polygon-offset so it always sits visually on top of the body surface */
function StickerMaterial({ texture }: { texture: ReturnType<typeof decalTexture> }) {
  return (
    <meshBasicMaterial
      map={texture}
      transparent
      side={2 /* DoubleSide */}
      polygonOffset
      polygonOffsetFactor={-2}
    />
  )
}
