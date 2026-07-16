import { useSettingsStore } from '../state/settingsStore'

/**
 * Optional voice narration via the Web Speech API — pure garnish, feature
 * detected, off by default (design.md §6.5). Reads kid-facing lines aloud
 * so a pre-reader can play alone.
 */
export function speak(text: string): void {
  if (!useSettingsStore.getState().narration) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.05
    window.speechSynthesis.speak(utterance)
  } catch {
    // narration is never worth crashing over
  }
}
