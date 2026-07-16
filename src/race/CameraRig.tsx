import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { damp3 } from 'maath/easing'
import { sfx } from '../audio/audio'
import { WHEEL_DROP_IN } from '../garage/CarBody'
import { IN_TO_M } from '../lib/math'
import { useRaceStore } from '../state/raceStore'
import { CAR_LENGTH_M } from '../sim/tuning'
import { carPose, surfaceAt } from './trackGeometry'

/**
 * Race camera choreography, driven by the playback clock and the
 * PRE-COMPUTED race (we know the whole story before it plays):
 *   1. gate ceremony (t < 0): hero shot up the ramp, cars at the pin
 *   2. follow: floats above/behind the pack at ~45°, biased to the player
 *   3. finish approach: dollies to a trackside view at the line
 * Advances the playback clock; restores the garage camera on unmount.
 */

const PLAYER_LANE = 1
const FOLLOW_OFFSET = new Vector3(-20, 13, 27) // behind, above, toward the grandstand
const GARAGE_CAM = { position: new Vector3(0, 3.2, 10.5), target: new Vector3(0, 0, 0) }

export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const target = useRef(new Vector3())
  const lookAt = useRef(new Vector3())
  const initialized = useRef(false)
  const cheered = useRef(false)
  const snapped = useRef(false)

  useEffect(() => {
    initialized.current = false
    cheered.current = false
    snapped.current = false
    return () => {
      // hand the camera back to the garage/title framing
      camera.position.copy(GARAGE_CAM.position)
      camera.lookAt(GARAGE_CAM.target)
    }
  }, [camera])

  useFrame((_, delta) => {
    const { raceData, playback, track, photoFinish, freezeFrame } = useRaceStore.getState()
    if (!raceData || playback.finished) return

    const winnerTime = Math.min(...raceData.lanes.map((l) => l.finishTime))

    // slow-mo: ease the clock toward 0.12× over the last stretch of a photo finish
    if (photoFinish && !playback.frozen) {
      const tickNow = Math.min(raceData.ticks - 1, Math.floor(Math.max(0, playback.t) / raceData.dt))
      const lead = Math.max(...raceData.lanes.map((l) => l.s[tickNow]!))
      const targetScale = lead > track.lengthM - 1.6 ? 0.12 : 1
      playback.timeScale += (targetScale - playback.timeScale) * Math.min(1, delta * 4)
      if (targetScale < 1 && !snapped.current) {
        snapped.current = true
        sfx.camera()
      }
    }

    // advance the race clock (clamped delta guards tab-switch jumps)
    playback.t += Math.min(delta, 1 / 20) * playback.timeScale

    // the moment the winner crosses: cheer once; freeze if it's a photo finish
    if (playback.t >= winnerTime && !cheered.current) {
      cheered.current = true
      sfx.cheer()
      if (photoFinish) freezeFrame()
    }

    const t = Math.max(0, playback.t)
    const tick = Math.min(raceData.ticks - 1, Math.floor(t / raceData.dt))
    const playerS = raceData.lanes[PLAYER_LANE]!.s[tick]!
    const leaderS = Math.max(...raceData.lanes.map((l) => l.s[tick]!))

    const finishApproach = leaderS > track.lengthM - 2.4

    let desiredPos: Vector3
    let desiredLook: Vector3

    if (playback.t < 0) {
      // 1 — gate ceremony: low hero shot looking up the ramp at the pack
      const gate = surfaceAt(track, 0)
      desiredPos = new Vector3(gate.x + 34, gate.y + 6, 26)
      desiredLook = new Vector3(gate.x - 4, gate.y + 3, 0)
    } else if (!finishApproach) {
      // 2 — follow cam: pack centroid biased 70% toward the player
      const centroidS = raceData.lanes.reduce((sum, l) => sum + l.s[tick]!, 0) / raceData.lanes.length
      const focusS = playerS * 0.7 + centroidS * 0.3
      const pose = carPose(track, focusS, CAR_LENGTH_M)
      desiredLook = new Vector3(pose.x + 2, pose.y + 1.5, 0) // slight look-ahead
      desiredPos = desiredLook.clone().add(FOLLOW_OFFSET)
    } else {
      // 3 — trackside at the line
      const finish = surfaceAt(track, track.lengthM)
      desiredPos = new Vector3(finish.x - 16, finish.y + 10, 52)
      desiredLook = new Vector3(finish.x - 2, finish.y + 2 + WHEEL_DROP_IN, 0)
    }

    if (!initialized.current) {
      target.current.copy(desiredPos)
      lookAt.current.copy(desiredLook)
      initialized.current = true
    } else {
      damp3(target.current, desiredPos, 0.16, delta)
      damp3(lookAt.current, desiredLook, 0.14, delta)
    }
    camera.position.copy(target.current)
    camera.lookAt(lookAt.current)
  })

  return null
}

/** rough world x of the finish line in inches (for overlays that care) */
export function finishXIn(lengthM: number): number {
  return lengthM / IN_TO_M
}
