import type { ReactNode } from 'react'
import { sfx } from '../audio/audio'
import { TEMPLATES } from '../content/templates'
import { useAppStore } from '../state/appStore'
import { useGarageStore, type CarveTool, type GarageStation } from '../state/garageStore'
import { Btn } from '../ui/Btn'
import { Fieldset, Plaque, Seg } from '../ui/Fieldset'
import {
  IconArrowLeft,
  IconBlock,
  IconBrush,
  IconFlag,
  IconGarage,
  IconRedo,
  IconRuler,
  IconSand,
  IconSaw,
  IconScale,
  IconScoop,
  IconSideView,
  IconTopView,
  IconUndo,
  IconWheel,
} from '../ui/icons'
import { CarveView } from './CarveView'
import { CarWall } from './CarWall'
import { PaintView } from './PaintView'
import { WeightsView } from './WeightsView'
import { WheelsView } from './WheelsView'

/**
 * The workbench. Stations live in a folder-tab strip across the top of the
 * panel (not a button farm); each station's controls are grouped in
 * legended fieldsets. Letterpress everywhere.
 */

const STATIONS: { id: GarageStation; icon: ReactNode; label: string }[] = [
  { id: 'carve', icon: <IconSaw size={17} />, label: 'Carve' },
  { id: 'weights', icon: <IconScale size={17} />, label: 'Weights' },
  { id: 'wheels', icon: <IconWheel size={17} />, label: 'Wheels' },
  { id: 'paint', icon: <IconBrush size={17} />, label: 'Paint' },
  { id: 'cars', icon: <IconGarage size={17} />, label: 'My Cars' },
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
          alignItems: 'stretch',
          gap: 10,
          padding: '10px 14px 6px',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        <Btn size="md" onClick={() => setScreen('title')} title="back to title">
          <IconArrowLeft size={18} />
        </Btn>
        <Plaque tone="ink" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em', fontSize: '1rem', textTransform: 'none' }}>
          {design.name} &middot; No.{design.number}
        </Plaque>
        <Plaque tone={derived.overweight ? 'red' : 'paper'}>
          <IconScale size={16} /> {derived.totalOz.toFixed(1)} / 5 oz
        </Plaque>
        <div style={{ flex: 1 }} />
        {station === 'carve' && (
          <>
            <Btn onClick={undo} disabled={!canUndo} title="undo">
              <IconUndo size={18} /> Undo
            </Btn>
            <Btn onClick={redo} disabled={!canRedo} title="redo">
              <IconRedo size={18} />
            </Btn>
          </>
        )}
        <Btn onClick={() => setScreen('blueprint')} title="print real-world plans for this car">
          <IconRuler size={18} /> Build Plans
        </Btn>
        <Btn variant="red" size="lg" onClick={() => setScreen('rivalSelect')}>
          <IconFlag size={20} /> Race
        </Btn>
      </div>

      {/* main row: workbench panel left, 3D preview shows through right */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ width: 'min(58%, 720px)', margin: '0 0 10px 14px', display: 'flex', flexDirection: 'column', pointerEvents: 'auto' }}>
          {/* folder-tab strip */}
          <div style={{ display: 'flex', gap: 4, paddingLeft: 10 }}>
            {STATIONS.map((s) => {
              const active = station === s.id
              return (
                <button
                  key={s.id}
                  className="lp-label"
                  onClick={() => {
                    sfx.tap()
                    setStation(s.id)
                  }}
                  style={{
                    background: active ? 'var(--ink)' : 'var(--paper)',
                    color: active ? 'var(--paper)' : 'var(--ink)',
                    border: '2px solid var(--ink)',
                    borderBottom: 'none',
                    borderRadius: '3px 3px 0 0',
                    padding: '9px 14px 11px',
                    marginBottom: -2,
                    fontSize: '0.74rem',
                    letterSpacing: '0.12em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    position: 'relative',
                    top: active ? 0 : 3,
                    zIndex: active ? 2 : 1,
                    transition: 'top 100ms',
                  }}
                >
                  {s.icon}
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* the panel */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--paper)',
              border: '2px solid var(--ink)',
              boxShadow: 'inset 0 0 0 4px var(--paper), inset 0 0 0 5px var(--ink)',
              borderRadius: 2,
              padding: 14,
              gap: 10,
              position: 'relative',
              zIndex: 1,
            }}
          >
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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Fieldset legend="View">
          <Seg
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'side', label: <><IconSideView size={16} /> Side</> },
              { value: 'top', label: <><IconTopView size={16} /> Top</> },
            ]}
          />
        </Fieldset>
        <Fieldset legend="Tools" style={{ flex: 1 }}>
          <Seg
            size="sm"
            value={tool}
            onChange={(t) => setTool(t as CarveTool)}
            options={[
              { value: 'slice', label: <><IconSaw size={16} /> Slice</>, title: 'one straight cut' },
              { value: 'scoop', label: <><IconScoop size={16} /> Scoop</>, title: 'carve a groove' },
              { value: 'sand', label: <><IconSand size={16} /> Sand</>, title: 'smooth it out' },
            ]}
          />
        </Fieldset>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <CarveView />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <Fieldset legend="Starter shapes">
          {TEMPLATES.map((t) => (
            <Btn key={t.id} size="sm" onClick={() => applyTemplate(t.ops)} title={`start from a ${t.name}`}>
              {t.name}
            </Btn>
          ))}
        </Fieldset>
        <Fieldset legend="Round the edges" style={{ flex: 1, minWidth: 170 }}>
          <input
            type="range"
            min={0}
            max={0.4}
            step={0.02}
            value={roundR}
            onChange={(e) => setEdgeRound(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--ink)' }}
          />
        </Fieldset>
        <Fieldset legend="Start over">
          <Btn
            size="sm"
            variant="red"
            onClick={() => {
              if (confirm('Start over with a fresh block of pine?')) resetBlock()
            }}
          >
            <IconBlock size={16} /> Fresh block
          </Btn>
        </Fieldset>
      </div>
    </>
  )
}
