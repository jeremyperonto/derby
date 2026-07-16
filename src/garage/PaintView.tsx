import { DECALS, SLOT_LABELS } from '../content/decals'
import { generateCarName } from '../content/names'
import { PALETTE, type PaletteId } from '../content/palette'
import { DECAL_SLOTS } from '../model/carDesign'
import { useGarageStore } from '../state/garageStore'
import { useProgressStore } from '../state/progressStore'
import { Btn } from '../ui/Btn'

/**
 * Paint & decals station: body/wheel colors, racing number, car name, and
 * one-tap sticker slots (tapping a slot cycles through the stickers).
 */
export function PaintView() {
  const design = useGarageStore((s) => s.design)
  const unlockedCount = useProgressStore((s) => s.unlocked.length) // re-render on unlocks
  const { setPaint, setNumber, setName, setDecal, clearDecal } = useGarageStore.getState()
  const { availablePaints, availableDecals } = useProgressStore.getState()

  void unlockedCount
  const paints = availablePaints()
  const decals = DECALS.filter((d) => availableDecals().includes(d.id))

  const cycleDecal = (slot: (typeof DECAL_SLOTS)[number]) => {
    const current = design.decals.find((d) => d.slot === slot)?.decalId
    const i = decals.findIndex((d) => d.id === current)
    const next = i + 1
    if (next >= decals.length) clearDecal(slot)
    else setDecal({ slot, decalId: decals[next]!.id })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '6px 4px', overflowY: 'auto' }}>
      <div>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>
          🎨 Body paint{' '}
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--navy)' }}>
            (beat rivals to win more colors!)
          </span>
        </div>
        <SwatchRow paints={paints} selected={design.paint.body} onPick={(body) => setPaint({ body })} />
      </div>

      <div>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>🛞 Wheel paint</div>
        <SwatchRow
          paints={[...paints, 'ink']}
          selected={design.paint.wheels}
          onPick={(wheels) => setPaint({ wheels })}
        />
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>🔢 Racing number</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Btn variant="paper" onClick={() => setNumber((design.number + 99) % 100)}>
              −
            </Btn>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                minWidth: 64,
                textAlign: 'center',
                background: 'var(--paper)',
                border: '3px solid var(--ink)',
                borderRadius: 12,
                padding: '2px 10px',
              }}
            >
              {design.number}
            </div>
            <Btn variant="paper" onClick={() => setNumber((design.number + 1) % 100)}>
              +
            </Btn>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>📛 Car name</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={design.name}
              onChange={(e) => setName(e.target.value)}
              style={{
                flex: 1,
                fontSize: '1.15rem',
                fontWeight: 800,
                fontFamily: 'inherit',
                padding: '10px 12px',
                border: '3px solid var(--ink)',
                borderRadius: 12,
                background: 'var(--paper)',
                color: 'var(--ink)',
              }}
            />
            <Btn variant="paper" onClick={() => setName(generateCarName())} title="random name">
              🎲
            </Btn>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 900, marginBottom: 2 }}>✨ Stickers</div>
        <div style={{ color: 'var(--navy)', fontWeight: 600, fontSize: '0.92rem', marginBottom: 8 }}>
          Tap a spot to change its sticker.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DECAL_SLOTS.map((slot) => {
            const current = design.decals.find((d) => d.slot === slot)
            const glyph = decals.find((d) => d.id === current?.decalId)?.glyph
            return (
              <Btn key={slot} variant="paper" onClick={() => cycleDecal(slot)}>
                <span style={{ fontSize: '1.5rem' }}>{glyph ?? '➕'}</span>
                <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{SLOT_LABELS[slot]}</div>
              </Btn>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SwatchRow({
  paints,
  selected,
  onPick,
}: {
  paints: PaletteId[]
  selected: PaletteId
  onPick: (id: PaletteId) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {[...new Set(paints)].map((id) => (
        <button
          key={id}
          onClick={() => onPick(id)}
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: PALETTE[id],
            border: selected === id ? '4px solid var(--ink)' : '3px solid rgba(33,29,22,0.35)',
            boxShadow: selected === id ? '0 3px 0 var(--ink)' : 'none',
            cursor: 'pointer',
          }}
          title={id}
        />
      ))}
    </div>
  )
}
