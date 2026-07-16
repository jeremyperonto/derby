import { useGarageStore } from '../state/garageStore'
import { Btn } from '../ui/Btn'

/**
 * Wheels station: axle polish, graphite, raised wheel — the friction
 * lessons. The Squeak-O-Meter makes μ tangible for a six-year-old.
 */

const POLISH_LEVELS = ['🪵 rough', '🩹 sanded', '✨ smooth', '💎 mirror']
const GRAPHITE_LEVELS = ['0 puffs', '1 puff 🌫️', '2 puffs 🌫️🌫️', '3 puffs 🌫️🌫️🌫️']

export function WheelsView() {
  const design = useGarageStore((s) => s.design)
  const derived = useGarageStore((s) => s.derived)
  const setWheels = useGarageStore((s) => s.setWheels)

  const { polish, graphite, raised } = design.wheels

  // μ ranges roughly 0.08 (best) … 0.30 (worst) — map to a 0..1 squeak score
  const squeak = Math.max(0, Math.min(1, (derived.params.muAxle - 0.08) / 0.22))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '8px 4px' }}>
      <StationRow
        title="🔩 Axle polish"
        hint="Shine up the nails the wheels spin on — smooth = fast!"
      >
        {POLISH_LEVELS.map((label, level) => (
          <Btn
            key={level}
            variant="paper"
            active={polish === level}
            onClick={() => setWheels({ polish: level as 0 | 1 | 2 | 3 })}
          >
            {label}
          </Btn>
        ))}
      </StationRow>

      <StationRow
        title="🌫️ Graphite powder"
        hint="The classic derby trick — slippery dust for the axles."
      >
        {GRAPHITE_LEVELS.map((label, level) => (
          <Btn
            key={level}
            variant="paper"
            active={graphite === level}
            onClick={() => setWheels({ graphite: level as 0 | 1 | 2 | 3 })}
          >
            {label}
          </Btn>
        ))}
      </StationRow>

      <StationRow
        title="🎈 Raised wheel"
        hint="Lift one front wheel — three shoes rub less than four!"
      >
        <Btn
          variant="paper"
          active={raised === 'none'}
          onClick={() => setWheels({ raised: 'none' })}
        >
          4 wheels down
        </Btn>
        <Btn
          variant="paper"
          active={raised === 'frontLeft'}
          onClick={() => setWheels({ raised: 'frontLeft' })}
        >
          front wheel up 🎈
        </Btn>
      </StationRow>

      {/* Squeak-O-Meter */}
      <div>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Squeak-O-Meter</div>
        <div
          style={{
            height: 26,
            borderRadius: 13,
            border: '3px solid var(--ink)',
            background: 'linear-gradient(90deg, var(--forest), var(--mustard), var(--brick-red))',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: `calc(${(squeak * 100).toFixed(1)}% - 10px)`,
              top: -8,
              fontSize: 22,
              transition: 'left 300ms',
            }}
          >
            🔻
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--navy)' }}>
          <span>🤫 whisper quiet (fast)</span>
          <span>🔊 squeaky (slow)</span>
        </div>
      </div>
    </div>
  )
}

function StationRow({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ color: 'var(--navy)', fontWeight: 600, fontSize: '0.92rem', marginBottom: 8 }}>
        {hint}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}
