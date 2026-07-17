import { useAppStore } from '../state/appStore'
import { useProgressStore } from '../state/progressStore'
import { useSettingsStore } from '../state/settingsStore'
import { Btn } from '../ui/Btn'
import { IconFlag, IconSound, IconSoundOff, IconVoice, IconWrench } from '../ui/icons'
import { CrossedFlags, DiamondRule, EstPlaque, SpeedRules } from '../ui/ornaments'

/**
 * Title screen: a one-ink badge lockup straight from the reference posters
 * (crossed checkered flags, arched letterspaced line, big Rye display,
 * script tagline, speed rules) over the rotating car showcase.
 */
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
        color: 'var(--ink)',
      }}
    >
      {/* badge lockup */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '4.5vh',
          gap: 4,
        }}
      >
        <CrossedFlags width={215} />

        {/* arched top line */}
        <svg width={460} height={46} viewBox="0 0 460 46" style={{ marginTop: -6, maxWidth: '94vw' }}>
          <path id="title-arch" d="M 16 42 Q 230 4 444 42" fill="none" />
          <text
            className="lp-label"
            style={{ fontSize: 15, letterSpacing: '0.34em', fill: 'var(--ink)' }}
          >
            <textPath href="#title-arch" startOffset="50%" textAnchor="middle">
              PINEWOOD PHYSICS SPEEDWAY
            </textPath>
          </text>
        </svg>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 'clamp(2.6rem, 8.5vw, 5rem)',
            lineHeight: 0.95,
            letterSpacing: '0.06em',
            color: 'var(--brick-red)',
            textShadow: '3px 3px 0 var(--ink)',
            textAlign: 'center',
            margin: '4px 0 0',
          }}
        >
          DERBY DASH
        </h1>

        {/* DERBY-style ruled line with the year plaque */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <SpeedRules width={54} height={14} />
          <EstPlaque>EST. 2026</EstPlaque>
          <div style={{ transform: 'scaleX(-1)', display: 'flex' }}>
            <SpeedRules width={54} height={14} />
          </div>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-script)',
            fontSize: 'clamp(1.3rem, 3.4vw, 1.9rem)',
            color: 'var(--navy)',
            marginTop: 6,
            transform: 'rotate(-2deg)',
          }}
        >
          carve it &middot; race it &middot; learn why it won
        </div>
      </div>

      {/* actions */}
      <div style={{ marginTop: 'auto', paddingBottom: '7vh', display: 'flex', gap: 14, pointerEvents: 'auto' }}>
        <Btn variant="red" size="lg" onClick={() => setScreen('garage')}>
          <IconWrench size={22} /> Let&rsquo;s Build
        </Btn>
        {defeated.length > 0 && (
          <Btn variant="ink" size="lg" onClick={() => setScreen('rivalSelect')}>
            <IconFlag size={22} /> Race
          </Btn>
        )}
      </div>

      <div style={{ paddingBottom: 16, color: 'var(--ink)' }}>
        <DiamondRule width={230} />
      </div>

      {/* settings corner */}
      <div
        style={{
          position: 'absolute',
          right: 14,
          bottom: 14,
          display: 'flex',
          gap: 8,
          pointerEvents: 'auto',
        }}
      >
        <Btn size="sm" onClick={() => setMuted(!muted)} title="sound">
          {muted ? <IconSoundOff size={18} /> : <IconSound size={18} />}
        </Btn>
        <Btn size="sm" active={narration} onClick={() => setNarration(!narration)} title="read tips aloud">
          <IconVoice size={18} />
        </Btn>
      </div>
    </div>
  )
}
