import { translate, type Key } from './i18n'
import { useGame } from './game/store'

/** Translator bound to the player's chosen language. */
export function useT() {
  const lang = useGame((s) => s.profile.lang)
  return (key: Key, params?: Record<string, string | number>) => translate(lang, key, params)
}
