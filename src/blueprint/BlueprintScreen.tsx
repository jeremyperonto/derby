import { idxAt } from '../carve/buffers'
import { decalById, SLOT_LABELS } from '../content/decals'
import { stickerDataURL } from '../garage/carDecals'
import { PALETTE } from '../content/palette'
import { WHEEL_RADIUS_IN, AXLE_Y_IN } from '../garage/CarBody'
import { IconArrowLeft, IconPrint } from '../ui/icons'
import { AXLE_X_IN, BLOCK, MAX_WEIGHT_OZ, PLUG_OZ, WEIGHT_SLOTS } from '../model/carDesign'
import { useAppStore } from '../state/appStore'
import { useGarageStore } from '../state/garageStore'
import { Btn } from '../ui/Btn'
import { DiamondRule } from '../ui/ornaments'
import { maxHeightIn, mm, sideProfilePathMm, topProfilePathMm } from './profilePath'

/**
 * The printable shop blueprint (design.md §7): true 1:1-scale profiles the
 * kid's real block can be cut from, weight plan, prep checklist, paint
 * scheme, and a calibration ruler. Screen shows a kraft-paper sheet;
 * printing swaps to toner-friendly linework via CSS (see index.css).
 */
export function BlueprintScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const design = useGarageStore((s) => s.design)
  const buffers = useGarageStore((s) => s.buffers)
  const derived = useGarageStore((s) => s.derived)

  const heightIn = maxHeightIn(buffers)
  const plugTotalOz = design.weights.reduce((sum, p) => sum + PLUG_OZ[p.kind], 0)

  return (
    <div
      className="blueprint-screen"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--navy)',
        overflow: 'auto',
        padding: 20,
      }}
    >
      {/* controls (hidden in print) */}
      <div
        className="no-print"
        style={{ display: 'flex', gap: 10, marginBottom: 14, width: 'min(1080px, 100%)', margin: '0 auto 14px' }}
      >
        <Btn onClick={() => setScreen('garage')}>
          <IconArrowLeft size={17} /> Garage
        </Btn>
        <div style={{ flex: 1 }} />
        <Btn variant="red" size="lg" onClick={() => window.print()}>
          <IconPrint size={19} /> Print the plans
        </Btn>
      </div>

      {/* the sheet */}
      <div
        className="blueprint-sheet"
        style={{
          background: 'var(--kraft)',
          margin: '0 auto',
          width: 'min(1080px, 100%)',
          border: '2px solid var(--ink)',
          boxShadow: 'inset 0 0 0 4px var(--kraft), inset 0 0 0 5px var(--ink)',
          padding: '22px 26px',
          color: 'var(--ink)',
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 16,
            borderBottom: '2px solid var(--ink)',
            paddingBottom: 10,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="lp-label" style={{ fontSize: '0.6rem', color: 'var(--brick-red)', marginBottom: 2 }}>
              Official Race Plans
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', lineHeight: 0.95, letterSpacing: '0.02em' }}>
              {design.name}
            </div>
          </div>
          <div
            className="lp-label"
            style={{
              border: '2px solid var(--ink)',
              padding: '4px 10px',
              fontSize: '0.8rem',
              alignSelf: 'center',
            }}
          >
            No. {design.number}
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.03em' }}>
              DERBY DASH SPEEDWAY
            </div>
            <div className="lp-label" style={{ fontSize: '0.62rem', color: 'var(--brick-red)' }}>
              1:1 scale — print at 100%
            </div>
          </div>
        </div>

        <div className="bp-body" style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
          {/* profiles column (minWidth kept below a phone's content width so
              it never forces horizontal overflow; SVGs scale via maxWidth) */}
          <div style={{ flex: '1 1 600px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Section step="1" title="Side view — cut this profile first" hint="band saw">
              {/* width(mm) MUST equal viewBox width(units) for true 1:1 print scale */}
              <svg
                width="200mm"
                height={`${mm(heightIn) + 30}mm`}
                viewBox={`-9 ${-(mm(heightIn) + 16)} 200 ${mm(heightIn) + 30}`}
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
              >
                {/* baseline (bottom of the block) */}
                <line x1={0} y1={0} x2={mm(7)} y2={0} stroke="var(--ink)" strokeWidth={0.35} strokeDasharray="2 1.5" opacity={0.5} />

                {/* the wood */}
                <path d={sideProfilePathMm(buffers)} fill="var(--pine)" fillOpacity={0.5} stroke="var(--ink)" strokeWidth={0.6} strokeLinejoin="round" className="bp-line" />

                {/* wheels: dashed silhouette at the real mount height */}
                {[AXLE_X_IN.front, AXLE_X_IN.rear].map((x) => (
                  <g key={x}>
                    <circle cx={mm(x)} cy={mm(AXLE_Y_IN)} r={mm(WHEEL_RADIUS_IN)} fill="none" stroke="var(--ink)" strokeWidth={0.3} strokeDasharray="1.6 1.2" opacity={0.45} />
                    <circle cx={mm(x)} cy={mm(AXLE_Y_IN)} r={0.9} fill="var(--ink)" />
                    <text x={mm(x)} y={mm(AXLE_Y_IN) + 5.4} fontSize={2.6} textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight={600}>
                      axle {x}″
                    </text>
                  </g>
                ))}

                {/* balance point marker */}
                <path d={`M ${mm(derived.comXIn) - 2} 3 L ${mm(derived.comXIn) + 2} 3 L ${mm(derived.comXIn)} 0.2 Z`} fill="var(--brick-red)" />

                {/* length dimension */}
                <DimLine x1={0} x2={mm(7)} y={-(mm(heightIn) + 8)} label={`7.00 in (177.8 mm)`} />
                {/* height dimension */}
                <text x={mm(7) + 2.5} y={-mm(heightIn) / 2} fontSize={2.8} fontFamily="Oswald, sans-serif" fontWeight={600} writingMode="tb">
                  {heightIn.toFixed(2)}″ tall
                </text>
              </svg>
            </Section>

            <Section step="2" title="Top view — then cut this one" hint="weights = drilled holes">
              {/* width(mm) MUST equal viewBox width(units) for true 1:1 print scale */}
              <svg
                width="200mm"
                height="48mm"
                viewBox={`-9 -22 200 48`}
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
              >
                <path d={topProfilePathMm(buffers)} fill="var(--pine)" fillOpacity={0.5} stroke="var(--ink)" strokeWidth={0.6} strokeLinejoin="round" className="bp-line" />
                <line x1={0} y1={0} x2={mm(7)} y2={0} stroke="var(--ink)" strokeWidth={0.3} strokeDasharray="2 1.6" opacity={0.5} />
                {design.weights.map((plug, i) => {
                  const slot = WEIGHT_SLOTS[plug.slot]!
                  // keep the drill mark ON the wood: clamp toward the centerline
                  // if the carved tail is too narrow for its bumper slot
                  const hwMm = mm(buffers.halfWidth[idxAt(slot.xIn)]!)
                  const rawZ = mm(-slot.zIn)
                  const limit = Math.max(0, hwMm - 4.2)
                  const cy = Math.max(-limit, Math.min(limit, rawZ))
                  return (
                    <g key={i}>
                      <circle cx={mm(slot.xIn)} cy={cy} r={3.7} fill="var(--paper)" stroke="var(--brick-red)" strokeWidth={0.6} />
                      <text x={mm(slot.xIn)} y={cy + 1.2} fontSize={3} textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight={600}>
                        {PLUG_OZ[plug.kind]}
                      </text>
                    </g>
                  )
                })}
                {design.weights.length === 0 && (
                  <text x={mm(3.5)} y={0} fontSize={3} textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight={600} opacity={0.6}>
                    no weights yet — add some in the garage!
                  </text>
                )}
                <text x={mm(3.5)} y={22} fontSize={2.8} textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight={600}>
                  drill ⌀0.29″ holes at the marks · numbers are ounces (steel ¼ · tungsten 1)
                </text>
              </svg>
            </Section>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
              <DiamondRule width={200} />
            </div>
          </div>

          {/* right column: ruler + build sheet */}
          <div style={{ flex: '1 1 250px', minWidth: 250, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Section title="Check the scale">
              {/* width(mm) MUST equal viewBox width(units): the bar reads exactly 1 inch */}
              <svg width="80mm" height="15mm" viewBox="0 0 80 15" style={{ maxWidth: '100%', height: 'auto', display: 'block' }}>
                <rect x={2} y={2} width={25.4} height={7} fill="var(--paper)" stroke="var(--ink)" strokeWidth={0.6} />
                {[0, 6.35, 12.7, 19.05, 25.4].map((x) => (
                  <line key={x} x1={2 + x} y1={2} x2={2 + x} y2={x % 12.7 === 0 ? 11 : 9} stroke="var(--ink)" strokeWidth={0.5} />
                ))}
                <text x={2} y={14} fontSize={2.4} fontFamily="Oswald, sans-serif" fontWeight={600}>
                  this bar must be exactly 1 inch — else set print to 100%
                </text>
              </svg>
            </Section>

            <Section title="Build sheet">
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1.5px solid var(--ink)',
                  fontFamily: 'var(--font-prose)',
                  fontSize: '0.92rem',
                }}
              >
                <tbody>
                  {[
                    ['Weight', `${derived.totalOz.toFixed(2)} of ${MAX_WEIGHT_OZ} oz`],
                    ['Plugs', `${plugTotalOz.toFixed(2)} oz in ${design.weights.length} hole${design.weights.length === 1 ? '' : 's'}`],
                    ['Balance', `${derived.comXIn.toFixed(2)}″ from the nose — balance it there on a pencil`],
                    ['Polish', ['none — sand them!', 'fine sandpaper', 'wet-sand smooth', 'polish to a mirror'][design.wheels.polish]!],
                    ['Graphite', design.wheels.graphite === 0 ? 'none — add some!' : `${design.wheels.graphite} good puff${design.wheels.graphite > 1 ? 's' : ''} per axle`],
                    ['Wheels', design.wheels.raised === 'none' ? 'all four touching' : 'raise the front-left a hair off the track'],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td
                        className="lp-label"
                        style={{
                          border: '1px solid var(--ink)',
                          padding: '5px 9px',
                          fontSize: '0.62rem',
                          whiteSpace: 'nowrap',
                          verticalAlign: 'top',
                          background: 'rgba(33,29,22,0.05)',
                        }}
                      >
                        {k}
                      </td>
                      <td style={{ border: '1px solid var(--ink)', padding: '5px 9px', lineHeight: 1.35 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Paint & number">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', fontFamily: 'var(--font-prose)' }}>
                <Swatch label={paintName(design.paint.body)} color={PALETTE[design.paint.body] ?? '#999'} />
                <Swatch label={`wheels: ${paintName(design.paint.wheels)}`} color={PALETTE[design.paint.wheels] ?? '#333'} />
              </div>
              <div style={{ fontFamily: 'var(--font-prose)', fontSize: '0.9rem', marginTop: 4 }}>
                Racing number <b>{design.number}</b> on both sides.
              </div>
            </Section>

            {design.decals.length > 0 && (
              <Section title="Stickers">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'var(--font-prose)', fontSize: '0.92rem' }}>
                  {design.decals.map((d) => {
                    const url = stickerDataURL(d.decalId)
                    return (
                      <div key={d.slot} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {url && <img src={url} width={20} height={20} alt="" style={{ border: '1px solid var(--ink)', borderRadius: 2, background: 'var(--paper)' }} />}
                        <span>
                          <b>{decalById(d.decalId)?.name}</b> — {SLOT_LABELS[d.slot].toLowerCase()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Section>
            )}

            <div
              style={{
                marginTop: 'auto',
                fontFamily: 'var(--font-prose)',
                fontStyle: 'italic',
                fontSize: '0.85rem',
                lineHeight: 1.4,
                borderTop: '2px solid var(--ink)',
                paddingTop: 8,
              }}
            >
              Tape the side view onto a {BLOCK.lengthIn}″ × 1¾″ × 1¼″ pine block and cut just outside the line. Built in Derby Dash.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  step,
  title,
  hint,
  children,
}: {
  step?: string
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {step && (
          <span
            className="lp-label"
            style={{
              border: '1.5px solid var(--ink)',
              width: 18,
              height: 18,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.66rem',
              flexShrink: 0,
            }}
          >
            {step}
          </span>
        )}
        <span className="lp-label" style={{ fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        {hint && (
          <span style={{ fontFamily: 'var(--font-script)', fontSize: '0.95rem', color: 'var(--brick-red)' }}>
            {hint}
          </span>
        )}
        <span style={{ flex: 1, height: 0, borderTop: '1px solid var(--ink)', opacity: 0.35 }} />
      </div>
      {children}
    </section>
  )
}

/** dimension line with end ticks and a centered label */
function DimLine({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="var(--ink)" strokeWidth={0.3} />
      <line x1={x1} y1={y - 1.4} x2={x1} y2={y + 1.4} stroke="var(--ink)" strokeWidth={0.3} />
      <line x1={x2} y1={y - 1.4} x2={x2} y2={y + 1.4} stroke="var(--ink)" strokeWidth={0.3} />
      <rect x={(x1 + x2) / 2 - 18} y={y - 2} width={36} height={4} fill="var(--kraft)" className="dim-bg" />
      <text x={(x1 + x2) / 2} y={y + 1.1} fontSize={3} textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight={600}>
        {label}
      </text>
    </g>
  )
}

function paintName(id: string): string {
  const NAMES: Record<string, string> = {
    brickRed: 'brick red',
    navy: 'navy',
    skyBlue: 'sky blue',
    mustard: 'mustard gold',
    orange: 'hot-rod orange',
    forest: 'forest green',
    paper: 'cream white',
    ink: 'midnight black',
    pine: 'pine',
    kraft: 'kraft',
  }
  return NAMES[id] ?? id
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.9rem' }}>
      <div style={{ width: 22, height: 22, background: color, border: '2px solid var(--ink)', borderRadius: 2 }} />
      {label}
    </div>
  )
}
