import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useGame } from './game/store'
import { cameraTarget } from './home/HomeScene'

// Lets automated play-throughs drive the store in development builds.
if (import.meta.env.DEV) Object.assign(window, { __game: useGame, __camera: cameraTarget })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
