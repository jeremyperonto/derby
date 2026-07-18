import { useGarageStore } from '../state/garageStore'
import { Fieldset, Seg } from '../ui/Fieldset'

/**
 * Wheels station: axle polish + graphite — the friction lessons, each a
 * labeled letterpress control group. The Squeak-O-Meter makes μ tangible for
 * a six-year-old.
 */
export function WheelsView() {
  const design = useGarageStore((s) => s.design)
  const derived = useGarageStore((s) => s.derived)
  const setWheels = useGarageStore((s) => s.setWheels)

  const { polish, graphite } = design.wheels

  // μ ranges roughly 0.08 (best) … 0.30 (worst) — map to a 0..1 squeak score
  const squeak = Math.max(0, Math.min(1, (derived.params.muAxle - 0.08) / 0.22))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 2px', overflowY: 'auto' }}>
      <Fieldset legend="Axle polish — shine the nails the wheels spin on" contentStyle={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <Seg
          value={polish}
          onChange={(level) => setWheels({ polish: level as 0 | 1 | 2 | 3 })}
          options={[
            { value: 0, label: 'Rough' },
            { value: 1, label: 'Sanded' },
            { value: 2, label: 'Smooth' },
            { value: 3, label: 'Mirror' },
          ]}
        />
      </Fieldset>

      <Fieldset legend="Graphite — the classic slippery derby dust" contentStyle={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <Seg
          value={graphite}
          onChange={(level) => setWheels({ graphite: level as 0 | 1 | 2 | 3 })}
          options={[
            { value: 0, label: 'None' },
            { value: 1, label: '1 puff' },
            { value: 2, label: '2 puffs' },
            { value: 3, label: '3 puffs' },
          ]}
        />
      </Fieldset>

      <Fieldset legend="Squeak-o-meter" contentStyle={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div
          style={{
            height: 22,
            border: '2px solid var(--ink)',
            borderRadius: 2,
            background: 'linear-gradient(90deg, var(--forest), var(--mustard), var(--brick-red))',
            position: 'relative',
          }}
        >
          <svg
            width={18}
            height={12}
            viewBox="0 0 18 12"
            style={{
              position: 'absolute',
              left: `calc(${(squeak * 100).toFixed(1)}% - 9px)`,
              top: -13,
              transition: 'left 300ms',
            }}
          >
            <path d="M2 1h14L9 11z" fill="var(--ink)" />
          </svg>
        </div>
        <div className="lp-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--navy)' }}>
          <span>whisper quiet — fast</span>
          <span>squeaky — slow</span>
        </div>
      </Fieldset>
    </div>
  )
}
