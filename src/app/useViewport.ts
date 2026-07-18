import { useSyncExternalStore } from 'react'

/**
 * Live viewport classification for responsive layout. Measures the #root
 * element (not window) so it stays correct in production AND honors the
 * dev-only `?device=WxH` frame that shrinks #root to a phone box for
 * automated verification (see devHooks.ts). The app was originally laid out
 * for a wide screen; these flags let each screen collapse to a phone-first
 * arrangement.
 *
 *   compact — narrow enough to shrink the chrome (icon-first bars, tighter
 *             padding). True on phones in either orientation and small
 *             tablets in portrait.
 *   stacked — too narrow for a side-by-side workbench: switch to a vertical
 *             bottom-sheet layout (controls under the car). Phone portrait
 *             and other very narrow widths.
 *   short   — very little vertical room (phone landscape): keep bars minimal.
 */
export interface Viewport {
  w: number
  h: number
  portrait: boolean
  compact: boolean
  stacked: boolean
  short: boolean
}

const COMPACT_W = 860
const STACKED_W = 720
const SHORT_H = 480

function measure(): { w: number; h: number } {
  const root = typeof document !== 'undefined' ? document.getElementById('root') : null
  if (root && root.clientWidth > 0) return { w: root.clientWidth, h: root.clientHeight }
  if (typeof window !== 'undefined') return { w: window.innerWidth, h: window.innerHeight }
  return { w: 1024, h: 768 }
}

function compute(): Viewport {
  const { w, h } = measure()
  return {
    w,
    h,
    portrait: h >= w,
    compact: w < COMPACT_W,
    stacked: w < STACKED_W,
    short: h < SHORT_H,
  }
}

let current = compute()
const listeners = new Set<() => void>()
let started = false

function notify() {
  const next = compute()
  if (
    next.w === current.w &&
    next.h === current.h &&
    next.compact === current.compact &&
    next.stacked === current.stacked &&
    next.short === current.short
  ) {
    return
  }
  current = next
  for (const l of listeners) l()
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('resize', notify, { passive: true })
  window.addEventListener('orientationchange', notify, { passive: true })
  const root = document.getElementById('root')
  if (root && 'ResizeObserver' in window) new ResizeObserver(notify).observe(root)
}

export function useViewport(): Viewport {
  return useSyncExternalStore(
    (cb) => {
      start()
      listeners.add(cb)
      notify()
      return () => listeners.delete(cb)
    },
    () => current,
    () => current,
  )
}
