/**
 * Procedural background music: a slow, warm workshop loop (soft chords + plucked pentatonic
 * melody) scheduled on WebAudio, so the game ships without audio files.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let timer: ReturnType<typeof setInterval> | undefined
let nextBar = 0
let bar = 0

const BPM = 84
const BEAT = 60 / BPM
// I–vi–IV–V in C, voiced low and warm.
const CHORDS = [
  [48, 55, 64],
  [45, 52, 60],
  [41, 48, 57],
  [43, 50, 59],
]
const SCALE = [60, 62, 64, 67, 69, 72, 74, 76]
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

function voice(freq: number, start: number, dur: number, gain: number, type: OscillatorType) {
  const osc = ctx!.createOscillator()
  const g = ctx!.createGain()
  const filter = ctx!.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = type === 'triangle' ? 1800 : 900
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(gain, start + (type === 'triangle' ? 0.01 : 0.3))
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(filter).connect(g).connect(master!)
  osc.start(start)
  osc.stop(start + dur + 0.05)
}

function scheduleBar(start: number) {
  const chord = CHORDS[bar % CHORDS.length]
  for (const n of chord) voice(hz(n), start, BEAT * 4, 0.05, 'sine')
  // Sparse melody: a few plucks per bar, seeded by the bar number so it varies but stays calm.
  for (let beat = 0; beat < 8; beat++) {
    const r = Math.sin(bar * 12.9898 + beat * 78.233) * 43758.5453
    if (r - Math.floor(r) < 0.42) {
      const note = SCALE[Math.floor((r * 7) % SCALE.length + SCALE.length) % SCALE.length]
      voice(hz(note), start + beat * (BEAT / 2), BEAT * 1.5, 0.035, 'triangle')
    }
  }
  bar++
}

export const music = {
  start() {
    if (timer) return
    try {
      ctx ??= new AudioContext()
    } catch {
      return
    }
    if (ctx.state === 'suspended') void ctx.resume()
    master = ctx.createGain()
    master.gain.value = 0.6
    master.connect(ctx.destination)
    nextBar = ctx.currentTime + 0.1
    timer = setInterval(() => {
      // Keep one bar scheduled ahead.
      while (ctx && nextBar < ctx.currentTime + BEAT * 4) {
        scheduleBar(nextBar)
        nextBar += BEAT * 4
      }
    }, 250)
  },
  stop() {
    clearInterval(timer)
    timer = undefined
    if (master && ctx) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.2)
      const m = master
      setTimeout(() => m.disconnect(), 800)
    }
    master = null
  },
}
