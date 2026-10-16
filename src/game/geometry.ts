import { SCREW_RADIUS, type PlateDef, type PlatePose } from './types'

/** Is the world point inside the plate at the given pose, grown (or shrunk, if negative) by `margin`? */
export function plateContains(def: PlateDef, pose: PlatePose, px: number, py: number, margin = 0): boolean {
  const dx = px - pose.x
  const dy = py - pose.y
  if (def.shape === 'disc') return Math.hypot(dx, dy) <= def.w / 2 + margin
  const c = Math.cos(-pose.angle)
  const s = Math.sin(-pose.angle)
  const lx = dx * c - dy * s
  const ly = dx * s + dy * c
  return Math.abs(lx) <= def.w / 2 + margin && Math.abs(ly) <= def.h / 2 + margin
}

/** Is the world point (px, py) under the plate at the given pose, with a margin for the screw head? */
export const plateCoversPoint = (def: PlateDef, pose: PlatePose, px: number, py: number) => plateContains(def, pose, px, py, SCREW_RADIUS * 0.6)

const samples = new WeakMap<PlateDef, Array<[number, number]>>()

/** Points spread over the plate's face, in plate-local coordinates. */
function plateSamples(def: PlateDef) {
  let pts = samples.get(def)
  if (pts) return pts
  pts = []
  const hw = def.w / 2 - 0.1
  const hh = def.h / 2 - 0.1
  const nx = Math.max(1, Math.ceil((2 * hw) / 0.3))
  const ny = Math.max(1, Math.ceil((2 * hh) / 0.3))
  for (let i = 0; i <= nx; i++)
    for (let j = 0; j <= ny; j++) {
      const x = -hw + (2 * hw * i) / nx
      const y = -hh + (2 * hh * j) / ny
      if (def.shape !== 'disc' || Math.hypot(x, y) <= def.w / 2 - 0.1) pts.push([x, y])
    }
  if (pts.length === 0) pts.push([0, 0])
  samples.set(def, pts)
  return pts
}

const atRest = (d: PlateDef, p: PlatePose) => p.x === d.x && p.y === d.y && p.angle === d.angle
/** Most plates never move, so overlaps between plates at rest are computed once per pair. */
const restOverlap = new WeakMap<PlateDef, WeakMap<PlateDef, boolean>>()

/** Do two plates share any area at their poses? (A sliver along the edge does not count.) */
export function platesOverlap(a: PlateDef, poseA: PlatePose, b: PlateDef, poseB: PlatePose): boolean {
  if (atRest(a, poseA) && atRest(b, poseB)) {
    let row = restOverlap.get(a)
    if (!row) restOverlap.set(a, (row = new WeakMap()))
    let hit = row.get(b)
    if (hit === undefined) row.set(b, (hit = overlapAt(a, poseA, b, poseB)))
    return hit
  }
  return overlapAt(a, poseA, b, poseB)
}

function overlapAt(a: PlateDef, poseA: PlatePose, b: PlateDef, poseB: PlatePose): boolean {
  const reach = Math.hypot(a.w, a.h) / 2 + Math.hypot(b.w, b.h) / 2
  if (Math.hypot(poseA.x - poseB.x, poseA.y - poseB.y) > reach) return false
  const c = Math.cos(poseA.angle)
  const s = Math.sin(poseA.angle)
  return plateSamples(a).some(([x, y]) => plateContains(b, poseB, poseA.x + x * c - y * s, poseA.y + x * s + y * c, -0.08))
}

/** Moment of inertia per unit mass around the plate's centre. */
export const plateInertia = (def: PlateDef) => (def.shape === 'disc' ? (def.w * def.w) / 8 : (def.w * def.w + def.h * def.h) / 12)

export const restPose = (def: PlateDef): PlatePose => ({ x: def.x, y: def.y, angle: def.angle })

/** Builds a bar-shaped plate spanning a→b with screws at the given fractions along it. */
export function bar(
  id: string,
  layer: number,
  a: [number, number],
  b: [number, number],
  tint: string,
  screws: Array<{ t: number; color: PlateDef['screws'][number]['color']; head: PlateDef['screws'][number]['head']; rust?: number }>,
  width = 0.95,
): PlateDef {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return {
    id,
    layer,
    x: (a[0] + b[0]) / 2,
    y: (a[1] + b[1]) / 2,
    w: Math.hypot(dx, dy) + width,
    h: width,
    angle: Math.atan2(dy, dx),
    tint,
    screws: screws.map((s, i) => ({
      id: `${id}.${i}`,
      x: a[0] + dx * s.t,
      y: a[1] + dy * s.t,
      color: s.color,
      head: s.head,
      rust: s.rust,
    })),
  }
}
