import type { PlateDef } from './types'

/**
 * Object templates: the plate layout of a recognisable thing (car, clock, robot…). Screw spots are
 * derived from each part's shape unless given explicitly; colours, bits and rust are assigned later
 * per level, so one template yields many levels.
 */
type Pt = [number, number]

export type Part =
  | { k: 'rect'; l: number; x: number; y: number; w: number; h: number; a?: number; tint: string; screws?: Pt[] }
  | { k: 'disc'; l: number; x: number; y: number; r: number; tint: string; screws?: Pt[] }
  | { k: 'bar'; l: number; a: Pt; b: Pt; w?: number; tint: string; t?: number[] }

export interface Template {
  /** Also the level name key: `obj.<id>`. */
  id: string
  parts: Part[]
}

export type TemplatePlate = Omit<PlateDef, 'screws'> & { spots: Pt[] }

const MIN_GAP = 0.8
const INSET = 0.45
export const SCREW_BOUNDS = { x: 3.95, y: 4.55 }

const C = {
  red: '#ff4f5e',
  coral: '#ff8a4c',
  glass: '#5fd0ff',
  tyre: '#4a5068',
  cream: '#ffe0a3',
  ink: '#3d4a6b',
  gold: '#ffb72b',
  sky: '#4f8dff',
  pale: '#8fb6ff',
  lemon: '#ffd83d',
  mint: '#35d9a0',
  lilac: '#a77bff',
  wood: '#c9783a',
  dark: '#7a4a2a',
  leaf: '#5fcf4f',
  pink: '#ff6fae',
  steel: '#9aa8c4',
}

