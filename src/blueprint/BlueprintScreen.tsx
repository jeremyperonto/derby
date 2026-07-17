import { decalById, SLOT_LABELS } from '../content/decals'
import { stickerDataURL } from '../garage/carDecals'
import { PALETTE } from '../content/palette'
import { IconArrowLeft, IconPrint } from '../ui/icons'
import { AXLE_X_IN, MAX_WEIGHT_OZ, PLUG_OZ, WEIGHT_SLOTS } from '../model/carDesign'
import { useAppStore } from '../state/appStore'
import { useGarageStore } from '../state/garageStore'
import { Btn } from '../ui/Btn'
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
        padding: 16,
      }}
    >
      {/* controls (hidden in print) */}
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
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
          border: '3px solid var(--ink)',
          borderRadius: 6,
          padding: 18,
          color: 'var(--ink)',
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
            borderBottom: '3px solid var(--ink)',
            paddingBottom: 8,
            marginBottom: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem' }}>
            {design.name} · №{design.number}
          </div>
          <div style={{ fontWeight: 800, letterSpacing: '0.12em' }}>OFFICIAL RACE PLANS</div>
          <div style={{ marginLeft: 'auto', fontWeight: 700 }}>
            DERBY DASH SPEEDWAY · 1:1 SCALE — PRINT AT 100%
          </div>
        </div>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {/* profiles column */}
          <div style={{ flex: '1 1 620px', minWidth: 320 }}>
            <SectionTitle>SIDE VIEW — cut this profile first (band saw)</SectionTitle>
            <svg
              width="204mm"
              height="46mm"
              viewBox="-6 -40 204 46"
              style={{ maxWidth: '100%', display: 'block' }}
            >
              <path
                d={sideProfilePathMm(buffers)}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={0.5}
                className="bp-line"
              />
              {/* axles */}
              {[AXLE_X_IN.front, AXLE_X_IN.rear].map((x) => (
                <g key={x}>
                  <circle cx={mm(x)} cy={-7.6} r={1.6} fill="none" stroke="var(--ink)" strokeWidth={0.4} />
                  <line x1={mm(x)} y1={0} x2={mm(x)} y2={3} stroke="var(--ink)" strokeWidth={0.3} />
                  <text x={mm(x)} y={5.6} fontSize={2.6} textAnchor="middle" fontWeight={700}>
                    axle {x}″
                  </text>
                </g>
              ))}
              {/* balance point */}
              <path
                d={`M ${mm(derived.comXIn) - 2} 2.2 L ${mm(derived.comXIn) + 2} 2.2 L ${mm(derived.comXIn)} -0.5 Z`}
                fill="var(--brick-red)"
              />
              {/* length dimension */}
              <line x1={0} y1={-36} x2={mm(7)} y2={-36} stroke="var(--ink)" strokeWidth={0.3} />
              <text x={mm(3.5)} y={-37.2} fontSize={3} textAnchor="middle" fontWeight={700}>
                7.00 in (177.8 mm)
              </text>
              <text x={mm(7) + 1.5} y={-mm(heightIn) / 2} fontSize={3} fontWeight={700} writingMode="tb">
                {heightIn.toFixed(2)}″
              </text>
            </svg>

            <SectionTitle>TOP VIEW — then cut this one (weights shown as holes)</SectionTitle>
            <svg
              width="204mm"
              height="54mm"
              viewBox="-6 -27 204 54"
              style={{ maxWidth: '100%', display: 'block' }}
            >
              <path
                d={topProfilePathMm(buffers)}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={0.5}
                className="bp-line"
              />
              <line x1={0} y1={0} x2={mm(7)} y2={0} stroke="var(--ink)" strokeWidth={0.2} strokeDasharray="2 1.4" />
              {design.weights.map((plug, i) => {
                const slot = WEIGHT_SLOTS[plug.slot]!
                return (
                  <g key={i}>
                    <circle
                      cx={mm(slot.xIn)}
                      cy={mm(-slot.zIn)}
                      r={3.6}
                      fill="none"
                      stroke="var(--brick-red)"
                      strokeWidth={0.5}
                    />
                    <text
                      x={mm(slot.xIn)}
                      y={mm(-slot.zIn) + 1.1}
                      fontSize={2.8}
                      textAnchor="middle"
                      fontWeight={800}
                    >
                      {PLUG_OZ[plug.kind]}
                    </text>
                  </g>
                )
              })}
              <text x={mm(3.5)} y={25} fontSize={3} textAnchor="middle" fontWeight={700}>
                drill ⌀0.29″ holes at the marks · numbers are ounces (steel ¼ oz · tungsten 1 oz)
              </text>
            </svg>
          </div>

          {/* right column: ruler + build sheet */}
          <div style={{ flex: '1 1 240px', minWidth: 240, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionTitle>CHECK THE SCALE</SectionTitle>
            <svg width="80mm" height="14mm" viewBox="0 0 80 14" style={{ display: 'block' }}>
              <rect x={2} y={2} width={25.4} height={6} fill="none" stroke="var(--ink)" strokeWidth={0.5} />
              {[0, 6.35, 12.7, 19.05, 25.4].map((x) => (
                <line key={x} x1={2 + x} y1={2} x2={2 + x} y2={x % 12.7 === 0 ? 10 : 8} stroke="var(--ink)" strokeWidth={0.4} />
              ))}
              <text x={2} y={13} fontSize={2.4} fontWeight={700}>
                bar must measure exactly 1 inch — else set print scale to 100%
              </text>
            </svg>

            <SectionTitle>BUILD SHEET</SectionTitle>
            <table style={{ fontSize: '0.92rem', fontWeight: 700, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['Total weight', `${derived.totalOz.toFixed(2)} oz of ${MAX_WEIGHT_OZ} allowed`],
                  ['Added plugs', `${plugTotalOz.toFixed(2)} oz (${design.weights.length} holes)`],
                  ['Balance point', `${derived.comXIn.toFixed(2)}″ from the nose — car should balance on a pencil there`],
                  ['Axle polish', ['none — sand them!', 'fine sandpaper', 'wet-sand smooth', 'polish to a mirror'][design.wheels.polish]!],
                  ['Graphite', design.wheels.graphite === 0 ? 'none — add some!' : `${design.wheels.graphite} good puff${design.wheels.graphite > 1 ? 's' : ''} per axle`],
                  ['Wheels', design.wheels.raised === 'none' ? 'all four touching' : 'raise the FRONT LEFT a hair off the track'],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ border: '1px solid var(--ink)', padding: '4px 8px', whiteSpace: 'nowrap' }}>{k}</td>
                    <td style={{ border: '1px solid var(--ink)', padding: '4px 8px' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <SectionTitle>PAINT SCHEME</SectionTitle>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Swatch label={`body: ${design.paint.body}`} color={PALETTE[design.paint.body] ?? '#999'} />
              <Swatch label={`wheels: ${design.paint.wheels}`} color={PALETTE[design.paint.wheels] ?? '#333'} />
              <div style={{ fontWeight: 800 }}>№ {design.number} on both sides</div>
            </div>

            {design.decals.length > 0 && (
              <>
                <SectionTitle>STICKERS</SectionTitle>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {design.decals.map((d) => {
                    const url = stickerDataURL(d.decalId)
                    return (
                      <div key={d.slot} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {url && <img src={url} width={18} height={18} alt="" />}
                        {decalById(d.decalId)?.name} — {SLOT_LABELS[d.slot]}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div style={{ marginTop: 'auto', fontWeight: 700, fontSize: '0.85rem', borderTop: '2px solid var(--ink)', paddingTop: 6 }}>
              Built in Derby Dash — tape the side view to a 7″ × 1¾″ × 1¼″ pine block and cut just outside the line.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 900, letterSpacing: '0.08em', margin: '8px 0 4px', fontSize: '0.9rem' }}>
      {children}
    </div>
  )
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.9rem' }}>
      <div style={{ width: 22, height: 22, background: color, border: '2px solid var(--ink)', borderRadius: 5 }} />
      {label}
    </div>
  )
}
