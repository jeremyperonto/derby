import type { ReactNode } from 'react'
import { useState } from 'react'
import { DECALS, SLOT_LABELS, type Decal } from '../content/decals'
import { generateCarName } from '../content/names'
import { CAR_PAINTS, PALETTE, type PaletteId } from '../content/palette'
import { RIVALS } from '../content/rivals'
import { UNLOCKS } from '../content/unlocks'
import { DECAL_SLOTS } from '../model/carDesign'
import { useGarageStore } from '../state/garageStore'
import { useProgressStore } from '../state/progressStore'
import { Btn } from '../ui/Btn'
import { Fieldset } from '../ui/Fieldset'
import { IconDice, IconLock, IconMinus, IconPlus } from '../ui/icons'
import { stickerDataURL } from './carDecals'

const SELECTED_RING = 'inset 0 0 0 3px var(--paper), inset 0 0 0 5px var(--ink)'

/** which rival hands out a paint/decal, so locked items say how to earn them */
function grantingRivalName(unlockId: string): string | null {
  const rival = RIVALS.find((r) => r.unlocks.includes(unlockId))
  return rival ? rival.name : null
}
function paintHint(id: PaletteId): string {
  const u = UNLOCKS.find((x) => x.kind === 'paint' && x.itemId === id)
  const who = u && grantingRivalName(u.id)
  return who ? `Beat ${who} to win ${u!.label}!` : 'Win more races to unlock this color!'
}
function decalHint(id: string): string {
  const u = UNLOCKS.find((x) => x.kind === 'decal' && x.itemId === id)
  const who = u && grantingRivalName(u.id)
  return who ? `Beat ${who} to win the ${u!.label}!` : 'Win more races to unlock this sticker!'
}

/**
 * Paint & decals station: body/wheel/accent colors, racing number, car name,
 * and one-tap sticker spots. Locked colors and stickers are shown greyed with
 * a lock so a kid can see what's still to win (tap one for the how-to-unlock).
 */
export function PaintView() {
  const design = useGarageStore((s) => s.design)
  const unlockedCount = useProgressStore((s) => s.unlocked.length) // re-render on unlocks
  const { setPaint, setNumber, setName, setDecal, clearDecal } = useGarageStore.getState()
  const { availablePaints, availableDecals } = useProgressStore.getState()
  const [hint, setHint] = useState<string | null>(null)

  void unlockedCount
  const availPaint = new Set(availablePaints())
  const availWheel = new Set<PaletteId>([...availablePaints(), 'ink']) // wheels can be ink from the start
  const availDecal = new Set(availableDecals())
  const unlockedDecals = DECALS.filter((d) => availDecal.has(d.id))

  const cycleDecal = (slot: (typeof DECAL_SLOTS)[number]) => {
    const current = design.decals.find((d) => d.slot === slot)?.decalId
    const i = unlockedDecals.findIndex((d) => d.id === current)
    const next = i + 1
    if (next >= unlockedDecals.length) clearDecal(slot)
    else setDecal({ slot, decalId: unlockedDecals[next]!.id })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '2px 0', overflowY: 'auto' }}>
      {hint && (
        <button
          onClick={() => setHint(null)}
          className="lp-label"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '2px solid var(--ink)',
            borderRadius: 2,
            background: 'var(--mustard)',
            color: 'var(--ink)',
            padding: '7px 12px',
            fontSize: '0.66rem',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <IconLock size={16} /> {hint}
        </button>
      )}

      <Fieldset legend="Body paint — beat rivals to win more colors">
        <SwatchRow
          ids={CAR_PAINTS}
          available={availPaint}
          selected={design.paint.body}
          onPick={(body) => {
            setPaint({ body })
            setHint(null)
          }}
          onLocked={(id) => setHint(paintHint(id))}
        />
      </Fieldset>

      <Fieldset legend="Wheel paint">
        <SwatchRow
          ids={CAR_PAINTS}
          available={availWheel}
          selected={design.paint.wheels}
          onPick={(wheels) => {
            setPaint({ wheels })
            setHint(null)
          }}
          onLocked={(id) => setHint(paintHint(id))}
        />
      </Fieldset>

      <Fieldset legend="Accent trim — number ring & wheel hubs">
        <SwatchRow
          ids={CAR_PAINTS}
          available={availPaint}
          selected={design.paint.accent}
          onPick={(accent) => {
            setPaint({ accent })
            setHint(null)
          }}
          onLocked={(id) => setHint(paintHint(id))}
          leading={
            <NoneSwatch
              active={!design.paint.accent}
              onClick={() => {
                setPaint({ accent: undefined })
                setHint(null)
              }}
            />
          }
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

      <Fieldset legend="Sticker collection — win races to unlock more">
        {DECALS.map((d) => (
          <StickerTile key={d.id} decal={d} locked={!availDecal.has(d.id)} onLocked={() => setHint(decalHint(d.id))} />
        ))}
      </Fieldset>
    </div>
  )
}

