import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Btn } from '../ui/Btn'
import { Fieldset } from '../ui/Fieldset'
import { IconCopy } from '../ui/icons'
import { SpeedRules } from '../ui/ornaments'

const REPO = 'https://github.com/jeremyperonto/derby'

/** shared letterpress field look — ink border, paper fill, prose type */
const fieldStyle: CSSProperties = {
  width: '100%',
  border: '2px solid var(--ink)',
  background: 'var(--paper)',
  borderRadius: 2,
  fontFamily: 'var(--font-prose)',
  fontSize: '0.95rem',
  color: 'var(--ink)',
  padding: '8px 10px',
  WebkitUserSelect: 'text',
  userSelect: 'text',
}

/**
 * "Suggest an improvement" — collects a bug report or feature request and
 * routes it out to a coding agent: either a prefilled GitHub issue, or a
 * ready-to-paste prompt for the visitor's own AI. All state is local.
 */
export function SuggestSection() {
  const [req, setReq] = useState('')
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)

  const sendToAgent = () => {
    const request = req.trim()
    if (!request) return
    const who = name.trim()
    const title = request.split('\n')[0].slice(0, 70)
    const body = request + '\n\n---\nSubmitted via Derby Dash' + (who ? '\nCredit: ' + who : '')
    const url =
      REPO + '/issues/new?labels=enhancement&title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body)
    window.open(url, '_blank', 'noopener')
  }

  const copyAgentPrompt = () => {
    const request = req.trim()
    if (!request) return
    const who = name.trim()
    const prompt =
      'Clone ' +
      REPO +
      ' and make this change to my local copy:\n\n' +
      request +
      '\n\nThe project is open source. If the change would help others too, also open an issue at ' +
      REPO +
      '/issues describing it' +
      (who ? ' and credit ' + who : '') +
      '.'
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div style={{ width: '100%', maxWidth: 560, marginTop: 18 }}>
      {/* section label, mirroring the About card's ruled dividers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 12px' }}>
        <SpeedRules width={40} height={12} />
        <div className="lp-label" style={{ fontSize: '0.72rem', color: 'var(--navy)' }}>
          suggest an improvement
        </div>
        <div style={{ flex: 1, borderTop: '1.5px solid var(--ink)', opacity: 0.4 }} />
      </div>

      <p style={{ fontFamily: 'var(--font-prose)', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 14px' }}>
        Found a bug, or want Derby Dash to do something it can{'’'}t yet? Describe it below {'—'} it goes to a
        coding agent, and if I build it, I{'’'}ll credit you. Or copy it as a prompt and have your own AI make the
        change today.
      </p>

      <Fieldset
        legend="Bug report or feature request"
        contentStyle={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}
      >
        <textarea
          value={req}
          onChange={(e) => setReq(e.target.value)}
          placeholder="Describe the bug, or the thing you wish Derby Dash could do."
          rows={4}
          style={{ ...fieldStyle, minHeight: 110, resize: 'vertical', lineHeight: 1.45 }}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional, so I can credit you)"
          style={fieldStyle}
        />
      </Fieldset>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <Btn variant="red" onClick={sendToAgent}>
          Suggest an improvement {'→'}
        </Btn>
        <Btn variant="line" onClick={copyAgentPrompt}>
          <IconCopy size={18} /> {copied ? 'Copied' : 'Copy as a prompt for your own AI'}
        </Btn>
      </div>

      <div style={{ fontFamily: 'var(--font-prose)', fontSize: '0.8rem', color: 'var(--navy)', marginTop: 10 }}>
        Opens a prefilled request on GitHub (free account needed) {'—'} or email{' '}
        <a href="mailto:jeremy@peronto.com" style={{ color: 'var(--ink)' }}>
          jeremy@peronto.com
        </a>
        .
      </div>
    </div>
  )
}
