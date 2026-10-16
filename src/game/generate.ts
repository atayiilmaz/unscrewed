import { minSwitches } from './solver'
import { buildTemplate, TEMPLATES, type Template } from './templates'
import type { ColorId, Head, LevelDef } from './types'

/** Deterministic PRNG so a seed always yields the same level. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(xs: T[], rand: () => number): T[] {
  const out = [...xs]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const ALL_COLORS: ColorId[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange']
const ALL_HEADS: Head[] = ['phillips', 'flat', 'hex', 'torx']

export interface Difficulty {
  heads: number
  maxColors: number
  rustChance: number
  /** Extra switches on top of the solver minimum (plates swinging can cost a switch or two). */
  slack: number
}

/** Difficulty ramps with the level number n (0 = first generated level). */
export function difficultyFor(n: number): Difficulty {
  return {
    heads: n < 4 ? 2 : n < 18 ? 3 : 4,
    maxColors: Math.min(6, 3 + Math.floor(n / 12)),
    rustChance: n < 6 ? 0 : Math.min(0.3, 0.08 + n * 0.004),
    slack: n < 12 ? 2 : 1,
  }
}

export function levelFromTemplate(template: Template, id: string, seed: number, mirror: boolean, diff: Difficulty): LevelDef {
  const plates = buildTemplate(template, mirror)
  const total = plates.reduce((n, p) => n + p.spots.length, 0)
  const boxes = total / 3

  for (let attempt = 0; attempt < 80; attempt++) {
    const rand = mulberry32(seed * 7919 + attempt)
    // Fall back to fewer bit types if a layout keeps failing.
    const headCount = Math.max(1, diff.heads - Math.floor(attempt / 40))
    const heads = shuffle(ALL_HEADS, rand).slice(0, headCount)
    const colors = shuffle(ALL_COLORS, rand).slice(0, Math.min(diff.maxColors, boxes))
    const boxQueue = shuffle(
      Array.from({ length: boxes }, (_, i) => colors[i % colors.length]),
      rand,
    )
    const pool = shuffle(
      boxQueue.flatMap((c) => [c, c, c]),
      rand,
    )

    let k = 0
    const level: LevelDef = {
      id,
      name: template.id,
      startBit: heads[0],
      switches: 99,
      boxQueue,
      plates: plates.map(({ spots, ...plate }) => ({
        ...plate,
        screws: spots.map(([x, y], i) => ({
          id: `${plate.id}.${i}`,
          x,
          y,
          color: pool[k++],
          head: heads[Math.floor(rand() * heads.length)],
          rust: rand() < diff.rustChance ? 1 + Math.floor(rand() * 2) : undefined,
        })),
      })),
    }
    // Start with a bit that has something to do.
    const firstFree = level.plates.flatMap((p) => p.screws)
    level.startBit = firstFree[firstFree.length - 1].head

    let min: number | null
    try {
      min = minSwitches(level, 400_000)
    } catch {
      continue
    }
    if (min === null) continue
    return { ...level, switches: min + diff.slack }
  }
  throw new Error(`could not generate ${id} from ${template.id}`)
}

export const VARIANTS = 5

/** Every generated level in play order: each round walks all templates, alternating mirror. */
export function generatedPlan() {
  const plan: Array<{ n: number; template: Template; mirror: boolean; seed: number }> = []
  for (let round = 0; round < VARIANTS; round++) {
    TEMPLATES.forEach((template, i) => {
      const n = round * TEMPLATES.length + i
      plan.push({ n, template, mirror: (round + i) % 2 === 1, seed: 1000 + n })
    })
  }
  return plan
}
