import { useMemo, useState } from 'react'
import { LESSONS } from '../content/lessons'
import { rivalById, RIVALS } from '../content/rivals'
import { unlockById } from '../content/unlocks'
import { useAppStore } from '../state/appStore'
import { useProgressStore } from '../state/progressStore'
import { PLAYER_LANE, RIVAL_LANE, useRaceStore } from '../state/raceStore'
import { bestTips, lengthsPhrase } from '../sim/feedback'
import { CAR_LENGTH_M } from '../sim/tuning'
import { Btn } from '../ui/Btn'

const MEDALS = ['🥇', '🥈', '🥉', '4th']

export function ResultsScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const raceData = useRaceStore((s) => s.raceData)
  const lanes = useRaceStore((s) => s.lanes)
  const laneParams = useRaceStore((s) => s.laneParams)
  const rivalId = useRaceStore((s) => s.rivalId)
  const rematch = useRaceStore((s) => s.rematch)
  const recordWin = useProgressStore((s) => s.recordWin)
  const [showNotes, setShowNotes] = useState(false)

  // compute outcome + tips + progress ONCE per race
  const outcome = useMemo(() => {
    if (!raceData || !rivalId) return null
    const rival = rivalById(rivalId)!
    const playerTime = raceData.lanes[PLAYER_LANE]!.finishTime
    const rivalTime = raceData.lanes[RIVAL_LANE]!.finishTime
    const beatRival = playerTime < rivalTime
    const speed = raceData.lanes[PLAYER_LANE]!.finishSpeed || 4.5
    const marginLengths = (Math.abs(rivalTime - playerTime) * speed) / CAR_LENGTH_M

    if (beatRival) {
      const newUnlocks = recordWin(rivalId, marginLengths)
      const nextRival = RIVALS[RIVALS.findIndex((r) => r.id === rivalId) + 1]
      return { beatRival, rival, marginLengths, newUnlocks, nextRival, tip: undefined }
    }

    const playerDesign = lanes[PLAYER_LANE]!.design
    const tips = bestTips(playerDesign, laneParams, PLAYER_LANE, RIVAL_LANE, raceData.seed)
    return { beatRival, rival, marginLengths, newUnlocks: [], nextRival: undefined, tip: tips[0] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceData, rivalId])

  if (!raceData || !outcome) return null

  const lesson = outcome.tip ? LESSONS[outcome.tip.lesson] : LESSONS[outcome.rival.lesson]

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
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '4px solid var(--ink)',
          borderRadius: 18,
          boxShadow: '0 8px 0 var(--ink)',
          padding: '20px 28px',
          minWidth: 'min(520px, 94vw)',
          maxWidth: 640,
          pointerEvents: 'auto',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            fontSize: '2rem',
            fontWeight: 900,
            color: outcome.beatRival ? 'var(--brick-red)' : 'var(--navy)',
            marginBottom: 12,
          }}
        >
          {outcome.beatRival
            ? `🏆 YOU BEAT ${outcome.rival.name.toUpperCase()}!`
            : `${outcome.rival.name} takes it — so close!`}
        </h2>

        {/* heat placings */}
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
                padding: '6px 10px',
                borderRadius: 10,
                background: entry.isPlayer ? 'var(--mustard)' : 'transparent',
                fontWeight: entry.isPlayer ? 800 : 600,
              }}
            >
              <span style={{ width: 38 }}>{MEDALS[place]}</span>
              <span style={{ flex: 1 }}>
                {entry.design.name} #{entry.design.number}
                {entry.isPlayer ? ' (you!)' : entry.isRival ? ` (${outcome.rival.name})` : ''}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Number.isFinite(time) ? `${time.toFixed(3)}s` : '—'}
              </span>
              <span style={{ width: 86, textAlign: 'right', color: 'var(--navy)', fontSize: '0.9rem' }}>
                {place === 0 ? '' : `+${margin.toFixed(1)} cars`}
              </span>
            </div>
          )
        })}

        {/* prize moment */}
        {outcome.newUnlocks.length > 0 && (
          <div
            style={{
              marginTop: 12,
              background: 'var(--mustard)',
              border: '3px solid var(--ink)',
              borderRadius: 12,
              padding: '10px 14px',
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            🎁 PRIZE{outcome.newUnlocks.length > 1 ? 'S' : ''} UNLOCKED:{' '}
            {outcome.newUnlocks.map((id) => unlockById(id)?.label).join(' · ')}
          </div>
        )}

        {/* pit crew tip on a loss */}
        {!outcome.beatRival && (
          <div
            style={{
              marginTop: 12,
              background: 'var(--sky-blue)',
              border: '3px solid var(--ink)',
              borderRadius: 12,
              padding: '10px 14px',
            }}
          >
            <div style={{ fontWeight: 900 }}>{lesson.icon} Pit crew says:</div>
            <div style={{ fontWeight: 700, marginTop: 4 }}>
              {outcome.tip
                ? LESSONS[outcome.tip.lesson].tipLine.replace(
                    '{gain}',
                    lengthsPhrase(outcome.tip.gainLengths),
                  )
                : lesson.kidLine}
            </div>
            <button
              onClick={() => setShowNotes((v) => !v)}
              style={{
                marginTop: 8,
                fontWeight: 800,
                color: 'var(--navy)',
                textDecoration: 'underline',
                fontSize: '0.95rem',
              }}
            >
              📖 Pit Crew Notes for grown-ups {showNotes ? '▴' : '▾'}
            </button>
            {showNotes && (
              <div style={{ marginTop: 8, fontSize: '0.95rem', lineHeight: 1.45 }}>
                <p>{lesson.parentScript}</p>
                <p style={{ marginTop: 6 }}>
                  <b>Try at home:</b> {lesson.tryAtHome}
                </p>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Btn variant="red" onClick={rematch}>
            🔁 Rematch
          </Btn>
          <Btn onClick={() => setScreen('garage')}>🔧 Garage</Btn>
          {outcome.beatRival && outcome.nextRival && (
            <Btn variant="navy" onClick={() => setScreen('rivalSelect')}>
              ⚡ Next: {outcome.nextRival.name}
            </Btn>
          )}
        </div>
      </div>
    </div>
  )
}
