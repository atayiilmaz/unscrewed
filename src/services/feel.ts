/** Synthesized sound + vibration so the prototype has feedback without audio assets. */
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

let ctx: AudioContext | null = null
const options = { sfx: true, haptics: true }

/** Mirrors the player's sound / vibration settings. */
export function setFeelOptions(o: { sfx: boolean; haptics: boolean }) {
  Object.assign(options, o)
}

function audio() {
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number) {
  if (!options.sfx) return
  const a = audio()
  if (!a) return
  const t = a.currentTime + delay
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur)
}

const native = Capacitor.isNativePlatform()

/** Android/web vibrate by duration; iOS has no vibrate API, so map length to a haptic impact. */
const vibrate = (ms: number | number[]) => {
  if (!options.haptics) return
  if (native) {
    const total = Array.isArray(ms) ? ms.reduce((a, b) => a + b, 0) : ms
    if (Array.isArray(ms)) void Haptics.notification({ type: NotificationType.Error })
    else void Haptics.impact({ style: total >= 25 ? ImpactStyle.Medium : ImpactStyle.Light })
    return
  }
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* not supported */
  }
}

export const feel = {
  click() {
    tone(1200, 0.035, 'square', 0.04)
    vibrate(8)
  },
  /** Ratchet clicks while the screw turns out. */
  unscrew() {
    for (let i = 0; i < 4; i++) tone(1400 + i * 120, 0.03, 'square', 0.05, i * 0.05)
    tone(700, 0.12, 'triangle', 0.08, 0.22, 1100)
    vibrate(12)
  },
  rust() {
    tone(180, 0.09, 'sawtooth', 0.07, 0, 120)
    vibrate(25)
  },
  error() {
    tone(220, 0.14, 'square', 0.06, 0, 160)
    vibrate([20, 40, 20])
  },
  bit() {
    tone(900, 0.05, 'square', 0.05)
    tone(1300, 0.06, 'square', 0.05, 0.05)
  },
  boxDone() {
    ;[660, 880, 1320].forEach((f, i) => tone(f, 0.16, 'triangle', 0.09, i * 0.07))
    vibrate(30)
  },
  plateDrop() {
    tone(160, 0.25, 'sine', 0.12, 0.15, 60)
  },
  win() {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, i * 0.1))
  },
}
