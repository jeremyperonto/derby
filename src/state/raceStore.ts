import { create } from 'zustand'
import { replayOps } from '../carve/replay'
import type { CarveBuffers } from '../carve/buffers'
import type { CarDesign } from '../model/carDesign'
import { deriveSimParams } from '../model/deriveSimParams'
import { recordBestTime } from '../lib/storage'
import { runRace, type RaceData } from '../sim/simulate'
import { buildTrack, type Track } from '../sim/track'
import { useAppStore } from './appStore'

/**
 * Race orchestration: derive params, run the WHOLE sim before anything
 * animates (CLAUDE.md rule 4), then let the scene replay it. The playback
 * clock is a mutable object (not reactive state) — useFrame advances it and
 * writes to refs; React never re-renders during a race.
 */

export interface LaneEntry {
  design: CarDesign
  buffers: CarveBuffers
  isPlayer: boolean
}

export interface Playback {
  /** race clock in seconds; negative = pre-gate ceremony */
  t: number
  playing: boolean
  timeScale: number
  /** set true once the results screen has been triggered */
  finished: boolean
}

interface RaceState {
  track: Track
  lanes: LaneEntry[]
  raceData: RaceData | null
  playback: Playback
  attempt: number

  startRace: (player: CarDesign, rivals: CarDesign[], seed?: number) => void
  rematch: () => void
  finishPlayback: () => void
}

const GATE_CEREMONY_S = 1.6

export const useRaceStore = create<RaceState>((set, get) => ({
  track: buildTrack(),
  lanes: [],
  raceData: null,
  playback: { t: 0, playing: false, timeScale: 1, finished: false },
  attempt: 0,

  startRace: (player, rivals, seed) => {
    const attempt = get().attempt + 1
    const designs = [rivals[0]!, player, rivals[1]!, rivals[2]!] // player in lane 2
    const lanes: LaneEntry[] = designs.map((design) => ({
      design,
      buffers: replayOps(design.carve.ops),
      isPlayer: design === player,
    }))
    const params = designs.map((d) => deriveSimParams(d).params)
    const raceData = runRace(params, seed ?? attempt * 7919 + 17)
    set({
      lanes,
      raceData,
      attempt,
      playback: { t: -GATE_CEREMONY_S, playing: true, timeScale: 1, finished: false },
    })
    useAppStore.getState().setScreen('race')
  },

  rematch: () => {
    const { lanes } = get()
    if (!lanes.length) return
    const player = lanes.find((l) => l.isPlayer)!.design
    const rivals = lanes.filter((l) => !l.isPlayer).map((l) => l.design)
    get().startRace(player, rivals)
  },

  finishPlayback: () => {
    const { playback, lanes, raceData } = get()
    if (playback.finished) return
    const playerLane = lanes.findIndex((l) => l.isPlayer)
    const playerTime = raceData?.lanes[playerLane]?.finishTime
    if (playerTime !== undefined && Number.isFinite(playerTime)) {
      recordBestTime(lanes[playerLane]!.design.id, playerTime)
    }
    set({ playback: { ...playback, finished: true } })
    useAppStore.getState().setScreen('results')
  },
}))
