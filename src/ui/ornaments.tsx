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

/** crossed checkered wing flags (title lockup) */
export function CrossedFlags({ width = 220 }: { width?: number }) {
  const h = width * 0.36
  return (
    <svg width={width} height={h} viewBox="0 0 220 80" fill="none" stroke="currentColor">
      {/* poles */}
      <line x1={38} y1={74} x2={104} y2={18} strokeWidth={3} />
      <line x1={182} y1={74} x2={116} y2={18} strokeWidth={3} />
      {/* left flag: waving parallelogram with checker grid */}
      <g>
        <path d="M96 24 42 62 22 40 76 8z" fill="var(--paper)" strokeWidth={2.5} strokeLinejoin="round" />
        <Checkers ox={22} oy={8} dirX={[18, -13]} dirY={[7, 11]} />
      </g>
      <g>
        <path d="M124 24 178 62 198 40 144 8z" fill="var(--paper)" strokeWidth={2.5} strokeLinejoin="round" />
        <Checkers ox={198} oy={8} dirX={[-18, -13]} dirY={[-7, 11]} />
      </g>
    </svg>
  )
}

/** 4×3 checker fill for the flags, drawn as filled parallelogram cells */
function Checkers({ ox, oy, dirX, dirY }: { ox: number; oy: number; dirX: [number, number]; dirY: [number, number] }) {
  const cells = []
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      if ((i + j) % 2 === 0) continue
      const x = ox + dirX[0] * i + dirY[0] * j
      const y = oy + dirX[1] * i + dirY[1] * j
      cells.push(
        <path
          key={`${i}-${j}`}
          d={`M ${x} ${y} l ${dirX[0]} ${dirX[1]} l ${dirY[0]} ${dirY[1]} l ${-dirX[0]} ${-dirX[1]} z`}
          fill="currentColor"
          stroke="none"
        />,
      )
    }
  }
  return <>{cells}</>
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
