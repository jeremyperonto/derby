import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Sprite } from 'three'
import { CarBody, WHEEL_DROP_IN } from '../garage/CarBody'
import { medalTexture } from '../garage/carDecals'
import { useRaceStore } from '../state/raceStore'
import { CAR_LENGTH_M } from '../sim/tuning'
import { carPose, laneZ } from './trackGeometry'

/**
 * The four cars, replaying the precomputed sim, plus the floating place
 * medal that pops over each car the instant its nose crosses the line.
 * All per-frame updates go through refs — zero React re-renders during the
 * race (CLAUDE.md rule 7). Phase transitions live in CameraRig.
 */
export function RaceCars() {
  const lanes = useRaceStore((s) => s.lanes)
  const raceData = useRaceStore((s) => s.raceData)
  const groups = useRef<(Group | null)[]>([])
  const medals = useRef<(Sprite | null)[]>([])

  useFrame((_, delta) => {
    const { raceData: race, playback, track } = useRaceStore.getState()
    if (!race) return
    const t = Math.max(0, playback.t)
    const tickF = t / race.dt
    const i0 = Math.min(race.ticks - 1, Math.floor(tickF))
    const i1 = Math.min(race.ticks - 1, i0 + 1)
    const frac = tickF - i0

    for (let lane = 0; lane < race.lanes.length; lane++) {
      const g = groups.current[lane]
      if (!g) continue
      const trace = race.lanes[lane]!
      const s = trace.s[i0]! * (1 - frac) + trace.s[i1]! * frac
      const pose = carPose(track, s, CAR_LENGTH_M)
      g.position.set(pose.x, pose.y + WHEEL_DROP_IN, laneZ(lane))
      g.rotation.z = pose.pitch

      // spin the wheels to match ground speed (raised wheel stays still — kids notice)
      const vInPerS = trace.v[i0]! / 0.0254
      const spin = (vInPerS * delta * playback.timeScale) / 0.59 // ω = v/r
      if (spin > 0) {
        g.traverse((o) => {
          if (o.userData.isWheel && !o.userData.raised) o.rotation.z -= spin
        })
      }

      // place medal pops the moment this car's nose crosses the line
      const medal = medals.current[lane]
      if (medal) {
        const since = t - trace.finishTime
        if (since >= 0) {
          medal.visible = true
          const pop = Math.min(1, since / 0.22)
          const overshoot = 1 + 0.5 * Math.sin(Math.min(1, pop) * Math.PI) // springy pop
          const size = 3.4 * pop * overshoot
          medal.scale.set(size, size, 1)
          medal.position.set(pose.x - 3.5, pose.y + 4.6 + Math.min(1.2, since) * 0.8, laneZ(lane))
        } else {
          medal.visible = false // hides again when the replay rewinds — then re-pops
        }
      }
    }
  })

  return (
    <group>
      {lanes.map((entry, lane) => {
        const place = raceData ? raceData.order.indexOf(lane) : 3
        return (
          <group key={lane}>
            <group ref={(el) => (groups.current[lane] = el)}>
              {/* car geometry has its nose at local x=0 pointing −x; flip to run +x */}
              <group rotation={[0, Math.PI, 0]}>
                <CarBody design={entry.design} buffers={entry.buffers} />
              </group>
            </group>
            <sprite ref={(el) => (medals.current[lane] = el)} visible={false}>
              <spriteMaterial map={medalTexture(place)} transparent depthWrite={false} />
            </sprite>
          </group>
        )
      })}
    </group>
  )
}
