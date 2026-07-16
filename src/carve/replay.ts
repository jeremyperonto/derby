import type { CarveOp } from '../model/carDesign'
import { freshBlock, type CarveBuffers } from './buffers'
import { applyOp, encodeQuantized } from './ops'

/**
 * The op log is the source of truth for shape (CLAUDE.md rule 3).
 * Shape state = replay of the log onto a fresh block. Undo = shorter log.
 * Replay of ~200 ops over 512 samples is well under a millisecond, so no
 * checkpointing is needed yet.
 */
export function replayOps(ops: readonly CarveOp[]): CarveBuffers {
  const buffers = freshBlock()
  for (const op of ops) applyOp(buffers, op)
  return buffers
}

/** Op count beyond which the oldest ops are baked into a snapshot op. */
export const BAKE_THRESHOLD = 240
const BAKE_KEEP = 120

/**
 * Compact a long op log: bake everything except the most recent BAKE_KEEP
 * ops into a quantized buffer snapshot (1/1000", visually invisible).
 * Returns the log unchanged when under the threshold. Undo across the bake
 * boundary is deliberately impossible — by 240 ops it's ancient history.
 */
export function compactOps(ops: readonly CarveOp[]): CarveOp[] {
  if (ops.length <= BAKE_THRESHOLD) return [...ops]
  const bakePoint = ops.length - BAKE_KEEP
  const baked = replayOps(ops.slice(0, bakePoint))
  return [
    {
      t: 'baked',
      yTop: encodeQuantized(baked.yTop),
      halfWidth: encodeQuantized(baked.halfWidth),
      edgeRadius: baked.edgeRadius,
    },
    ...ops.slice(bakePoint),
  ]
}
