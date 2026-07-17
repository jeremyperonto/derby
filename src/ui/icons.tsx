import type { CSSProperties, ReactNode } from 'react'

/**
 * Hand-drawn stroke icon set — the game's only iconography (no emoji).
 * All icons are 24×24 line drawings in currentColor so they inherit the
 * surrounding ink. Keep strokes ~2 and shapes chunky/simple.
 */

function I({ children, size = 20, style }: { children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  )
}

export type IconProps = { size?: number; style?: CSSProperties }

/** hand saw — carve station */
export const IconSaw = (p: IconProps) => (
  <I {...p}>
    <path d="M3 13 14 4l6 7-10 8H6z" />
    <path d="M10 19l-1.6 2M13 17l-1.6 2M16 14.6 14.4 17" strokeWidth={1.6} />
    <circle cx={16.4} cy={7.6} r={1.2} strokeWidth={1.6} />
  </I>
)

/** gouge/scoop */
export const IconScoop = (p: IconProps) => (
  <I {...p}>
    <path d="M6 3c0 7 2 12 6 12s6-5 6-12" />
    <path d="M12 15v6" />
  </I>
)

/** sanding block */
export const IconSand = (p: IconProps) => (
  <I {...p}>
    <path d="M4 12h16v5H4z" />
    <path d="M7 12V9h10v3" />
    <path d="M6.5 20h2M11 20h2M15.5 20h2" strokeWidth={1.6} />
  </I>
)

/** balance scale — weights */
export const IconScale = (p: IconProps) => (
  <I {...p}>
    <path d="M12 4v14M5 6h14M12 20h0" />
    <path d="M5 6 2.6 12a3 3 0 0 0 4.8 0zM19 6l-2.4 6a3 3 0 0 0 4.8 0z" />
    <path d="M8 20h8" />
  </I>
)

/** wheel */
export const IconWheel = (p: IconProps) => (
  <I {...p}>
    <circle cx={12} cy={12} r={8.5} />
    <circle cx={12} cy={12} r={2.4} />
    <path d="M12 3.5v6M12 14.4v6M3.5 12h6M14.4 12h6" strokeWidth={1.6} />
  </I>
)

/** paint brush */
export const IconBrush = (p: IconProps) => (
  <I {...p}>
    <path d="M20 3c-5 2-9 6-11 10l2 2C15 13 19 9 21 4z" />
    <path d="M9 15c-2 0-4 1.4-4 5 2.4 0 5-.6 6-2.6z" />
  </I>
)

/** garage / car wall */
export const IconGarage = (p: IconProps) => (
  <I {...p}>
    <path d="M3 10 12 4l9 6v10h-3v-7H6v7H3z" />
    <path d="M6 16h12M6 19h12" strokeWidth={1.6} />
  </I>
)

/** single checkered race flag */
export const IconFlag = (p: IconProps) => (
  <I {...p}>
    <path d="M5 21V4" />
    <path d="M5 4c4-2 8 2 14 0v10c-6 2-10-2-14 0z" />
    <path d="M9 4.6v4.8M13 5.6v4.8M17 5.2v4.8M5 9c4-2 8 2 14 0" strokeWidth={1.3} />
  </I>
)

/** drafting ruler — blueprint */
export const IconRuler = (p: IconProps) => (
  <I {...p}>
    <path d="M3 17 17 3l4 4L7 21z" />
    <path d="M8.5 15.5 10 17M11.5 12.5 13 14M14.5 9.5 16 11M17.5 6.5 19 8" strokeWidth={1.6} />
  </I>
)

export const IconUndo = (p: IconProps) => (
  <I {...p}>
    <path d="M8 5 3 10l5 5" />
    <path d="M3 10h11a6 6 0 0 1 0 12h-4" />
  </I>
)

export const IconRedo = (p: IconProps) => (
  <I {...p}>
    <path d="m16 5 5 5-5 5" />
    <path d="M21 10H10a6 6 0 0 0 0 12h4" />
  </I>
)

export const IconArrowLeft = (p: IconProps) => (
  <I {...p}>
    <path d="M20 12H4M10 6l-6 6 6 6" />
  </I>
)

export const IconPlus = (p: IconProps) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
)

export const IconMinus = (p: IconProps) => (
  <I {...p}>
    <path d="M5 12h14" />
  </I>
)

/** dice — random name */
export const IconDice = (p: IconProps) => (
  <I {...p}>
    <rect x={4} y={4} width={16} height={16} rx={3} />
    <circle cx={9} cy={9} r={1.1} fill="currentColor" stroke="none" />
    <circle cx={15} cy={15} r={1.1} fill="currentColor" stroke="none" />
    <circle cx={15} cy={9} r={1.1} fill="currentColor" stroke="none" />
    <circle cx={9} cy={15} r={1.1} fill="currentColor" stroke="none" />
  </I>
)

