import { plateCoversPoint, platesOverlap } from './geometry'
import {
  ACTIVE_BOXES,
  BOX_SIZE,
  TRAY_SIZE,
  type GameOptions,
  type GameState,
  type Head,
  type LevelDef,
  type PlatePose,
  type TapResult,
} from './types'

export type Poses = Record<string, PlatePose>

export function createGame(level: LevelDef, opts: GameOptions = {}): GameState {
  const state: GameState = {
    level,
    screws: {},
    plates: {},
    boxes: [],
    queue: [...level.boxQueue],
    nextBoxUid: 1,
    tray: Array(TRAY_SIZE + (opts.extraTraySlots ?? 0)).fill(null),
    bit: level.startBit,
    switchesLeft: level.switches + (opts.extraSwitches ?? 0),
    status: 'playing',
  }
  for (const plate of level.plates) {
    state.plates[plate.id] = { def: plate, pins: plate.screws.map((s) => s.id) }
    for (const s of plate.screws) {
      state.screws[s.id] = { def: s, plateId: plate.id, status: 'board', rustLeft: Math.max(0, (s.rust ?? 0) - (opts.rustRelief ?? 0)) }
    }
  }
  return advanceBoxes(state)
}

function clone(state: GameState): GameState {
  return {
    ...state,
    screws: { ...state.screws },
    plates: { ...state.plates },
    boxes: state.boxes.map((b) => ({ ...b, filled: [...b.filled] })),
    queue: [...state.queue],
    tray: [...state.tray],
  }
}

export interface Support {
  /** Plates physically on the board: screwed down, or held flat by a present plate lying on top. */
  present: Set<string>
  /** Plates with a present plate lying on top of them. */
  pressed: Set<string>
}

/**
 * Works out which plates are still on the board. `poses` holds only plates that have not fallen.
 * A plate without screws stays put while a plate that is itself still present lies on top of it.
 */
export function supportOf(state: GameState, poses: Poses): Support {
  const present = new Set<string>()
  const pressed = new Set<string>()
  const order = Object.values(state.plates).sort((a, b) => b.def.layer - a.def.layer)
  for (const plate of order) {
    const pose = poses[plate.def.id]
    if (!pose) continue
    const onTop = order.some((q) => {
      const qp = poses[q.def.id]
      return q.def.layer > plate.def.layer && present.has(q.def.id) && qp && platesOverlap(plate.def, pose, q.def, qp)
    })
    if (onTop) pressed.add(plate.def.id)
    if (plate.pins.length > 0 || onTop) present.add(plate.def.id)
  }
  return { present, pressed }
}

/** Returns the id of the present plate covering the screw, or null when it is free to turn. */
export function coverOf(state: GameState, poses: Poses, screwId: string, support = supportOf(state, poses)): string | null {
  const screw = state.screws[screwId]
  const layer = state.plates[screw.plateId].def.layer
  let best: string | null = null
  let bestLayer = -Infinity
  for (const plate of Object.values(state.plates)) {
    if (!support.present.has(plate.def.id) || plate.def.layer <= layer) continue
    const pose = poses[plate.def.id]
    if (pose && plateCoversPoint(plate.def, pose, screw.def.x, screw.def.y) && plate.def.layer > bestLayer) {
      best = plate.def.id
      bestLayer = plate.def.layer
    }
  }
  return best
}

