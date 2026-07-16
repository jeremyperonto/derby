import { useState } from 'react'
import { N, xAt } from '../carve/buffers'
import {
  AXLE_X_IN,
  BLOCK,
  MAX_WEIGHT_OZ,
  WEIGHT_SLOTS,
} from '../model/carDesign'
import { useGarageStore } from '../state/garageStore'
import { Btn } from '../ui/Btn'

/**
 * Weights station: underside view with pre-drilled slots (tap to place /
 * remove a plug), the Official Scale, and the Balance Bubble — the two
 * meters that teach the two weight lessons (design.md §3.2).
 */
export function WeightsView() {
  const design = useGarageStore((s) => s.design)
  const derived = useGarageStore((s) => s.derived)
  const buffers = useGarageStore((s) => s.buffers)
  const togglePlug = useGarageStore((s) => s.togglePlug)
  const [plugKind, setPlugKind] = useState<'steel' | 'tungsten'>('tungsten')
  const [bounce, setBounce] = useState(false)

  const mid = BLOCK.widthIn / 2
  const plugAt = (slot: number) => design.weights.find((p) => p.slot === slot)

  // balance-bubble geometry: green target zone ahead of the rear axle
  const zoneFrom = AXLE_X_IN.rear - 1.5
  const zoneTo = AXLE_X_IN.rear - 0.25
  const inZone = derived.comXIn >= zoneFrom && derived.comXIn <= zoneTo

  // scale needle: 0–6 oz sweep over 180°
  const needleDeg = Math.min(derived.totalOz, 6) * 30 - 90

  const onSlotTap = (slot: number) => {
    const result = togglePlug(slot, plugKind)
    if (result === 'overweight') {
      setBounce(true)
      setTimeout(() => setBounce(false), 700)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontWeight: 800 }}>Pick a plug:</span>
        <Btn variant="paper" active={plugKind === 'steel'} onClick={() => setPlugKind('steel')}>
          ⚫ Steel · ¼ oz
        </Btn>
        <Btn
          variant="paper"
          active={plugKind === 'tungsten'}
          onClick={() => setPlugKind('tungsten')}
        >
          ⚪ Tungsten · 1 oz
        </Btn>
        <span style={{ color: 'var(--navy)', fontWeight: 700, marginLeft: 'auto' }}>
          tap a hole to add / remove
        </span>
      </div>

      {/* underside of the car */}
      <svg
        viewBox={`-0.4 -0.4 ${BLOCK.lengthIn + 0.8} ${BLOCK.widthIn + 0.8}`}
        style={{ width: '100%', flex: 1, minHeight: 0 }}
      >
        <rect
          x={-0.4}
          y={-0.4}
          width={BLOCK.lengthIn + 0.8}
          height={BLOCK.widthIn + 0.8}
          fill="var(--kraft)"
          rx={0.15}
        />
        {/* body outline from the live top profile (underside silhouette) */}
        <path d={undersidePath(buffers.halfWidth, mid)} fill="var(--pine)" stroke="var(--ink)" strokeWidth={0.035} />
        {/* axles */}
        {[AXLE_X_IN.front, AXLE_X_IN.rear].map((x) => (
          <line
            key={x}
            x1={x}
            y1={-0.25}
            x2={x}
            y2={BLOCK.widthIn + 0.25}
            stroke="var(--ink)"
            strokeWidth={0.06}
            strokeOpacity={0.55}
          />
        ))}
        {/* balance target zone */}
        <rect
          x={zoneFrom}
          y={mid - 0.16}
          width={zoneTo - zoneFrom}
          height={0.32}
          rx={0.16}
          fill="var(--forest)"
          fillOpacity={0.35}
        />
        {/* the balance bubble itself */}
        <circle
          cx={derived.comXIn}
          cy={mid}
          r={0.17}
          fill={inZone ? 'var(--forest)' : 'var(--brick-red)'}
          stroke="var(--ink)"
          strokeWidth={0.03}
        />
        {/* weight slots */}
        {WEIGHT_SLOTS.map((slot, i) => {
          const plug = plugAt(i)
          return (
            <g key={i} onClick={() => onSlotTap(i)} style={{ cursor: 'pointer' }}>
              {/* generous invisible touch target */}
              <circle cx={slot.xIn} cy={mid - slot.zIn} r={0.42} fill="transparent" />
              <circle
                cx={slot.xIn}
                cy={mid - slot.zIn}
                r={0.2}
                fill={plug ? (plug.kind === 'tungsten' ? '#b9bec7' : '#5a5e66') : 'transparent'}
                stroke="var(--ink)"
                strokeWidth={0.035}
                strokeDasharray={plug ? undefined : '0.07 0.06'}
              />
              {plug && (
                <text
                  x={slot.xIn}
                  y={mid - slot.zIn + 0.07}
                  fontSize={0.19}
                  textAnchor="middle"
                  fill={plug.kind === 'tungsten' ? 'var(--ink)' : 'var(--paper)'}
                  fontWeight={800}
                >
                  {plug.kind === 'tungsten' ? '1' : '¼'}
                </text>
              )}
            </g>
          )
        })}
        <text x={0.06} y={-0.12} fontSize={0.24} fill="var(--ink)" fontWeight={700}>
          ⬅ nose · looking at the bottom of the car
        </text>
      </svg>

      {/* meters row */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {/* the official scale */}
        <svg viewBox="0 0 100 62" style={{ width: 190, flexShrink: 0 }}>
          <path d="M 8 54 A 42 42 0 0 1 92 54" fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
          {/* red zone from 5oz to 6oz */}
          <path d="M 87.4 33.8 A 42 42 0 0 1 92 54" fill="none" stroke="var(--brick-red)" strokeWidth={7} />
          {[0, 1, 2, 3, 4, 5, 6].map((oz) => {
            const a = ((oz * 30 - 180) * Math.PI) / 180
            return (
              <line
                key={oz}
                x1={50 + 34 * Math.cos(a)}
                y1={54 + 34 * Math.sin(a)}
                x2={50 + 40 * Math.cos(a)}
                y2={54 + 40 * Math.sin(a)}
                stroke="var(--ink)"
                strokeWidth={2}
              />
            )
          })}
          <g
            style={{
              transform: `rotate(${needleDeg}deg)`,
              transformOrigin: '50px 54px',
              transition: 'transform 400ms cubic-bezier(.34,1.56,.64,1)',
            }}
          >
            <line x1={50} y1={54} x2={50} y2={16} stroke="var(--brick-red)" strokeWidth={3.5} />
          </g>
          <circle cx={50} cy={54} r={5} fill="var(--ink)" />
        </svg>

        <div
          style={{
            fontWeight: 800,
            fontSize: '1.1rem',
            color: bounce ? 'var(--brick-red)' : 'var(--ink)',
            animation: bounce ? 'shake 0.5s' : undefined,
          }}
        >
          {bounce
            ? '🚨 Too heavy for the official scale!'
            : `${derived.totalOz.toFixed(2)} oz of ${MAX_WEIGHT_OZ} allowed`}
          <div style={{ fontSize: '0.95rem', color: 'var(--navy)', fontWeight: 700 }}>
            {inZone
              ? '✅ Balance bubble in the green — heavy in the back!'
              : derived.comXIn < zoneFrom
                ? '👉 Move the bubble back — add weight near the tail'
                : '👈 A little too far back — nudge a plug forward'}
          </div>
        </div>
      </div>
    </div>
  )
}

function undersidePath(halfWidth: Float32Array, mid: number): string {
  const step = 8
  const right: string[] = []
  const left: string[] = []
  for (let i = 0; i < N; i += step) {
    right.push(`${i === 0 ? 'M' : 'L'} ${xAt(i)} ${mid - halfWidth[i]!}`)
    left.unshift(`L ${xAt(i)} ${mid + halfWidth[i]!}`)
  }
  return `${right.join(' ')} L ${BLOCK.lengthIn} ${mid - halfWidth[N - 1]!} L ${BLOCK.lengthIn} ${mid + halfWidth[N - 1]!} ${left.join(' ')} Z`
}
