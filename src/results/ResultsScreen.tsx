import { useEffect, useMemo, useState } from 'react'
import { useViewport } from '../app/useViewport'
import { sfx } from '../audio/audio'
import { speak } from '../audio/narration'
import { LESSONS } from '../content/lessons'
import { rivalById, RIVALS } from '../content/rivals'
import { unlockById } from '../content/unlocks'
import { medalDataURL } from '../garage/carDecals'
import { AXLE_X_IN } from '../model/carDesign'
import { deriveSimParams } from '../model/deriveSimParams'
import { useAppStore } from '../state/appStore'
import { useProgressStore } from '../state/progressStore'
import { PLAYER_LANE, RIVAL_LANE, useRaceStore } from '../state/raceStore'
import { bestTips, lengthsPhrase } from '../sim/feedback'
import { CAR_LENGTH_M } from '../sim/tuning'
import { Btn } from '../ui/Btn'
import { IconFlag, IconRematch, IconRuler, IconWrench, LessonIcon } from '../ui/icons'
import { DiamondRule } from '../ui/ornaments'

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="lp-label" style={{ fontSize: '0.64rem', alignSelf: 'center', color: 'var(--navy)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic' }}>{value}</span>
    </>
  )
}

export function ResultsScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const raceData = useRaceStore((s) => s.raceData)
  const lanes = useRaceStore((s) => s.lanes)
  const laneParams = useRaceStore((s) => s.laneParams)
  const rivalId = useRaceStore((s) => s.rivalId)
  const rematch = useRaceStore((s) => s.rematch)
  const recordWin = useProgressStore((s) => s.recordWin)
  const [showNotes, setShowNotes] = useState(false)
  const { compact } = useViewport()

  // compute outcome + tips + progress ONCE per race
  const outcome = useMemo(() => {
    if (!raceData || !rivalId) return null
    const rival = rivalById(rivalId)!
    // winning means WINNING THE HEAT — a kid watches all four cars, so the
    // celebration must match the finish line (fillers are capped below the
    // rival, so heat winner ≡ rival beaten in practice)
    const wonHeat = raceData.order[0] === PLAYER_LANE
    const heatWinner = lanes[raceData.order[0]!]!
    const playerTime = raceData.lanes[PLAYER_LANE]!.finishTime
    const rivalTime = raceData.lanes[RIVAL_LANE]!.finishTime
    const speed = raceData.lanes[PLAYER_LANE]!.finishSpeed || 4.5
    const marginLengths = (Math.abs(rivalTime - playerTime) * speed) / CAR_LENGTH_M

    if (wonHeat) {
      const newUnlocks = recordWin(rivalId, marginLengths)
      // next challenge = first undefeated racer in any now-unlocked division
      const progress = useProgressStore.getState()
      const nextRival = RIVALS.find(
        (r) => !progress.defeated.includes(r.id) && progress.isRivalAvailable(r.id),
      )
      return { wonHeat, heatWinner, rival, marginLengths, newUnlocks, nextRival, tip: undefined }
    }

    const playerDesign = lanes[PLAYER_LANE]!.design
    const tips = bestTips(playerDesign, laneParams, PLAYER_LANE, RIVAL_LANE, raceData.seed)
    return { wonHeat, heatWinner, rival, marginLengths, newUnlocks: [], nextRival: undefined, tip: tips[0] }
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
    if (outcome.wonHeat) {
      sfx.fanfare()
      speak(`You won the heat — you beat ${outcome.rival.name}!`)
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
        alignItems: compact ? 'center' : 'flex-start',
        // `safe center` keeps the panel centered but falls back to top-aligned
        // when it's taller than the screen, so the headline never gets clipped
        // above an unscrollable edge (the classic flex-centering + overflow bug)
        justifyContent: 'safe center',
        padding: compact ? '12px 10px' : '14px 0 14px 18px',
        pointerEvents: 'auto',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'var(--paper)',
          border: '2px solid var(--ink)',
          boxShadow: 'inset 0 0 0 4px var(--paper), inset 0 0 0 5.5px var(--ink)',
          borderRadius: 2,
          padding: compact ? '16px 18px' : '20px 26px',
          width: '100%',
          maxWidth: 540,
          flexShrink: 0,
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
            color: outcome.wonHeat ? 'var(--brick-red)' : 'var(--navy)',
            marginBottom: 2,
          }}
        >
          {outcome.wonHeat
            ? `You beat ${outcome.rival.name}!`
            : `${outcome.heatWinner.isRival ? outcome.rival.name : outcome.heatWinner.design.name} takes it`}
        </h2>
        {!outcome.wonHeat && (
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-script)', fontSize: '1.3rem', color: 'var(--navy)', marginBottom: 4 }}>
            so close!
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <DiamondRule width={200} />
        </div>

        {/* the winner spins in the 3D winner's circle beside this panel */}
        {(() => {
          const winnerLane = raceData.order[0]!
          const winner = lanes[winnerLane]!
          const spec = deriveSimParams(winner.design)
          const { polish, graphite, raised } = winner.design.wheels
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
          const POLISH_WORDS = ['rough', 'sanded', 'smooth', 'mirror']
          return (
            <>
              <div
                style={{
                  border: '2px solid var(--ink)',
                  borderRadius: 2,
                  background: 'var(--kraft)',
                  padding: '7px 12px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <img src={medalDataURL(0)} width={38} height={38} alt="first place" style={{ flexShrink: 0 }} />
                <div className="lp-label" style={{ fontSize: '0.7rem', lineHeight: 1.5 }}>
                  In the winner&rsquo;s circle: {winner.design.name} No.{winner.design.number}
                  {winner.isPlayer ? ' — that’s you!' : winner.isRival ? ` — ${outcome.rival.name}` : ''}
                </div>
              </div>

              {/* how the winning car was built — the peek under the hood */}
              <fieldset
                style={{
                  border: '1.5px solid var(--ink)',
                  borderRadius: 2,
                  padding: '6px 12px 9px',
                  margin: '0 0 12px',
                }}
              >
                <legend className="lp-label" style={{ fontSize: '0.62rem', padding: '0 8px' }}>
                  How the winner was built
                </legend>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    columnGap: 14,
                    rowGap: 3,
                    fontSize: '0.86rem',
                  }}
                >
                  <SpecRow label="Weight" value={`${spec.totalOz.toFixed(1)} oz of 5${spec.totalOz >= 4.75 ? ' — loaded up!' : ''}`} />
                  <SpecRow
                    label="Balance"
                    value={
                      behindRearAxle >= 0
                        ? `${behindRearAxle.toFixed(1)}″ ahead of the rear axle${inZone ? ' — heavy in the back!' : ''}`
                        : 'behind the rear axle!'
                    }
                  />
                  <SpecRow
                    label="Axles"
                    value={`${POLISH_WORDS[polish]} polish · ${graphite === 0 ? 'no' : graphite} puff${graphite === 1 ? '' : 's'} of graphite`}
                  />
                  <SpecRow label="Wheels" value={raised === 'none' ? 'all four down' : 'front wheel raised — only three rub'} />
                  <SpecRow label="Shape" value={shape} />
                </div>
              </fieldset>
            </>
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
        {!outcome.wonHeat && (
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
          {outcome.wonHeat && outcome.nextRival && (
            <Btn variant="ink" onClick={() => setScreen('rivalSelect')}>
              <IconFlag size={17} /> Next: {outcome.nextRival.name}
            </Btn>
          )}
        </div>

        {/* the screen-to-workbench bridge: a winning car has earned real plans */}
        {outcome.wonHeat && (
          <button
            onClick={() => setScreen('blueprint')}
            className="lp-label"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '12px auto 0',
              fontSize: '0.7rem',
              color: 'var(--brick-red)',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              cursor: 'pointer',
            }}
          >
            <IconRuler size={15} /> Print this car&rsquo;s real build plans
          </button>
        )}
      </div>
    </div>
  )
}
