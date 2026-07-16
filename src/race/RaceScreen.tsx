import { useEffect, useRef, useState } from 'react'
import { sfx } from '../audio/audio'
import { useRaceStore } from '../state/raceStore'

/**
 * Race overlay: countdown flag, GO!, and the photo-finish freeze frame.
 * The 3D scene does the real work; this layer re-renders at ~8 fps for the
 * countdown numbers only.
 */
export function RaceScreen() {
  const [, force] = useState(0)
  const lastCount = useRef(-1)

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 120)
    return () => clearInterval(id)
  }, [])

  const { playback } = useRaceStore.getState()
  const count = playback.t < 0 ? Math.ceil(-playback.t) : 0

  // countdown / gate sounds on transitions
  useEffect(() => {
    if (count !== lastCount.current) {
      if (count > 0) sfx.beep()
      else if (lastCount.current > 0) {
        sfx.clack()
        sfx.go()
      }
      lastCount.current = count
    }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {count > 0 && (
        <CenterText color="var(--paper)">{count}</CenterText>
      )}
      {count === 0 && playback.t < 0.9 && (
        <CenterText color="var(--mustard)" small tilt>
          GO! 🏁
        </CenterText>
      )}
      {playback.frozen && (
        <>
          {/* camera-flash wash */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--paper)',
              animation: 'photoflash 700ms ease-out forwards',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '9vh',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 7vw, 4rem)',
                color: 'var(--ink)',
                background: 'var(--paper)',
                border: '4px solid var(--ink)',
                borderRadius: 14,
                boxShadow: '0 6px 0 var(--ink)',
                padding: '10px 26px',
                transform: 'rotate(-3deg)',
              }}
            >
              📸 PHOTO FINISH!
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function CenterText({
  children,
  color,
  small,
  tilt,
}: {
  children: React.ReactNode
  color: string
  small?: boolean
  tilt?: boolean
}) {
  return (
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
          fontFamily: 'var(--font-display)',
          fontSize: small ? 'clamp(3rem, 12vw, 7rem)' : 'clamp(5rem, 18vw, 11rem)',
          color,
          textShadow: '6px 6px 0 var(--ink)',
          transform: tilt ? 'rotate(-4deg)' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
