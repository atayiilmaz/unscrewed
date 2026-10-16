import { useCallback, useEffect, useState } from 'react'
import { useGame } from './game/store'
import { translate } from './i18n'
import { music } from './services/music'
import { GameScene } from './scene/GameScene'
import { DemoAd, Hud, OfferSheet, Toast } from './ui/Hud'
import { Loader } from './ui/Loader'
import { Workshop } from './ui/Workshop'

export default function App() {
  const screen = useGame((s) => s.screen)
  const [booted, setBooted] = useState(false)
  const done = useCallback(() => setBooted(true), [])
  const lang = useGame((s) => s.profile.lang)
  // Browsers only allow audio after a gesture: start the music on the first touch.
  useEffect(() => {
    const start = () => {
      if (useGame.getState().profile.settings.music) music.start()
    }
    window.addEventListener('pointerdown', start, { once: true })
    return () => window.removeEventListener('pointerdown', start)
  }, [])
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(lang, 'app.name')
  }, [lang])
  return (
    <div className="app">
      {/* The puzzle scene compiles after boot so it never delays the first screen. */}
      {(booted || screen === 'game') && <GameScene active={screen === 'game'} />}
      {screen === 'game' ? <Hud /> : <Workshop />}
      <OfferSheet />
      <Toast />
      <DemoAd />
      {!booted && <Loader onDone={done} />}
    </div>
  )
}
