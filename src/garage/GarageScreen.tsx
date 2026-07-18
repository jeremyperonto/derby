import { useEffect, useRef, type ReactNode } from 'react'
import { sfx } from '../audio/audio'
import { useViewport } from '../app/useViewport'
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
  const { compact, stacked } = useViewport()

  // keep the active folder-tab in view when the strip scrolls horizontally
  const stripRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = stripRef.current?.querySelector('[data-active="true"]') as HTMLElement | null
    el?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [station])

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
      {/* top bar — collapses to icon-first controls on small screens */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 6 : 10,
          padding: compact ? '7px 9px 4px' : '10px 14px 6px',
          pointerEvents: 'auto',
          flexWrap: 'wrap',
        }}
      >
        <Btn size={compact ? 'sm' : 'md'} onClick={() => setScreen('title')} title="back to title">
          <IconArrowLeft size={18} />
        </Btn>
        <Plaque
          tone="ink"
          style={{
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.04em',
            fontSize: compact ? '0.82rem' : '1rem',
            textTransform: 'none',
            minWidth: 0,
            flex: compact ? '1 1 90px' : '0 0 auto',
            maxWidth: compact ? '48vw' : undefined,
            minHeight: compact ? 38 : undefined,
            padding: compact ? '6px 10px' : undefined,
            overflow: 'hidden',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {design.name} &middot; No.{design.number}
          </span>
        </Plaque>
        <Plaque
          tone={derived.overweight ? 'red' : 'paper'}
          style={compact ? { fontSize: '0.74rem', minHeight: 38, padding: '6px 9px' } : undefined}
        >
          <IconScale size={16} /> {derived.totalOz.toFixed(1)} / 5 oz
        </Plaque>
        {!compact && <div style={{ flex: 1 }} />}
        {station === 'carve' && (
          <>
            <Btn size={compact ? 'sm' : 'md'} onClick={undo} disabled={!canUndo} title="undo">
              <IconUndo size={18} /> {!compact && 'Undo'}
            </Btn>
            <Btn size={compact ? 'sm' : 'md'} onClick={redo} disabled={!canRedo} title="redo">
              <IconRedo size={18} />
            </Btn>
          </>
        )}
        <Btn size={compact ? 'sm' : 'md'} onClick={() => setScreen('blueprint')} title="print real-world plans for this car">
          <IconRuler size={18} /> {!compact && 'Build Plans'}
        </Btn>
        {compact && <div style={{ flex: 1 }} />}
        <Btn variant="red" size={compact ? 'md' : 'lg'} onClick={() => setScreen('rivalSelect')}>
          <IconFlag size={compact ? 18 : 20} /> Race
        </Btn>
      </div>

      {/* main area: side-by-side on wide screens (panel left, car right);
          stacked bottom-sheet on portrait phones (car above, controls below) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: stacked ? 'column' : 'row',
          minHeight: 0,
        }}
      >
        {/* transparent car band — only in stacked mode, lets the 3D car show */}
        {stacked && <div style={{ flex: 1, minHeight: 0, pointerEvents: 'none' }} />}

        <div
          style={
            stacked
              ? {
                  height: 'min(58vh, 580px)',
                  margin: '0 8px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  pointerEvents: 'auto',
                }
              : {
                  width: 'min(58%, 720px)',
                  margin: '0 0 10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  pointerEvents: 'auto',
                }
          }
        >
          {/* folder-tab strip — scrolls horizontally when it can't fit */}
          <div
            ref={stripRef}
            className={compact ? 'no-scrollbar' : undefined}
            style={{
              display: 'flex',
              gap: 4,
              paddingLeft: 10,
              flexWrap: 'nowrap',
              overflowX: compact ? 'auto' : 'visible',
              flexShrink: 0,
            }}
          >
            {STATIONS.map((s) => {
              const active = station === s.id
              return (
                <button
                  key={s.id}
                  data-active={active}
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
                    padding: compact ? '8px 11px 10px' : '9px 14px 11px',
                    marginBottom: -2,
                    fontSize: compact ? '0.66rem' : '0.74rem',
                    letterSpacing: compact ? '0.08em' : '0.12em',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: compact ? 5 : 7,
                    flexShrink: 0,
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
              padding: compact ? 10 : 14,
              gap: compact ? 8 : 10,
              position: 'relative',
              zIndex: 1,
              overflowY: stacked ? 'auto' : undefined,
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
