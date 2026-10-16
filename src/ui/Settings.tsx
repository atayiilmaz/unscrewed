import { useState } from 'react'
import { useGame } from '../game/store'
import type { Key } from '../i18n'
import { useT } from '../useT'
import { Icon, type IconName } from './art'

export const APP_VERSION = '0.4.0'
export const SUPPORT_EMAIL = 'support@unscrewed.app'

function Label({ icon, text }: { icon?: IconName; text: string }) {
  return (
    <span className="setting-label">
      {icon && <Icon name={icon} size={28} />}
      {text}
    </span>
  )
}

function Toggle({ label, icon, on, onChange }: { label: string; icon?: IconName; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="setting" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <Label icon={icon} text={label} />
      <span className={`switch ${on ? 'on' : ''}`}>
        <i />
      </span>
    </button>
  )
}

function Segmented<T extends string>({ label, icon, value, options, onChange }: { label: string; icon?: IconName; value: T; options: Array<[T, string]>; onChange: (v: T) => void }) {
  return (
    <div className="setting">
      <Label icon={icon} text={label} />
      <div className="segmented">
        {options.map(([v, text]) => (
          <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Player settings. Shared by the workshop and the in-game pause menu; native-only rows (restore
 * purchases, notifications) are wired to placeholders until the store build.
 */
export function SettingsSheet({ inGame = false }: { inGame?: boolean }) {
  const t = useT()
  const profile = useGame((s) => s.profile)
  const update = useGame((s) => s.updateSettings)
  const setLang = useGame((s) => s.setLang)
  const reset = useGame((s) => s.resetProgress)
  const goHome = useGame((s) => s.goHome)
  const restart = useGame((s) => s.restart)
  const open = useGame((s) => s.openSheet)
  const [confirm, setConfirm] = useState(false)
  const [note, setNote] = useState<Key | null>(null)
  const st = profile.settings

  return (
    <div className="settings">
      {inGame && (
        <div className="settings-actions">
          <button
            className="primary"
            onClick={() => {
              open(null)
              restart()
            }}
          >
            <Icon name="restart" size={22} /> {t('hud.restart')}
          </button>
          <button className="secondary-solid" onClick={goHome}>
            <Icon name="home" size={22} /> {t('hud.home')}
          </button>
        </div>
      )}

      <h3>{t('settings.audio')}</h3>
      <div className="setting-group">
        <Toggle label={t('settings.sfx')} icon={st.sfx ? 'sound-on' : 'sound-off'} on={st.sfx} onChange={(v) => update({ sfx: v })} />
        <Toggle label={t('settings.music')} icon="music" on={st.music} onChange={(v) => update({ music: v })} />
        <Toggle label={t('settings.haptics')} icon="vibration" on={st.haptics} onChange={(v) => update({ haptics: v })} />
      </div>

      <h3>{t('settings.general')}</h3>
      <div className="setting-group">
        <Segmented
          label={t('settings.language')}
          icon="language"
          value={profile.lang}
          options={[
            ['tr', 'Türkçe'],
            ['en', 'English'],
          ]}
          onChange={setLang}
        />
        <Segmented
          label={t('settings.graphics')}
          icon="star"
          value={st.quality}
          options={[
            ['low', t('settings.low')],
            ['high', t('settings.high')],
          ]}
          onChange={(v) => update({ quality: v })}
        />
        <Toggle label={t('settings.notifications')} icon="hourglass" on={false} onChange={() => setNote('settings.nativeOnly')} />
      </div>

      <h3>{t('settings.account')}</h3>
      <div className="setting-group">
        <button className="setting link" onClick={() => setNote('settings.nativeOnly')}>
          <Label icon="gift" text={t('settings.restore')} />
          <span>›</span>
        </button>
        <a className="setting link" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${t('app.name')} v${APP_VERSION}`)}`}>
          <Label icon="support" text={t('settings.support')} />
          <span>›</span>
        </a>
        <a className="setting link" href="https://unscrewed.app/privacy" target="_blank" rel="noreferrer">
          <span>{t('settings.privacy')}</span>
          <span>›</span>
        </a>
        <a className="setting link" href="https://unscrewed.app/terms" target="_blank" rel="noreferrer">
          <span>{t('settings.terms')}</span>
          <span>›</span>
        </a>
      </div>

      {note && <p className="settings-note">{t(note)}</p>}

      {!inGame && (
        <div className="setting-group danger">
          {confirm ? (
            <div className="confirm">
              <span>{t('settings.resetConfirm')}</span>
              <div>
                <button className="secondary-solid" onClick={() => setConfirm(false)}>
                  {t('offer.cancel')}
                </button>
                <button className="danger-btn" onClick={reset}>
                  {t('settings.reset')}
                </button>
              </div>
            </div>
          ) : (
            <button className="setting link" onClick={() => setConfirm(true)}>
              <span>{t('settings.reset')}</span>
              <span>›</span>
            </button>
          )}
        </div>
      )}

      <p className="version">
        {t('app.name')} · v{APP_VERSION}
      </p>
    </div>
  )
}