export const TEMPLATES: Template[] = [
  {
    id: 'car',
    parts: [
      { k: 'rect', l: 0, x: 0, y: -0.6, w: 7.2, h: 2.2, tint: C.red },
      { k: 'rect', l: 1, x: -0.3, y: 1.2, w: 4.2, h: 1.9, tint: C.coral },
      { k: 'rect', l: 2, x: -0.3, y: 1.3, w: 3.0, h: 1.0, tint: C.glass },
      { k: 'disc', l: 3, x: -2.3, y: -1.9, r: 1.05, tint: C.tyre },
      { k: 'disc', l: 3, x: 2.3, y: -1.9, r: 1.05, tint: C.tyre },
      { k: 'disc', l: 1, x: 3.3, y: 0.1, r: 0.45, tint: C.lemon },
    ],
  },
  {
    id: 'clock',
    parts: [
      { k: 'disc', l: 0, x: 0, y: 0.6, r: 3.4, tint: C.cream },
      { k: 'bar', l: 1, a: [0, 0.6], b: [1.9, 2.6], w: 0.7, tint: C.ink, t: [0.35, 1] },
      { k: 'bar', l: 2, a: [0, 0.6], b: [-2.5, -1.4], w: 0.6, tint: C.ink, t: [0.3, 1] },
      { k: 'disc', l: 3, x: 0, y: 0.6, r: 0.55, tint: C.steel },
      { k: 'bar', l: 1, a: [0, -2.4], b: [0, -4.3], w: 0.9, tint: C.gold },
    ],
  },
  {
    id: 'robot',
    parts: [
      { k: 'rect', l: 0, x: 0, y: -0.8, w: 4.2, h: 3.6, tint: C.sky },
      { k: 'rect', l: 1, x: 0, y: 2.4, w: 2.8, h: 2.0, tint: C.pale },
      { k: 'disc', l: 2, x: -0.6, y: 2.5, r: 0.45, tint: C.lemon },
      { k: 'disc', l: 2, x: 0.6, y: 2.5, r: 0.45, tint: C.lemon },
      { k: 'bar', l: 1, a: [-1.7, 0.4], b: [-3.5, -2.6], w: 0.9, tint: C.steel },
      { k: 'bar', l: 1, a: [1.7, 0.4], b: [3.5, -2.6], w: 0.9, tint: C.steel },
      { k: 'bar', l: 1, a: [-1.0, -2.3], b: [-1.0, -4.4], w: 0.9, tint: C.steel },
      { k: 'bar', l: 1, a: [1.0, -2.3], b: [1.0, -4.4], w: 0.9, tint: C.steel },
      { k: 'rect', l: 2, x: 0, y: -0.7, w: 2.2, h: 1.3, tint: C.gold },
    ],
  },
  {
    id: 'guitar',
    parts: [
      { k: 'disc', l: 0, x: 0, y: -2.2, r: 2.3, tint: C.red },
      { k: 'disc', l: 0, x: 0, y: 0.3, r: 1.7, tint: C.red },
      { k: 'bar', l: 1, a: [0, 0.2], b: [0, 3.6], w: 0.9, tint: C.dark },
      { k: 'rect', l: 2, x: 0, y: 3.9, w: 1.5, h: 1.2, tint: C.dark },
      { k: 'disc', l: 2, x: 0, y: -0.8, r: 0.75, tint: C.ink },
      { k: 'rect', l: 2, x: 0, y: -3.0, w: 2.4, h: 0.8, tint: C.cream },
    ],
  },
  {
    id: 'gamepad',
    parts: [
      { k: 'rect', l: 0, x: 0, y: 0.2, w: 7.4, h: 3.4, tint: C.lilac },
      { k: 'disc', l: 1, x: -2.7, y: -1.4, r: 1.3, tint: C.lilac },
      { k: 'disc', l: 1, x: 2.7, y: -1.4, r: 1.3, tint: C.lilac },
      { k: 'bar', l: 2, a: [-2.3, -0.7], b: [-2.3, 1.3], w: 0.6, tint: C.ink },
      { k: 'bar', l: 3, a: [-3.3, 0.3], b: [-1.3, 0.3], w: 0.6, tint: C.ink },
      { k: 'disc', l: 2, x: 2.3, y: 1.0, r: 0.5, tint: C.red },
      { k: 'disc', l: 2, x: 3.1, y: 0.2, r: 0.5, tint: C.mint },
      { k: 'disc', l: 2, x: 1.5, y: 0.2, r: 0.5, tint: C.sky },
      { k: 'rect', l: 1, x: 0, y: 2.6, w: 3.0, h: 1.0, tint: C.steel },
    ],
  },
  {
    id: 'radio',
    parts: [
      { k: 'rect', l: 0, x: 0, y: -0.6, w: 7.0, h: 4.6, tint: C.mint },
      { k: 'disc', l: 1, x: -1.6, y: -0.8, r: 1.7, tint: C.cream },
      { k: 'disc', l: 2, x: 2.2, y: 0.4, r: 0.8, tint: C.gold },
      { k: 'bar', l: 1, a: [2.6, 1.9], b: [3.6, 4.4], w: 0.6, tint: C.steel },
      { k: 'bar', l: 1, a: [-2.4, 2.4], b: [1.4, 2.4], w: 0.8, tint: C.dark },
      { k: 'rect', l: 2, x: 2.2, y: -1.7, w: 2.0, h: 0.9, tint: C.ink },
    ],
  },
  {
    id: 'camera',
    parts: [
      { k: 'rect', l: 0, x: 0, y: -0.6, w: 7.2, h: 4.0, tint: C.ink },
      { k: 'disc', l: 1, x: 0.3, y: -0.8, r: 1.7, tint: C.steel },
      { k: 'disc', l: 2, x: 0.3, y: -0.8, r: 0.9, tint: C.glass },
      { k: 'rect', l: 1, x: -2.5, y: 0.9, w: 1.6, h: 1.0, tint: C.lemon },
      { k: 'rect', l: 1, x: 1.6, y: 1.9, w: 2.4, h: 1.0, tint: C.steel },
      { k: 'bar', l: 2, a: [-3.5, 1.6], b: [-2.0, 3.8], w: 0.6, tint: C.red },
    ],
  },
  {
    id: 'plane',
    parts: [
      { k: 'bar', l: 0, a: [-3.4, 0], b: [3.2, 0], w: 1.6, tint: C.pale },
      { k: 'bar', l: 1, a: [0.4, -3.9], b: [0.4, 3.9], w: 1.4, tint: C.sky },
      { k: 'bar', l: 1, a: [-3.1, -1.5], b: [-3.1, 1.5], w: 0.9, tint: C.sky },
      { k: 'bar', l: 2, a: [3.7, -1.5], b: [3.7, 1.5], w: 0.55, tint: C.ink },
      { k: 'disc', l: 2, x: 1.9, y: 0, r: 0.6, tint: C.glass },
    ],
  },
  {
    id: 'house',
    parts: [
      { k: 'rect', l: 0, x: 0, y: -1.4, w: 6.0, h: 4.4, tint: C.cream },
      { k: 'bar', l: 1, a: [-3.5, 0.9], b: [-0.3, 3.9], w: 1.0, tint: C.red },
      { k: 'bar', l: 1, a: [3.5, 0.9], b: [0.3, 3.9], w: 1.0, tint: C.red },
      { k: 'rect', l: 1, x: 0, y: -2.5, w: 1.6, h: 2.6, tint: C.wood },
      { k: 'rect', l: 2, x: -1.9, y: -0.7, w: 1.4, h: 1.4, tint: C.glass },
      { k: 'rect', l: 2, x: 1.9, y: -0.7, w: 1.4, h: 1.4, tint: C.glass },
      { k: 'rect', l: 0, x: 2.1, y: 3.3, w: 0.9, h: 1.8, tint: C.dark },
    ],
  },
  {
    id: 'flower',
    parts: [
      { k: 'bar', l: 0, a: [0, -3.0], b: [0, 1.0], w: 0.7, tint: C.leaf },
      { k: 'bar', l: 1, a: [0, -2.0], b: [-2.4, -0.9], w: 0.8, tint: C.leaf },
      { k: 'bar', l: 1, a: [0, -1.1], b: [2.4, -0.1], w: 0.8, tint: C.leaf },
      { k: 'disc', l: 1, x: 0, y: 3.2, r: 1.1, tint: C.pink },
      { k: 'disc', l: 1, x: -1.7, y: 1.9, r: 1.1, tint: C.pink },
      { k: 'disc', l: 1, x: 1.7, y: 1.9, r: 1.1, tint: C.pink },
      { k: 'disc', l: 2, x: 0, y: 1.9, r: 0.9, tint: C.lemon },
      { k: 'rect', l: 2, x: 0, y: -3.7, w: 3.2, h: 1.6, tint: C.coral },
    ],
  },
  {
    id: 'bike',
    parts: [
      { k: 'disc', l: 0, x: -2.4, y: -1.6, r: 1.5, tint: C.tyre },
      { k: 'disc', l: 0, x: 2.4, y: -1.6, r: 1.5, tint: C.tyre },
      { k: 'bar', l: 1, a: [-2.4, -1.6], b: [-0.2, 0.9], w: 0.55, tint: C.red },
      { k: 'bar', l: 1, a: [0.2, -1.4], b: [2.4, -1.6], w: 0.55, tint: C.red },
      { k: 'bar', l: 2, a: [-1.0, 1.6], b: [1.9, 1.6], w: 0.55, tint: C.red },
      { k: 'rect', l: 3, x: -1.3, y: 2.3, w: 1.7, h: 0.7, tint: C.ink },
      { k: 'bar', l: 3, a: [1.9, 1.2], b: [2.9, 3.0], w: 0.55, tint: C.steel },
    ],
  },
  {
    id: 'rocket',
    parts: [
      { k: 'rect', l: 0, x: 0, y: 0.2, w: 2.6, h: 6.2, tint: C.steel },
      { k: 'rect', l: 1, x: 0, y: 3.6, w: 1.8, h: 1.6, a: 45, tint: C.red },
      { k: 'bar', l: 1, a: [-1.2, -1.6], b: [-3.0, -3.7], w: 0.9, tint: C.red },
      { k: 'bar', l: 1, a: [1.2, -1.6], b: [3.0, -3.7], w: 0.9, tint: C.red },
      { k: 'disc', l: 2, x: 0, y: 1.4, r: 0.75, tint: C.glass },
      { k: 'rect', l: 1, x: 0, y: -3.6, w: 1.5, h: 1.2, tint: C.gold },
      { k: 'rect', l: 2, x: 0, y: -0.9, w: 3.2, h: 0.8, tint: C.sky },
    ],
  },
]

