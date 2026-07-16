import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { CarBody, WHEEL_DROP_IN } from '../garage/CarBody'
import { useRaceStore } from '../state/raceStore'
import { CAR_LENGTH_M } from '../sim/tuning'
import { carPose, laneZ } from './trackGeometry'

/**
 * The four cars, replaying the precomputed sim. All per-frame updates go
 * through refs — zero React re-renders during the race (CLAUDE.md rule 7).
 */
export function RaceCars() {
  const lanes = useRaceStore((s) => s.lanes)
  const groups = useRef<(Group | null)[]>([])

  useFrame(() => {
    const { raceData, playback, track, finishPlayback } = useRaceStore.getState()
    if (!raceData) return
    const t = Math.max(0, playback.t)
    const tickF = t / raceData.dt
    const i0 = Math.min(raceData.ticks - 1, Math.floor(tickF))
    const i1 = Math.min(raceData.ticks - 1, i0 + 1)
    const frac = tickF - i0

    for (let lane = 0; lane < raceData.lanes.length; lane++) {
      const g = groups.current[lane]
      if (!g) continue
      const trace = raceData.lanes[lane]!
      const s = trace.s[i0]! * (1 - frac) + trace.s[i1]! * frac
      const pose = carPose(track, s, CAR_LENGTH_M)
      g.position.set(pose.x, pose.y + WHEEL_DROP_IN, laneZ(lane))
      g.rotation.z = pose.pitch
    }

    // hand off to results shortly after the last car (or timeout) finishes
    const lastFinish = Math.max(...raceData.lanes.map((l) => Math.min(l.finishTime, 12)))
    if (playback.t > lastFinish + 1.4) finishPlayback()
  })

  return (
    <group>
      {lanes.map((entry, lane) => (
        <group key={lane} ref={(el) => (groups.current[lane] = el)}>
          {/* car geometry has its nose at local x=0 pointing −x; flip to run +x */}
          <group rotation={[0, Math.PI, 0]}>
            <CarBody design={entry.design} buffers={entry.buffers} />
          </group>
        </group>
      ))}
    </group>
  )
}
