import type { CarSimParams } from '../model/deriveSimParams'
import { mulberry32 } from './rng'
import { buildTrack, type Track } from './track'
import { CAR_LENGTH_M, TUNING, type Tuning } from './tuning'

/**
 * The deterministic heart of the game (CLAUDE.md rules 2 & 4): the entire
 * heat is computed here BEFORE anything animates. The 3D race scene is a
 * replay of the returned tick arrays.
 *
 * Per-lane equation of motion (1D along the track arc, s = nose position):
 *
 *   m_eff · dv/dt =  m·g·sinφ(s_com)                        gravity at the CoM
 *                  − (μ_axle·(r_a/r_w) + μ_roll)·m·g·cosφ    axle + rolling friction
 *                  − ½·ρ·Cd·A·v² · aeroGain                  air drag
 *   m_eff = m + 4 · I_w/r_w²                                 wheels steal energy to spin
 *
 * Gravity is evaluated where the CENTER OF MASS sits on the track curve —
 * that single geometric fact reproduces the real rear-weight advantage
 * (more PE, released later) with no hacks.
 */

export interface LaneResult {
  /** nose arc position (m) per tick, from gate drop to finish (clamped after) */
  s: Float32Array
  /** speed (m/s) per tick */
  v: Float32Array
  /** sub-tick-interpolated finish time (s), Infinity if never finished */
  finishTime: number
  finishSpeed: number
}

export interface RaceData {
  dt: number
  ticks: number
  lanes: LaneResult[]
  /** lane indices ordered by finish time (winner first) */
  order: number[]
  /** finish-time gap to the winner per lane (s) */
  gapToWinner: number[]
  /** gap in car lengths at the winner's finish speed — kid-facing margin */
  marginLengths: number[]
  seed: number
}

export function runRace(
  cars: CarSimParams[],
  seed: number,
  t: Tuning = TUNING,
  track: Track = buildTrack(t),
): RaceData {
  const rng = mulberry32(seed)
  const dt = t.dt
  const maxTicks = Math.ceil(t.maxSimTimeS / dt)
  const S = track.lengthM

  interface Sim {
    s: number
    v: number
    finished: boolean
    /** finished AND coasted past the runout — stop integrating */
    done: boolean
    finishTime: number
    finishSpeed: number
    wobbleMu: number
    trace: { s: Float32Array; v: Float32Array }
  }

  const sims: Sim[] = cars.map(() => ({
    s: 0,
    v: 0,
    finished: false,
    done: false,
    finishTime: Infinity,
    finishSpeed: 0,
    // per-race, per-lane friction noise — the only randomness in a heat
    wobbleMu: 1 + t.wobble * (2 * rng() - 1),
    trace: { s: new Float32Array(maxTicks + 1), v: new Float32Array(maxTicks + 1) },
  }))

  let tick = 0
  for (; tick < maxTicks; tick++) {
    let allDone = true
    for (let lane = 0; lane < sims.length; lane++) {
      const sim = sims[lane]!
      const car = cars[lane]!
      sim.trace.s[tick] = sim.s
      sim.trace.v[tick] = sim.v
      if (sim.done) continue
      allDone = false

      const mEff = car.massKg + 4 * car.wheelIOverR2Kg
      const sCom = sim.s - comLeverM(car, t)
      const sinPhi = track.sinAt(sCom)
      const cosPhi = track.cosAt(sCom)

      const gravity = car.massKg * t.gravity * sinPhi
      const muTotal =
        (car.muAxle * sim.wobbleMu * (t.axleRadiusM / t.wheelRadiusM) + t.muRoll) *
        car.massKg *
        t.gravity *
        cosPhi
      const drag = 0.5 * t.airDensity * car.dragCd * car.frontalAreaM2 * sim.v * sim.v * t.aeroGain

      // (the vNext clamp below keeps friction from ever pushing a car backward)
      const a = (gravity - muTotal - drag) / mEff

      // semi-implicit Euler, fixed dt
      const vNext = Math.max(0, sim.v + a * dt)
      const sNext = sim.s + vNext * dt

      if (sNext >= S && !sim.finished) {
        const frac = vNext > 0 ? (S - sim.s) / (vNext * dt) : 0
        sim.finishTime = (tick + frac) * dt
        sim.finishSpeed = vNext
        sim.finished = true
      }
      // keep rolling through the runout past the line, then stop
      if (sNext >= S + t.coastPastFinishM || vNext === 0) {
        if (sim.finished) sim.done = true
      }
      sim.v = vNext
      sim.s = sNext
    }
    if (allDone) break
  }

  const ticks = tick
  const lanes: LaneResult[] = sims.map((sim) => ({
    s: sim.trace.s.slice(0, ticks),
    v: sim.trace.v.slice(0, ticks),
    finishTime: sim.finishTime,
    finishSpeed: sim.finishSpeed,
  }))

  const order = lanes
    .map((lane, i) => ({ i, ft: lane.finishTime }))
    .sort((a, b) => a.ft - b.ft)
    .map((x) => x.i)

  const winner = lanes[order[0]!]!
  const gapToWinner = lanes.map((lane) => lane.finishTime - winner.finishTime)
  const marginLengths = gapToWinner.map((gap) =>
    Number.isFinite(gap) ? (gap * winner.finishSpeed) / CAR_LENGTH_M : Infinity,
  )

  return { dt, ticks, lanes, order, gapToWinner, marginLengths, seed }
}

/**
 * Distance from the nose to the (gameplay-exaggerated) CoM along the car.
 * placementGain stretches the CoM's offset from neutral so kids can feel
 * placement; at gain 1 this is the physical CoM.
 */
function comLeverM(car: CarSimParams, t: Tuning): number {
  const neutralM = t.comNeutralIn * 0.0254
  return neutralM + (car.comFromNoseM - neutralM) * t.placementGain
}
