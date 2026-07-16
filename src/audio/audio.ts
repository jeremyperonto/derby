import { useSettingsStore } from '../state/settingsStore'

/**
 * All SFX are synthesized with Web Audio — zero asset files, tiny, and
 * charmingly bleepy (fits the toy world). AudioContext unlocks on the
 * first user gesture (iOS requirement); every effect checks the mute
 * setting at call time.
 */

let ctx: AudioContext | null = null

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as never as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** call once at boot: unlock audio on the first pointer interaction */
export function installAudioUnlock(): void {
  if (typeof window === 'undefined') return
  const unlock = () => {
    ensure()
    window.removeEventListener('pointerdown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
}

const muted = () => useSettingsStore.getState().muted

interface ToneOpts {
  freq: number
  endFreq?: number
  duration: number
  type?: OscillatorType
  gain?: number
  delay?: number
}

function tone({ freq, endFreq, duration, type = 'square', gain = 0.08, delay = 0 }: ToneOpts): void {
  if (muted()) return
  const ac = ensure()
  if (!ac || ac.state !== 'running') return
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + duration)
  amp.gain.setValueAtTime(0, t0)
  amp.gain.linearRampToValueAtTime(gain, t0 + 0.008)
  amp.gain.exponentialRampToValueAtTime(0.0005, t0 + duration)
  osc.connect(amp).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

function noise(duration: number, { gain = 0.06, delay = 0, lowpass = 2200 } = {}): void {
  if (muted()) return
  const ac = ensure()
  if (!ac || ac.state !== 'running') return
  const t0 = ac.currentTime + delay
  const length = Math.ceil(ac.sampleRate * duration)
  const buffer = ac.createBuffer(1, length, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = lowpass
  const amp = ac.createGain()
  amp.gain.setValueAtTime(gain, t0)
  amp.gain.exponentialRampToValueAtTime(0.0005, t0 + duration)
  src.connect(filter).connect(amp).connect(ac.destination)
  src.start(t0)
}

export const sfx = {
  /** UI button press */
  tap: () => tone({ freq: 620, endFreq: 500, duration: 0.06, gain: 0.05 }),
  /** knife slice committed */
  carve: () => {
    noise(0.16, { gain: 0.09, lowpass: 3200 })
    tone({ freq: 300, endFreq: 120, duration: 0.16, type: 'sawtooth', gain: 0.03 })
  },
  /** sanding rub */
  sand: () => noise(0.22, { gain: 0.05, lowpass: 1200 }),
  /** weight plug drops in */
  plugIn: () => tone({ freq: 210, endFreq: 130, duration: 0.13, type: 'sine', gain: 0.14 }),
  /** weight plug pops out */
  plugOut: () => tone({ freq: 130, endFreq: 240, duration: 0.11, type: 'sine', gain: 0.1 }),
  /** overweight honk */
  honk: () => {
    tone({ freq: 220, duration: 0.18, type: 'sawtooth', gain: 0.09 })
    tone({ freq: 180, duration: 0.22, type: 'sawtooth', gain: 0.09, delay: 0.16 })
  },
  /** graphite puff */
  puff: () => noise(0.14, { gain: 0.05, lowpass: 900 }),
  /** countdown beep + the GO horn */
  beep: () => tone({ freq: 440, duration: 0.12, gain: 0.09 }),
  go: () => {
    tone({ freq: 660, duration: 0.4, gain: 0.1 })
    tone({ freq: 880, duration: 0.34, gain: 0.08, delay: 0.05 })
  },
  /** gate clack */
  clack: () => noise(0.05, { gain: 0.16, lowpass: 5000 }),
  /** crowd cheer at the line */
  cheer: () => {
    noise(0.9, { gain: 0.07, lowpass: 1500 })
    noise(0.6, { gain: 0.05, delay: 0.15, lowpass: 2400 })
  },
  /** photo-finish camera snap */
  camera: () => {
    noise(0.03, { gain: 0.12, lowpass: 6000 })
    tone({ freq: 1200, duration: 0.05, gain: 0.05, delay: 0.03 })
  },
  /** victory fanfare (three rising notes) */
  fanfare: () => {
    tone({ freq: 523, duration: 0.16, gain: 0.09 })
    tone({ freq: 659, duration: 0.16, gain: 0.09, delay: 0.15 })
    tone({ freq: 784, duration: 0.34, gain: 0.1, delay: 0.3 })
    tone({ freq: 1046, duration: 0.4, gain: 0.07, delay: 0.32 })
  },
  /** gentle "so close" note */
  womp: () => tone({ freq: 300, endFreq: 220, duration: 0.4, type: 'triangle', gain: 0.07 }),
}
