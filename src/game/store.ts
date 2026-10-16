import { create } from 'zustand'
import { shouldShowInterstitial, showInterstitial, showRewarded } from '../services/ads'
import { translate, type Key, type Lang } from '../i18n'
import { feel, setFeelOptions } from '../services/feel'
import { music } from '../services/music'
import { getLevel, LEVEL_COUNT } from './levels'
import { getPoses, rebuildPhysics, resetPhysics, syncPins } from './physics'
import {
  addBooster,
  addCoins,
  BOOSTERS,
  buyDecor,
  buyUpgrade,
  clearProfile,
  consumeBooster,
  newProfile,
  levelReward,
  loadProfile,
  masterLevel,
  saveProfile,
  spend,
  type BoosterId,
  type DecorId,
  type Profile,
  type Settings,
  type UpgradeId,
} from './profile'
import { advanceBoxes, createGame, evaluate, grantSwitches, grantTraySlot, hasLeavingBox, hasRust, removeRust, switchBit, tapScrew } from './rules'
import type { GameState, Head } from './types'

export const BOX_LEAVE_MS = 450
const UNDO_DEPTH = 30

export type Feedback =
  | { seq: number; kind: 'covered'; screwId: string; plateId: string }
  | { seq: number; kind: 'wrong-bit'; screwId: string }
  | { seq: number; kind: 'rust'; screwId: string }
  | { seq: number; kind: 'no-room'; screwId: string }
  | { seq: number; kind: 'no-switch' }

export type Screen = 'home' | 'game'
export type HomeSheet = 'skills' | 'decor' | 'market' | 'collection' | 'settings' | null
/** Places in the workshop the mechanic can walk to. */
export type Spot = UpgradeId | 'bench'

interface Store {
  screen: Screen
  profile: Profile
  /** Bumped on every (re)start so the scene remounts with fresh animation state. */
  runId: number
  game: GameState
  history: GameState[]
  feedback: Feedback | null
  /** Latest screwdriver turn, for the tool animation. */
  turn: { seq: number; screwId: string; kind: 'out' | 'rust' } | null
  toast: { seq: number; text: string } | null
  /** Booster waiting for the player to choose coins vs. an ad. */
  offer: BoosterId | null

  play: () => void
  goHome: () => void
  tap: (screwId: string) => void
  selectBit: (head: Head) => void
  restart: () => void
  finishLevel: (double: boolean) => Promise<void>
  reviveSwitches: () => Promise<void>
  activateBooster: (id: BoosterId) => void
  settleOffer: (how: 'coins' | 'ad' | 'cancel') => Promise<void>
  buyUpgrade: (id: UpgradeId) => void
  buyDecor: (id: DecorId) => void
  buyBooster: (id: BoosterId) => void
  setLang: (lang: Lang) => void
  sheet: HomeSheet
  openSheet: (sheet: HomeSheet) => void
  /** Station the player tapped in the workshop; the mechanic walks there. */
  focus: { seq: number; spot: Spot } | null
  focusSpot: (spot: Spot) => void
  updateSettings: (patch: Partial<Settings>) => void
  resetProgress: () => void
  /** Last purchase, so the workshop can celebrate it. */
  celebrate: { seq: number; what: string } | null
}

function startLevel(p: Profile) {
  const game = createGame(getLevel(p.level), { extraSwitches: p.upgrades.kit, extraTraySlots: p.upgrades.tray, rustRelief: p.upgrades.rust })
  resetPhysics(game)
  return game
}

let seq = 0
let boxTimer: ReturnType<typeof setTimeout> | undefined
const stopBoxTimer = () => {
  clearTimeout(boxTimer)
  boxTimer = undefined
}

