import { lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AboutScreen } from './app/AboutScreen'
import { TitleScreen } from './app/TitleScreen'
import { TitleShowcase } from './app/TitleShowcase'
import { BlueprintScreen } from './blueprint/BlueprintScreen'
import { PALETTE } from './content/palette'
import { GarageScene } from './garage/GarageScene'
import { GarageScreen } from './garage/GarageScreen'
import { CameraRig } from './race/CameraRig'
import { PreRaceCamera, PreRaceScreen } from './race/PreRaceScreen'
import { RaceCars } from './race/RaceCars'
import { RaceScreen } from './race/RaceScreen'
import { RivalSelectScreen } from './race/RivalSelectScreen'
import { TrackScene } from './race/TrackScene'
import { ResultsScreen } from './results/ResultsScreen'
import { WinnersCircle } from './results/WinnersCircle'
import { useAppStore } from './state/appStore'

const TuningPanel = lazy(() => import('./app/TuningPanel'))

// dev-only preserveDrawingBuffer lets tooling capture WebGL frames via
// toDataURL; stable module-level identity so the renderer is never rebuilt
const GL_OPTIONS = { preserveDrawingBuffer: import.meta.env.DEV } as const

/** 3D content per screen, inside the ONE persistent Canvas (never unmounted). */
function SceneRouter() {
  const screen = useAppStore((s) => s.screen)
  return (
    <>
      {/* one cream-paper sky everywhere — the whole game lives on the poster */}
      <color attach="background" args={[PALETTE.paper]} />
      <hemisphereLight args={[PALETTE.paper, PALETTE.kraft, 0.9]} />
      <directionalLight position={[4, 8, 6]} intensity={1.2} />
      {(screen === 'title' || screen === 'tuning') && <TitleShowcase />}
      {screen === 'garage' && <GarageScene />}
      {(screen === 'preRace' || screen === 'race') && (
        <>
          {/* TrackScene + RaceCars stay mounted across the line-up → race hand-off;
              only the camera swaps (static staging vs. the finish choreography) */}
          <TrackScene />
          <RaceCars />
          {screen === 'race' ? <CameraRig /> : <PreRaceCamera />}
        </>
      )}
      {screen === 'results' && <WinnersCircle />}
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
      {screen === 'about' && <AboutScreen />}
      {screen === 'garage' && <GarageScreen />}
      {screen === 'rivalSelect' && <RivalSelectScreen />}
      {screen === 'preRace' && <PreRaceScreen />}
      {screen === 'race' && <RaceScreen />}
      {screen === 'results' && <ResultsScreen />}
      {screen === 'blueprint' && <BlueprintScreen />}
      {screen === 'tuning' && (
        <Suspense fallback={null}>
          <TuningPanel />
        </Suspense>
      )}
    </>
  )
}
