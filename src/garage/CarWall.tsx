import { N, xAt } from '../carve/buffers'
import { replayOps } from '../carve/replay'
import { getDoc } from '../lib/storage'
import { PALETTE } from '../content/palette'
import { BLOCK, type CarDesign } from '../model/carDesign'
import { useGarageStore } from '../state/garageStore'
import { Btn } from '../ui/Btn'

/**
 * The car wall: every saved car hangs here as a mini side-profile plaque.
 * Tap to put it on the bench; build as many cars as you like.
 */
export function CarWall() {
  const activeId = useGarageStore((s) => s.design.id)
  const { loadDesign, newCar, deleteCar, setStation } = useGarageStore.getState()
  const doc = getDoc()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>🏠 My cars</div>
        <div style={{ flex: 1 }} />
        <Btn
          variant="red"
          onClick={() => {
            newCar()
            setStation('carve')
          }}
        >
          🪵 New car
        </Btn>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
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
          <div style={{ color: 'var(--navy)', fontWeight: 700 }}>
            No cars yet — your current build saves automatically!
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
        background: active ? 'var(--mustard)' : 'var(--paper)',
        border: '3px solid var(--ink)',
        borderRadius: 14,
        boxShadow: '0 4px 0 var(--ink)',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <button onClick={onLoad} style={{ display: 'block', width: '100%' }}>
        <MiniProfile car={car} />
        <div style={{ fontWeight: 900, marginTop: 4 }}>
          {car.name} <span style={{ color: 'var(--navy)' }}>#{car.number}</span>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>
          {bestTime ? `🏆 best: ${bestTime.toFixed(3)}s` : 'not raced yet'}
        </div>
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Btn variant="paper" onClick={onLoad} style={{ minHeight: 40 }}>
          🔧 Build
        </Btn>
        <Btn variant="paper" onClick={onDelete} style={{ minHeight: 40 }} title="delete">
          🗑
        </Btn>
      </div>
    </div>
  )
}

/** crisp little side-profile from the op log — no WebGL needed */
function MiniProfile({ car }: { car: CarDesign }) {
  const buffers = replayOps(car.carve.ops)
  const step = 16
  const pts: string[] = [`M 0 ${BLOCK.heightIn}`, `L 0 ${BLOCK.heightIn - buffers.yTop[0]!}`]
  for (let i = 0; i < N; i += step) {
    pts.push(`L ${xAt(i)} ${BLOCK.heightIn - buffers.yTop[i]!}`)
  }
  pts.push(`L ${BLOCK.lengthIn} ${BLOCK.heightIn - buffers.yTop[N - 1]!}`, `L ${BLOCK.lengthIn} ${BLOCK.heightIn}`, 'Z')
  return (
    <svg viewBox={`-0.2 -0.2 ${BLOCK.lengthIn + 0.4} ${BLOCK.heightIn + 0.6}`} style={{ width: '100%' }}>
      <path d={pts.join(' ')} fill={PALETTE[car.paint.body] ?? PALETTE.brickRed} stroke="var(--ink)" strokeWidth={0.05} />
      {[1.3, 5.675].map((x) => (
        <circle key={x} cx={x} cy={BLOCK.heightIn + 0.12} r={0.16} fill={PALETTE[car.paint.wheels] ?? PALETTE.ink} />
      ))}
    </svg>
  )
}
