import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { sfx } from '../audio/audio'
import { idxAt, N, xAt } from '../carve/buffers'
import {
  AXLE_X_IN,
  BLOCK,
  MIN_HALF_WIDTH_IN,
  MIN_THICKNESS_IN,
  type CarveOp,
} from '../model/carDesign'
import { useGarageStore } from '../state/garageStore'
import { AXLE_Y_IN, WHEEL_RADIUS_IN } from './CarBody'

const WHEEL_WIDTH_IN = 0.32

/**
 * The 2D carve surface: an SVG of the live profile that turns finger drags
 * into carve ops. Coordinates are real inches (the SVG viewBox is the
 * block); gestures preview live via the store's draft op and commit on
 * release. Side view edits yTop; top view edits halfWidth (symmetric).
 */

const TOOL_R = { scoop: 0.45, sand: 0.55 } as const
const SAMPLE_STEP = 4 // buffer samples per SVG point
const MIN_STROKE_DIST = 0.06 // inches between recorded stroke points

export function CarveView() {
  const view = useGarageStore((s) => s.view)
  const tool = useGarageStore((s) => s.tool)
  const buffers = useGarageStore((s) => s.buffers)
  const draftOp = useGarageStore((s) => s.draftOp)
  const setDraft = useGarageStore((s) => s.setDraft)
  const commitDraft = useGarageStore((s) => s.commitDraft)

  const svgRef = useRef<SVGSVGElement>(null)
  const gesture = useRef<{ start: [number, number]; stroke: [number, number][] } | null>(null)

  const H = view === 'side' ? BLOCK.heightIn : BLOCK.widthIn
  const PAD = 0.45

  /** pointer event → inch coords in profile space (y up from block bottom / centerline) */
  const toInches = (e: PointerEvent<SVGSVGElement>): [number, number] | null => {
    const svg = svgRef.current
    if (!svg) return null
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    const x = pt.x
    const yProfile = view === 'side' ? H - pt.y : BLOCK.widthIn / 2 - pt.y
    return [x, yProfile]
  }

  const draftFor = (start: [number, number], stroke: [number, number][], end: [number, number]): CarveOp => {
    if (tool === 'slice') {
      return { t: 'slice', view, ax: start[0], ay: start[1], bx: end[0], by: end[1] }
    }
    return { t: tool, view, stroke, r: TOOL_R[tool] }
  }

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    const p = toInches(e)
    if (!p) return
    // gesture FIRST — capture is best-effort and can throw ("no active
    // pointer") on some first interactions; carving must survive that
    gesture.current = { start: p, stroke: [p] }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* drags just won't track outside the panel — fine */
    }
    if (tool !== 'slice') setDraft(draftFor(p, [p], p))
  }

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current
    if (!g) return
    const p = toInches(e)
    if (!p) return
    if (tool === 'slice') {
      setDraft(draftFor(g.start, g.stroke, p))
    } else {
      const last = g.stroke[g.stroke.length - 1]!
      const dist = Math.hypot(p[0] - last[0], p[1] - last[1])
      if (dist >= MIN_STROKE_DIST) {
        // interpolate so fast drags still carve a continuous groove
        const steps = Math.min(40, Math.floor(dist / MIN_STROKE_DIST))
        for (let k = 1; k <= steps; k++) {
          g.stroke.push([
            last[0] + ((p[0] - last[0]) * k) / steps,
            last[1] + ((p[1] - last[1]) * k) / steps,
          ])
        }
        setDraft(draftFor(g.start, g.stroke, p))
      }
    }
  }

  const onUp = () => {
    if (!gesture.current) return
    gesture.current = null
    if (tool === 'sand') sfx.sand()
    else sfx.carve()
    commitDraft()
  }

  // --- profile paths from the live buffers ---
  const sy = (y: number) => H - y // side view: flip so up is up
  let path = ''
  if (view === 'side') {
    const pts: string[] = [`M 0 ${sy(0)}`, `L 0 ${sy(buffers.yTop[0]!)}`]
    for (let i = 0; i < N; i += SAMPLE_STEP) pts.push(`L ${xAt(i)} ${sy(buffers.yTop[i]!)}`)
    pts.push(`L ${BLOCK.lengthIn} ${sy(buffers.yTop[N - 1]!)}`, `L ${BLOCK.lengthIn} ${sy(0)}`, 'Z')
    path = pts.join(' ')
  } else {
    const mid = BLOCK.widthIn / 2
    const right: string[] = []
    const left: string[] = []
    for (let i = 0; i < N; i += SAMPLE_STEP) {
      right.push(`${i === 0 ? 'M' : 'L'} ${xAt(i)} ${mid - buffers.halfWidth[i]!}`)
      left.unshift(`L ${xAt(i)} ${mid + buffers.halfWidth[i]!}`)
    }
    path = `${right.join(' ')} L ${BLOCK.lengthIn} ${mid + buffers.halfWidth[N - 1]!} ${left.join(' ')} Z`
  }

  const floorY =
    view === 'side' ? sy(MIN_THICKNESS_IN) : BLOCK.widthIn / 2 - MIN_HALF_WIDTH_IN

  const sliceDraft = draftOp?.t === 'slice' ? draftOp : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* caption lives OUTSIDE the drawing so it can never overlap it */}
      <div className="lp-label" style={{ fontSize: '0.66rem', color: 'var(--navy)' }}>
        « nose — {view === 'side' ? 'side view' : 'top view · dashed boxes show where the wheels mount'}
      </div>
    <svg
      ref={svgRef}
      viewBox={`${-PAD} ${-PAD} ${BLOCK.lengthIn + 2 * PAD} ${H + 2 * PAD}`}
      style={{ width: '100%', flex: 1, minHeight: 0, touchAction: 'none', display: 'block' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* workbench background + inch grid */}
      <rect x={-PAD} y={-PAD} width={BLOCK.lengthIn + 2 * PAD} height={H + 2 * PAD} fill="var(--kraft)" rx={0.15} />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={i} y1={0} x2={i} y2={H} stroke="var(--ink)" strokeOpacity={0.15} strokeWidth={0.015} />
      ))}

      {/* the wood */}
      <path d={path} fill="var(--pine)" stroke="var(--ink)" strokeWidth={0.035} strokeLinejoin="round" />

      {/* minimum-thickness floor */}
      <line
        x1={0}
        y1={floorY}
        x2={BLOCK.lengthIn}
        y2={floorY}
        stroke="var(--brick-red)"
        strokeOpacity={0.35}
        strokeWidth={0.02}
        strokeDasharray="0.12 0.1"
      />
      {view === 'top' && (
        <line
          x1={0}
          y1={BLOCK.widthIn / 2 + MIN_HALF_WIDTH_IN}
          x2={BLOCK.lengthIn}
          y2={BLOCK.widthIn / 2 + MIN_HALF_WIDTH_IN}
          stroke="var(--brick-red)"
          strokeOpacity={0.35}
          strokeWidth={0.02}
          strokeDasharray="0.12 0.1"
        />
      )}

      {/* wheels where they'll really mount: axle near the bottom edge,
          wheel overlapping the body's lower band and hanging below it */}
      {view === 'side' &&
        [AXLE_X_IN.front, AXLE_X_IN.rear].map((x) => (
          <g key={x} pointerEvents="none">
            <circle
              cx={x}
              cy={sy(AXLE_Y_IN)}
              r={WHEEL_RADIUS_IN}
              fill="var(--ink)"
              fillOpacity={0.06}
              stroke="var(--ink)"
              strokeOpacity={0.55}
              strokeWidth={0.03}
              strokeDasharray="0.1 0.07"
            />
            <circle cx={x} cy={sy(AXLE_Y_IN)} r={0.06} fill="var(--ink)" fillOpacity={0.8} />
          </g>
        ))}
      {view === 'top' &&
        [AXLE_X_IN.front, AXLE_X_IN.rear].map((x) => {
          const hw = buffers.halfWidth[idxAt(x)]!
          return (
            <g key={x} pointerEvents="none">
              {[-1, 1].map((side) => {
                const zInner = BLOCK.widthIn / 2 - side * (hw + 0.03)
                const rectY = side > 0 ? zInner - WHEEL_WIDTH_IN : zInner
                return (
                  <rect
                    key={side}
                    x={x - WHEEL_RADIUS_IN}
                    y={rectY}
                    width={WHEEL_RADIUS_IN * 2}
                    height={WHEEL_WIDTH_IN}
                    fill="var(--ink)"
                    fillOpacity={0.06}
                    stroke="var(--ink)"
                    strokeOpacity={0.55}
                    strokeWidth={0.03}
                    strokeDasharray="0.1 0.07"
                    rx={0.08}
                  />
                )
              })}
            </g>
          )
        })}

      {/* slice preview line */}
      {sliceDraft && (
        <line
          x1={sliceDraft.ax - 20 * (sliceDraft.bx - sliceDraft.ax)}
          y1={lineSvgY(sliceDraft, -20, view, H)}
          x2={sliceDraft.bx + 20 * (sliceDraft.bx - sliceDraft.ax)}
          y2={lineSvgY(sliceDraft, 21, view, H)}
          stroke="var(--brick-red)"
          strokeWidth={0.04}
          strokeDasharray="0.18 0.12"
        />
      )}

    </svg>
    </div>
  )
}

/** y of the extended slice line at parameter t along a→b, in svg coords */
function lineSvgY(
  op: { ax: number; ay: number; bx: number; by: number },
  t: number,
  view: 'side' | 'top',
  H: number,
): number {
  const y = op.ay + (op.by - op.ay) * t
  return view === 'side' ? H - y : BLOCK.widthIn / 2 - y
}
