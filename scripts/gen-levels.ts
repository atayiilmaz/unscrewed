import { writeFileSync } from 'node:fs'
import { difficultyFor, generatedPlan, levelFromTemplate } from '../src/game/generate'
import { tutorialLevels } from '../src/game/levels'

const levels = generatedPlan().map(({ n, template, mirror, seed }) => {
  const id = `L${tutorialLevels.length + n + 1}`
  const t = Date.now()
  const level = levelFromTemplate(template, id, seed, mirror, difficultyFor(n))
  const screws = level.plates.flatMap((p) => p.screws)
  const heads = new Set(screws.map((s) => s.head)).size
  console.log(id.padEnd(4), level.name.padEnd(9), `screws=${screws.length}`, `heads=${heads}`, `switches=${level.switches}`, `${Date.now() - t}ms`)
  return level
})
const round = (v: unknown): unknown =>
  typeof v === 'number' ? Math.round(v * 1000) / 1000 : Array.isArray(v) ? v.map(round) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round(x)])) : v
writeFileSync(new URL('../src/game/levels.generated.json', import.meta.url), JSON.stringify(round(levels)) + '\n')
console.log(`wrote ${levels.length} levels`)
