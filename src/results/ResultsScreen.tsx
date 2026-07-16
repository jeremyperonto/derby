import { useAppStore } from '../state/appStore'
import { useRaceStore } from '../state/raceStore'
import { Btn } from '../ui/Btn'

const MEDALS = ['🥇', '🥈', '🥉', '4th']

export function ResultsScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const raceData = useRaceStore((s) => s.raceData)
  const lanes = useRaceStore((s) => s.lanes)
  const rematch = useRaceStore((s) => s.rematch)

  if (!raceData) return null

  const playerLane = lanes.findIndex((l) => l.isPlayer)
  const playerPlace = raceData.order.indexOf(playerLane)
  const won = playerPlace === 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '4px solid var(--ink)',
          borderRadius: 18,
          boxShadow: '0 8px 0 var(--ink)',
          padding: '22px 30px',
          minWidth: 'min(480px, 92vw)',
          pointerEvents: 'auto',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 900,
            color: won ? 'var(--brick-red)' : 'var(--navy)',
            marginBottom: 14,
          }}
        >
          {won ? '🏆 YOU WON!' : 'So close!'}
        </h2>

        {raceData.order.map((lane, place) => {
          const entry = lanes[lane]!
          const time = raceData.lanes[lane]!.finishTime
          const margin = raceData.marginLengths[lane]!
          return (
            <div
              key={lane}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 10px',
                borderRadius: 10,
                background: entry.isPlayer ? 'var(--mustard)' : 'transparent',
                fontWeight: entry.isPlayer ? 800 : 600,
                fontSize: '1.05rem',
              }}
            >
              <span style={{ width: 40 }}>{MEDALS[place]}</span>
              <span style={{ flex: 1 }}>
                {entry.design.name} #{entry.design.number}
                {entry.isPlayer ? ' (you!)' : ''}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Number.isFinite(time) ? `${time.toFixed(3)}s` : '—'}
              </span>
              <span style={{ width: 90, textAlign: 'right', color: 'var(--navy)' }}>
                {place === 0 ? '' : `+${margin.toFixed(1)} cars`}
              </span>
            </div>
          )
        })}

        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'center' }}>
          <Btn variant="red" onClick={rematch}>
            🔁 Rematch
          </Btn>
          <Btn onClick={() => setScreen('garage')}>🔧 Back to Garage</Btn>
        </div>
      </div>
    </div>
  )
}