function SwatchRow({
  ids,
  available,
  selected,
  onPick,
  onLocked,
  leading,
}: {
  ids: PaletteId[]
  available: Set<PaletteId>
  selected: PaletteId | undefined
  onPick: (id: PaletteId) => void
  onLocked: (id: PaletteId) => void
  leading?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {leading}
      {[...new Set(ids)].map((id) => {
        const unlocked = available.has(id)
        return (
          <button
            key={id}
            onClick={() => (unlocked ? onPick(id) : onLocked(id))}
            style={{
              position: 'relative',
              width: 42,
              height: 42,
              borderRadius: 2,
              background: PALETTE[id],
              border: '2px solid var(--ink)',
              boxShadow: selected === id ? SELECTED_RING : 'none',
              opacity: unlocked ? 1 : 0.45,
              cursor: 'pointer',
            }}
            title={unlocked ? id : 'locked — tap to see how to win it'}
          >
            {!unlocked && <LockBadge />}
          </button>
        )
      })}
    </div>
  )
}

/** paper lock chip that reads on top of any swatch color */
function LockBadge() {
  return (
    <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'var(--paper)',
          border: '1.5px solid var(--ink)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <IconLock size={14} />
      </span>
    </span>
  )
}

/** the "no accent" tile — a slashed paper chip */
function NoneSwatch({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="no accent"
      style={{
        position: 'relative',
        width: 42,
        height: 42,
        borderRadius: 2,
        background: 'var(--paper)',
        border: '2px solid var(--ink)',
        boxShadow: active ? SELECTED_RING : 'none',
        cursor: 'pointer',
      }}
    >
      <svg width={40} height={40} viewBox="0 0 40 40" style={{ position: 'absolute', inset: 0 }}>
        <line x1={9} y1={31} x2={31} y2={9} stroke="var(--ink)" strokeWidth={2.5} />
      </svg>
    </button>
  )
}

/** a sticker in the collection gallery — greyed with a lock until it's won */
function StickerTile({ decal, locked, onLocked }: { decal: Decal; locked: boolean; onLocked: () => void }) {
  const url = stickerDataURL(decal.id)
  return (
    <button
      onClick={locked ? onLocked : undefined}
      title={locked ? 'locked — tap to see how to win it' : decal.name}
      style={{
        position: 'relative',
        width: 46,
        height: 46,
        border: '2px solid var(--ink)',
        borderRadius: 2,
        background: 'var(--paper)',
        display: 'grid',
        placeItems: 'center',
        opacity: locked ? 0.5 : 1,
        cursor: locked ? 'pointer' : 'default',
      }}
    >
      {url && <img src={url} width={32} height={32} alt="" style={{ filter: locked ? 'grayscale(1)' : 'none' }} />}
      {locked && <LockBadge />}
    </button>
  )
}
