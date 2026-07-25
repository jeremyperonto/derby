import { useFrame, useThree } from '@react-three/fiber'
import { rivalById } from '../content/rivals'
import { MiniProfile } from '../garage/CarWall'
import { describeCar, SpecRow } from '../results/carSpec'
import { useAppStore } from '../state/appStore'
import { PLAYER_LANE, useRaceStore } from '../state/raceStore'
import { Btn } from '../ui/Btn'
import { IconArrowLeft, IconFlag } from '../ui/icons'
import { SpeedRules } from '../ui/ornaments'
import { surfaceAt } from './trackGeometry'

/**
 * Static staging camera for the pre-race line-up: parks a hero shot on the
 * four cars sitting at the gate (the clock is held at the ceremony start, so
 * RaceCars renders them at the start line). A slow sway keeps it alive.
 */
export function PreRaceCamera() {
  const camera = useThree((s) => s.camera)
  const track = useRaceStore((s) => s.track)
  useFrame((state) => {
    const gate = surfaceAt(track, 0)
    const sway = Math.sin(state.clock.elapsedTime * 0.35) * 3
    camera.position.set(gate.x + 30, gate.y + 9, 26 + sway)
    camera.lookAt(gate.x - 3, gate.y + 2.5, 0)
  })
  return null
}

/**
 * Pre-race line-up overlay: your car vs. the field. Shows every lane and your
 * car's stat sheet before the heat runs, then GO releases the pre-computed
 * race. The 3D staging shows behind this panel.
 */
export function PreRaceScreen() {
  const lanes = useRaceStore((s) => s.lanes)
  const rivalId = useRaceStore((s) => s.rivalId)
  const beginRace = useRaceStore((s) => s.beginRace)
  const setScreen = useAppStore((s) => s.setScreen)

  const rival = rivalId ? rivalById(rivalId) : null
  const player = lanes[PLAYER_LANE]?.design
  if (!player) return null

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', color: 'var(--ink)' }}>
      {/* top bar: back + matchup banner */}
      <div style={{ position: 'absolute', top: 14, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ pointerEvents: 'auto' }}>
          <Btn size="md" onClick={() => setScreen('rivalSelect')} title="pick a different rival">
            <IconArrowLeft size={18} />
          </Btn>
        </div>
        <div style={{ flex: 1 }} />
        <div
          className="lp-label"
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--paper)',
            border: '2px solid var(--ink)',
            borderRadius: 2,
            padding: '6px 14px',
            fontSize: '0.8rem',
          }}
        >
          <SpeedRules width={30} height={11} />
          on your marks{rival ? ` — you vs. ${rival.name}` : ''}
        </div>
      </div>

      {/* line-up card, bottom */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 12px 16px',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            background: 'var(--paper)',
            border: '2px solid var(--ink)',
            boxShadow: 'inset 0 0 0 4px var(--paper), inset 0 0 0 5.5px var(--ink)',
            borderRadius: 2,
            padding: '14px 18px 16px',
            width: '100%',
            maxWidth: 760,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* the field */}
          <div style={{ flex: '1 1 300px', minWidth: 260 }}>
            <div className="lp-label" style={{ fontSize: '0.66rem', color: 'var(--navy)', marginBottom: 6 }}>
              The line-up
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {lanes.map((entry, lane) => {
                const role = entry.isPlayer ? 'Your car' : entry.isRival ? (rival?.name ?? 'Rival') : 'Challenger'
                return (
                  <div
                    key={lane}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '4px 8px',
                      border: '1.5px solid var(--ink)',
                      borderRadius: 2,
                      background: entry.isPlayer ? 'var(--kraft)' : 'var(--paper)',
                    }}
                  >
                    <div className="lp-label" style={{ fontSize: '0.7rem', width: 18, textAlign: 'center' }}>
                      {lane + 1}
                    </div>
                    <div style={{ width: 66, flexShrink: 0 }}>
                      <MiniProfile design={entry.design} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', lineHeight: 1.1 }}>
                        {entry.design.name} No.{entry.design.number}
                      </div>
                      <div className="lp-label" style={{ fontSize: '0.58rem', color: 'var(--navy)' }}>
                        {role}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* your car's stats + GO */}
          <div style={{ flex: '1 1 240px', minWidth: 220, display: 'flex', flexDirection: 'column' }}>
            <div className="lp-label" style={{ fontSize: '0.66rem', color: 'var(--navy)', marginBottom: 6 }}>
              Your car — {player.name}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                columnGap: 14,
                rowGap: 4,
                fontSize: '0.9rem',
                border: '1.5px solid var(--ink)',
                borderRadius: 2,
                padding: '8px 12px',
              }}
            >
              {describeCar(player).map((row) => (
                <SpecRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
            <Btn variant="red" size="lg" onClick={beginRace} style={{ marginTop: 12, width: '100%' }}>
              <IconFlag size={20} /> Go!
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
