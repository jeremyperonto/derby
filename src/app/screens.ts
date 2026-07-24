/** Screen state machine — no URL router (see CLAUDE.md). */
export type Screen =
  | 'title'
  | 'about'
  | 'garage'
  | 'rivalSelect'
  | 'preRace'
  | 'race'
  | 'results'
  | 'blueprint'
  | 'tuning' // dev-only, reached via ?tuning
