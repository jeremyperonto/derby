import { lazy, Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { TitleScreen } from './app/TitleScreen'
import { PALETTE } from './content/palette'
import { GarageScene } from './garage/GarageScene'
import { GarageScreen } from './garage/GarageScreen'
import { CameraRig } from './race/CameraRig'
import { RaceCars } from './race/RaceCars'
import { RaceScreen } from './race/RaceScreen'
import { RivalSelectScreen } from './race/RivalSelectScreen'
import { TrackScene } from './race/TrackScene'
import { ResultsScreen } from './results/ResultsScreen'
import { useAppStore } from './state/appStore'

const TuningPanel = lazy(() => import('./app/TuningPanel'))

// dev-only preserveDrawingBuffer lets tooling capture WebGL frames via
// toDataURL; stable module-level identity so the renderer is never rebuilt
const GL_OPTIONS = { preserveDrawingBuffer: import.meta.env.DEV } as const

/** Title-screen hero: a slowly tumbling raw pine block, waiting to be carved. */
function TitleBlock() {
  const group = useRef<Group>(null)
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.5
  })
  return (
    <group ref={group} rotation={[0.15, 0, 0.04]}>
      <mesh>
        <boxGeometry args={[7, 1.25, 1.75]} />
        <meshStandardMaterial color={PALETTE.pine} flatShading />
      </mesh>
    </group>
  )
}

/** 3D content per screen, inside the ONE persistent Canvas (never unmounted). */
function SceneRouter() {
  const screen = useAppStore((s) => s.screen)
  return (
    <>
      <color attach="background" args={[PALETTE.skyBlue]} />
      <hemisphereLight args={[PALETTE.paper, PALETTE.kraft, 0.9]} />
      <directionalLight position={[4, 8, 6]} intensity={1.2} />
      {(screen === 'title' || screen === 'tuning') && <TitleBlock />}
      {screen === 'garage' && <GarageScene />}
      {(screen === 'race' || screen === 'results') && (
        <>
          <TrackScene />
          <RaceCars />
          <CameraRig />
        </>
      )}
    </>
  )
}

export default function App() {
  const screen = useAppStore((s) => s.screen)

  return (
    <>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 3.2, 10.5], fov: 40 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={GL_OPTIONS}
      >
        <SceneRouter />
      </Canvas>

      {screen === 'title' && <TitleScreen />}
      {screen === 'garage' && <GarageScreen />}
      {screen === 'rivalSelect' && <RivalSelectScreen />}
      {screen === 'race' && <RaceScreen />}
      {screen === 'results' && <ResultsScreen />}
      {screen === 'tuning' && (
        <Suspense fallback={null}>
          <TuningPanel />
        </Suspense>
      )}
    </>
  )
}
