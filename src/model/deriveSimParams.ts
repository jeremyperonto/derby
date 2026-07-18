import { measureBody } from '../carve/measure'
import { replayOps } from '../carve/replay'
import { G_TO_KG, IN_TO_M, OZ_TO_KG } from '../lib/math'
import { TUNING, type Tuning } from '../sim/tuning'
import {
  AXLE_X_IN,
  PLUG_OZ,
  WEIGHT_SLOTS,
  type CarDesign,
} from './carDesign'

/**
 * THE mapping from garage choices to physics — one pure function
 * (CLAUDE.md rule 5). Everything the sim knows about a car is here.
 */
export interface CarSimParams {
  massKg: number
  /** center of mass, meters behind the nose */
  comFromNoseM: number
  frontalAreaM2: number
  dragCd: number
  muAxle: number
  /** effective rotational mass per wheel, kg (all four spin) */
  wheelIOverR2Kg: number
}

export interface DerivedCar {
  params: CarSimParams
  /** garage-meter extras */
  totalOz: number
  bodyOz: number
  comXIn: number
  overweight: boolean
}

export function deriveSimParams(design: CarDesign, t: Tuning = TUNING): DerivedCar {
  const buffers = replayOps(design.carve.ops)
  const body = measureBody(buffers, t)

  // --- mass & CoM: body integral + plugs at their slots + wheels/axles at the axles ---
  const bodyKg = body.bodyMassG * G_TO_KG
  const wheelHardwareKg = (t.wheelMassG + t.axleMassG) * G_TO_KG // per corner
  let massKg = bodyKg
  let momentKgIn = bodyKg * body.comXIn

  for (const plug of design.weights) {
    const slot = WEIGHT_SLOTS[plug.slot]
    if (!slot) continue
    const kg = PLUG_OZ[plug.kind] * OZ_TO_KG
    massKg += kg
    momentKgIn += kg * slot.xIn
  }

  for (const axleX of [AXLE_X_IN.front, AXLE_X_IN.front, AXLE_X_IN.rear, AXLE_X_IN.rear]) {
    massKg += wheelHardwareKg
    momentKgIn += wheelHardwareKg * axleX
  }

  const comXIn = momentKgIn / massKg

  // --- friction from wheel prep ---
  const { polish, graphite } = design.wheels
  let muAxle =
    t.muAxleBase - t.polishCut[polish]! - t.graphiteCut[graphite]!
  // spread gain pivots about the mid prep level so the mean stays put
  muAxle = t.muMid + (muAxle - t.muMid) * t.frictionSpreadGain

  const totalOz = massKg / OZ_TO_KG

  return {
    params: {
      massKg,
      comFromNoseM: comXIn * IN_TO_M,
      frontalAreaM2: body.frontalAreaM2 + t.wheelFrontalAreaM2,
      dragCd: body.dragCd,
      muAxle,
      wheelIOverR2Kg: t.wheelIOverR2G * G_TO_KG,
    },
    totalOz,
    bodyOz: bodyKg / OZ_TO_KG,
    comXIn,
    overweight: totalOz > 5.0 + 1e-9,
  }
}
