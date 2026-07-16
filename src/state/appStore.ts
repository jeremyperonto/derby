import { create } from 'zustand'
import type { Screen } from '../app/screens'

interface AppState {
  screen: Screen
  setScreen: (screen: Screen) => void
}

const initialScreen: Screen =
  import.meta.env.DEV && new URLSearchParams(location.search).has('tuning') ? 'tuning' : 'title'

export const useAppStore = create<AppState>((set) => ({
  screen: initialScreen,
  setScreen: (screen) => set({ screen }),
}))
