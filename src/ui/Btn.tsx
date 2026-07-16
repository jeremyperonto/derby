import type { CSSProperties, ReactNode } from 'react'
import { sfx } from '../audio/audio'

/**
 * Chunky retro-poster button — the one button of the game. Big touch
 * targets (min 48px), squashes on press, never hover-dependent.
 */
export function Btn({
  children,
  onClick,
  variant = 'mustard',
  active = false,
  disabled = false,
  style,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'mustard' | 'red' | 'paper' | 'navy'
  active?: boolean
  disabled?: boolean
  style?: CSSProperties
  title?: string
}) {
  const bg = {
    mustard: 'var(--mustard)',
    red: 'var(--brick-red)',
    paper: 'var(--paper)',
    navy: 'var(--navy)',
  }[variant]
  const fg = variant === 'red' || variant === 'navy' ? 'var(--paper)' : 'var(--ink)'

  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg,
        color: fg,
        border: '3px solid var(--ink)',
        borderRadius: 12,
        boxShadow: active ? 'inset 0 3px 0 rgba(0,0,0,0.25)' : '0 4px 0 var(--ink)',
        transform: active ? 'translateY(3px)' : 'none',
        minHeight: 52,
        minWidth: 52,
        padding: '8px 16px',
        fontWeight: 800,
        fontSize: '1.05rem',
        letterSpacing: '0.02em',
        opacity: disabled ? 0.45 : 1,
        transition: 'transform 80ms, box-shadow 80ms',
        touchAction: 'manipulation',
        ...style,
      }}
      onPointerDown={(e) => {
        if (!disabled) sfx.tap()
        const el = e.currentTarget
        el.style.transform = 'translateY(3px)'
        el.style.boxShadow = 'inset 0 2px 0 rgba(0,0,0,0.2)'
      }}
      onPointerUp={(e) => {
        const el = e.currentTarget
        el.style.transform = active ? 'translateY(3px)' : 'none'
        el.style.boxShadow = active ? 'inset 0 3px 0 rgba(0,0,0,0.25)' : '0 4px 0 var(--ink)'
      }}
      onPointerLeave={(e) => {
        const el = e.currentTarget
        el.style.transform = active ? 'translateY(3px)' : 'none'
        el.style.boxShadow = active ? 'inset 0 3px 0 rgba(0,0,0,0.25)' : '0 4px 0 var(--ink)'
      }}
    >
      {children}
    </button>
  )
}
