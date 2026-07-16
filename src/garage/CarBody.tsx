import { useMemo } from 'react'
import type { CarveBuffers } from '../carve/buffers'
import { idxAt } from '../carve/buffers'
import { loftGeometry } from '../carve/loft'
import { PALETTE } from '../content/palette'
import { AXLE_X_IN, WEIGHT_SLOTS, type CarDesign } from '../model/carDesign'

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
        <mesh
          key={i}
          position={[w.x, AXLE_Y_IN + (w.raised ? RAISED_LIFT_IN : 0), w.z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[WHEEL_RADIUS_IN, WHEEL_RADIUS_IN, WHEEL_WIDTH_IN, 14]} />
          <meshStandardMaterial color={wheelColor} flatShading roughness={0.9} />
        </mesh>
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
    </group>
  )
}
