import type { DecorId, UpgradeId } from '../game/profile'
import type { Spot } from '../game/store'

/**
 * Workshop floor plan (world units, y up). The room spans x −6…6, z −5…5; the camera looks in
 * from the front-right corner, so the back (z −5) and left (x −6) walls are the solid ones.
 */
export const ROOM = { w: 12, d: 10, wall: 3.2 }

export interface StationSpot {
  /** Where the station model sits and which way it faces. */
  pos: [number, number, number]
  rot: number
  /** Where the mechanic stands to use it, and the heading he faces. */
  stand: [number, number]
  face: number
}

export const STATIONS: Record<UpgradeId, StationSpot> = {
  kit: { pos: [-3.4, 0, -4.7], rot: 0, stand: [-3.4, -3.4], face: Math.PI },
  tray: { pos: [-5.2, 0, -0.4], rot: Math.PI / 2, stand: [-3.9, -0.4], face: -Math.PI / 2 },
  rust: { pos: [-4.6, 0, 3.3], rot: Math.PI / 2, stand: [-3.3, 3.0], face: -Math.PI / 2 },
  coin: { pos: [3.6, 0, 3.4], rot: Math.PI, stand: [3.6, 2.1], face: 0 },
  speed: { pos: [4.6, 0, -3.4], rot: -Math.PI / 2, stand: [3.3, -2.6], face: Math.PI / 2 },
}

export const BENCH = { pos: [0, 0, -3.6] as [number, number, number], top: 1.0, w: 4.2, d: 1.3 }

export const SPOTS: Record<Spot, { stand: [number, number]; face: number }> = {
  bench: { stand: [0, -2.45], face: Math.PI },
  ...Object.fromEntries(Object.entries(STATIONS).map(([id, s]) => [id, { stand: s.stand, face: s.face }])),
} as Record<Spot, { stand: [number, number]; face: number }>

/** Open floor the mechanic routes through, so he never walks through the bench. */
export const HUB: [number, number] = [0, 0.6]

export const DECOR_SPOTS: Record<DecorId, { pos: [number, number, number]; rot?: number }> = {
  lamp: { pos: [-1.6, BENCH.top, -3.9] },
  vise: { pos: [1.7, BENCH.top, -3.7] },
  radio: { pos: [5.2, 0, 0.6], rot: -Math.PI / 2 },
  clock: { pos: [1.2, 2.3, -4.92] },
  poster: { pos: [-5.92, 1.9, -2.6], rot: Math.PI / 2 },
  toolbox: { pos: [-1.2, 0, 4.2], rot: 0.3 },
  plant: { pos: [5.3, 0, 4.4] },
  robot: { pos: [-5.5, 0, 1.8], rot: Math.PI / 2 },
  trophy: { pos: [3.0, 1.12, 3.75] },
}