export const IconPrint = (p: IconProps) => (
  <I {...p}>
    <path d="M7 8V3h10v5" />
    <rect x={4} y={8} width={16} height={8} rx={1.5} />
    <path d="M7 13h10v8H7z" />
  </I>
)

export const IconSound = (p: IconProps) => (
  <I {...p}>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" strokeWidth={1.7} />
  </I>
)

export const IconSoundOff = (p: IconProps) => (
  <I {...p}>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="m16 9 6 6M22 9l-6 6" strokeWidth={1.7} />
  </I>
)

/** speech / narration */
export const IconVoice = (p: IconProps) => (
  <I {...p}>
    <path d="M21 11a8 7 0 0 1-8 7c-1 0-2-.1-2.9-.4L5 19l1.2-3.2A7 7 0 0 1 5 11a8 7 0 0 1 16 0z" />
    <path d="M9 10.5h6M9 13h4" strokeWidth={1.6} />
  </I>
)

export const IconRematch = (p: IconProps) => (
  <I {...p}>
    <path d="M20 5v6h-6" />
    <path d="M20 11A8 8 0 1 0 18 17" />
  </I>
)

export const IconWrench = (p: IconProps) => (
  <I {...p}>
    <path d="M14 7a4.5 4.5 0 0 1 5.6-4.3L16.5 6l1.5 1.5 3.3-3.1A4.5 4.5 0 0 1 17 10L8 19a2.1 2.1 0 0 1-3-3l9-9z" />
  </I>
)

export const IconTrash = (p: IconProps) => (
  <I {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />
    <path d="M10 11v6M14 11v6" strokeWidth={1.6} />
  </I>
)

export const IconStar = (p: IconProps) => (
  <I {...p}>
    <path d="m12 3 2.5 5.4 5.8.7-4.3 4 1.1 5.8L12 16l-5.1 2.9 1.1-5.8-4.3-4 5.8-.7z" />
  </I>
)

/** raised-wheel balloon-lift concept: wheel with an up arrow */
export const IconLift = (p: IconProps) => (
  <I {...p}>
    <circle cx={12} cy={16} r={5} />
    <path d="M12 8V2M9 4.5 12 2l3 2.5" />
  </I>
)

/** graphite puff cloud */
export const IconPuff = (p: IconProps) => (
  <I {...p}>
    <path d="M7 17a4 4 0 1 1 .6-8A5.5 5.5 0 0 1 18 9.7 3.6 3.6 0 0 1 17.5 17z" />
    <path d="M8 21h1.5M12 21h1.5M16 21h1.5" strokeWidth={1.6} />
  </I>
)

/** side-view / top-view little cars */
export const IconSideView = (p: IconProps) => (
  <I {...p}>
    <path d="M3 15h2l4-5h7l5 3v2h-2" />
    <circle cx={8} cy={16} r={2} />
    <circle cx={17} cy={16} r={2} />
    <path d="M10 15h5" />
  </I>
)

export const IconTopView = (p: IconProps) => (
  <I {...p}>
    <rect x={7} y={3} width={10} height={18} rx={4} />
    <path d="M7 8h10M7 16h10" strokeWidth={1.6} />
  </I>
)

/** fresh block of pine */
export const IconBlock = (p: IconProps) => (
  <I {...p}>
    <path d="M3 9l9-5 9 5-9 5z" />
    <path d="M3 9v6l9 5v-6M21 9v6l-9 5" />
  </I>
)

/** wind lines — aero lesson */
export const IconWind = (p: IconProps) => (
  <I {...p}>
    <path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7" />
  </I>
)

/** sparkle — friction/polish lesson */
export const IconSparkle = (p: IconProps) => (
  <I {...p}>
    <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    <path d="m7 7 2.5 2.5M14.5 14.5 17 17M17 7l-2.5 2.5M9.5 14.5 7 17" strokeWidth={1.4} />
  </I>
)

/** weight-back arrow — placement lesson */
export const IconWeightBack = (p: IconProps) => (
  <I {...p}>
    <rect x={13} y={10} width={8} height={8} rx={1.5} />
    <path d="M17 10V7M15.5 7h3" strokeWidth={1.6} />
    <path d="M10 14H3M6 11l-3 3 3 3" />
  </I>
)

/** camera — photo finish */
export const IconCamera = (p: IconProps) => (
  <I {...p}>
    <rect x={3} y={7} width={18} height={13} rx={2} />
    <path d="M8 7 9.5 4h5L16 7" />
    <circle cx={12} cy={13} r={3.5} />
  </I>
)

/** lesson id → icon component (content stays React-free) */
export const LESSON_ICONS = {
  saw: IconSaw,
  scale: IconScale,
  weightBack: IconWeightBack,
  sparkle: IconSparkle,
  wind: IconWind,
  lift: IconLift,
} as const

export function LessonIcon({ id, size }: { id: keyof typeof LESSON_ICONS; size?: number }) {
  const Icon = LESSON_ICONS[id]
  return <Icon size={size} />
}
