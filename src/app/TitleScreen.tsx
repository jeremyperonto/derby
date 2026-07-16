import { useAppStore } from '../state/appStore'
import { useProgressStore } from '../state/progressStore'
import { useSettingsStore } from '../state/settingsStore'
import { Btn } from '../ui/Btn'

const CHECKER =
  'repeating-conic-gradient(var(--ink) 0% 25%, var(--paper) 0% 50%) 0 0 / 28px 28px'

export function TitleScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const defeated = useProgressStore((s) => s.defeated)
  const muted = useSettingsStore((s) => s.muted)
  const narration = useSettingsStore((s) => s.narration)
  const { setMuted, setNarration } = useSettingsStore.getState()

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* checkered top & bottom ribbons */}
      <div style={{ height: 18, width: '100%', background: CHECKER }} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '7vh',
          gap: 14,
        }}
      >
        {/* sunburst behind the title */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '30px 60px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -40,
              background:
                'repeating-conic-gradient(rgba(217,160,63,0.35) 0deg 9deg, transparent 9deg 18deg)',
              borderRadius: '50%',
              filter: 'blur(1px)',
            }}
          />
          <h1
            style={{
              position: 'relative',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.6rem, 9vw, 5.5rem)',
              letterSpacing: '0.03em',
              color: 'var(--brick-red)',
              textShadow: '5px 5px 0 var(--ink)',
              textTransform: 'uppercase',
              textAlign: 'center',
              lineHeight: 1.05,
            }}
          >
            Derby
            <br />
            Dash
          </h1>
        </div>

        <p style={{ color: 'var(--navy)', fontSize: '1.15rem', fontWeight: 800 }}>
          🏁 carve it · race it · learn why it won 🏁
        </p>

        <div style={{ marginTop: '3vh', display: 'flex', gap: 12, pointerEvents: 'auto' }}>
          <Btn
            variant="red"
            onClick={() => setScreen('garage')}
            style={{ fontSize: '1.5rem', padding: '16px 32px', fontFamily: 'var(--font-display)' }}
          >
            🔨 Let&apos;s Build!
          </Btn>
          {defeated.length > 0 && (
            <Btn
              variant="navy"
              onClick={() => setScreen('rivalSelect')}
              style={{ fontSize: '1.5rem', padding: '16px 32px', fontFamily: 'var(--font-display)' }}
            >
              🏁 Race!
            </Btn>
          )}
        </div>
      </div>

      {/* settings corner */}
      <div style={{ position: 'absolute', right: 14, bottom: 30, display: 'flex', gap: 8, pointerEvents: 'auto' }}>
        <Btn variant="paper" onClick={() => setMuted(!muted)} title="sound">
          {muted ? '🔇' : '🔊'}
        </Btn>
        <Btn
          variant="paper"
          active={narration}
          onClick={() => setNarration(!narration)}
          title="read tips aloud"
        >
          🗣️
        </Btn>
      </div>

      <div style={{ height: 18, width: '100%', background: CHECKER }} />
    </div>
  )
}