const rot = ([x, y]: Pt, a: number): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]
const deg = (d: number) => (d * Math.PI) / 180

interface Candidate {
  plate: Omit<TemplatePlate, 'spots'>
  /** Preferred screw spots, world space. */
  primary: Pt[]
  /** Other valid spots on the plate, used when a preferred one collides. */
  fallback: Pt[]
}

function partCandidate(part: Part, id: string): Candidate {
  if (part.k === 'disc') {
    const r = part.r
    const ring = r - INSET
    const at = (d: number): Pt => [part.x + Math.cos(deg(d)) * ring, part.y + Math.sin(deg(d)) * ring]
    const primary: Pt[] = part.screws
      ? part.screws.map(([x, y]) => [part.x + x, part.y + y])
      : r >= 1.3
        ? [90, 210, 330].map(at)
        : r >= 0.8
          ? [180, 0].map(at)
          : [[part.x, part.y]]
    const fallback = r >= 0.8 ? Array.from({ length: 24 }, (_, i) => at(i * 15)) : []
    return { plate: { id, shape: 'disc', layer: part.l, x: part.x, y: part.y, w: r * 2, h: r * 2, angle: 0, tint: part.tint }, primary, fallback }
  }
  if (part.k === 'bar') {
    const w = part.w ?? 0.95
    const dx = part.b[0] - part.a[0]
    const dy = part.b[1] - part.a[1]
    const len = Math.hypot(dx, dy)
    const along = (t: number): Pt => [part.a[0] + dx * t, part.a[1] + dy * t]
    const ts = part.t ?? (len >= 4.5 ? [0, 0.5, 1] : [0, 1])
    return {
      plate: { id, layer: part.l, x: (part.a[0] + part.b[0]) / 2, y: (part.a[1] + part.b[1]) / 2, w: len + w, h: w, angle: Math.atan2(dy, dx), tint: part.tint },
      primary: ts.map(along),
      fallback: Array.from({ length: 21 }, (_, i) => along(i / 20)),
    }
  }
  const a = deg(part.a ?? 0)
  const hw = part.w / 2 - INSET
  const hh = part.h / 2 - INSET
  const world = (p: Pt): Pt => {
    const [x, y] = rot(p, a)
    return [part.x + x, part.y + y]
  }
  let local: Pt[]
  if (part.screws) local = part.screws
  else if (Math.min(part.w, part.h) >= 1.6)
    local = [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh],
    ]
  else if (part.w >= part.h) local = part.w >= 4.5 ? [[-hw, 0], [0, 0], [hw, 0]] : [[-hw, 0], [hw, 0]]
  else local = part.h >= 4.5 ? [[0, -hh], [0, 0], [0, hh]] : [[0, -hh], [0, hh]]
  // Fallbacks run along the inset outline (and the centre line for thin plates).
  const fallback: Pt[] = []
  const steps = 10
  for (let i = 0; i <= steps; i++) {
    const u = -hw + (2 * hw * i) / steps
    const v = -hh + (2 * hh * i) / steps
    fallback.push([u, -hh], [u, hh], [-hw, v], [hw, v], [u, 0])
  }
  return {
    plate: { id, layer: part.l, x: part.x, y: part.y, w: part.w, h: part.h, angle: a, tint: part.tint },
    primary: local.map(world),
    fallback: fallback.map(world),
  }
}

