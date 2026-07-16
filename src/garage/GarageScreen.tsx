import { TEMPLATES } from '../content/templates'
import { TEST_CARS } from '../content/testCars'
import type { CarDesign } from '../model/carDesign'
import { useAppStore } from '../state/appStore'
import { useGarageStore, type CarveTool, type GarageStation } from '../state/garageStore'
import { useRaceStore } from '../state/raceStore'
import { Btn } from '../ui/Btn'
import { CarveView } from './CarveView'
import { CarWall } from './CarWall'
import { PaintView } from './PaintView'
import { WeightsView } from './WeightsView'
import { WheelsView } from './WheelsView'

/** interim opponents until the rivals ladder lands (M5) */
export const PRACTICE_RIVALS: CarDesign[] = [
  { ...TEST_CARS.brickRacer!, paint: { body: 'navy', wheels: 'ink' } },
  { ...TEST_CARS.squeakyWedge!, paint: { body: 'mustard', wheels: 'ink' } },
  { ...TEST_CARS.noseWedge!, paint: { body: 'forest', wheels: 'ink' } },
]

/**
 * Garage overlay: station tabs down the left card (carve / weights /
 * wheels / paint / car wall); the live 3D preview shows through on the
 * right of the persistent Canvas.
 */

const TOOLS: { id: CarveTool; icon: string; label: string }[] = [
  { id: 'slice', icon: '🔪', label: 'Slice' },
  { id: 'scoop', icon: '🥄', label: 'Scoop' },
  { id: 'sand', icon: '🧽', label: 'Sand' },
]

const STATIONS: { id: GarageStation; icon: string; label: string }[] = [
  { id: 'carve', icon: '🔪', label: 'Carve' },
  { id: 'weights', icon: '⚖️', label: 'Weights' },
  { id: 'wheels', icon: '🛞', label: 'Wheels' },
  { id: 'paint', icon: '🎨', label: 'Paint' },
  { id: 'cars', icon: '🏠', label: 'My Cars' },
]

export function GarageScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const station = useGarageStore((s) => s.station)
  const design = useGarageStore((s) => s.design)
  const derived = useGarageStore((s) => s.derived)
  const canUndo = useGarageStore((s) => s.design.carve.ops.length > 0)
  const canRedo = useGarageStore((s) => s.redoStack.length > 0)
  const { setStation, undo, redo } = useGarageStore.getState()

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none',
      }}
    >
      {/* top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        <Btn variant="paper" onClick={() => setScreen('title')} title="back">
          ⬅
        </Btn>
        <div
          style={{
            background: 'var(--navy)',
            color: 'var(--paper)',
            border: '3px solid var(--ink)',
            borderRadius: 12,
            padding: '8px 16px',
            fontWeight: 800,
          }}
        >
          🔨 {design.name} · #{design.number}
        </div>
        <div
          style={{
            background: derived.overweight ? 'var(--brick-red)' : 'var(--paper)',
            color: derived.overweight ? 'var(--paper)' : 'var(--ink)',
            border: '3px solid var(--ink)',
            borderRadius: 12,
            padding: '8px 16px',
            fontWeight: 800,
          }}
        >
          ⚖️ {derived.totalOz.toFixed(1)} / 5 oz
        </div>
        <div style={{ flex: 1 }} />
        {station === 'carve' && (
          <>
            <Btn variant="mustard" onClick={undo} disabled={!canUndo} title="undo">
              ↩️ Undo
            </Btn>
            <Btn variant="paper" onClick={redo} disabled={!canRedo} title="redo">
              ↪️
            </Btn>
          </>
        )}
        <Btn
          variant="red"
          onClick={() => useRaceStore.getState().startRace(design, PRACTICE_RIVALS)}
          style={{ fontSize: '1.25rem' }}
        >
          🏁 RACE!
        </Btn>
      </div>

      {/* main row: station card left, 3D preview shows through right */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div
          style={{
            width: 'min(58%, 720px)',
            margin: '0 0 10px 14px',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--paper)',
            border: '3px solid var(--ink)',
            borderRadius: 16,
            boxShadow: '0 6px 0 var(--ink)',
            padding: 12,
            pointerEvents: 'auto',
            gap: 10,
          }}
        >
          {/* station tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATIONS.map((s) => (
              <Btn
                key={s.id}
                variant={station === s.id ? 'mustard' : 'paper'}
                active={station === s.id}
                onClick={() => setStation(s.id)}
              >
                {s.icon} {s.label}
              </Btn>
            ))}
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {station === 'carve' && <CarveStation />}
            {station === 'weights' && <WeightsView />}
            {station === 'wheels' && <WheelsView />}
            {station === 'paint' && <PaintView />}
            {station === 'cars' && <CarWall />}
          </div>
        </div>
      </div>
    </div>
  )
}

function CarveStation() {
  const tool = useGarageStore((s) => s.tool)
  const view = useGarageStore((s) => s.view)
  const design = useGarageStore((s) => s.design)
  const { setTool, setView, resetBlock, applyTemplate, setEdgeRound } = useGarageStore.getState()

  const roundR = (() => {
    const op = [...design.carve.ops].reverse().find((o) => o.t === 'round')
    return op && op.t === 'round' ? op.r : 0
  })()

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn variant="paper" active={view === 'side'} onClick={() => setView('side')}>
          🚗 Side
        </Btn>
        <Btn variant="paper" active={view === 'top'} onClick={() => setView('top')}>
          🔝 Top
        </Btn>
        <div style={{ flex: 1 }} />
        {TOOLS.map((t) => (
          <Btn key={t.id} active={tool === t.id} onClick={() => setTool(t.id)} title={t.label}>
            <span style={{ fontSize: '1.3rem' }}>{t.icon}</span> {t.label}
          </Btn>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, marginTop: 10 }}>
        <CarveView />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
        <span style={{ fontWeight: 800 }}>⭕ Round edges</span>
        <input
          type="range"
          min={0}
          max={0.4}
          step={0.02}
          value={roundR}
          onChange={(e) => setEdgeRound(Number(e.target.value))}
          style={{ width: 140 }}
        />
        <div style={{ flex: 1 }} />
        {TEMPLATES.map((t) => (
          <Btn key={t.id} variant="paper" onClick={() => applyTemplate(t.ops)} title={t.name}>
            {t.icon} {t.name}
          </Btn>
        ))}
        <Btn
          variant="red"
          onClick={() => {
            if (confirm('Start over with a fresh block of pine?')) resetBlock()
          }}
        >
          🪵 Fresh block
        </Btn>
      </div>
    </>
  )
}
