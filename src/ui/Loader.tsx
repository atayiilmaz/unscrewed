import { useEffect, useState } from 'react'
import { homeReady } from '../home/HomeScene'
import type { Key } from '../i18n'
import { useT } from '../useT'
import { APP_VERSION } from './Settings'

const BASE = import.meta.env.BASE_URL
const MIN_SHOW_MS = 1400
const TIPS: Key[] = ['tip.1', 'tip.2', 'tip.3', 'tip.4', 'tip.5']

/** Every image the game shows, so nothing pops in after the loader is gone. */
async function assetList(): Promise<string[]> {
  let icons: string[] = []
  try {
    icons = ((await (await fetch(`${BASE}ui/names.json`)).json()) as string[]).map((n) => `${BASE}ui/${n}.webp`)
  } catch {
    /* offline first run: icons load lazily instead */
  }
  return [...icons, `${BASE}tex/wood.webp`, `${BASE}tex/pegboard.webp`, `${BASE}tex/floor.webp`, `${BASE}brand/logo-mark.webp`]
}

function preload(url: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = url
  })
}

/**
 * Branded loading screen: splash art, logo and a progress bar with a spinning screw. Shown on
 * launch while art preloads; the same look is used for over-the-air updates.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const t = useT()
  const [progress, setProgress] = useState(0.08)
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length))
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    let alive = true
    // Count the minimum time from the first painted frame, not from mount: building the 3D
    // scene can block the main thread before anything is on screen.
    let started = Infinity
    requestAnimationFrame(() => requestAnimationFrame(() => (started = performance.now())))
    void (async () => {
      const urls = await assetList()
      let done = 0
      const total = urls.length + 2
      const bump = () => alive && setProgress(Math.max(0.08, ++done / total))
      await Promise.all([...urls.map((u) => preload(u).then(bump)), document.fonts.ready.then(bump), homeReady.then(bump)])
      if (started === Infinity) started = performance.now()
      const wait = Math.max(0, MIN_SHOW_MS - (performance.now() - started))
      setTimeout(() => {
        if (!alive) return
        setLeaving(true)
        setTimeout(onDone, 350)
      }, wait)
    })()
    const tips = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 2600)
    return () => {
      alive = false
      clearInterval(tips)
    }
  }, [onDone])

  const pct = Math.round(progress * 100)
  return (
    <div className={`loader ${leaving ? 'leaving' : ''}`}>
      <img className="loader-logo" src={`${BASE}brand/logo.webp`} alt={t('app.name')} />
      <div className="loader-bottom">
        <p className="loader-tip" key={tip}>
          {t(TIPS[tip])}
        </p>
        <div className="loader-bar">
          <i style={{ width: `${pct}%` }} />
          <img className="loader-screw" src={`${BASE}brand/loader-screw.webp`} alt="" style={{ left: `${pct}%` }} />
        </div>
        <div className="loader-meta">
          <span>
            {t('loading')} {pct}%
          </span>
          <span>v{APP_VERSION}</span>
        </div>
      </div>
    </div>
  )
}
