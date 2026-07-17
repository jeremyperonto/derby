import { useEffect, useMemo, useState } from 'react'
import { sfx } from '../audio/audio'
import { speak } from '../audio/narration'
import { LESSONS } from '../content/lessons'
import { rivalById, RIVALS } from '../content/rivals'
import { unlockById } from '../content/unlocks'
import { medalDataURL } from '../garage/carDecals'
import { MiniProfile } from '../garage/CarWall'
import { useAppStore } from '../state/appStore'
import { useProgressStore } from '../state/progressStore'
import { PLAYER_LANE, RIVAL_LANE, useRaceStore } from '../state/raceStore'
import { bestTips, lengthsPhrase } from '../sim/feedback'
import { CAR_LENGTH_M } from '../sim/tuning'
import { Btn } from '../ui/Btn'
import { IconFlag, IconRematch, IconWrench, LessonIcon } from '../ui/icons'
import { DiamondRule } from '../ui/ornaments'

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

  const lesson = outcome
    ? outcome.tip
      ? LESSONS[outcome.tip.lesson]
      : LESSONS[outcome.rival.lesson]
    : null

  // celebration + narration when the panel appears
  useEffect(() => {
    if (!outcome || !lesson) return
    if (outcome.beatRival) {
      sfx.fanfare()
      speak(`You beat ${outcome.rival.name}!`)
    } else {
      sfx.womp()
      const line = outcome.tip
        ? LESSONS[outcome.tip.lesson].tipLine.replace('{gain}', lengthsPhrase(outcome.tip.gainLengths))
        : lesson.kidLine
      speak(`So close! Pit crew says: ${line}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome])

  if (!raceData || !outcome || !lesson) return null

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
          border: '2px solid var(--ink)',
          boxShadow: 'inset 0 0 0 4px var(--paper), inset 0 0 0 5.5px var(--ink)',
          borderRadius: 2,
          padding: '20px 26px',
          minWidth: 'min(520px, 94vw)',
          maxWidth: 640,
          pointerEvents: 'auto',
          color: 'var(--ink)',
        }}
      >
        {/* eyebrow */}
        <div className="lp-label" style={{ textAlign: 'center', fontSize: '0.62rem', color: 'var(--navy)', marginBottom: 6 }}>
          Official results — Derby Dash Speedway
        </div>

        {/* headline: letterspaced gothic caps, not the display face */}
        <h2
          className="lp-label"
          style={{
            textAlign: 'center',
            fontSize: '1.45rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: outcome.beatRival ? 'var(--brick-red)' : 'var(--navy)',
            marginBottom: 2,
          }}
        >
          {outcome.beatRival ? `You beat ${outcome.rival.name}!` : `${outcome.rival.name} takes it`}
        </h2>
        {!outcome.beatRival && (
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-script)', fontSize: '1.3rem', color: 'var(--navy)', marginBottom: 4 }}>
            so close!
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <DiamondRule width={200} />
        </div>

        {/* the winner's car, framed */}
        {(() => {
          const winnerLane = raceData.order[0]!
          const winner = lanes[winnerLane]!
          return (
            <div
              style={{
                border: '2px solid var(--ink)',
                borderRadius: 2,
                background: 'var(--kraft)',
                padding: '8px 12px 4px',
                marginBottom: 12,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={medalDataURL(0)} width={46} height={46} alt="first place" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <MiniProfile design={winner.design} />
                </div>
              </div>
              <div className="lp-label" style={{ textAlign: 'center', fontSize: '0.68rem', padding: '2px 0 4px' }}>
                Winner: {winner.design.name} No.{winner.design.number}
                {winner.isPlayer ? ' — that’s you!' : winner.isRival ? ` — ${outcome.rival.name}` : ''}
              </div>
            </div>
          )
        })()}

        {/* heat placings, each with its medal */}
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
                padding: '5px 8px',
                borderTop: place === 0 ? 'none' : '1px solid rgba(33,29,22,0.25)',
                background: entry.isPlayer ? 'rgba(217,160,63,0.28)' : 'transparent',
              }}
            >
              <img src={medalDataURL(place)} width={30} height={30} alt={`place ${place + 1}`} style={{ flexShrink: 0 }} />
              <span className="lp-label" style={{ flex: 1, fontSize: '0.82rem', fontWeight: entry.isPlayer ? 600 : 400 }}>
                {entry.design.name} No.{entry.design.number}
                {entry.isPlayer ? ' — you' : entry.isRival ? ` — ${outcome.rival.name}` : ''}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                {Number.isFinite(time) ? `${time.toFixed(3)}s` : '—'}
              </span>
              <span className="lp-label" style={{ width: 82, textAlign: 'right', color: 'var(--navy)', fontSize: '0.66rem' }}>
                {place === 0 ? '' : `+${margin.toFixed(1)} cars`}
              </span>
            </div>
          )
        })}

        {/* prize moment */}
        {outcome.newUnlocks.length > 0 && (
          <div
            className="lp-label"
            style={{
              marginTop: 12,
              background: 'var(--mustard)',
              border: '2px solid var(--ink)',
              borderRadius: 2,
              padding: '9px 14px',
              fontSize: '0.78rem',
              textAlign: 'center',
            }}
          >
            Prize{outcome.newUnlocks.length > 1 ? 's' : ''} unlocked:{' '}
            {outcome.newUnlocks.map((id) => unlockById(id)?.label).join(' · ')}
          </div>
        )}

        {/* pit crew tip on a loss */}
        {!outcome.beatRival && (
          <div
            style={{
              marginTop: 12,
              border: '2px solid var(--ink)',
              borderRadius: 2,
              padding: '10px 14px',
            }}
          >
            <div className="lp-label" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <LessonIcon id={lesson.icon} size={17} /> Pit crew says
            </div>
            <div style={{ fontFamily: 'var(--font-prose)', fontSize: '1.02rem', marginTop: 6, lineHeight: 1.4 }}>
              {outcome.tip
                ? LESSONS[outcome.tip.lesson].tipLine.replace('{gain}', lengthsPhrase(outcome.tip.gainLengths))
                : lesson.kidLine}
            </div>
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="lp-label"
              style={{
                marginTop: 8,
                fontSize: '0.68rem',
                color: 'var(--brick-red)',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                cursor: 'pointer',
              }}
            >
              Pit Crew Notes for grown-ups {showNotes ? '▲' : '▼'}
            </button>
            {showNotes && (
              <div style={{ marginTop: 8, fontFamily: 'var(--font-prose)', fontSize: '0.95rem', lineHeight: 1.5 }}>
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
            <IconRematch size={17} /> Rematch
          </Btn>
          <Btn onClick={() => setScreen('garage')}>
            <IconWrench size={17} /> Garage
          </Btn>
          {outcome.beatRival && outcome.nextRival && (
            <Btn variant="ink" onClick={() => setScreen('rivalSelect')}>
              <IconFlag size={17} /> Next: {outcome.nextRival.name}
            </Btn>
          )}
        </div>
      </div>
    </div>
  )
}
