import { useAppStore } from '../state/appStore'
import { Btn } from '../ui/Btn'
import { IconArrowLeft } from '../ui/icons'
import { CrossedFlags, DiamondRule, EstPlaque, SpeedRules } from '../ui/ornaments'

/** the three design pillars, in kid-and-parent words */
const PILLARS: { title: string; body: string }[] = [
  {
    title: 'The physics is real',
    body: 'No fake stats. Rivals lose for the same reasons real derby cars lose — where the weight sits, how smooth the body is, how polished the axles are.',
  },
  {
    title: 'Losing is the lesson',
    body: 'Every loss comes with one kid-sized tip, worked out by re-running the race with a better car: “Moving your weights back would have won by half a car!”',
  },
  {
    title: 'Your car, your call',
    body: 'You carve it, paint it, name it, and number it. It’s never a menu pick — it’s the car you made.',
  },
]

/**
 * About screen: a letterpress card that explains what Derby Dash is for —
 * built from the same masthead ornaments as the title and the results-card
 * paper shell. Reached from the title settings corner; back returns to title.
 */
export function AboutScreen() {
  const setScreen = useAppStore((s) => s.setScreen)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--paper)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 16px 40px',
        color: 'var(--ink)',
      }}
    >
      <div style={{ alignSelf: 'flex-start' }}>
        <Btn size="md" onClick={() => setScreen('title')} title="back to the title">
          <IconArrowLeft size={18} />
        </Btn>
      </div>

      <div
        style={{
          background: 'var(--paper)',
          border: '2px solid var(--ink)',
          boxShadow: 'inset 0 0 0 4px var(--paper), inset 0 0 0 5.5px var(--ink)',
          borderRadius: 2,
          padding: '22px 26px 26px',
          width: '100%',
          maxWidth: 560,
          marginTop: 8,
        }}
      >
        {/* masthead */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <CrossedFlags width={168} />
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 'clamp(2rem, 7vw, 2.9rem)',
              lineHeight: 0.95,
              letterSpacing: '0.05em',
              color: 'var(--brick-red)',
              textShadow: '2px 2px 0 var(--ink)',
              margin: '4px 0 0',
              textAlign: 'center',
            }}
          >
            ABOUT DERBY DASH
          </h1>
          <div
            style={{
              fontFamily: 'var(--font-script)',
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              color: 'var(--navy)',
              transform: 'rotate(-2deg)',
              marginTop: 2,
            }}
          >
            carve it &middot; race it &middot; learn why it won
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
          <DiamondRule width={220} />
        </div>

        {/* purpose */}
        <div style={{ fontFamily: 'var(--font-prose)', fontSize: '1rem', lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 12px' }}>
            Derby Dash is a pretend Pinewood Derby workshop. You carve a block of pine into a race car,
            paint it, name it, and send it down a real 3D track against a garage full of rivals.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            Every choice in the garage changes how the car runs — where you tuck the weights, how
            smooth you sand the body, how much you polish the axles — using the same physics that
            decide a real derby race. Nothing is faked.
          </p>
          <p style={{ margin: 0 }}>
            When you build a car you love, Derby Dash prints a true-to-scale blueprint so a grown-up
            and a kid can cut the real thing together in the workshop.
          </p>
        </div>

        {/* pillars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 12px' }}>
          <SpeedRules width={40} height={12} />
          <div className="lp-label" style={{ fontSize: '0.72rem', color: 'var(--navy)' }}>
            what it stands for
          </div>
          <div style={{ flex: 1, borderTop: '1.5px solid var(--ink)', opacity: 0.4 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PILLARS.map((p) => (
            <div key={p.title}>
              <div className="lp-label" style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 2 }}>
                {p.title}
              </div>
              <div style={{ fontFamily: 'var(--font-prose)', fontSize: '0.95rem', lineHeight: 1.45 }}>
                {p.body}
              </div>
            </div>
          ))}
        </div>

        {/* colophon + home link */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 12px' }}>
          <DiamondRule width={180} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--navy)' }}>
            A made-with-love project by Jeremy Peronto.
          </div>
          <a
            href="https://jeremyperonto.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'var(--ink)' }}
          >
            <EstPlaque>jeremyperonto.com</EstPlaque>
          </a>
        </div>
      </div>
    </div>
  )
}
