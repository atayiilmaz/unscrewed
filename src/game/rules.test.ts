import { describe, expect, it } from 'vitest'
import { bar, restPose } from './geometry'
import { LEVELS, tutorialLevels } from './levels'
import { advanceBoxes, coverOf, createGame, evaluate, grantTraySlot, hasLeavingBox, hasRust, removeRust, supportOf, switchBit, tapScrew, type Poses } from './rules'
import { minSwitches, solve } from './solver'
import type { LevelDef } from './types'

const posesOf = (level: LevelDef): Poses => Object.fromEntries(level.plates.map((p) => [p.id, restPose(p)]))

const mini: LevelDef = {
  id: 't',
  name: 't',
  startBit: 'phillips',
  switches: 1,
  boxQueue: ['red', 'blue'],
  plates: [
    bar('low', 0, [-2, 0], [2, 0], '#fff', [
      { t: 0, color: 'red', head: 'phillips' },
      { t: 1, color: 'blue', head: 'flat', rust: 1 },
    ]),
    bar('top', 1, [-2, -1], [-2, 2], '#fff', [
      { t: 0, color: 'red', head: 'phillips' },
      { t: 1, color: 'red', head: 'phillips' },
    ]),
    bar('side', 0, [3, -3], [3, 3], '#fff', [
      { t: 0, color: 'blue', head: 'flat' },
      { t: 1, color: 'blue', head: 'flat' },
    ]),
  ],
}

describe('rules', () => {
  const poses = posesOf(mini)

  it('blocks screws under a higher plate', () => {
    const g = createGame(mini)
    expect(coverOf(g, poses, 'low.0')).toBe('top')
    expect(tapScrew(g, poses, 'low.0').result).toEqual({ kind: 'covered', by: 'top' })
  })

  it('needs the matching bit', () => {
    const g = createGame(mini)
    expect(tapScrew(g, poses, 'side.0').result.kind).toBe('wrong-bit')
  })

  it('fills a box, sends it off and frees the covered screw', () => {
    let g = createGame(mini)
    g = tapScrew(g, poses, 'top.0').state
    g = tapScrew(g, poses, 'top.1').state
    expect(g.plates.top.pins).toEqual([])
    expect(coverOf(g, poses, 'low.0')).toBeNull()
    g = tapScrew(g, poses, 'low.0').state
    expect(g.boxes[0].leaving).toBe(true)
    g = advanceBoxes(g)
    expect(g.boxes.map((b) => b.color)).toEqual(['blue'])
  })

  it('rusty screws take extra taps', () => {
    let g = createGame(mini)
    g = switchBit(g, poses, 'flat').state
    expect(g.switchesLeft).toBe(0)
    const r1 = tapScrew(g, poses, 'low.1')
    expect(r1.result).toEqual({ kind: 'rust', left: 0 })
    expect(tapScrew(r1.state, poses, 'low.1').result).toEqual({ kind: 'removed', to: 'box' })
  })

  it('reports stuck when no free screw fits and switches are gone', () => {
    let g = createGame({ ...mini, switches: 0, startBit: 'flat' })
    g = tapScrew(g, poses, 'side.0').state
    g = tapScrew(g, poses, 'side.1').state
    // remaining free: top.* (phillips), low.1 (flat, rusty) → still a move
    expect(g.status).toBe('playing')
    g = tapScrew(tapScrew(g, poses, 'low.1').state, poses, 'low.1').state
    g = advanceBoxes(g)
    expect(g.status).toBe('playing')
  })

  it('a screwless plate stays pressed under a screwed plate on top, and keeps covering', () => {
    const level: LevelDef = {
      ...mini,
      boxQueue: ['red', 'blue'],
      plates: [
        bar('base', 0, [-0.5, 0], [0.5, 0], '#fff', [
          { t: 0, color: 'red', head: 'phillips' },
          { t: 1, color: 'red', head: 'phillips' },
        ]),
        bar('under', 1, [-3, 0], [3, 0], '#fff', [{ t: 1, color: 'red', head: 'phillips' }]),
        bar('over', 2, [-2, -2], [-2, 2], '#fff', [
          { t: 0, color: 'blue', head: 'phillips' },
          { t: 1, color: 'blue', head: 'phillips' },
        ]),
      ],
    }
    const poses = posesOf(level)
    let g = tapScrew(createGame(level), poses, 'under.0').state
    expect(g.plates.under.pins).toEqual([])
    const support = supportOf(g, poses)
    expect(support.present.has('under')).toBe(true)
    expect(support.pressed.has('under')).toBe(true)
    expect(coverOf(g, poses, 'base.0')).toBe('under')

    g = tapScrew(g, poses, 'over.0').state
    g = tapScrew(g, poses, 'over.1').state
    expect(supportOf(g, poses).present.has('under')).toBe(false)
    expect(coverOf(g, poses, 'base.0')).toBeNull()
  })

  it('oil clears rust from every board screw', () => {
    const g = createGame(mini)
    expect(hasRust(g)).toBe(true)
    const oiled = removeRust(g)
    expect(hasRust(oiled)).toBe(false)
    expect(oiled.screws['low.1'].rustLeft).toBe(0)
  })

  it('applies workshop upgrades to a new game', () => {
    const g = createGame(mini, { extraSwitches: 2, extraTraySlots: 1 })
    expect(g.switchesLeft).toBe(3)
    expect(g.tray).toHaveLength(6)
  })

  it('an extra tray slot revives a full tray', () => {
    const level: LevelDef = {
      ...mini,
      boxQueue: ['green', 'green'],
      plates: [bar('x', 0, [-3, 0], [3, 0], '#fff', [0, 0.2, 0.4, 0.6, 0.8].map((t) => ({ t, color: 'red' as const, head: 'phillips' as const })))],
    }
    let g = createGame(level)
    for (let i = 0; i < 5; i++) g = tapScrew(g, posesOf(level), `x.${i}`).state
    g = grantTraySlot(g)
    expect(g.status).toBe('playing')
    expect(g.tray.filter((t) => t === null)).toHaveLength(1)
  })

  it('loses when the tray fills', () => {
    const level: LevelDef = {
      ...mini,
      boxQueue: ['green', 'green'],
      plates: [
        bar('x', 0, [-3, 0], [3, 0], '#fff', [0, 0.2, 0.4, 0.6, 0.8].map((t) => ({ t, color: 'red' as const, head: 'phillips' as const }))),
      ],
    }
    let g = createGame(level)
    for (let i = 0; i < 5; i++) g = tapScrew(g, posesOf(level), `x.${i}`).state
    expect(g.status).toBe('lost-tray')
  })
})

