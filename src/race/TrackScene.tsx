import { useMemo } from 'react'
import { PALETTE } from '../content/palette'
import { IN_TO_M } from '../lib/math'
import { useRaceStore } from '../state/raceStore'
import {
  DECK_HALF_WIDTH_IN,
  LANE_COUNT,
  laneZ,
  ribbonGeometry,
  surfaceAt,
} from './trackGeometry'

/**
 * Static race world: track deck + lane guide rails + gate/finish dressing +
 * ground. All static geometry is memoized once per track. Props get their
 * art pass in M6 — this is the playable skeleton.
 */
export function TrackScene() {
  const track = useRaceStore((s) => s.track)

  const fromM = -0.6
  const toM = track.lengthM + 2

  const deck = useMemo(() => ribbonGeometry(track, fromM, toM, 0, DECK_HALF_WIDTH_IN * 2), [track])
  const rails = useMemo(
    () =>
      Array.from({ length: LANE_COUNT }, (_, lane) =>
        ribbonGeometry(track, fromM, toM, laneZ(lane), 1.6, 0.12),
      ),
    [track],
  )

  const finish = surfaceAt(track, track.lengthM)
  const gate = surfaceAt(track, 0)
  const groundY = -3

  return (
    <group>
      {/* ground */}
      <mesh position={[finish.x / 2, groundY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1400, 700]} />
        <meshStandardMaterial color={PALETTE.forest} />
      </mesh>

      {/* track deck + side skirts */}
      <mesh geometry={deck}>
        <meshStandardMaterial color={PALETTE.pine} flatShading />
      </mesh>
      {rails.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color={PALETTE.kraft} flatShading />
        </mesh>
      ))}

      {/* starting gate posts */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[gate.x, gate.y + 4, side * (DECK_HALF_WIDTH_IN + 2)]}>
          <boxGeometry args={[1.2, 8, 1.2]} />
          <meshStandardMaterial color={PALETTE.brickRed} flatShading />
        </mesh>
      ))}

      {/* finish gantry: posts + checkered crossbar */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[finish.x, finish.y + 7, side * (DECK_HALF_WIDTH_IN + 2)]}>
          <boxGeometry args={[1.4, 14, 1.4]} />
          <meshStandardMaterial color={PALETTE.navy} flatShading />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh
          key={i}
          position={[
            finish.x,
            finish.y + 13.3,
            -DECK_HALF_WIDTH_IN - 1 + ((DECK_HALF_WIDTH_IN + 1) * 2 * (i + 0.5)) / 12,
          ]}
        >
          <boxGeometry args={[0.6, 2.4, ((DECK_HALF_WIDTH_IN + 1) * 2) / 12]} />
          <meshStandardMaterial color={i % 2 ? PALETTE.paper : PALETTE.ink} flatShading />
        </mesh>
      ))}

      {/* finish line painted on the deck */}
      <mesh
        position={[finish.x, finish.y + 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[2.5, DECK_HALF_WIDTH_IN * 2]} />
        <meshBasicMaterial color={PALETTE.paper} />
      </mesh>

      {/* start-hill scenery marker: a big sun behind the gate */}
      <mesh position={[gate.x - 60, gate.y + 30, -120]}>
        <circleGeometry args={[22, 20]} />
        <meshBasicMaterial color={PALETTE.mustard} />
      </mesh>
    </group>
  )
}

/** camera helper: world-inch positions the rig needs */
export function trackLandmarks(track: ReturnType<typeof useRaceStore.getState>['track']) {
  return {
    gate: surfaceAt(track, 0),
    finish: surfaceAt(track, track.lengthM),
    finishApproachM: track.lengthM - 2.2,
    lengthIn: track.lengthM / IN_TO_M,
  }
}
