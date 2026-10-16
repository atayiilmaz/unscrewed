import { useEffect, useState } from 'react'
import { BOOSTERS, levelReward, type BoosterId } from '../game/profile'
import type { Key } from '../i18n'
import { useT } from '../useT'
import { BitIcon, BoosterIcon, Icon } from './art'
import { SettingsSheet } from './Settings'
import { Sheet } from './Workshop'
import { levelHeads } from '../game/rules'
import { useGame } from '../game/store'
import { onAdRequest } from '../services/ads'

export function Coins({ big = false }: { big?: boolean }) {
  const coins = useGame((s) => s.profile.coins)
  return (
    <div className={`coins ${big ? 'big' : ''}`}>
      <span className="coin-icon" aria-hidden>
        ●
      </span>
      {coins}
    </div>
  )
}

function TopBar() {
  const t = useT()
  const level = useGame((s) => s.profile.level)
  const name = useGame((s) => s.game.level.name)
  const open = useGame((s) => s.openSheet)
  return (
    <div className="topbar">
      <button className="icon-btn" onClick={() => open('settings')} aria-label={t('settings.title')}>
        <Icon name="pause" size={28} />
      </button>
      <div className="level-chip">
        <span className="level-num">{t('hud.level', { n: level + 1 })}</span>
        <span className="level-name">{t(`obj.${name}` as Key)}</span>
      </div>
      <div className="topbar-right">
        <Coins />
      </div>
    </div>
  )
}

function BoosterButton({ id }: { id: BoosterId }) {
  const t = useT()
  const count = useGame((s) => s.profile.boosters[id])
  const use = useGame((s) => s.activateBooster)
  return (
    <button className="booster" onClick={() => use(id)} aria-label={t(`booster.${id}` as Key)}>
      <BoosterIcon id={id} size={22} />
      <span className="booster-name">{t(`booster.${id}` as Key)}</span>
      <span className={`booster-badge ${count === 0 ? 'buy' : ''}`}>{count > 0 ? count : '+'}</span>
    </button>
  )
}

