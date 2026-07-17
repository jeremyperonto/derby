import type { CSSProperties } from 'react'

/**
 * Letterpress ornaments lifted from the reference badges: diamond rules,
 * triple speed lines, stars, and crossed checkered flags. One-ink, in
 * currentColor.
 */

/** ─────◆───── divider */
export function DiamondRule({ width = 180, style }: { width?: number; style?: CSSProperties }) {
  return (
    <svg width={width} height={12} viewBox={`0 0 ${width} 12`} fill="none" style={style}>
      <line x1={0} y1={6} x2={width / 2 - 14} y2={6} stroke="currentColor" strokeWidth={1.5} />
      <line x1={width / 2 + 14} y1={6} x2={width} y2={6} stroke="currentColor" strokeWidth={1.5} />
      <path
        d={`M ${width / 2} 1 L ${width / 2 + 6} 6 L ${width / 2} 11 L ${width / 2 - 6} 6 Z`}
        fill="currentColor"
      />
      <circle cx={width / 2 - 10} cy={6} r={1.4} fill="currentColor" />
      <circle cx={width / 2 + 10} cy={6} r={1.4} fill="currentColor" />
    </svg>
  )
}

/** ≡ triple speed rules (from the Pinewood Derby badge), flanking children */
export function SpeedRules({ height = 14, width = 44 }: { height?: number; width?: number }) {
  const gap = height / 4
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={i * 6}
          y1={gap * (i + 1)}
          x2={width}
          y2={gap * (i + 1)}
          stroke="currentColor"
          strokeWidth={height / 7}
        />
      ))}
    </svg>
  )
}

/** three stacked stars (badge center column) */
export function StarColumn({ size = 34 }: { size?: number }) {
  const star = (cx: number, cy: number, r: number) => {
    const pts: string[] = []
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5
      const rr = i % 2 === 0 ? r : r * 0.45
      pts.push(`${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`)
    }
    return pts.join(' ')
  }
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="currentColor">
      <polygon points={star(17, 8, 6)} />
      <polygon points={star(9, 24, 4.5)} />
      <polygon points={star(25, 24, 4.5)} />
    </svg>
  )
}

/**
 * Checkered wings + star column — the crossed-flag lockup from the
 * reference badge, built from skewed parallelograms so the checker grid
 * is registered to the wing by construction.
 */
export function CrossedFlags({ width = 220 }: { width?: number }) {
  const CELL = 8
  const COLS = 5
  const ROWS = 3
  const wingW = CELL * COLS
  const wingH = CELL * ROWS

  const wing = (
    <g>
      {/* checker cells (paper base + ink alternates) */}
      <rect x={0} y={0} width={wingW} height={wingH} fill="var(--paper)" />
      {Array.from({ length: COLS }, (_, i) =>
        Array.from({ length: ROWS }, (_, j) =>
          (i + j) % 2 === 0 ? (
            <rect key={`${i}-${j}`} x={i * CELL} y={j * CELL} width={CELL} height={CELL} fill="currentColor" />
          ) : null,
        ),
      )}
      <rect x={0} y={0} width={wingW} height={wingH} fill="none" stroke="currentColor" strokeWidth={2.4} />
    </g>
  )

  return (
    <svg width={width} height={width * 0.31} viewBox="0 0 220 68" fill="none">
      {/* right wing rises outward; left is its mirror */}
      <g transform="translate(121,32) skewY(-14)">{wing}</g>
      <g transform="translate(99,32) scale(-1,1) skewY(-14)">{wing}</g>
      {/* star column between the wings */}
      <polygon points={starPoints(110, 22, 8)} fill="currentColor" />
      <polygon points={starPoints(110, 41, 5.5)} fill="currentColor" />
      <polygon points={starPoints(110, 56, 4.2)} fill="currentColor" />
    </svg>
  )
}

function starPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r : r * 0.42
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

/** small ruled plaque like the badge's "EST 2015" chip */
export function EstPlaque({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="lp-label"
      style={{
        display: 'inline-block',
        border: '1.5px solid currentColor',
        padding: '2px 10px',
        fontSize: '0.7rem',
      }}
    >
      {children}
    </span>
  )
}
