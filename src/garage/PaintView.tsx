import { DECALS, SLOT_LABELS } from '../content/decals'
import { generateCarName } from '../content/names'
import { PALETTE, type PaletteId } from '../content/palette'
import { DECAL_SLOTS } from '../model/carDesign'
import { useGarageStore } from '../state/garageStore'
import { useProgressStore } from '../state/progressStore'
import { Btn } from '../ui/Btn'
import { Fieldset } from '../ui/Fieldset'
import { IconDice, IconMinus, IconPlus } from '../ui/icons'
import { stickerDataURL } from './carDecals'

/**
 * Paint & decals station: body/wheel colors, racing number, car name, and
 * one-tap sticker spots (tapping a spot cycles through the stickers).
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '2px 0', overflowY: 'auto' }}>
      <Fieldset legend="Body paint — beat rivals to win more colors">
        <SwatchRow paints={paints} selected={design.paint.body} onPick={(body) => setPaint({ body })} />
      </Fieldset>

      <Fieldset legend="Wheel paint">
        <SwatchRow
          paints={[...paints, 'ink']}
          selected={design.paint.wheels}
          onPick={(wheels) => setPaint({ wheels })}
        />
      </Fieldset>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Fieldset legend="Racing number">
          <Btn size="sm" onClick={() => setNumber((design.number + 99) % 100)} title="lower">
            <IconMinus size={16} />
          </Btn>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.7rem',
              minWidth: 58,
              textAlign: 'center',
              border: '2px solid var(--ink)',
              borderRadius: 2,
              background: 'var(--paper)',
              padding: '2px 8px',
            }}
          >
            {design.number}
          </div>
          <Btn size="sm" onClick={() => setNumber((design.number + 1) % 100)} title="higher">
            <IconPlus size={16} />
          </Btn>
        </Fieldset>

        <Fieldset legend="Car name" style={{ flex: 1, minWidth: 220 }}>
          <input
            value={design.name}
            onChange={(e) => setName(e.target.value)}
            style={{
              flex: 1,
              fontFamily: 'var(--font-label)',
              fontSize: '1.05rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              padding: '8px 12px',
              border: '2px solid var(--ink)',
              borderRadius: 2,
              background: 'var(--paper)',
              color: 'var(--ink)',
              minWidth: 120,
            }}
          />
          <Btn size="sm" onClick={() => setName(generateCarName())} title="random name">
            <IconDice size={18} />
          </Btn>
        </Fieldset>
      </div>

      <Fieldset legend="Stickers — tap a spot to change it">
        {DECAL_SLOTS.map((slot) => {
          const current = design.decals.find((d) => d.slot === slot)
          const url = current ? stickerDataURL(current.decalId) : null
          return (
            <button
              key={slot}
              onClick={() => cycleDecal(slot)}
              style={{
                width: 76,
                border: '2px solid var(--ink)',
                borderRadius: 2,
                background: 'var(--paper)',
                padding: '6px 4px 5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer',
              }}
              title={current ? DECALS.find((d) => d.id === current.decalId)?.name : 'add a sticker'}
            >
              <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {url ? (
                  <img src={url} width={34} height={34} alt="" />
                ) : (
                  <IconPlus size={20} style={{ opacity: 0.45 }} />
                )}
              </div>
              <span className="lp-label" style={{ fontSize: '0.58rem' }}>
                {SLOT_LABELS[slot]}
              </span>
            </button>
          )
        })}
      </Fieldset>
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
            width: 42,
            height: 42,
            borderRadius: 2,
            background: PALETTE[id],
            border: '2px solid var(--ink)',
            boxShadow: selected === id ? 'inset 0 0 0 3px var(--paper), inset 0 0 0 5px var(--ink)' : 'none',
            cursor: 'pointer',
          }}
          title={id}
        />
      ))}
    </div>
  )
}
