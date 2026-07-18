/**
 * ALL physics constants and gameplay-balance knobs live here — nowhere else
 * (CLAUDE.md rule 6). The dev tuning panel (?tuning) edits these live.
 *
 * Factor-spread targets on a ~3 s heat, in car lengths (1 length ≈ 178 mm):
 *   total weight (3.5→5 oz) ~4 · placement (nose→rear) ~2–3 · friction ~2 ·
 *   aero (brick→wedge) ~1 · seeded wobble ±0.3
 */
export interface Tuning {
  // --- track geometry ---
  trackLengthM: number
  rampAngleDeg: number
  rampLengthM: number
  transitionRadiusM: number
  startPadM: number // table extends this far behind the gate (CoM sits behind the nose)

  // --- integration ---
  dt: number
  maxSimTimeS: number
  /** cars keep coasting this far past the line (finish times unaffected) */
  coastPastFinishM: number

  // --- world ---
  gravity: number
  airDensity: number

  // --- materials & hardware ---
  pineDensityGcm3: number
  wheelMassG: number
  axleMassG: number
  wheelIOverR2G: number // effective rotational mass per spinning wheel (k·m_wheel)
  wheelRadiusM: number
  axleRadiusM: number
  wheelFrontalAreaM2: number // exposed wheel slivers, added to body frontal area

  // --- friction ---
  muRoll: number
  muAxleBase: number
  polishCut: [number, number, number, number] // μ reduction per polish level 0–3
  graphiteCut: [number, number, number, number] // μ reduction per graphite level 0–3

  // --- aero (Cd heuristic from carve profile) ---
  cdBase: number
  cdBluntGain: number // penalty × (front cross-section fraction)
  cdTaperCredit: number // credit × (1 − rear cross-section fraction)
  cdEdgeCredit: number // credit × (edgeRadius / max radius)
  cdMin: number
  cdMax: number

  // --- per-factor gameplay gains (spread multipliers, physical form unchanged) ---
  aeroGain: number // multiplies the whole drag term (reality is too subtle for kids)
  placementGain: number // exaggerates CoM distance from neutral along the car
  frictionSpreadGain: number // scales (μ − μ_mid) about the mid prep level
  comNeutralIn: number // inches from nose considered "neutral" placement
  muMid: number // μ pivot for frictionSpreadGain

  // --- per-race variation ---
  wobble: number // fractional friction noise per car per race (seeded)
}

export const TUNING: Tuning = {
  trackLengthM: 12.2, // ~40 ft
  rampAngleDeg: 24,
  rampLengthM: 2.5, // + transition drop ⇒ ~1.3 m start height
  transitionRadiusM: 3.5,
  startPadM: 0.5,

  dt: 1 / 240,
  maxSimTimeS: 15,
  coastPastFinishM: 1.8,

  gravity: 9.81,
  airDensity: 1.2,

  pineDensityGcm3: 0.4,
  wheelMassG: 2.6,
  axleMassG: 2.0,
  wheelIOverR2G: 1.7,
  wheelRadiusM: 0.0151,
  axleRadiusM: 0.0011,
  wheelFrontalAreaM2: 0.0006,

  muRoll: 0.002,
  muAxleBase: 0.3,
  polishCut: [0, 0.07, 0.12, 0.15],
  graphiteCut: [0, 0.04, 0.06, 0.07],

  cdBase: 0.55,
  cdBluntGain: 0.45,
  cdTaperCredit: 0.15,
  cdEdgeCredit: 0.1,
  cdMin: 0.35,
  cdMax: 1.05,

  aeroGain: 2.5,
  placementGain: 4.5,
  frictionSpreadGain: 0.7,
  comNeutralIn: 3.5,
  muMid: 0.19,

  wobble: 0.05,
}

/** One "car length" in meters — margins are reported to kids in car lengths. */
export const CAR_LENGTH_M = 0.1778 // 7 inches
