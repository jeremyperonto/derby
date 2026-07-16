import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { installDevHooks } from './app/devHooks'
import './index.css'

installDevHooks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
