import { useEffect, useState } from 'react'
import { useRaceStore } from '../state/raceStore'

/**
 * Race overlay: countdown flag + minimal HUD. The 3D scene does the real
 * work; this layer stays out of the way (pointer-events none except HUD).
 */
export function RaceScreen() {
  const [, force] = useState(0)

  // tick a light re-render for the countdown numbers only (4 fps is plenty)
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [])

  const { playback } = useRaceStore.getState()
  const count = playback.t < 0 ? Math.ceil(-playback.t) : 0

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {count > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(5rem, 18vw, 11rem)',
              fontWeight: 900,
              color: 'var(--paper)',
              textShadow: '6px 6px 0 var(--ink)',
            }}
          >
            {count}
          </div>
        </div>
      )}
      {count === 0 && playback.t < 0.9 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(3rem, 12vw, 7rem)',
              fontWeight: 900,
              color: 'var(--mustard)',
              textShadow: '5px 5px 0 var(--ink)',
              transform: 'rotate(-4deg)',
            }}
          >
            GO! 🏁
          </div>
        </div>
      )}
    </div>
  )
}
