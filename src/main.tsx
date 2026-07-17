import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/anton/index.css'
import '@fontsource/oswald/400.css'
import '@fontsource/oswald/500.css'
import '@fontsource/oswald/600.css'
import '@fontsource/yellowtail/index.css'
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
