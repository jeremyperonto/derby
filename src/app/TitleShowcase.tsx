import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { replayOps } from '../carve/replay'
import { PALETTE } from '../content/palette'
import { SHOWCASE_CARS } from '../content/showcase'
import { CarBody, WHEEL_DROP_IN } from '../garage/CarBody'

const HOLD_S = 3.4
const SWAP_S = 0.4

/**
 * Title-screen turntable: cycles through the showcase cars, squashing down
 * and popping back up between swaps while it slowly rotates.
 */
export function TitleShowcase() {
  const [index, setIndex] = useState(0)
  const turntable = useRef<Group>(null)
  const carGroup = useRef<Group>(null)
  const clock = useRef(0)

  const cars = useMemo(
    () => SHOWCASE_CARS.map((design) => ({ design, buffers: replayOps(design.carve.ops) })),
    [],
  )
  const car = cars[index % cars.length]!

  useFrame((_, delta) => {
    clock.current += delta
    if (turntable.current) turntable.current.rotation.y += delta * 0.5

    const g = carGroup.current
    if (!g) return
    const t = clock.current % (HOLD_S + SWAP_S)
    if (t > HOLD_S) {
      // squash out, swap at the midpoint, spring back in
      const k = (t - HOLD_S) / SWAP_S // 0..1
      const s = k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2
      const eased = 0.05 + 0.95 * s * s * (3 - 2 * s)
      g.scale.set(eased, eased, eased)
      if (k >= 0.5 && Math.floor(clock.current / (HOLD_S + SWAP_S)) !== index) {
        setIndex(Math.floor(clock.current / (HOLD_S + SWAP_S)) % cars.length)
      }
    } else {
      g.scale.set(1, 1, 1)
    }
  })

  return (
    <group position={[0, -2.3, 0]} scale={0.78}>
      <group ref={turntable}>
        <group ref={carGroup}>
          <group position={[-3.5, WHEEL_DROP_IN + 0.15, 0]}>
            <CarBody design={car.design} buffers={car.buffers} />
          </group>
        </group>
        {/* display stand */}
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
