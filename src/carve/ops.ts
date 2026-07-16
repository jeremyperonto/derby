import { clamp } from '../lib/math'
import {
  BLOCK,
  MIN_HALF_WIDTH_IN,
  MIN_THICKNESS_IN,
  type CarveOp,
} from '../model/carDesign'
import { DX_IN, N, xAt, type CarveBuffers } from './buffers'

/**
 * Pure carve operations on heightfield buffers. applyOp MUTATES `buffers`
 * (callers own cloning; replay always starts from a fresh block).
 *
 * Invariants the tools guarantee (kid guardrails):
 *  - the body can never get thinner than MIN_THICKNESS_IN (side)
 *    or narrower than MIN_HALF_WIDTH_IN (top) — cuts "stop" at the floor
 *  - material is only ever REMOVED (yTop/halfWidth never grow)
 *  - the car stays full length (7") and symmetric about the centerline
 */

const FLOOR = { side: MIN_THICKNESS_IN, top: MIN_HALF_WIDTH_IN } as const
const CEIL = { side: BLOCK.heightIn, top: BLOCK.widthIn / 2 } as const

/** tiny uniform removal per sanding pass so rubbing always does something */
const SAND_BITE_IN = 0.002

function target(buffers: CarveBuffers, view: 'side' | 'top'): Float32Array {
  return view === 'side' ? buffers.yTop : buffers.halfWidth
}

export function applyOp(buffers: CarveBuffers, op: CarveOp): void {
  switch (op.t) {
    case 'slice':
      applySlice(buffers, op)
      break
    case 'scoop':
      applyScoop(buffers, op)
      break
    case 'sand':
      applySand(buffers, op)
      break
    case 'round':
      buffers.edgeRadius = clamp(op.r, 0, 0.5)
      break
    case 'baked':
      applyBaked(buffers, op)
      break
  }
}

/**
 * One straight bandsaw cut. The drawn segment is extended to an infinite
 * line; min() only bites where the line dips below the current surface, so
 * extending is safe and matches how a real through-cut behaves. In top view
 * the line's |z| is used, keeping the car symmetric. Near-vertical lines are
 * a no-op (length cuts aren't a thing in v1 — cars stay 7").
 */
function applySlice(
  buffers: CarveBuffers,
  op: Extract<CarveOp, { t: 'slice' }>,
): void {
  const { ax, ay, bx, by, view } = op
  if (Math.abs(bx - ax) < 0.05) return
  const arr = target(buffers, view)
  const slope = (by - ay) / (bx - ax)
  const floor = FLOOR[view]
  const mirror = view === 'top' // top view is symmetric about the centerline
  for (let i = 0; i < N; i++) {
    const raw = ay + slope * (xAt(i) - ax)
    const lineY = mirror ? Math.abs(raw) : raw
    const cut = Math.max(lineY, floor)
    if (cut < arr[i]!) arr[i] = cut
  }
}

/** Concave gouge: a disk of radius r follows the stroke; each point carves a circular bite. */
function applyScoop(
  buffers: CarveBuffers,
  op: Extract<CarveOp, { t: 'scoop' }>,
): void {
  const arr = target(buffers, op.view)
  const floor = FLOOR[op.view]
  const r = clamp(op.r, 0.05, 1.5)
  const reach = Math.ceil(r / DX_IN)
  for (const [cx, cy] of op.stroke) {
    const c = Math.abs(cy)
    const ci = Math.round(cx / DX_IN)
    for (let i = Math.max(0, ci - reach); i <= Math.min(N - 1, ci + reach); i++) {
      const dx = xAt(i) - cx
      const under = r * r - dx * dx
      if (under <= 0) continue
      const cut = Math.max(c - Math.sqrt(under), floor)
      if (cut < arr[i]!) arr[i] = cut
    }
  }
}

/**
 * Sanding rub: within the stroke neighborhood, pull the surface toward a
 * local box-blur — but clamped to never ADD material, so it knocks down
 * peaks and leaves hollows alone (physically honest). A tiny uniform bite
 * makes repeated rubbing keep working on already-smooth spots.
 */
function applySand(
  buffers: CarveBuffers,
  op: Extract<CarveOp, { t: 'sand' }>,
): void {
  const arr = target(buffers, op.view)
  const floor = FLOOR[op.view]
  const r = clamp(op.r, 0.1, 1.0)
  const reach = Math.ceil(r / DX_IN)
  const kernel = Math.max(2, Math.ceil(reach / 2))
  for (const [cx] of op.stroke) {
    const ci = Math.round(cx / DX_IN)
    const lo = Math.max(0, ci - reach)
    const hi = Math.min(N - 1, ci + reach)
    // snapshot the window so the blur reads pre-pass values
    const before = arr.slice(Math.max(0, lo - kernel), Math.min(N, hi + kernel + 1))
    const offset = Math.max(0, lo - kernel)
    for (let i = lo; i <= hi; i++) {
      let sum = 0
      let count = 0
      for (let k = i - kernel; k <= i + kernel; k++) {
        if (k < 0 || k >= N) continue
        sum += before[k - offset]!
        count++
      }
      const smoothed = sum / count - SAND_BITE_IN
      const cut = Math.max(Math.min(arr[i]!, smoothed), floor)
      arr[i] = cut
    }
  }
}

function applyBaked(
  buffers: CarveBuffers,
  op: Extract<CarveOp, { t: 'baked' }>,
): void {
  const yTop = decodeQuantized(op.yTop, CEIL.side)
  const halfWidth = decodeQuantized(op.halfWidth, CEIL.top)
  if (!yTop || !halfWidth) return // malformed bake: ignore rather than crash
  buffers.yTop.set(yTop)
  buffers.halfWidth.set(halfWidth)
  buffers.edgeRadius = clamp(op.edgeRadius, 0, 0.5)
}

// --- baked-op encoding: Uint16 quantized to 1/1000 inch, base64 ---

export function encodeQuantized(arr: Float32Array): string {
  const q = new Uint16Array(arr.length)
  for (let i = 0; i < arr.length; i++) q[i] = Math.round(arr[i]! * 1000)
  const bytes = new Uint8Array(q.buffer)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin)
}

export function decodeQuantized(b64: string, max: number): Float32Array | null {
  try {
    const bin = atob(b64)
    if (bin.length !== N * 2) return null
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const q = new Uint16Array(bytes.buffer)
    const out = new Float32Array(N)
    for (let i = 0; i < N; i++) out[i] = clamp(q[i]! / 1000, 0, max)
    return out
  } catch {
    return null
  }
}
