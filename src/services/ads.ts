/**
 * Ad facade. On the web build these are demo stand-ins that drive the in-game ad overlay; the
 * native build will route the same calls to AdMob (@capacitor-community/admob) without touching
 * game code.
 */
type Listener = (ad: { kind: 'rewarded' | 'interstitial'; done: (completed: boolean) => void } | null) => void

let listener: Listener = () => {}

export const onAdRequest = (l: Listener) => {
  listener = l
}

function show(kind: 'rewarded' | 'interstitial'): Promise<boolean> {
  return new Promise((resolve) => {
    listener({
      kind,
      done: (completed) => {
        listener(null)
        resolve(completed)
      },
    })
  })
}

/** Resolves true only when the player watched to the end and earned the reward. */
export const showRewarded = () => show('rewarded')
export const showInterstitial = () => show('interstitial').then(() => undefined)

/** Interstitial cadence; tunable over OTA with the rest of the remote config. */
export const INTERSTITIAL = { firstAfterLevel: 3, every: 2 }

export const shouldShowInterstitial = (clearedLevelNumber: number) =>
  clearedLevelNumber >= INTERSTITIAL.firstAfterLevel && (clearedLevelNumber - INTERSTITIAL.firstAfterLevel) % INTERSTITIAL.every === 0
