import { LESSONS } from '../content/lessons'
import { RIVALS } from '../content/rivals'
import { useAppStore } from '../state/appStore'
import { useGarageStore } from '../state/garageStore'
import { useProgressStore } from '../state/progressStore'
import { useRaceStore } from '../state/raceStore'
import { Btn } from '../ui/Btn'

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
        padding: '16px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <Btn variant="paper" onClick={() => setScreen('garage')} title="back">
          ⬅
        </Btn>
        <h2 style={{ fontWeight: 900, fontSize: '1.6rem', color: 'var(--brick-red)' }}>
          🏁 PICK YOUR RIVAL
        </h2>
        <div style={{ flex: 1 }} />
        <div style={{ fontWeight: 800, color: 'var(--navy)' }}>
          racing: {design.name} #{design.number}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
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
                background: beaten ? 'var(--paper)' : available ? 'var(--sky-blue)' : '#d9d2c2',
                border: '3px solid var(--ink)',
                borderRadius: 16,
                boxShadow: '0 5px 0 var(--ink)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                opacity: available ? 1 : 0.65,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: '2.6rem' }}>{available ? rival.portrait : '🔒'}</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>
                    {i + 1}. {rival.name}
                  </div>
                  <div style={{ fontStyle: 'italic', color: 'var(--navy)', fontWeight: 600 }}>
                    {available ? rival.tagline : 'Beat the rival before them!'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '1.6rem' }}>
                  {gold.includes(rival.id) ? '🏆' : beaten ? '🥇' : ''}
                </div>
              </div>

              {available && (
                <>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{rival.intro}</div>
                  <div
                    style={{
                      background: 'var(--paper)',
                      border: '2px solid var(--ink)',
                      borderRadius: 10,
                      padding: '6px 10px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  >
                    {lesson.icon} Lesson: {lesson.title}
                  </div>
                  <Btn variant="red" onClick={() => startRace(design, rival.id)}>
                    🏁 {beaten ? 'Rematch!' : 'Race!'}
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
