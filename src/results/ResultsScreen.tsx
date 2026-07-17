import { useEffect, useMemo, useState } from 'react'
import { sfx } from '../audio/audio'
import { speak } from '../audio/narration'
import { LESSONS } from '../content/lessons'
import { rivalById, RIVALS } from '../content/rivals'
import { unlockById } from '../content/unlocks'
import { useAppStore } from '../state/appStore'
import { useProgressStore } from '../state/progressStore'
import { PLAYER_LANE, RIVAL_LANE, useRaceStore } from '../state/raceStore'
import { bestTips, lengthsPhrase } from '../sim/feedback'
import { CAR_LENGTH_M } from '../sim/tuning'
import { Btn } from '../ui/Btn'
import { IconFlag, IconRematch, IconWrench, LessonIcon } from '../ui/icons'
import { DiamondRule } from '../ui/ornaments'

const PLACES = ['1st', '2nd', '3rd', '4th']

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
        <h2
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '1.75rem',
            color: outcome.beatRival ? 'var(--brick-red)' : 'var(--navy)',
            textShadow: outcome.beatRival ? '1.5px 1.5px 0 var(--ink)' : 'none',
            marginBottom: 4,
          }}
        >
          {outcome.beatRival ? `YOU BEAT ${outcome.rival.name.toUpperCase()}!` : `${outcome.rival.name} takes it`}
        </h2>
        {!outcome.beatRival && (
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-script)', fontSize: '1.3rem', color: 'var(--navy)', marginBottom: 6 }}>
            so close!
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <DiamondRule width={200} />
        </div>

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
                padding: '6px 8px',
                borderTop: place === 0 ? 'none' : '1px solid rgba(33,29,22,0.25)',
                background: entry.isPlayer ? 'rgba(217,160,63,0.28)' : 'transparent',
              }}
            >
              <span
                className="lp-label"
                style={{
                  width: 40,
                  fontSize: '0.72rem',
                  textAlign: 'center',
                  border: '1.5px solid var(--ink)',
                  padding: '2px 0',
                  background: place === 0 ? 'var(--ink)' : 'transparent',
                  color: place === 0 ? 'var(--paper)' : 'var(--ink)',
                }}
              >
                {PLACES[place]}
              </span>
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
