/** Player progression: coins, boosters, workshop upgrades and decorations. Pure functions + storage. */
import { defaultLang, type Lang } from '../i18n'

export type BoosterId = 'undo' | 'oil' | 'slot'
export type UpgradeId = 'kit' | 'tray' | 'rust' | 'coin' | 'speed'

export interface Profile {
  lang: Lang
  level: number
  /** Levels cleared and screws removed, all time. */
  cleared: number
  screws: number
  coins: number
  boosters: Record<BoosterId, number>
  upgrades: Record<UpgradeId, number>
  decor: DecorId[]
  /** Times each object (level name key) has been taken apart. */
  collection: Record<string, number>
  settings: Settings
  savedAt: number
}

export interface Settings {
  sfx: boolean
  music: boolean
  haptics: boolean
  /** 'low' drops shadows and pixel ratio for older phones. */
  quality: 'low' | 'high'
}

export const BOOSTERS: Record<BoosterId, { price: number }> = {
  undo: { price: 60 },
  oil: { price: 90 },
  slot: { price: 120 },
}

/** Workshop skills. `fx(level)` is the number shown in the effect text. */
export const UPGRADES: Record<UpgradeId, { prices: number[]; fx: (lvl: number) => number }> = {
  kit: { prices: [250, 700, 1500], fx: (l) => l },
  tray: { prices: [900, 2400], fx: (l) => l },
  rust: { prices: [400, 1200], fx: (l) => l },
  coin: { prices: [200, 450, 800, 1300, 2000], fx: (l) => l * 10 },
  speed: { prices: [150, 400, 900], fx: (l) => l * 35 },
}
export const UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[]

export const DECOR: Array<{ id: DecorId; price: number }> = [
  { id: 'lamp', price: 120 },
  { id: 'plant', price: 160 },
  { id: 'radio', price: 220 },
  { id: 'poster', price: 260 },
  { id: 'clock', price: 320 },
  { id: 'toolbox', price: 400 },
  { id: 'vise', price: 480 },
  { id: 'robot', price: 600 },
  { id: 'trophy', price: 900 },
]
export type DecorId = 'lamp' | 'plant' | 'radio' | 'poster' | 'clock' | 'toolbox' | 'vise' | 'robot' | 'trophy'

export const RANK_COUNT = 5

export function newProfile(): Profile {
  return {
    lang: defaultLang(),
    level: 0,
    cleared: 0,
    screws: 0,
    coins: 50,
    boosters: { undo: 3, oil: 1, slot: 1 },
    upgrades: { kit: 0, tray: 0, rust: 0, coin: 0, speed: 0 },
    decor: [],
    collection: {},
    settings: { sfx: true, music: true, haptics: true, quality: 'high' },
    savedAt: 0,
  }
}

/** Workshop rank (0-based) grows with everything bought for it. */
export function rankOf(p: Profile) {
  const points = p.decor.length + Object.values(p.upgrades).reduce((a, b) => a + b, 0)
  const idx = Math.min(RANK_COUNT - 1, Math.floor(points / 4))
  return { idx, progress: idx === RANK_COUNT - 1 ? 1 : (points % 4) / 4 }
}

/** Master level from jobs done: 1 + one level per three cleared levels. */
export function masterLevel(p: Profile) {
  return { level: 1 + Math.floor(p.cleared / 3), progress: (p.cleared % 3) / 3 }
}

/** Coins for clearing a level: a base plus a bonus for every bit switch left unused, scaled by haggling. */
export const levelReward = (switchesLeft: number, coinLevel = 0) => Math.round((20 + 5 * Math.min(switchesLeft, 6)) * (1 + coinLevel * 0.1))

export function spend(p: Profile, amount: number): Profile | null {
  return p.coins >= amount ? { ...p, coins: p.coins - amount } : null
}

export function addCoins(p: Profile, amount: number): Profile {
  return { ...p, coins: p.coins + amount }
}

export function addBooster(p: Profile, id: BoosterId, n = 1): Profile {
  return { ...p, boosters: { ...p.boosters, [id]: p.boosters[id] + n } }
}

export function consumeBooster(p: Profile, id: BoosterId): Profile | null {
  return p.boosters[id] > 0 ? addBooster(p, id, -1) : null
}

export function upgradePrice(p: Profile, id: UpgradeId): number | null {
  return UPGRADES[id].prices[p.upgrades[id]] ?? null
}

export function buyUpgrade(p: Profile, id: UpgradeId): Profile | null {
  const price = upgradePrice(p, id)
  const paid = price === null ? null : spend(p, price)
  return paid && { ...paid, upgrades: { ...paid.upgrades, [id]: paid.upgrades[id] + 1 } }
}

export function buyDecor(p: Profile, id: DecorId): Profile | null {
  const item = DECOR.find((d) => d.id === id)
  if (!item || p.decor.includes(id)) return null
  const paid = spend(p, item.price)
  return paid && { ...paid, decor: [...paid.decor, id] }
}

const KEY = 'sokum-profile-v1'
const LEGACY_KEY = 'sokum-save-v1'

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Profile>
      const base = newProfile()
      return {
        ...base,
        ...p,
        boosters: { ...base.boosters, ...p.boosters },
        upgrades: { ...base.upgrades, ...p.upgrades },
        settings: { ...base.settings, ...p.settings },
        collection: p.collection ?? {},
        decor: p.decor ?? [],
      }
    }
    const legacy = Number(JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '{}').level) || 0
    return { ...newProfile(), level: legacy }
  } catch {
    return newProfile()
  }
}

export function clearProfile() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* storage unavailable */
  }
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, savedAt: Date.now() }))
  } catch {
    /* storage unavailable */
  }
}
