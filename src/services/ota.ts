import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

/**
 * Over-the-air updates for the native app. Each web build ships ota/latest.json and a zip of
 * itself (vite.config.ts); the site is deployed to Vercel on every push. On launch the app asks
 * the live site for latest.json and, if that build is newer than the one running, downloads it
 * and switches to it. Native changes (new plugins, permissions, icons) still need a store release.
 */
/** Where updates come from; VITE_OTA_HOST overrides it for testing against a local server. */
export const OTA_HOST = import.meta.env.VITE_OTA_HOST ?? 'https://unscrewed-sandy.vercel.app'
export const BUILD_ID = __BUILD_ID__
const BUILT_AT = __BUILT_AT__

const CHECK_TIMEOUT_MS = 4000
const DOWNLOAD_TIMEOUT_MS = 60000

interface Latest {
  version: string
  builtAt: number
  file: string
}

const withTimeout = <T>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])

/** Only the packaged app updates itself: not the website, not live-reload dev sessions. */
const enabled = () => Capacitor.isNativePlatform() && location.hostname === 'localhost'

/**
 * Confirms the running bundle works; without this the updater rolls back to the previous one.
 * Call as soon as the app has rendered.
 */
export function markAppReady() {
  if (enabled()) void CapacitorUpdater.notifyAppReady().catch(() => {})
}

/**
 * Checks for a newer build and, if there is one, downloads and applies it (the app reloads into
 * it). Resolves normally when there is nothing to do or anything fails, so the game always starts.
 */
export async function updateIfAvailable(onProgress: (fraction: number) => void): Promise<void> {
  if (!enabled()) return
  try {
    const res = await withTimeout(fetch(`${OTA_HOST}/ota/latest.json`, { cache: 'no-store' }), CHECK_TIMEOUT_MS)
    if (!res.ok) return
    const latest = (await res.json()) as Latest
    // Never step back to an older deploy (e.g. a dev build installed ahead of the last push).
    if (latest.version === BUILD_ID || latest.builtAt <= BUILT_AT) return

    onProgress(0)
    const listener = await CapacitorUpdater.addListener('download', ({ percent }) => onProgress(percent / 100))
    try {
      const bundle = await withTimeout(CapacitorUpdater.download({ url: `${OTA_HOST}/ota/${latest.file}`, version: latest.version }), DOWNLOAD_TIMEOUT_MS)
      await CapacitorUpdater.set({ id: bundle.id })
    } finally {
      void listener.remove()
    }
  } catch (e) {
    console.warn('ota: update skipped', e)
  }
}