export const useGame = create<Store>((set, get) => {
  const toast = (key: Key, params?: Record<string, string | number>) => set({ toast: { seq: ++seq, text: translate(get().profile.lang, key, params) } })
  const celebrate = (what: string) => set({ celebrate: { seq: ++seq, what } })

  const setProfile = (profile: Profile) => {
    saveProfile(profile)
    set({ profile })
  }

  const applySettings = (st: Settings) => {
    setFeelOptions(st)
    if (st.music) music.start()
    else music.stop()
  }

  /** Plays out full boxes one step at a time so each leaves with its own animation. */
  const scheduleBoxes = () => {
    if (boxTimer || !hasLeavingBox(get().game)) return
    boxTimer = setTimeout(() => {
      boxTimer = undefined
      feel.boxDone()
      const game = evaluate(advanceBoxes(get().game), getPoses())
      set({ game })
      afterChange(game)
    }, BOX_LEAVE_MS)
  }

  const afterChange = (game: GameState) => {
    scheduleBoxes()
    if (game.status === 'won') feel.win()
  }

  /** Commits a move, remembering the previous state for undo. */
  const commit = (prev: GameState, game: GameState) => {
    set({ game, history: [...get().history, prev].slice(-UNDO_DEPTH) })
  }

  const fresh = (profile: Profile) => ({ game: startLevel(profile), history: [], runId: get().runId + 1, feedback: null, offer: null })

  const applyBooster = (id: BoosterId): boolean => {
    const { game, history } = get()
    if (id === 'undo') {
      const prev = history[history.length - 1]
      if (!prev) return false
      stopBoxTimer()
      rebuildPhysics(prev)
      set({ game: { ...prev, status: 'playing' }, history: history.slice(0, -1) })
      scheduleBoxes()
      return true
    }
    if (id === 'oil') {
      if (!hasRust(game)) return false
      set({ game: removeRust(game) })
      return true
    }
    set({ game: evaluate(grantTraySlot(game), getPoses()) })
    return true
  }

  const profile = loadProfile()
  setFeelOptions(profile.settings)
  return {
    screen: 'home',
    profile,
    runId: 0,
    game: startLevel(profile),
    history: [],
    feedback: null,
    turn: null,
    sheet: null,
    focus: null,
    toast: null,
    offer: null,
    celebrate: null,

    play() {
      stopBoxTimer()
      feel.click()
      set({ screen: 'game', sheet: null, ...fresh(get().profile) })
    },

    goHome() {
      stopBoxTimer()
      set({ screen: 'home', offer: null, sheet: null })
    },

    openSheet(sheet) {
      feel.click()
      set({ sheet })
    },

    focusSpot(spot) {
      set({ focus: { seq: ++seq, spot } })
    },

    updateSettings(patch) {
      const settings = { ...get().profile.settings, ...patch }
      setProfile({ ...get().profile, settings })
      applySettings(settings)
    },

    resetProgress() {
      clearProfile()
      const fresh = { ...newProfile(), lang: get().profile.lang, settings: get().profile.settings }
      setProfile(fresh)
      set({ sheet: null, screen: 'home' })
    },

    tap(screwId) {
      const prev = get().game
      const { state, result } = tapScrew(prev, getPoses(), screwId)
      switch (result.kind) {
        case 'covered':
          feel.error()
          set({ feedback: { seq: ++seq, kind: 'covered', screwId, plateId: result.by } })
          return
        case 'wrong-bit':
          feel.error()
          set({ feedback: { seq: ++seq, kind: 'wrong-bit', screwId } })
          toast('toast.wrongBit')
          return
        case 'no-room':
          feel.error()
          set({ feedback: { seq: ++seq, kind: 'no-room', screwId } })
          return
        case 'rust':
          feel.rust()
          set({ game: state, feedback: { seq: ++seq, kind: 'rust', screwId }, turn: { seq: ++seq, screwId, kind: 'rust' } })
          return
        case 'removed': {
          feel.unscrew()
          syncPins(state)
          commit(prev, state)
          set({ turn: { seq: ++seq, screwId, kind: 'out' } })
          afterChange(state)
          return
        }
      }
    },

    selectBit(head) {
      const prev = get().game
      if (head === prev.bit || prev.status !== 'playing') return
      const { state, ok } = switchBit(prev, getPoses(), head)
      if (!ok) {
        feel.error()
        set({ feedback: { seq: ++seq, kind: 'no-switch' } })
        toast('toast.noSwitch')
        return
      }
      feel.bit()
      commit(prev, state)
    },

    restart() {
      stopBoxTimer()
      set(fresh(get().profile))
    },

    async finishLevel(double) {
      const { game, profile } = get()
      if (game.status !== 'won') return
      let reward = levelReward(game.switchesLeft, profile.upgrades.coin)
      if (double && (await showRewarded())) reward *= 2
      else if (shouldShowInterstitial(profile.level + 1)) await showInterstitial()
      const screws = Object.keys(game.screws).length
      const name = game.level.name
      const next = {
        ...addCoins(profile, reward),
        level: (profile.level + 1) % LEVEL_COUNT,
        cleared: profile.cleared + 1,
        screws: profile.screws + screws,
        collection: { ...profile.collection, [name]: (profile.collection[name] ?? 0) + 1 },
      }
      setProfile(next)
      if (masterLevel(next).level > masterLevel(profile).level) toast('toast.levelUp', { n: masterLevel(next).level })
      stopBoxTimer()
      set(fresh(next))
    },

    async reviveSwitches() {
      if (!(await showRewarded())) return
      feel.bit()
      set({ game: grantSwitches(get().game, 2) })
    },

    activateBooster(id) {
      const { profile, game } = get()
      if (game.status === 'won') return
      if (game.status !== 'playing' && !(id === 'slot' && game.status === 'lost-tray') && id !== 'undo') return
      if (id === 'undo' && get().history.length === 0) return toast('toast.noUndo')
      if (id === 'oil' && !hasRust(game)) return toast('toast.noRust')
      const paid = consumeBooster(profile, id)
      if (!paid) return set({ offer: id })
      if (applyBooster(id)) {
        feel.bit()
        setProfile(paid)
      }
    },

    async settleOffer(how) {
      const id = get().offer
      set({ offer: null })
      if (!id || how === 'cancel') return
      if (how === 'coins') {
        const paid = spend(get().profile, BOOSTERS[id].price)
        if (!paid) return toast('toast.noCoins')
        setProfile(addBooster(paid, id))
      } else {
        if (!(await showRewarded())) return
        setProfile(addBooster(get().profile, id))
      }
      get().activateBooster(id)
    },

    buyUpgrade(id) {
      const next = buyUpgrade(get().profile, id)
      if (!next) return toast('toast.noCoins')
      feel.boxDone()
      setProfile(next)
      celebrate(id)
    },

    buyBooster(id) {
      const paid = spend(get().profile, BOOSTERS[id].price)
      if (!paid) return toast('toast.noCoins')
      feel.bit()
      setProfile(addBooster(paid, id))
      celebrate(id)
    },

    buyDecor(id) {
      const next = buyDecor(get().profile, id)
      if (!next) return toast('toast.noCoins')
      feel.boxDone()
      setProfile(next)
      celebrate(id)
    },

    setLang(lang) {
      setProfile({ ...get().profile, lang })
    },
  }
})
