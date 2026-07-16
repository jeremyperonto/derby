import { create } from 'zustand'
import { replayOps } from '../carve/replay'
import type { CarveBuffers } from '../carve/buffers'
import { generateFillerDesign, rivalById } from '../content/rivals'
import { recordBestTime } from '../lib/storage'
import type { CarDesign } from '../model/carDesign'
import { deriveSimParams, type CarSimParams } from '../model/deriveSimParams'
import { hashSeed, mulberry32 } from '../sim/rng'
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
  isRival: boolean
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
  laneParams: CarSimParams[]
  raceData: RaceData | null
  playback: Playback
  attempt: number
  /** ladder rival this heat is against (null = practice race) */
  rivalId: string | null

  startRace: (player: CarDesign, rivalId: string) => void
  rematch: () => void
  finishPlayback: () => void
}

const GATE_CEREMONY_S = 1.6
export const PLAYER_LANE = 1
export const RIVAL_LANE = 2

export const useRaceStore = create<RaceState>((set, get) => ({
  track: buildTrack(),
  lanes: [],
  laneParams: [],
  raceData: null,
  playback: { t: 0, playing: false, timeScale: 1, finished: false },
  attempt: 0,
  rivalId: null,

  startRace: (player, rivalId) => {
    const rival = rivalById(rivalId)
    if (!rival) return
    const attempt = get().attempt + 1
    const seed = hashSeed(`${rivalId}:${attempt}:${player.id}`)

    // lanes: filler, PLAYER, RIVAL, filler — fillers seeded from the race seed
    const fillerRng = mulberry32(seed ^ 0x9e3779b9)
    const designs = [
      generateFillerDesign(fillerRng),
      player,
      rival.design,
      generateFillerDesign(fillerRng),
    ]
    const lanes: LaneEntry[] = designs.map((design, lane) => ({
      design,
      buffers: replayOps(design.carve.ops),
      isPlayer: lane === PLAYER_LANE,
      isRival: lane === RIVAL_LANE,
    }))
    const laneParams = designs.map((d) => deriveSimParams(d).params)
    const raceData = runRace(laneParams, seed)
    set({
      lanes,
      laneParams,
      raceData,
      attempt,
      rivalId,
      playback: { t: -GATE_CEREMONY_S, playing: true, timeScale: 1, finished: false },
    })
    useAppStore.getState().setScreen('race')
  },

  rematch: () => {
    const { lanes, rivalId } = get()
    const player = lanes.find((l) => l.isPlayer)?.design
    if (!player || !rivalId) return
    get().startRace(player, rivalId)
  },

  finishPlayback: () => {
    const { playback, lanes, raceData } = get()
    if (playback.finished) return
    const playerTime = raceData?.lanes[PLAYER_LANE]?.finishTime
    if (playerTime !== undefined && Number.isFinite(playerTime)) {
      recordBestTime(lanes[PLAYER_LANE]!.design.id, playerTime)
    }
    set({ playback: { ...playback, finished: true } })
    useAppStore.getState().setScreen('results')
  },
}))
