import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGame } from './game/store'
import { cameraTarget } from './home/HomeScene'

// Lets automated play-throughs drive the store in development builds.
if (import.meta.env.DEV) Object.assign(window, { __game: useGame, __camera: cameraTarget })

// The page itself never scrolls (iOS can still nudge it when focusing or scrolling into view).
window.addEventListener('scroll', () => window.scrollY && window.scrollTo(0, 0), { passive: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
