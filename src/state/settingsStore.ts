import { create } from 'zustand'
import { getDoc, mutateDoc } from '../lib/storage'

interface SettingsState {
  muted: boolean
  narration: boolean
  setMuted: (muted: boolean) => void
  setNarration: (narration: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  muted: getDoc().settings.muted,
  narration: getDoc().settings.narration,
  setMuted: (muted) => {
    set({ muted })
    mutateDoc((doc) => {
      doc.settings.muted = muted
    })
  },
  setNarration: (narration) => {
    set({ narration })
    mutateDoc((doc) => {
      doc.settings.narration = narration
    })
  },
}))
