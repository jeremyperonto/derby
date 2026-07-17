import type { CSSProperties, ReactNode } from 'react'
import { sfx } from '../audio/audio'

/**
 * Letterpress plaque button — ink-on-paper with a double-rule border,
 * squared corners, letterspaced gothic caps. Variants:
 *   line  — paper plaque, ink border+text (the default control)
 *   ink   — filled ink, paper text (selected/secondary emphasis)
 *   red   — filled brick red (THE primary action)
 * No fat drop shadows, no rounded candy corners.
 */
export function Btn({
  children,
  onClick,
  variant = 'line',
  active = false,
  disabled = false,
  size = 'md',
  style,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'line' | 'ink' | 'red'
  active?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  style?: CSSProperties
  title?: string
}) {
  const filled = variant !== 'line' || active
  const bg = active ? 'var(--ink)' : variant === 'red' ? 'var(--brick-red)' : variant === 'ink' ? 'var(--ink)' : 'var(--paper)'
  const fg = filled ? 'var(--paper)' : 'var(--ink)'

  const pad = { sm: '5px 10px', md: '9px 16px', lg: '13px 26px' }[size]
  const font = { sm: '0.72rem', md: '0.85rem', lg: '1.05rem' }[size]
  const minH = { sm: 34, md: 46, lg: 56 }[size]

  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="lp-label"
      style={{
        background: bg,
        color: fg,
        border: '2px solid var(--ink)',
        // inner hairline rule = the letterpress double border
        boxShadow: filled ? 'inset 0 0 0 2px ' + bg + ', inset 0 0 0 3px ' + fg : 'inset 0 0 0 3px var(--paper), inset 0 0 0 4px var(--ink)',
        borderRadius: 2,
        minHeight: minH,
        padding: pad,
        fontSize: font,
        letterSpacing: '0.14em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.4 : 1,
        transition: 'transform 70ms',
        touchAction: 'manipulation',
        ...style,
      }}
      onPointerDown={(e) => {
        if (!disabled) sfx.tap()
        e.currentTarget.style.transform = 'translateY(1px)'
      }}
      onPointerUp={(e) => {
        e.currentTarget.style.transform = 'none'
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = 'none'
      }}
    >
      {children}
    </button>
  )
}
