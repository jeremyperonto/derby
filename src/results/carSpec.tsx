import { AXLE_X_IN, type CarDesign } from '../model/carDesign'
import { deriveSimParams } from '../model/deriveSimParams'

/**
 * Kid-friendly spec lines for a car — the single source of truth shared by the
 * results "how it was built" panel and the pre-race line-up. Turns the derived
 * physics (weight, balance, axle prep, drag) into plain words.
 */

const POLISH_WORDS = ['rough', 'sanded', 'smooth', 'mirror']

export interface SpecLine {
  label: string
  value: string
}

export function describeCar(design: CarDesign): SpecLine[] {
  const spec = deriveSimParams(design)
  const { polish, graphite } = design.wheels
  const behindRearAxle = AXLE_X_IN.rear - spec.comXIn
  const inZone = behindRearAxle >= 0.25 && behindRearAxle <= 1.5
  const shape =
    spec.params.dragCd <= 0.58
      ? 'slippery as a fish'
      : spec.params.dragCd <= 0.72
        ? 'sleek and low'
        : spec.params.dragCd <= 0.9
          ? 'a bit boxy'
          : 'a flying brick'
  return [
    { label: 'Weight', value: `${spec.totalOz.toFixed(1)} oz of 5${spec.totalOz >= 4.75 ? ' — loaded up!' : ''}` },
    {
      label: 'Balance',
      value:
        behindRearAxle >= 0
          ? `${behindRearAxle.toFixed(1)}″ ahead of the rear axle${inZone ? ' — heavy in the back!' : ''}`
          : 'behind the rear axle!',
    },
    {
      label: 'Axles',
      value: `${POLISH_WORDS[polish]} polish · ${graphite === 0 ? 'no' : graphite} puff${graphite === 1 ? '' : 's'} of graphite`,
    },
    { label: 'Shape', value: shape },
  ]
}

export function SpecRow({ label, value }: SpecLine) {
  return (
    <>
      <span className="lp-label" style={{ fontSize: '0.64rem', alignSelf: 'center', color: 'var(--navy)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic' }}>{value}</span>
    </>
  )
}
