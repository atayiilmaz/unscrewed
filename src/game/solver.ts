import { plateCoversPoint, platesOverlap, restPose } from './geometry'
import { levelHeads } from './rules'
import { ACTIVE_BOXES, BOX_SIZE, TRAY_SIZE, type Head, type LevelDef } from './types'

/**
 * Minimum bit switches needed to clear the level, assuming plates stay at rest until their last
 * screw is out and nothing lies on top of them (swinging is ignored). Rust is ignored too: extra taps cost nothing.
 * Returns null when the level cannot be cleared.
 *
 * Mirrors rules.ts on a compact bitmask state so whole levels can be searched quickly.
 */
export type SolverMove = { tap: string } | { bit: Head }

export function minSwitches(level: LevelDef, maxStates = 2_000_000): number | null {
  return solve(level, maxStates)?.switches ?? null
}

/** Cheapest solution as a move list, or null when unsolvable. */
export function solve(level: LevelDef, maxStates = 2_000_000): { switches: number; moves: SolverMove[] } | null {
  const screws = level.plates.flatMap((p, pi) => p.screws.map((s) => ({ ...s, plate: pi })))
  if (screws.length > 31) throw new Error('solver supports up to 31 screws')
  const colors = [...new Set(level.boxQueue)]
  const colorIdx = screws.map((s) => colors.indexOf(s.color))
  const heads = levelHeads(level)
  const headIdx = screws.map((s) => heads.indexOf(s.head))
  const queue = level.boxQueue.map((c) => colors.indexOf(c))

  const plateMask = level.plates.map((_, pi) => screws.reduce((m, s, i) => (s.plate === pi ? m | (1 << i) : m), 0))
  const plates = level.plates
  /** Plate indices covering each screw. */
  const blockers = screws.map((s) =>
    plates
      .map((p, pi) => ({ p, pi }))
      .filter(({ p }) => p.layer > plates[s.plate].layer && plateCoversPoint(p, restPose(p), s.x, s.y))
      .map(({ pi }) => pi),
  )
  /** Higher plates lying on top of each plate; any of them still present keeps it pressed in place. */
  const above = plates.map((p) => plates.map((q, qi) => ({ q, qi })).filter(({ q }) => q.layer > p.layer && platesOverlap(p, restPose(p), q, restPose(q))).map(({ qi }) => qi))
  const topDown = plates.map((_, i) => i).sort((a, b) => plates[b].layer - plates[a].layer)
  const presence = (removed: number) => {
    const present = plates.map(() => false)
    for (const pi of topDown) present[pi] = (plateMask[pi] & ~removed) !== 0 || above[pi].some((qi) => present[qi])
    return present
  }
  const all = (1 << screws.length) - 1

  interface S {
    removed: number
    bit: number
    qi: number
    /** Active boxes as [color, count] pairs. */
    boxes: number[][]
    tray: number[]
    trayTotal: number
    path: Path | null
  }
  type Path = { prev: Path | null; move: SolverMove }

  const fillFromQueue = (s: S) => {
    while (s.boxes.length < ACTIVE_BOXES && s.qi < queue.length) {
      const color = queue[s.qi++]
      const take = Math.min(s.tray[color], BOX_SIZE)
      s.tray[color] -= take
      s.trayTotal -= take
      if (take === BOX_SIZE) continue // filled straight from the tray and left again
      s.boxes.push([color, take])
    }
  }

  const place = (s: S, color: number): boolean => {
    const box = s.boxes.find((b) => b[0] === color && b[1] < BOX_SIZE)
    if (box) {
      box[1]++
      if (box[1] === BOX_SIZE) {
        s.boxes = s.boxes.filter((b) => b !== box)
        fillFromQueue(s)
      }
      return true
    }
    s.tray[color]++
    s.trayTotal++
    return s.trayTotal < TRAY_SIZE
  }

  const start: S = { removed: 0, bit: heads.indexOf(level.startBit), qi: 0, boxes: [], tray: colors.map(() => 0), trayTotal: 0, path: null }
  fillFromQueue(start)

  const key = (s: S) =>
    `${s.removed}|${s.bit}|${s.qi}|${s.boxes
      .map((b) => b.join(':'))
      .sort()
      .join(',')}|${s.tray.join(',')}`

  const buckets: S[][] = [[start]]
  const seen = new Set<string>()
  for (let cost = 0; cost < buckets.length; cost++) {
    const bucket = buckets[cost] ?? []
    while (bucket.length > 0) {
      const s = bucket.pop()!
      const k = key(s)
      if (seen.has(k)) continue
      seen.add(k)
      if (seen.size > maxStates) throw new Error(`solver exceeded ${maxStates} states on ${level.id}`)
      if (s.removed === all && s.trayTotal === 0) {
        const moves: SolverMove[] = []
        for (let p = s.path; p; p = p.prev) moves.unshift(p.move)
        return { switches: cost, moves }
      }

      const present = presence(s.removed)
      for (let i = 0; i < screws.length; i++) {
        if (s.removed & (1 << i) || headIdx[i] !== s.bit) continue
        if (blockers[i].some((pi) => present[pi])) continue
        const next: S = {
          ...s,
          removed: s.removed | (1 << i),
          boxes: s.boxes.map((b) => [...b]),
          tray: [...s.tray],
          path: { prev: s.path, move: { tap: screws[i].id } },
        }
        if (place(next, colorIdx[i])) bucket.push(next)
      }
      for (let h = 0; h < heads.length; h++) {
        if (h !== s.bit) (buckets[cost + 1] ??= []).push({ ...s, bit: h, path: { prev: s.path, move: { bit: heads[h] } } })
      }
    }
  }
  return null
}