const inBounds = ([x, y]: Pt) => Math.abs(x) <= SCREW_BOUNDS.x && Math.abs(y) <= SCREW_BOUNDS.y
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])

/**
 * Resolves a template into plates with final screw spots. Higher layers claim spots first; a
 * colliding spot slides to the nearest free spot on the same plate. The total is then padded (or,
 * failing that, trimmed) to whole boxes of three.
 */
export function buildTemplate(t: Template, mirror = false): TemplatePlate[] {
  const flip = (p: Pt): Pt => (mirror ? [-p[0], p[1]] : p)
  const cands = t.parts.map((part, i) => {
    const c = partCandidate(part, `p${i}`)
    if (!mirror) return c
    return { plate: { ...c.plate, x: -c.plate.x, angle: Math.PI - c.plate.angle }, primary: c.primary.map(flip), fallback: c.fallback.map(flip) }
  })

  const taken: Pt[] = []
  const free = (p: Pt) => inBounds(p) && taken.every((q) => dist(p, q) >= MIN_GAP)
  const spots = new Map<string, Pt[]>()
  for (const c of [...cands].sort((a, b) => b.plate.layer - a.plate.layer)) {
    const mine: Pt[] = []
    for (const want of c.primary) {
      const pick = free(want) ? want : [...c.fallback].sort((p, q) => dist(p, want) - dist(q, want)).find(free)
      if (pick) {
        mine.push(pick)
        taken.push(pick)
      }
    }
    spots.set(c.plate.id, mine)
  }

  const byLowLayer = [...cands].sort((a, b) => a.plate.layer - b.plate.layer)
  let total = [...spots.values()].reduce((n, s) => n + s.length, 0)
  // Pad with extra screws on low, roomy plates…
  for (const c of byLowLayer) {
    while (total % 3 !== 0) {
      const extra = c.fallback.find(free)
      if (!extra) break
      spots.get(c.plate.id)!.push(extra)
      taken.push(extra)
      total++
    }
  }
  // …or trim from the busiest low plates if no room was left.
  for (const c of byLowLayer) {
    const mine = spots.get(c.plate.id)!
    while (total % 3 !== 0 && mine.length > 2) {
      mine.pop()
      total--
    }
  }
  return cands.map((c) => ({ ...c.plate, spots: spots.get(c.plate.id)! })).filter((p) => p.spots.length > 0)
}
