import type { CSSProperties, ReactNode } from 'react'
import { sfx } from '../audio/audio'

/**
 * Legended group box — the classic letterpress "rule with a label breaking
 * it". Organizes tool clusters instead of loose button farms.
 */
export function Fieldset({
  legend,
  children,
  style,
  contentStyle,
}: {
  legend: string
  children: ReactNode
  style?: CSSProperties
  contentStyle?: CSSProperties
}) {
  return (
    <fieldset
      style={{
        border: '1.5px solid var(--ink)',
        borderRadius: 2,
        padding: '10px 12px 12px',
        margin: 0,
        minWidth: 0,
        ...style,
      }}
    >
      <legend
        className="lp-label"
        style={{ fontSize: '0.68rem', padding: '0 8px', color: 'var(--ink)' }}
      >
        {legend}
      </legend>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', ...contentStyle }}>
        {children}
      </div>
    </fieldset>
  )
}

/**
 * Segmented control: joined plaque options sharing borders, active = ink.
 * For mutually exclusive picks (view, tool, levels).
 */
export function Seg<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: { value: T; label: ReactNode; title?: string }[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        border: '2px solid var(--ink)',
        borderRadius: 2,
        background: 'var(--paper)',
        overflow: 'hidden',
        // never let the control shrink below its options — that silently
        // clipped the last segment (e.g. the Sand tool) on narrow screens
        flexShrink: 0,
      }}
    >
      {options.map((option, i) => {
        const activeOpt = option.value === value
        return (
          <button
            key={String(option.value)}
            title={option.title}
            onClick={() => {
              sfx.tap()
              onChange(option.value)
            }}
            className="lp-label"
            style={{
              background: activeOpt ? 'var(--ink)' : 'transparent',
              color: activeOpt ? 'var(--paper)' : 'var(--ink)',
              borderLeft: i > 0 ? '1.5px solid var(--ink)' : 'none',
              padding: size === 'sm' ? '6px 10px' : '9px 14px',
              fontSize: size === 'sm' ? '0.7rem' : '0.8rem',
              letterSpacing: '0.12em',
              minHeight: size === 'sm' ? 34 : 44,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              touchAction: 'manipulation',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** static plaque (nameplates, meters) */
export function Plaque({
  children,
  tone = 'paper',
  style,
}: {
  children: ReactNode
  tone?: 'paper' | 'ink' | 'red'
  style?: CSSProperties
}) {
  const bg = tone === 'ink' ? 'var(--ink)' : tone === 'red' ? 'var(--brick-red)' : 'var(--paper)'
  const fg = tone === 'paper' ? 'var(--ink)' : 'var(--paper)'
  return (
    <div
      className="lp-label"
      style={{
        background: bg,
        color: fg,
        border: '2px solid var(--ink)',
        boxShadow:
          tone === 'paper'
            ? 'inset 0 0 0 3px var(--paper), inset 0 0 0 4px var(--ink)'
            : `inset 0 0 0 2px ${bg}, inset 0 0 0 3px ${fg}`,
        borderRadius: 2,
        padding: '9px 14px',
        fontSize: '0.85rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 46,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
