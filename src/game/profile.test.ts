import { describe, expect, it } from 'vitest'
import { buyDecor, buyUpgrade, consumeBooster, levelReward, newProfile, rankOf, upgradePrice } from './profile'

describe('profile', () => {
  it('rewards unused switches, capped', () => {
    expect(levelReward(0)).toBe(20)
    expect(levelReward(2)).toBe(30)
    expect(levelReward(50)).toBe(50)
  })

  it('buys upgrades level by level until maxed', () => {
    let p = { ...newProfile(), coins: 10_000 }
    p = buyUpgrade(p, 'tray')!
    expect(p.upgrades.tray).toBe(1)
    expect(p.coins).toBe(10_000 - 900)
    p = buyUpgrade(p, 'tray')!
    expect(p.upgrades.tray).toBe(2)
    expect(upgradePrice(p, 'tray')).toBeNull()
    expect(buyUpgrade(p, 'tray')).toBeNull()
  })

  it('refuses purchases without coins and duplicate decor', () => {
    const poor = { ...newProfile(), coins: 10 }
    expect(buyDecor(poor, 'lamp')).toBeNull()
    const rich = buyDecor({ ...newProfile(), coins: 500 }, 'lamp')!
    expect(rich.decor).toEqual(['lamp'])
    expect(buyDecor(rich, 'lamp')).toBeNull()
  })

  it('consumes boosters only when owned', () => {
    const p = { ...newProfile(), boosters: { undo: 1, oil: 0, slot: 0 } }
    expect(consumeBooster(p, 'oil')).toBeNull()
    expect(consumeBooster(p, 'undo')!.boosters.undo).toBe(0)
  })

  it('ranks up every four workshop purchases', () => {
    const p = { ...newProfile(), decor: ['lamp', 'plant'] as const, upgrades: { kit: 1, tray: 0, rust: 0, coin: 1, speed: 0 } }
    expect(rankOf({ ...p, decor: [...p.decor] }).idx).toBe(1)
    expect(rankOf(newProfile()).idx).toBe(0)
  })

  it('haggling scales the level reward', () => {
    expect(levelReward(0, 5)).toBe(30)
    expect(levelReward(2, 1)).toBe(33)
  })
})
