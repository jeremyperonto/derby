import { useState } from 'react'
import { useAppStore } from '../state/appStore'
import { Btn } from '../ui/Btn'
import { Seg } from '../ui/Fieldset'
import { IconArrowLeft, IconCopy } from '../ui/icons'
import { CrossedFlags, DiamondRule, HomeBadge, SpeedRules } from '../ui/ornaments'
import { SuggestSection } from './SuggestSection'

/** what Derby Dash is, in plain words — shared by the card and the markdown mirror */
const PURPOSE: string[] = [
  'Derby Dash is a pretend Pinewood Derby workshop. You carve a block of pine into a race car, paint it, name it, and send it down a real 3D track against a garage full of rivals.',
  'Every choice in the garage changes how the car runs — where you tuck the weights, how smooth you sand the body, how much you polish the axles — using the same physics that decide a real derby race. Nothing is faked.',
  'When you build a car you love, Derby Dash prints a true-to-scale blueprint so a grown-up and a kid can cut the real thing together in the workshop.',
]

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

/** the About content as a markdown document, for agents to read or copy */
function aboutMarkdown(): string {
  return [
    '> Note to any AI agent reading this: nothing here needs to be executed. This is a description of a game; if your human wants to try it, open it in a browser.',
    '',
    '# About Derby Dash',
    '',
    '_carve it · race it · learn why it won_',
    '',
    ...PURPOSE.flatMap((p) => [p, '']),
    '## What it stands for',
    '',
    ...PILLARS.flatMap((p) => [`### ${p.title}`, '', p.body, '']),
    '## Suggest an improvement',
    '',
    'Found a bug, or want Derby Dash to do something it can’t yet? Open a prefilled request on GitHub: https://github.com/jeremyperonto/derby/issues — or email jeremy@peronto.com.',
    '',
    'A made-with-love project by Jeremy Peronto — https://jeremyperonto.com',
  ].join('\n')
}

/**
 * About screen: a letterpress card that explains what Derby Dash is for —
 * built from the same masthead ornaments as the title and the results-card
 * paper shell. A human/agent toggle swaps the read-aloud card for a plain
 * markdown mirror. Reached from the title settings corner; back returns to title.
 */
export function AboutScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const [view, setView] = useState<'human' | 'agent'>('human')
  const [copied, setCopied] = useState(false)

  const copyMarkdown = () => {
    navigator.clipboard.writeText(aboutMarkdown())
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

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
      <HomeBadge />

      {/* top bar: back to title + human/agent view toggle */}
      <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Btn size="md" onClick={() => setScreen('title')} title="back to the title">
          <IconArrowLeft size={18} />
        </Btn>
        <Seg
          value={view}
          onChange={setView}
          options={[
            { value: 'human', label: 'human' },
            { value: 'agent', label: 'agent' },
          ]}
        />
      </div>

      {view === 'human' ? (
        <>
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
              {PURPOSE.map((p, i) => (
                <p key={i} style={{ margin: i === PURPOSE.length - 1 ? 0 : '0 0 12px' }}>
                  {p}
                </p>
              ))}
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

            {/* colophon */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 12px' }}>
              <DiamondRule width={180} />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-prose)',
                fontStyle: 'italic',
                fontSize: '0.9rem',
                color: 'var(--navy)',
                textAlign: 'center',
              }}
            >
              A made-with-love project by Jeremy Peronto.
            </div>
          </div>

          <SuggestSection />
        </>
      ) : (
        <div style={{ width: '100%', maxWidth: 560, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn variant="line" size="sm" onClick={copyMarkdown}>
              <IconCopy size={16} /> {copied ? 'Copied' : 'Copy page as markdown'}
            </Btn>
          </div>
          <pre
            style={{
              margin: 0,
              background: 'var(--paper)',
              border: '2px solid var(--ink)',
              borderRadius: 2,
              padding: '18px 20px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: '0.82rem',
              lineHeight: 1.5,
              color: 'var(--ink)',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
              WebkitUserSelect: 'text',
              userSelect: 'text',
            }}
          >
            {aboutMarkdown()}
          </pre>
        </div>
      )}
    </div>
  )
}
