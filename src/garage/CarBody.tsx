import { useMemo } from 'react'
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
const halfWidthAt = (buffers: CarveBuffers, x: number) => buffers.halfWidth[idxAt(x)]!

function NumberPlates({ design, buffers }: { design: CarDesign; buffers: CarveBuffers }) {
  const texture = numberTexture(design.number)
  const x = 3.1
  const h = yTopAt(buffers, x)
  const size = Math.min(0.85, h * 0.85)
  const y = h * 0.52
  const z = halfWidthAt(buffers, x) + 0.015
  return (
    <>
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[x, y, side * z]}
          rotation={[0, side > 0 ? 0 : Math.PI, 0]}
        >
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      ))}
    </>
  )
}

/** sticker positions on the carved surface, tilted to lie on it */
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
  if (!texture) return null

  if (slot === 'hood' || slot === 'roof') {
    const x = slot === 'hood' ? 1.5 : 4.7
    const y = yTopAt(buffers, x) + 0.02
    // tilt to the local top-surface slope so the sticker lies flat on it
    const slope = Math.atan2(yTopAt(buffers, x + 0.3) - yTopAt(buffers, x - 0.3), 0.6)
    const size = Math.min(0.9, halfWidthAt(buffers, x) * 1.7)
    return (
      <group position={[x, y, 0]} rotation={[0, 0, slope]}>
        <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      </group>
    )
  }

  if (slot === 'tail') {
    const y = yTopAt(buffers, 6.9) * 0.5
    const size = Math.min(0.6, yTopAt(buffers, 6.9) * 0.8)
    return (
      <mesh position={[7.01, y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={texture} transparent />
      </mesh>
    )
  }

  const x = slot === 'sideFront' ? 1.5 : 4.9
  const h = yTopAt(buffers, x)
  const size = Math.min(0.65, h * 0.8)
  const z = halfWidthAt(buffers, x) + 0.015
  return (
    <>
      {[1, -1].map((side) => (
        <mesh key={side} position={[x, h * 0.5, side * z]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      ))}
    </>
  )
}