describe('levels', () => {
  it('tutorial color counts fill whole boxes', () => {
    for (const level of tutorialLevels) {
      const counts: Record<string, number> = {}
      for (const s of level.plates.flatMap((p) => p.screws)) counts[s.color] = (counts[s.color] ?? 0) + 1
      for (const c of level.boxQueue) counts[c] -= 3
      expect(Object.values(counts).every((n) => n === 0), level.id).toBe(true)
    }
  })

  it('every level is solvable within its budget, replayed through the real rules', () => {
    for (const level of LEVELS) {
      const solution = solve(level)
      expect(solution, level.id).not.toBeNull()
      expect(solution!.switches, level.id).toBeLessThanOrEqual(level.switches)

      const poses = posesOf(level)
      let g = createGame(level)
      for (const move of solution!.moves) {
        if ('bit' in move) {
          const r = switchBit(g, poses, move.bit)
          expect(r.ok, `${level.id} switch`).toBe(true)
          g = r.state
          continue
        }
        let r = tapScrew(g, poses, move.tap)
        while (r.result.kind === 'rust') r = tapScrew(r.state, poses, move.tap)
        expect(r.result.kind, `${level.id} tap ${move.tap}`).toBe('removed')
        g = r.state
        while (hasLeavingBox(g)) g = evaluate(advanceBoxes(g), poses)
      }
      expect(g.status, level.id).toBe('won')
    }
  }, 120_000)
})

describe('solver', () => {
  it('agrees with hand-checked tutorial minimums', () => {
    expect(tutorialLevels.map((l) => minSwitches(l))).toEqual([0, 2, 1])
  })
})
