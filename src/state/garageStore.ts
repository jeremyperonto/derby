import { create } from 'zustand'
import { replayOps, compactOps } from '../carve/replay'
import type { CarveBuffers } from '../carve/buffers'
import {
  freshCarDesign,
  MAX_WEIGHT_OZ,
  PLUG_OZ,
  type CarDesign,
  type CarveOp,
  type DecalPlacement,
  type WeightPlug,
  type WheelSetup,
} from '../model/carDesign'
import { deriveSimParams, type DerivedCar } from '../model/deriveSimParams'

export type CarveTool = 'slice' | 'scoop' | 'sand'
export type CarveViewSide = 'side' | 'top'
export type GarageStation = 'carve' | 'weights' | 'wheels' | 'paint'

interface GarageState {
  design: CarDesign
  /** derived cache: replay of design.carve.ops (+ any live gesture draft) */
  buffers: CarveBuffers
  derived: DerivedCar
  /** draft op for the gesture in progress — previewed live, committed on release */
  draftOp: CarveOp | null

  station: GarageStation
  tool: CarveTool
  view: CarveViewSide
  redoStack: CarveOp[]

  setStation: (station: GarageStation) => void
  setTool: (tool: CarveTool) => void
  setView: (view: CarveViewSide) => void

  setDraft: (op: CarveOp | null) => void
  commitDraft: () => void
  addOp: (op: CarveOp) => void
  undo: () => void
  redo: () => void
  resetBlock: () => void
  applyTemplate: (ops: CarveOp[]) => void
  setEdgeRound: (r: number) => void

  togglePlug: (slot: number, kind: WeightPlug['kind']) => 'placed' | 'removed' | 'overweight'
  setWheels: (patch: Partial<WheelSetup>) => void
  setPaint: (patch: Partial<CarDesign['paint']>) => void
  setNumber: (n: number) => void
  setName: (name: string) => void
  addDecal: (decal: DecalPlacement) => void
  removeLastDecal: () => void
  loadDesign: (design: CarDesign) => void
}

function recompute(design: CarDesign, draftOp: CarveOp | null) {
  const ops = draftOp ? [...design.carve.ops, draftOp] : design.carve.ops
  const buffers = replayOps(ops)
  return { buffers, derived: deriveSimParams(design) }
}

/** design with a mutated op list (ops are immutable snapshots) */
function withOps(design: CarDesign, ops: CarveOp[]): CarDesign {
  return { ...design, carve: { ops }, updatedAt: Date.now() }
}

export const useGarageStore = create<GarageState>((set, get) => {
  const initial = freshCarDesign(crypto.randomUUID(), Date.now())

  const apply = (design: CarDesign, extra: Partial<GarageState> = {}) => {
    const draftOp = extra.draftOp !== undefined ? extra.draftOp : null
    set({ design, draftOp, ...recompute(design, draftOp), ...extra })
  }

  return {
    design: initial,
    ...recompute(initial, null),
    draftOp: null,

    station: 'carve',
    tool: 'slice',
    view: 'side',
    redoStack: [],

    setStation: (station) => set({ station }),
    setTool: (tool) => set({ tool }),
    setView: (view) => set({ view }),

    setDraft: (op) => {
      const { design } = get()
      set({ draftOp: op, buffers: replayOps(op ? [...design.carve.ops, op] : design.carve.ops) })
    },
    commitDraft: () => {
      const { design, draftOp } = get()
      if (!draftOp) return
      apply(withOps(design, compactOps([...design.carve.ops, draftOp])), { redoStack: [] })
    },
    addOp: (op) => {
      const { design } = get()
      apply(withOps(design, compactOps([...design.carve.ops, op])), { redoStack: [] })
    },
    undo: () => {
      const { design, redoStack } = get()
      const ops = design.carve.ops
      if (!ops.length) return
      const last = ops[ops.length - 1]!
      apply(withOps(design, ops.slice(0, -1)), { redoStack: [...redoStack, last] })
    },
    redo: () => {
      const { design, redoStack } = get()
      if (!redoStack.length) return
      const op = redoStack[redoStack.length - 1]!
      apply(withOps(design, [...design.carve.ops, op]), { redoStack: redoStack.slice(0, -1) })
    },
    resetBlock: () => {
      const { design } = get()
      apply(withOps(design, []), { redoStack: [] })
    },
    applyTemplate: (ops) => {
      const { design } = get()
      apply(withOps(design, [...ops]), { redoStack: [] })
    },
    setEdgeRound: (r) => {
      const { design } = get()
      // round replaces any prior round op (one global fillet)
      const ops: CarveOp[] = design.carve.ops.filter((op) => op.t !== 'round')
      ops.push({ t: 'round', r })
      apply(withOps(design, ops))
    },

    togglePlug: (slot, kind) => {
      const { design, derived } = get()
      const existing = design.weights.findIndex((p) => p.slot === slot)
      if (existing >= 0) {
        apply({ ...design, weights: design.weights.filter((_, i) => i !== existing) })
        return 'removed'
      }
      const newOz = derived.totalOz + PLUG_OZ[kind]
      if (newOz > MAX_WEIGHT_OZ + 1e-9) return 'overweight'
      apply({ ...design, weights: [...design.weights, { slot, kind }] })
      return 'placed'
    },
    setWheels: (patch) => {
      const { design } = get()
      apply({ ...design, wheels: { ...design.wheels, ...patch } })
    },
    setPaint: (patch) => {
      const { design } = get()
      apply({ ...design, paint: { ...design.paint, ...patch } as CarDesign['paint'] })
    },
    setNumber: (n) => {
      const { design } = get()
      apply({ ...design, number: Math.max(0, Math.min(99, Math.round(n))) })
    },
    setName: (name) => {
      const { design } = get()
      apply({ ...design, name: name.slice(0, 40) })
    },
    addDecal: (decal) => {
      const { design } = get()
      if (design.decals.length >= 8) return
      apply({ ...design, decals: [...design.decals, decal] })
    },
    removeLastDecal: () => {
      const { design } = get()
      apply({ ...design, decals: design.decals.slice(0, -1) })
    },
    loadDesign: (design) => apply(design, { redoStack: [] }),
  }
})
