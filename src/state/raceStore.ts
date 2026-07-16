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
  /** 'live' = the race itself; 'replay' = the automatic slow-mo second look */
  phase: 'live' | 'replay'
  /** the instant replay has already run once */
  replayed: boolean
  /** photo-finish freeze frame is being shown */
  frozen: boolean
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
  /** top two finishers within 60 ms — trigger the slow-mo photo finish */
  photoFinish: boolean

  startRace: (player: CarDesign, rivalId: string) => void
  rematch: () => void
  freezeFrame: () => void
  startReplay: () => void
  finishPlayback: () => void
}

/** instant-replay window: rewind this far before the winner's crossing… */
export const REPLAY_REWIND_S = 0.75
/** …and run until this long after it, at REPLAY_SPEED */
export const REPLAY_TAIL_S = 0.5
export const REPLAY_SPEED = 0.35

const GATE_CEREMONY_S = 1.6
export const PLAYER_LANE = 1
export const RIVAL_LANE = 2

export const useRaceStore = create<RaceState>((set, get) => ({
  track: buildTrack(),
  lanes: [],
  laneParams: [],
  raceData: null,
  playback: {
    t: 0,
    playing: false,
    timeScale: 1,
    phase: 'live',
    replayed: false,
    frozen: false,
    finished: false,
  },
  attempt: 0,
  rivalId: null,
  photoFinish: false,

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
    const sorted = raceData.lanes.map((l) => l.finishTime).sort((a, b) => a - b)
    const photoFinish = Number.isFinite(sorted[1]!) && sorted[1]! - sorted[0]! < 0.06
    set({
      lanes,
      laneParams,
      raceData,
      attempt,
      rivalId,
      photoFinish,
      playback: {
        t: -GATE_CEREMONY_S,
        playing: true,
        timeScale: 1,
        phase: 'live',
        replayed: false,
        frozen: false,
        finished: false,
      },
    })
    useAppStore.getState().setScreen('race')
  },

  rematch: () => {
    const { lanes, rivalId } = get()
    const player = lanes.find((l) => l.isPlayer)?.design
    if (!player || !rivalId) return
    get().startRace(player, rivalId)
  },

  freezeFrame: () => {
    const { playback } = get()
    if (playback.frozen || playback.finished) return
    playback.timeScale = 0
    set({ playback: { ...playback, frozen: true } })
    // after the freeze-frame beat, roll the instant replay (then results)
    setTimeout(() => {
      if (get().playback.replayed) get().finishPlayback()
      else get().startReplay()
    }, 1800)
  },

  startReplay: () => {
    const { playback, raceData } = get()
    if (!raceData || playback.replayed || playback.finished) return
    const winnerTime = Math.min(...raceData.lanes.map((l) => l.finishTime))
    if (!Number.isFinite(winnerTime)) {
      get().finishPlayback()
      return
    }
    playback.t = Math.max(0, winnerTime - REPLAY_REWIND_S)
    playback.timeScale = REPLAY_SPEED
    set({ playback: { ...playback, phase: 'replay', replayed: true, frozen: false } })
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
