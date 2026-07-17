import { N, xAt } from '../carve/buffers'
import { replayOps } from '../carve/replay'
import { getDoc } from '../lib/storage'
import { PALETTE } from '../content/palette'
import { BLOCK, type CarDesign } from '../model/carDesign'
import { useGarageStore } from '../state/garageStore'
import { Btn } from '../ui/Btn'
import { IconBlock, IconTrash, IconWrench } from '../ui/icons'

/**
 * The car wall: every saved car hangs here as a side-profile plaque.
 * Tap to put it on the bench; build as many cars as you like.
 */
export function CarWall() {
  const activeId = useGarageStore((s) => s.design.id)
  const { loadDesign, newCar, deleteCar, setStation } = useGarageStore.getState()
  const doc = getDoc()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>My Cars</div>
        <div style={{ flex: 1 }} />
        <Btn
          variant="red"
          size="sm"
          onClick={() => {
            newCar()
            setStation('carve')
          }}
        >
          <IconBlock size={16} /> New car
        </Btn>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {doc.cars.map((car) => (
          <CarPlaque
            key={car.id}
            car={car}
            active={car.id === activeId}
            bestTime={doc.bestTimes[car.id]}
            onLoad={() => {
              loadDesign(car)
              setStation('carve')
            }}
            onDelete={() => {
              if (confirm(`Take "${car.name}" off the wall for good?`)) deleteCar(car.id)
            }}
          />
        ))}
        {doc.cars.length === 0 && (
          <div style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic', color: 'var(--navy)' }}>
            No cars yet — your current build saves automatically.
          </div>
        )}
      </div>
    </div>
  )
}

function CarPlaque({
  car,
  active,
  bestTime,
  onLoad,
  onDelete,
}: {
  car: CarDesign
  active: boolean
  bestTime: number | undefined
  onLoad: () => void
  onDelete: () => void
}) {
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '2px solid var(--ink)',
        boxShadow: active
          ? 'inset 0 0 0 3px var(--paper), inset 0 0 0 5px var(--brick-red)'
          : 'inset 0 0 0 3px var(--paper), inset 0 0 0 4px var(--ink)',
        borderRadius: 2,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <button onClick={onLoad} style={{ display: 'block', width: '100%', cursor: 'pointer' }}>
        <MiniProfile design={car} />
        <div className="lp-label" style={{ fontSize: '0.8rem', marginTop: 4 }}>
          {car.name} <span style={{ color: 'var(--brick-red)' }}>No.{car.number}</span>
        </div>
        <div className="lp-label" style={{ fontSize: '0.62rem', color: 'var(--navy)' }}>
          {bestTime ? `best time ${bestTime.toFixed(3)}s` : 'not raced yet'}
        </div>
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        <Btn size="sm" onClick={onLoad}>
          <IconWrench size={14} /> Build
        </Btn>
        <Btn size="sm" onClick={onDelete} title="delete">
          <IconTrash size={14} />
        </Btn>
      </div>
    </div>
  )
}

/** crisp little side-profile from the op log — no WebGL needed */
export function MiniProfile({ design }: { design: CarDesign }) {
  const buffers = replayOps(design.carve.ops)
  const step = 16
  const pts: string[] = [`M 0 ${BLOCK.heightIn}`, `L 0 ${BLOCK.heightIn - buffers.yTop[0]!}`]
  for (let i = 0; i < N; i += step) {
    pts.push(`L ${xAt(i)} ${BLOCK.heightIn - buffers.yTop[i]!}`)
  }
  pts.push(`L ${BLOCK.lengthIn} ${BLOCK.heightIn - buffers.yTop[N - 1]!}`, `L ${BLOCK.lengthIn} ${BLOCK.heightIn}`, 'Z')
  return (
    <svg viewBox={`-0.2 -0.2 ${BLOCK.lengthIn + 0.4} ${BLOCK.heightIn + 0.6}`} style={{ width: '100%' }}>
      <path d={pts.join(' ')} fill={PALETTE[design.paint.body] ?? PALETTE.brickRed} stroke="var(--ink)" strokeWidth={0.05} />
      {[1.3, 5.675].map((x) => (
        <circle key={x} cx={x} cy={BLOCK.heightIn + 0.12} r={0.16} fill={PALETTE[design.paint.wheels] ?? PALETTE.ink} />
      ))}
    </svg>
  )
}
