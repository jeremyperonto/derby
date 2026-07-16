import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/alfa-slab-one/index.css'
import App from './App'
import { installDevHooks } from './app/devHooks'
import { installAudioUnlock } from './audio/audio'
import './index.css'

installDevHooks()
installAudioUnlock()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
