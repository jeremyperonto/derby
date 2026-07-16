import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, InstancedMesh, Matrix4, MeshBasicMaterial } from 'three'
import { PALETTE } from '../content/palette'
import { IN_TO_M } from '../lib/math'
import { mulberry32 } from '../sim/rng'
import { useRaceStore } from '../state/raceStore'
import {
  DECK_HALF_WIDTH_IN,
  LANE_COUNT,
  laneZ,
  ribbonGeometry,
  surfaceAt,
} from './trackGeometry'

const FESTIVE = [PALETTE.brickRed, PALETTE.mustard, PALETTE.skyBlue, PALETTE.paper, PALETTE.orange]

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

      {/* winner lane lights, like a real derby finish gantry */}
      <FinishLights finishX={finish.x} finishY={finish.y} />

      {/* county-fair dressing: bunting pennants + a crowd of simple folk */}
      <Bunting />
      <Crowd finishX={finish.x} groundY={groundY} />
    </group>
  )
}

/**
 * Per-lane lights under the finish crossbar. Real derby tracks announce the
 * winner with an instant lane light — ours flashes the winner's lane the
 * moment their nose crosses (and blinks, because kids).
 */
function FinishLights({ finishX, finishY }: { finishX: number; finishY: number }) {
  const materials = useRef<(MeshBasicMaterial | null)[]>([])
  const OFF = PALETTE.navy
  const ON = PALETTE.mustard

  useFrame(() => {
    const { raceData, playback } = useRaceStore.getState()
    if (!raceData) return
    const winnerLane = raceData.order[0]!
    const winnerTime = raceData.lanes[winnerLane]!.finishTime
    const lit = Math.max(0, playback.t) >= winnerTime
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const material = materials.current[lane]
      if (material) material.color.set(lane === winnerLane && lit ? ON : OFF)
    }
  })

  return (
    <group>
      {Array.from({ length: LANE_COUNT }, (_, lane) => (
        <mesh key={lane} position={[finishX, finishY + 11.4, laneZ(lane)]}>
          <sphereGeometry args={[0.85, 10, 8]} />
          <meshBasicMaterial ref={(el) => (materials.current[lane] = el)} color={OFF} />
        </mesh>
      ))}
    </group>
  )
}

/** two strings of alternating pennant triangles along the flat run */
function Bunting() {
  const track = useRaceStore((s) => s.track)
  const ref = useRef<InstancedMesh>(null)
  const COUNT = 72

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new Matrix4()
    const color = new Color()
    for (let i = 0; i < COUNT; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const s = 3.2 + (i >> 1) * 0.26
      const p = surfaceAt(track, s)
      // pennants hang point-down from an imaginary string, drooping between posts
      m.makeRotationX(Math.PI)
      m.setPosition(
        p.x,
        p.y + 17 - Math.abs(Math.sin((i >> 1) * 0.9)) * 1.4,
        side * (DECK_HALF_WIDTH_IN + 5),
      )
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, color.set(FESTIVE[i % FESTIVE.length]!))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [track])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <coneGeometry args={[0.5, 1.3, 3]} />
      <meshBasicMaterial />
    </instancedMesh>
  )
}

/** blocky spectators clustered near the finish line */
function Crowd({ finishX, groundY }: { finishX: number; groundY: number }) {
  const ref = useRef<InstancedMesh>(null)
  const COUNT = 36

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const rng = mulberry32(7)
    const m = new Matrix4()
    const color = new Color()
    for (let i = 0; i < COUNT; i++) {
      const height = 3 + rng() * 2
      m.makeScale(1, height / 4, 1)
      // far side only — the finish camera films from the near side
      m.setPosition(
        finishX - 60 + rng() * 85,
        groundY + height / 2,
        -(DECK_HALF_WIDTH_IN + 8 + rng() * 16),
      )
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, color.set(FESTIVE[Math.floor(rng() * FESTIVE.length)]!))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [finishX, groundY])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <capsuleGeometry args={[1.1, 2.4, 2, 6]} />
      <meshStandardMaterial flatShading />
    </instancedMesh>
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
