import { LESSONS } from '../content/lessons'
import { RIVALS } from '../content/rivals'
import { MiniProfile } from '../garage/CarWall'
import { useAppStore } from '../state/appStore'
import { useGarageStore } from '../state/garageStore'
import { useProgressStore } from '../state/progressStore'
import { useRaceStore } from '../state/raceStore'
import { Btn } from '../ui/Btn'
import { IconArrowLeft, IconFlag, IconStar, LessonIcon } from '../ui/icons'
import { DiamondRule } from '../ui/ornaments'

/** The rivals poster wall: pick your next challenge (design.md §5). */
export function RivalSelectScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const design = useGarageStore((s) => s.design)
  const defeated = useProgressStore((s) => s.defeated)
  const gold = useProgressStore((s) => s.gold)
  const isRivalAvailable = useProgressStore((s) => s.isRivalAvailable)
  const startRace = useRaceStore((s) => s.startRace)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--paper)',
        overflowY: 'auto',
        padding: '14px 20px',
        color: 'var(--ink)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Btn size="md" onClick={() => setScreen('garage')} title="back to the garage">
          <IconArrowLeft size={18} />
        </Btn>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.8rem', color: 'var(--brick-red)', textShadow: '1.5px 1.5px 0 var(--ink)' }}>
          PICK YOUR RIVAL
        </h2>
        <div style={{ flex: 1 }} />
        <div className="lp-label" style={{ fontSize: '0.72rem', color: 'var(--navy)' }}>
          racing: {design.name} No.{design.number}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <DiamondRule width={260} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: 14,
        }}
      >
        {RIVALS.map((rival, i) => {
          const beaten = defeated.includes(rival.id)
          const available = isRivalAvailable(rival.id)
          const lesson = LESSONS[rival.lesson]
          return (
            <div
              key={rival.id}
              style={{
                background: 'var(--paper)',
                border: '2px solid var(--ink)',
                boxShadow: available
                  ? 'inset 0 0 0 3px var(--paper), inset 0 0 0 4px var(--ink)'
                  : 'none',
                borderRadius: 2,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                opacity: available ? 1 : 0.45,
              }}
            >
              {/* header: rung number plaque + name + trophy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="lp-label"
                  style={{
                    border: '2px solid var(--ink)',
                    width: 34,
                    height: 34,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1rem',
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', lineHeight: 1.1 }}>
                    {rival.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-script)', fontSize: '1rem', color: 'var(--navy)' }}>
                    {available ? rival.tagline : 'beat the rival before them'}
                  </div>
                </div>
                {(beaten || gold.includes(rival.id)) && (
                  <div style={{ marginLeft: 'auto', color: gold.includes(rival.id) ? 'var(--mustard)' : 'var(--ink)' }}>
                    <IconStar size={26} />
                  </div>
                )}
              </div>

              {available && (
                <>
                  {/* their actual car */}
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
        })}
      </div>
    </div>
  )
}
