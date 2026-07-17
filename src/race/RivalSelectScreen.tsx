import { LESSONS } from '../content/lessons'
import { DIVISIONS, RIVALS, type Rival } from '../content/rivals'
import { MiniProfile } from '../garage/CarWall'
import { useAppStore } from '../state/appStore'
import { useGarageStore } from '../state/garageStore'
import { useProgressStore } from '../state/progressStore'
import { useRaceStore } from '../state/raceStore'
import { Btn } from '../ui/Btn'
import { IconArrowLeft, IconFlag, IconStar, LessonIcon } from '../ui/icons'
import { SpeedRules } from '../ui/ornaments'

/**
 * The rivals wall, organized into divisions of similar-strength racers.
 * Race anyone in an unlocked division; beat enough of them to move up.
 */
export function RivalSelectScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const design = useGarageStore((s) => s.design)
  const defeated = useProgressStore((s) => s.defeated)
  const isDivisionUnlocked = useProgressStore((s) => s.isDivisionUnlocked)
  const defeatedInTier = useProgressStore((s) => s.defeatedInTier)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--paper)',
        overflowY: 'auto',
        padding: '14px 20px 30px',
        color: 'var(--ink)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Btn size="md" onClick={() => setScreen('garage')} title="back to the garage">
          <IconArrowLeft size={18} />
        </Btn>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: '1.8rem',
            color: 'var(--brick-red)',
            textShadow: '1.5px 1.5px 0 var(--ink)',
          }}
        >
          PICK YOUR RIVAL
        </h2>
        <div style={{ flex: 1 }} />
        <div className="lp-label" style={{ fontSize: '0.72rem', color: 'var(--navy)' }}>
          racing: {design.name} No.{design.number}
        </div>
      </div>

      {DIVISIONS.map((division) => {
        const racers = RIVALS.filter((r) => r.tier === division.tier)
        const unlocked = isDivisionUnlocked(division.tier)
        const priorDivision = DIVISIONS.find((d) => d.tier === division.tier - 1)
        const winsSoFar = priorDivision ? defeatedInTier(priorDivision.tier) : 0

        return (
          <div key={division.tier} style={{ marginTop: 18 }}>
            {/* division header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, opacity: unlocked ? 1 : 0.5 }}>
              <SpeedRules width={40} height={12} />
              <div>
                <div className="lp-label" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  {division.name}
                </div>
                <div style={{ fontFamily: 'var(--font-script)', fontSize: '1.05rem', color: 'var(--navy)' }}>
                  {unlocked
                    ? division.motto
                    : `beat ${division.winsToEnter - winsSoFar} more ${priorDivision!.name.toLowerCase().replace(' division', '')} racer${division.winsToEnter - winsSoFar === 1 ? '' : 's'} to enter`}
                </div>
              </div>
              <div style={{ transform: 'scaleX(-1)', display: 'flex' }}>
                <SpeedRules width={40} height={12} />
              </div>
              <div style={{ flex: 1, borderTop: '1.5px solid var(--ink)', opacity: 0.4 }} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 14,
              }}
            >
              {racers.map((rival) => (
                <RivalCard
                  key={rival.id}
                  rival={rival}
                  unlocked={unlocked}
                  beaten={defeated.includes(rival.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RivalCard({ rival, unlocked, beaten }: { rival: Rival; unlocked: boolean; beaten: boolean }) {
  const design = useGarageStore((s) => s.design)
  const gold = useProgressStore((s) => s.gold)
  const startRace = useRaceStore((s) => s.startRace)
  const lesson = LESSONS[rival.lesson]

  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '2px solid var(--ink)',
        boxShadow: unlocked ? 'inset 0 0 0 3px var(--paper), inset 0 0 0 4px var(--ink)' : 'none',
        borderRadius: 2,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: unlocked ? 1 : 0.45,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', lineHeight: 1.1 }}>
            {rival.name}
          </div>
          <div style={{ fontFamily: 'var(--font-script)', fontSize: '1rem', color: 'var(--navy)' }}>
            {unlocked ? rival.tagline : 'locked'}
          </div>
        </div>
        {(beaten || gold.includes(rival.id)) && (
          <div style={{ marginLeft: 'auto', color: gold.includes(rival.id) ? 'var(--mustard)' : 'var(--ink)' }}>
            <IconStar size={26} />
          </div>
        )}
      </div>

      {unlocked && (
        <>
          <div style={{ border: '1.5px solid var(--ink)', borderRadius: 2, padding: '6px 8px 2px', background: 'var(--kraft)' }}>
            <MiniProfile design={rival.design} />
          </div>

          <div style={{ fontFamily: 'var(--font-prose)', fontSize: '0.92rem', fontStyle: 'italic', lineHeight: 1.35 }}>
            {rival.intro}
          </div>

          <div
            className="lp-label"
            style={{
              border: '1.5px solid var(--ink)',
              padding: '5px 10px',
              fontSize: '0.66rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
            }}
          >
            <LessonIcon id={lesson.icon} size={15} /> Lesson: {lesson.title}
          </div>

          <Btn variant="red" onClick={() => startRace(design, rival.id)}>
            <IconFlag size={17} /> {beaten ? 'Rematch' : 'Race'}
          </Btn>
        </>
      )}
    </div>
  )
}
