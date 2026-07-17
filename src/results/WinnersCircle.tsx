import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { PALETTE } from '../content/palette'
import { CarBody, WHEEL_DROP_IN } from '../garage/CarBody'
import { useRaceStore } from '../state/raceStore'

/**
 * Results-screen 3D: the winning car — full paint, number, stickers —
 * rotating on the turntable like the homepage showcase, positioned
 * right-of-center so the results panel sits beside it.
 */
export function WinnersCircle() {
  const raceData = useRaceStore((s) => s.raceData)
  const lanes = useRaceStore((s) => s.lanes)
  const turntable = useRef<Group>(null)

  useFrame((_, delta) => {
    if (turntable.current) turntable.current.rotation.y += delta * 0.5
  })

  if (!raceData || !lanes.length) return null
  const winner = lanes[raceData.order[0]!]!

  return (
    <group position={[3.1, -1.1, 0]} scale={0.9}>
      <group ref={turntable}>
        <group position={[-3.5, WHEEL_DROP_IN + 0.15, 0]}>
          <CarBody design={winner.design} buffers={winner.buffers} />
        </group>
        {/* winner's-circle stand */}
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[4.3, 4.6, 0.32, 28]} />
          <meshStandardMaterial color={PALETTE.kraft} flatShading />
        </mesh>
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.9, 28]} />
          <meshBasicMaterial color={PALETTE.ink} transparent opacity={0.1} />
        </mesh>
      </group>
    </group>
  )
}
