import { create } from 'zustand'
import { unlockById, BASE_DECALS, BASE_PAINTS, UNLOCKS } from '../content/unlocks'
import { DIVISIONS, RIVALS, rivalById } from '../content/rivals'
import { getDoc, mutateDoc } from '../lib/storage'
import type { PaletteId } from '../content/palette'

/**
 * Division progression + cosmetic unlocks, persisted through storage.
 * Win = win the heat. Gold = win by ≥ 2 car lengths. Any racer in an
 * unlocked division can be challenged; beating winsToEnter racers in a
 * division opens the next one.
 */
interface ProgressState {
  defeated: string[]
  gold: string[]
  unlocked: string[]

  /** record a win; returns unlock ids newly granted (for the prize moment) */
  recordWin: (rivalId: string, marginLengths: number) => string[]
  defeatedInTier: (tier: number) => number
  isDivisionUnlocked: (tier: number) => boolean
  isRivalAvailable: (rivalId: string) => boolean
  availablePaints: () => PaletteId[]
  availableDecals: () => string[]
}

export const useProgressStore = create<ProgressState>((set, get) => {
  const saved = getDoc().progress

  return {
    defeated: saved.defeated,
    gold: saved.gold,
    unlocked: saved.unlocked,

    recordWin: (rivalId, marginLengths) => {
      const { defeated, gold, unlocked } = get()
      const rival = rivalById(rivalId)
      const newUnlocks: string[] = []

      const nextDefeated = defeated.includes(rivalId) ? defeated : [...defeated, rivalId]
      if (!defeated.includes(rivalId) && rival) {
        for (const unlockId of rival.unlocks) {
          if (!unlocked.includes(unlockId) && unlockById(unlockId)) newUnlocks.push(unlockId)
        }
      }
      const nextGold =
        marginLengths >= 2 && !gold.includes(rivalId) ? [...gold, rivalId] : gold
      const nextUnlocked = [...unlocked, ...newUnlocks]

      set({ defeated: nextDefeated, gold: nextGold, unlocked: nextUnlocked })
      mutateDoc((doc) => {
        doc.progress = { defeated: nextDefeated, gold: nextGold, unlocked: nextUnlocked }
      })
      return newUnlocks
    },

    defeatedInTier: (tier) => {
      const { defeated } = get()
      return RIVALS.filter((r) => r.tier === tier && defeated.includes(r.id)).length
    },

    /** a division opens once you've beaten enough racers in the previous one */
    isDivisionUnlocked: (tier) => {
      const division = DIVISIONS.find((d) => d.tier === tier)
      if (!division) return false
      if (division.winsToEnter === 0) return true
      return get().defeatedInTier(tier - 1) >= division.winsToEnter
    },

    /** every racer in an unlocked division is challengeable (and rematches stay open) */
    isRivalAvailable: (rivalId) => {
      const rival = rivalById(rivalId)
      if (!rival) return false
      return get().isDivisionUnlocked(rival.tier)
    },

    availablePaints: () => {
      const { unlocked } = get()
      const extra = UNLOCKS.filter((u) => u.kind === 'paint' && unlocked.includes(u.id)).map(
        (u) => u.itemId as PaletteId,
      )
      return [...BASE_PAINTS, ...extra]
    },

    availableDecals: () => {
      const { unlocked } = get()
      const extra = UNLOCKS.filter((u) => u.kind === 'decal' && unlocked.includes(u.id)).map(
        (u) => u.itemId,
      )
      return [...BASE_DECALS, ...extra]
    },
  }
})
