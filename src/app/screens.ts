/** Screen state machine — no URL router (see CLAUDE.md). */
export type Screen =
  | 'title'
  | 'garage'
  | 'rivalSelect'
  | 'race'
  | 'results'
  | 'blueprint'
  | 'tuning' // dev-only, reached via ?tuning
