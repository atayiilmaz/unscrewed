import { useEffect, useState } from 'react'

const KEY = 'sokum-fps'
const read = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Hidden on-device frame-rate readout; toggled by tapping the version line in settings 5 times. */
export function toggleFps() {
  try {
    localStorage.setItem(KEY, read() ? '0' : '1')
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event('fps-toggle'))
}

export function FpsMeter() {
  const [on, setOn] = useState(read)
  const [stats, setStats] = useState({ fps: 0, worst: 0 })
  useEffect(() => {
    const sync = () => setOn(read())
    window.addEventListener('fps-toggle', sync)
    return () => window.removeEventListener('fps-toggle', sync)
  }, [])
  useEffect(() => {
    if (!on) return
    let raf = 0
    let frames = 0
    let worst = 0
    let last = performance.now()
    let windowStart = last
    const tick = (now: number) => {
      worst = Math.max(worst, now - last)
      last = now
      frames++
      if (now - windowStart >= 1000) {
        setStats({ fps: Math.round((frames * 1000) / (now - windowStart)), worst: Math.round(worst) })
        frames = 0
        worst = 0
        windowStart = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on])
  if (!on) return null
  const color = stats.fps >= 55 ? '#3fcf6b' : stats.fps >= 40 ? '#ffc928' : '#ff4f5e'
  return (
    <div className="fps" style={{ color }}>
      {stats.fps} FPS · max {stats.worst}ms · {window.devicePixelRatio}x
    </div>
  )
}
