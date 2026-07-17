import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useGarageStore } from '../state/garageStore'
import { CarBody, WHEEL_DROP_IN } from './CarBody'
import { PALETTE } from '../content/palette'

/**
 * 3D garage preview inside the persistent Canvas: the live car on a slowly
 * turning display stand, positioned right-of-center so the carve panel
 * (left overlay) doesn't cover it.
 */
export function GarageScene() {
  const design = useGarageStore((s) => s.design)
  const buffers = useGarageStore((s) => s.buffers)
  const turntable = useRef<Group>(null)

  useFrame((_, delta) => {
    if (turntable.current) turntable.current.rotation.y += delta * 0.35
  })

  return (
    <group position={[2.6, -0.4, 0]}>
      <group ref={turntable}>
        {/* car centered on the turntable, wheels resting on it */}
        <group position={[-3.5, WHEEL_DROP_IN, 0]}>
          <CarBody design={design} buffers={buffers} />
        </group>
        {/* display stand */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[4.3, 4.6, 0.3, 28]} />
          <meshStandardMaterial color={PALETTE.kraft} flatShading />
        </mesh>
        {/* soft blob shadow */}
        <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.9, 24]} />
          <meshBasicMaterial color={PALETTE.ink} transparent opacity={0.12} />
        </mesh>
      </group>
    </group>
  )
}