export function tapScrew(state: GameState, poses: Poses, screwId: string): { state: GameState; result: TapResult } {
  const screw = state.screws[screwId]
  if (state.status !== 'playing' || !screw || screw.status !== 'board') return { state, result: { kind: 'ignored' } }

  const by = coverOf(state, poses, screwId)
  if (by) return { state, result: { kind: 'covered', by } }
  if (screw.def.head !== state.bit) return { state, result: { kind: 'wrong-bit' } }

  const next = clone(state)
  if (screw.rustLeft > 0) {
    next.screws[screwId] = { ...screw, rustLeft: screw.rustLeft - 1 }
    return { state: next, result: { kind: 'rust', left: screw.rustLeft - 1 } }
  }

  const box = next.boxes.find((b) => !b.leaving && b.color === screw.def.color && b.filled.length < BOX_SIZE)
  const traySlot = next.tray.indexOf(null)
  if (!box && traySlot < 0) return { state, result: { kind: 'no-room' } }

  const plate = next.plates[screw.plateId]
  next.plates[screw.plateId] = { ...plate, pins: plate.pins.filter((p) => p !== screwId) }

  if (box) {
    next.screws[screwId] = { ...screw, status: 'box', boxUid: box.uid, slot: box.filled.length }
    box.filled.push(screwId)
    if (box.filled.length === BOX_SIZE) box.leaving = true
  } else {
    next.screws[screwId] = { ...screw, status: 'tray', slot: traySlot }
    next.tray[traySlot] = screwId
  }
  return { state: evaluate(next, poses), result: { kind: 'removed', to: box ? 'box' : 'tray' } }
}

export function switchBit(state: GameState, poses: Poses, head: Head): { state: GameState; ok: boolean } {
  if (state.status !== 'playing' || head === state.bit) return { state, ok: false }
  if (state.switchesLeft <= 0) return { state, ok: false }
  const next = { ...state, bit: head, switchesLeft: state.switchesLeft - 1 }
  return { state: evaluate(next, poses), ok: true }
}

/** Drops full boxes, brings in queued ones and pulls matching screws out of the tray. */
export function advanceBoxes(state: GameState): GameState {
  const next = clone(state)
  next.boxes = next.boxes.filter((b) => !b.leaving)
  while (next.boxes.length < ACTIVE_BOXES && next.queue.length > 0) {
    next.boxes.push({ uid: next.nextBoxUid++, color: next.queue.shift()!, filled: [], leaving: false })
  }
  for (let i = 0; i < next.tray.length; i++) {
    const id = next.tray[i]
    if (!id) continue
    const box = next.boxes.find((b) => !b.leaving && b.color === next.screws[id].def.color && b.filled.length < BOX_SIZE)
    if (!box) continue
    next.screws[id] = { ...next.screws[id], status: 'box', boxUid: box.uid, slot: box.filled.length }
    box.filled.push(id)
    next.tray[i] = null
    if (box.filled.length === BOX_SIZE) box.leaving = true
  }
  return next
}

export const hasLeavingBox = (state: GameState) => state.boxes.some((b) => b.leaving)

/** Settles win/lose once no box animation is pending. */
export function evaluate(state: GameState, poses: Poses): GameState {
  if (state.status !== 'playing' || hasLeavingBox(state)) return state
  const onBoard = Object.values(state.screws).filter((s) => s.status === 'board')
  if (onBoard.length === 0 && state.tray.every((t) => t === null)) return { ...state, status: 'won' }
  if (state.tray.every((t) => t !== null)) return { ...state, status: 'lost-tray' }
  if (state.switchesLeft === 0) {
    const support = supportOf(state, poses)
    const free = onBoard.filter((s) => !coverOf(state, poses, s.def.id, support))
    if (free.length > 0 && !free.some((s) => s.def.head === state.bit)) return { ...state, status: 'stuck' }
  }
  return state
}

export function grantSwitches(state: GameState, n: number): GameState {
  return { ...state, switchesLeft: state.switchesLeft + n, status: 'playing' }
}

/** Oil booster: every rusty screw still on the board turns freely. */
export function removeRust(state: GameState): GameState {
  const screws = { ...state.screws }
  for (const [id, s] of Object.entries(screws)) if (s.status === 'board' && s.rustLeft > 0) screws[id] = { ...s, rustLeft: 0 }
  return { ...state, screws }
}

export const hasRust = (state: GameState) => Object.values(state.screws).some((s) => s.status === 'board' && s.rustLeft > 0)

export function grantTraySlot(state: GameState): GameState {
  return { ...state, tray: [...state.tray, null], status: 'playing' }
}

/** Every bit type used by the level, in a stable order. */
export function levelHeads(level: LevelDef): Head[] {
  const order: Head[] = ['phillips', 'flat', 'hex', 'torx']
  const used = new Set(level.plates.flatMap((p) => p.screws.map((s) => s.head)))
  return order.filter((h) => used.has(h))
}
