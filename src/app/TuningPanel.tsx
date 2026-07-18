import { useMemo, useState } from 'react'
import { TEST_CARS } from '../content/testCars'
import { deriveSimParams } from '../model/deriveSimParams'
import { runRace } from '../sim/simulate'
import { buildTrack } from '../sim/track'
import { CAR_LENGTH_M, TUNING, type Tuning } from '../sim/tuning'

/**
 * Dev-only balance workbench (reach via ?tuning in dev). Edits a local copy
 * of the tuning constants and re-runs the canonical cars live. When a tune
 * feels right, copy the JSON back into src/sim/tuning.ts and update the
 * golden test — deliberately (see CLAUDE.md).
 */

interface SliderDef {
  key: keyof Tuning
  label: string
  min: number
  max: number
  step: number
}

const SLIDERS: SliderDef[] = [
  { key: 'trackLengthM', label: 'track length (m)', min: 10, max: 14, step: 0.1 },
  { key: 'rampLengthM', label: 'ramp length (m)', min: 1.8, max: 3.2, step: 0.05 },
  { key: 'rampAngleDeg', label: 'ramp angle (°)', min: 18, max: 30, step: 0.5 },
  { key: 'muAxleBase', label: 'μ axle base', min: 0.1, max: 0.4, step: 0.005 },
  { key: 'frictionSpreadGain', label: 'friction spread gain', min: 0.2, max: 2, step: 0.05 },
  { key: 'placementGain', label: 'placement gain', min: 1, max: 8, step: 0.25 },
  { key: 'aeroGain', label: 'aero gain', min: 0.5, max: 6, step: 0.25 },
  { key: 'wobble', label: 'race wobble (±μ frac)', min: 0, max: 0.15, step: 0.005 },
  { key: 'pineDensityGcm3', label: 'pine density (g/cm³)', min: 0.3, max: 0.55, step: 0.01 },
]

const CAR_IDS = Object.keys(TEST_CARS) as (keyof typeof TEST_CARS)[]

export default function TuningPanel() {
  const [t, setT] = useState<Tuning>({ ...TUNING })

  const rows = useMemo(() => {
    const noWobble = { ...t, wobble: 0 }
    const track = buildTrack(noWobble)
    const derived = CAR_IDS.map((id) => ({ id, d: deriveSimParams(TEST_CARS[id]!, noWobble) }))
    const times = derived.map(({ id, d }) => {
      const race = runRace([d.params], 1, noWobble, track)
      return { id, d, time: race.lanes[0]!.finishTime, speed: race.lanes[0]!.finishSpeed }
    })
    const ref = times.find((r) => r.id === 'wedgeRacer')!
    return times.map((r) => ({
      ...r,
      marginLengths: ((r.time - ref.time) * ref.speed) / CAR_LENGTH_M,
    }))
  }, [t])

  const set = (key: keyof Tuning, value: number) => setT((prev) => ({ ...prev, [key]: value }))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'auto',
        background: 'var(--paper)',
        color: 'var(--ink)',
        padding: 24,
        fontFamily: 'ui-monospace, monospace',
        fontSize: 13,
        zIndex: 10,
      }}
    >
      <h2 style={{ marginBottom: 4 }}>Tuning Panel (dev)</h2>
      <p style={{ marginBottom: 16, color: 'var(--navy)' }}>
        Targets (lengths vs Wedge Racer): weight ~4 · placement ~2–3 · friction ~2 · aero ~1
      </p>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 340 }}>
          {SLIDERS.map(({ key, label, min, max, step }) => (
            <label key={key} style={{ display: 'block', marginBottom: 10 }}>
              <span style={{ display: 'inline-block', width: 190 }}>{label}</span>
              <b style={{ display: 'inline-block', width: 60 }}>{(t[key] as number).toFixed(3)}</b>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={t[key] as number}
                onChange={(e) => set(key, Number(e.target.value))}
                style={{ width: 260, verticalAlign: 'middle' }}
              />
            </label>
          ))}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              onClick={() => setT({ ...TUNING })}
              style={btnStyle}
            >
              reset
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(JSON.stringify(t, null, 2))}
              style={btnStyle}
            >
              copy tuning JSON
            </button>
          </div>
        </div>

        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['car', 'time (s)', 'vs ref (lengths)', 'oz', 'CoM (in)', 'Cd', 'μ axle'].map(
                (h) => (
                  <th key={h} style={cellStyle}>
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={r.id === 'wedgeRacer' ? { background: '#e8dcbf' } : undefined}>
                <td style={cellStyle}>{TEST_CARS[r.id]!.name}</td>
                <td style={cellStyle}>{r.time.toFixed(3)}</td>
                <td style={{ ...cellStyle, color: r.marginLengths > 0.01 ? 'var(--brick-red)' : 'var(--forest)' }}>
                  {r.marginLengths >= 0 ? '+' : ''}
                  {r.marginLengths.toFixed(2)}
                </td>
                <td style={cellStyle}>{r.d.totalOz.toFixed(2)}</td>
                <td style={cellStyle}>{r.d.comXIn.toFixed(2)}</td>
                <td style={cellStyle}>{r.d.params.dragCd.toFixed(2)}</td>
                <td style={cellStyle}>{r.d.params.muAxle.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const cellStyle: React.CSSProperties = {
  border: '1px solid var(--kraft)',
  padding: '4px 10px',
  textAlign: 'right',
}

const btnStyle: React.CSSProperties = {
  border: '2px solid var(--ink)',
  borderRadius: 6,
  padding: '6px 12px',
  background: 'var(--mustard)',
  fontWeight: 700,
}
