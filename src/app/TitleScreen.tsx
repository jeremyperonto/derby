import { useAppStore } from '../state/appStore'
import { Btn } from '../ui/Btn'

export function TitleScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '9vh',
        gap: 18,
        pointerEvents: 'none',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(2.6rem, 9vw, 5.5rem)',
          fontWeight: 900,
          letterSpacing: '0.04em',
          color: 'var(--brick-red)',
          textShadow: '4px 4px 0 var(--ink)',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Derby Dash
      </h1>
      <p style={{ color: 'var(--navy)', fontSize: '1.15rem', fontWeight: 700 }}>
        🏁 carve it · race it · learn why it won 🏁
      </p>
      <div style={{ marginTop: '4vh', pointerEvents: 'auto' }}>
        <Btn
          variant="red"
          onClick={() => setScreen('garage')}
          style={{ fontSize: '1.6rem', padding: '16px 34px' }}
        >
          🔨 Let&apos;s Build!
        </Btn>
      </div>
    </div>
  )
}
