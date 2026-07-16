import type { Rng } from '../sim/rng'

/** Kid-delighting car name generator (also names the seeded filler cars). */

const FIRST = [
  'Thunder',
  'Rocket',
  'Turbo',
  'Blazing',
  'Pickle',
  'Cosmic',
  'Wild',
  'Lucky',
  'Zippy',
  'Midnight',
  'Banana',
  'Iron',
  'Ghost',
  'Waffle',
  'Dyno',
]

const SECOND = [
  'Comet',
  'Wagon',
  'Arrow',
  'Flash',
  'Bolt',
  'Racer',
  'Rustler',
  'Express',
  'Zoomer',
  'Streak',
  'Machine',
  'Whistler',
  'Pepper',
  'Falcon',
  'Biscuit',
]

export function generateCarName(rng: Rng | (() => number) = Math.random): string {
  const a = FIRST[Math.floor(rng() * FIRST.length)]!
  const b = SECOND[Math.floor(rng() * SECOND.length)]!
  return `${a} ${b}`
}

const DRIVERS = ['Gary', 'Maple', 'Otis', 'Penny', 'Duke', 'Hazel', 'Ziggy', 'June', 'Moe', 'Scout']

export function generateFillerName(rng: Rng): string {
  const who = DRIVERS[Math.floor(rng() * DRIVERS.length)]!
  return rng() < 0.5 ? `${who}'s ${SECOND[Math.floor(rng() * SECOND.length)]!}` : generateCarName(rng)
}