function BottomBar() {
  const t = useT()
  const level = useGame((s) => s.game.level)
  const bit = useGame((s) => s.game.bit)
  const left = useGame((s) => s.game.switchesLeft)
  const selectBit = useGame((s) => s.selectBit)
  const revive = useGame((s) => s.reviveSwitches)
  const fbSeq = useGame((s) => (s.feedback?.kind === 'wrong-bit' || s.feedback?.kind === 'no-switch' ? s.feedback.seq : 0))
  const heads = levelHeads(level)

  return (
    <div className="bottom">
      <div className="boosters">
        <BoosterButton id="undo" />
        <BoosterButton id="oil" />
        <BoosterButton id="slot" />
      </div>
      {heads.length > 1 && (
        <>
          <div className="belt" key={fbSeq} data-pulse={fbSeq > 0}>
            {heads.map((h) => (
              <button key={h} className={`bit ${h === bit ? 'active' : ''}`} onClick={() => selectBit(h)}>
                <BitIcon head={h} size={34} />
                <span>{t(`bit.${h}` as Key)}</span>
              </button>
            ))}
          </div>
          <div className="switches">
            {t('hud.switches')} <b>{left}</b>
            {left === 0 && (
              <button className="ad-btn small" onClick={revive}>
                ▶ +2
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function Toast() {
  const toast = useGame((s) => s.toast)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1400)
    return () => clearTimeout(t)
  }, [toast])
  return toast && visible ? (
    <div className="toast" key={toast.seq}>
      {toast.text}
    </div>
  ) : null
}

function EndPanel() {
  const t = useT()
  const coinLevel = useGame((s) => s.profile.upgrades.coin)
  const status = useGame((s) => s.game.status)
  const name = useGame((s) => s.game.level.name)
  const switchesLeft = useGame((s) => s.game.switchesLeft)
  const canUndo = useGame((s) => s.history.length > 0)
  const restart = useGame((s) => s.restart)
  const finish = useGame((s) => s.finishLevel)
  const activateBooster = useGame((s) => s.activateBooster)
  const reviveSwitches = useGame((s) => s.reviveSwitches)
  const [busy, setBusy] = useState(false)
  useEffect(() => setBusy(false), [status])
  if (status === 'playing') return null

  const reward = levelReward(switchesLeft, coinLevel)
  const done = (double: boolean) => {
    setBusy(true)
    void finish(double)
  }

  return (
    <div className={`overlay ${status === 'won' ? 'delayed' : ''}`}>
      <div className="panel">
        {status === 'won' && (
          <>
            <div className="panel-emoji">
              <Icon name="trophy" size={88} />
            </div>
            <h2>{t('end.won')}</h2>
            <p>{t('end.wonText', { name: t(`obj.${name}` as Key) })}</p>
            <div className="reward">
              <span>
                +{reward} <span className="coin-icon">●</span>
              </span>
              {switchesLeft > 0 && <small>{t('end.bonus', { n: switchesLeft })}</small>}
            </div>
            <button className="ad-btn" disabled={busy} onClick={() => done(true)}>
              ▶ {t('end.double', { n: reward * 2 })}
            </button>
            <button className="primary" disabled={busy} onClick={() => done(false)}>
              {t('end.continue')}
            </button>
          </>
        )}
        {status === 'lost-tray' && (
          <>
            <div className="panel-emoji">
              <Icon name="screw-box" size={88} />
            </div>
            <h2>{t('end.trayFull')}</h2>
            <p>{t('end.trayText')}</p>
            <button className="ad-btn" onClick={() => activateBooster('slot')}>
              {t('end.addSlot')}
            </button>
            {canUndo && (
              <button className="secondary-solid" onClick={() => activateBooster('undo')}>
                ↶ {t('end.undo')}
              </button>
            )}
            <button className="secondary" onClick={restart}>
              {t('end.restart')}
            </button>
          </>
        )}
        {status === 'stuck' && (
          <>
            <div className="panel-emoji">
              <Icon name="lock" size={80} />
            </div>
            <h2>{t('end.stuck')}</h2>
            <p>{t('end.stuckText')}</p>
            <button className="ad-btn" onClick={reviveSwitches}>
              ▶ {t('end.moreSwitches')}
            </button>
            {canUndo && (
              <button className="secondary-solid" onClick={() => activateBooster('undo')}>
                ↶ {t('end.undo')}
              </button>
            )}
            <button className="secondary" onClick={restart}>
              {t('end.restart')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/** Shown when a booster runs out: pay coins or watch an ad for one more. */
export function OfferSheet() {
  const t = useT()
  const offer = useGame((s) => s.offer)
  const coins = useGame((s) => s.profile.coins)
  const settle = useGame((s) => s.settleOffer)
  if (!offer) return null
  const b = BOOSTERS[offer]
  return (
    <div className="overlay" onClick={() => void settle('cancel')}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-emoji">
          <BoosterIcon id={offer} size={56} />
        </div>
        <h2>{t(`booster.${offer}` as Key)}</h2>
        <p>{t(`booster.${offer}.hint` as Key)}</p>
        <button className="primary" disabled={coins < b.price} onClick={() => void settle('coins')}>
          {t('offer.buy', { n: b.price })} <span className="coin-icon">●</span>
        </button>
        <button className="ad-btn" onClick={() => void settle('ad')}>
          ▶ {t('offer.ad')}
        </button>
        <button className="secondary" onClick={() => void settle('cancel')}>
          {t('offer.cancel')}
        </button>
      </div>
    </div>
  )
}

/** Stand-in for the native ad SDK so the monetization flow can be played on the web build. */
export function DemoAd() {
  const t = useT()
  const [ad, setAd] = useState<Parameters<Parameters<typeof onAdRequest>[0]>[0]>(null)
  const [left, setLeft] = useState(0)
  useEffect(() => onAdRequest(setAd), [])
  useEffect(() => {
    if (!ad) return
    setLeft(ad.kind === 'rewarded' ? 3 : 2)
    const i = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(i)
  }, [ad])
  if (!ad) return null
  return (
    <div className="overlay ad">
      <div className="ad-box">
        <div className="ad-label">{ad.kind === 'rewarded' ? t('ad.rewarded') : t('ad.interstitial')}</div>
        <div className="ad-count">{left > 0 ? left : '✓'}</div>
        <button disabled={left > 0} onClick={() => ad.done(true)}>
          {left > 0 ? t('ad.wait') : ad.kind === 'rewarded' ? t('ad.claim') : t('ad.close')}
        </button>
        {ad.kind === 'rewarded' && (
          <button className="link" onClick={() => ad.done(false)}>
            {t('offer.cancel')}
          </button>
        )}
      </div>
    </div>
  )
}

function PauseSheet() {
  const t = useT()
  const sheet = useGame((s) => s.sheet)
  const open = useGame((s) => s.openSheet)
  if (sheet !== 'settings') return null
  return (
    <Sheet title={t('settings.title')} onClose={() => open(null)}>
      <SettingsSheet inGame />
    </Sheet>
  )
}

export function Hud() {
  return (
    <>
      <TopBar />
      <BottomBar />
      <EndPanel />
      <PauseSheet />
    </>
  )
}
