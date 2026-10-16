import { plateInertia } from './geometry'
import type { GameState, PlateDef } from './types'
import { supportOf, type Poses } from './rules'

/**
 * Tiny 2D plate physics: a plate with 2+ screws is fixed, with one screw it swings around that
 * screw like a pendulum, with none it falls off the board. A plate with a present plate lying on
 * top of it stays pressed flat until that plate is gone. Mutable and outside React on purpose:
 * it is stepped every frame and read by the rules for live cover checks.
 */
interface Body {
  def: PlateDef
  x: number
  y: number
  angle: number
  vx: number
  vy: number
  w: number
  mode: 'fixed' | 'swing' | 'fall'
  pin: { x: number; y: number } | null
  gone: boolean
}

const GRAVITY = 24
const DAMPING = 0.9
const FLOOR = -16

let bodies: Record<string, Body> = {}
let lastState: GameState | null = null
let sinceCheck = 0

export function resetPhysics(state: GameState) {
  bodies = {}
  lastState = state
  for (const { def } of Object.values(state.plates)) {
    bodies[def.id] = { def, x: def.x, y: def.y, angle: def.angle, vx: 0, vy: 0, w: 0, mode: 'fixed', pin: null, gone: false }
  }
}

/** Updates each plate's mode from the screws holding it and the plates lying on top of it. */
export function syncPins(state: GameState) {
  lastState = state
  const { pressed } = supportOf(state, getPoses())
  for (const plate of Object.values(state.plates)) {
    const b = bodies[plate.def.id]
    if (!b || b.mode === 'fall') continue
    const free = !pressed.has(plate.def.id)
    if (plate.pins.length === 0) {
      if (b.mode === 'fixed' && !free) continue
      if (b.mode === 'swing' && b.pin) {
        // Keep the swing's momentum as the plate lets go.
        b.vx = -b.w * (b.y - b.pin.y)
        b.vy = b.w * (b.x - b.pin.x)
      }
      b.mode = 'fall'
      b.pin = null
    } else if (plate.pins.length === 1 && plate.def.screws.length > 1 && b.mode === 'fixed' && free) {
      const s = state.screws[plate.pins[0]].def
      b.mode = 'swing'
      b.pin = { x: s.x, y: s.y }
      // A plate hanging straight down would never start moving; give it a nudge.
      if (Math.abs(b.x - s.x) < 0.05) b.w = (Math.random() < 0.5 ? -1 : 1) * 0.6
    }
  }
}

/**
 * Re-aligns bodies with a restored game state (undo): plates that are held again snap back to
 * their rest pose; a plate already swinging on the right screw keeps swinging.
 */
export function rebuildPhysics(state: GameState) {
  for (const plate of Object.values(state.plates)) {
    const b = bodies[plate.def.id]
    if (!b) continue
    const pins = plate.pins.length
    if (pins === 0) continue
    const pin = state.screws[plate.pins[0]].def
    const swingingOnPin = b.mode === 'swing' && b.pin && b.pin.x === pin.x && b.pin.y === pin.y
    if (pins === 1 && plate.def.screws.length > 1 && swingingOnPin) continue
    restBody(b)
  }
  // A screwless plate comes back only if it was trapped under a plate that is back in place.
  const loose = Object.values(state.plates)
    .filter((p) => p.pins.length === 0 && bodies[p.def.id]?.mode !== 'fixed')
    .sort((a, b) => b.def.layer - a.def.layer)
  for (const plate of loose) {
    const poses = { ...getPoses(), [plate.def.id]: { x: plate.def.x, y: plate.def.y, angle: plate.def.angle } }
    if (supportOf(state, poses).pressed.has(plate.def.id)) restBody(bodies[plate.def.id])
  }
  syncPins(state)
}

function restBody(b: Body) {
  Object.assign(b, { x: b.def.x, y: b.def.y, angle: b.def.angle, vx: 0, vy: 0, w: 0, mode: 'fixed', pin: null, gone: false })
}

function stepBody(b: Body, dt: number) {
  if (b.mode === 'swing' && b.pin) {
    const rx = b.x - b.pin.x
    const ry = b.y - b.pin.y
    const inertia = plateInertia(b.def) + rx * rx + ry * ry
    const torque = -GRAVITY * rx
    b.w += (torque / inertia - DAMPING * b.w) * dt
    const da = b.w * dt
    const c = Math.cos(da)
    const s = Math.sin(da)
    b.x = b.pin.x + rx * c - ry * s
    b.y = b.pin.y + rx * s + ry * c
    b.angle += da
  } else if (b.mode === 'fall') {
    b.vy -= GRAVITY * dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    b.angle += b.w * dt
    if (b.y < FLOOR) b.gone = true
  }
}

export function stepPhysics(dt: number) {
  // Plates lying on top swing or fall away over time, so keep re-checking what they release.
  sinceCheck += dt
  if (lastState && sinceCheck > 0.08) {
    sinceCheck = 0
    syncPins(lastState)
  }
  const h = Math.min(dt, 1 / 30) / 4
  for (let i = 0; i < 4; i++) for (const b of Object.values(bodies)) if (!b.gone) stepBody(b, h)
}

export function getPoses(): Poses {
  const poses: Poses = {}
  // Falling plates are no longer on the board.
  for (const [id, b] of Object.entries(bodies)) if (!b.gone && b.mode !== 'fall') poses[id] = { x: b.x, y: b.y, angle: b.angle }
  return poses
}

export const getBody = (id: string): Readonly<Body> | undefined => bodies[id]
