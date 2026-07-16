import { create } from 'zustand'
import { unlockById, BASE_DECALS, BASE_PAINTS, UNLOCKS } from '../content/unlocks'
import { RIVALS, rivalById } from '../content/rivals'
import { getDoc, mutateDoc } from '../lib/storage'
import type { PaletteId } from '../content/palette'

/**
 * Ladder progression + cosmetic unlocks, persisted through storage.
 * Win = beat the rival's car (heat placement vs fillers doesn't matter).
 * Gold = win by ≥ 2 car lengths.
 */
interface ProgressState {
  defeated: string[]
  gold: string[]
  unlocked: string[]

  /** record a win; returns unlock ids newly granted (for the prize moment) */
  recordWin: (rivalId: string, marginLengths: number) => string[]
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

    /** the first undefeated rival is available; everything defeated stays open for rematches */
    isRivalAvailable: (rivalId) => {
      const { defeated } = get()
      const index = RIVALS.findIndex((r) => r.id === rivalId)
      if (index < 0) return false
      if (defeated.includes(rivalId)) return true
      const firstUndefeated = RIVALS.findIndex((r) => !defeated.includes(r.id))
      return index === firstUndefeated
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
