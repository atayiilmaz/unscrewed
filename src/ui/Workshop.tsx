import { useEffect, useRef, useState, type ReactNode } from 'react'
import { getLevel, LEVELS } from '../game/levels'
import { BOOSTERS, DECOR, masterLevel, rankOf, UPGRADE_IDS, UPGRADES, upgradePrice, type BoosterId, type DecorId, type UpgradeId } from '../game/profile'
import { useGame, type HomeSheet } from '../game/store'
import { HomeScene } from '../home/HomeScene'
import { HomeLabels } from '../home/labels'
import type { Key } from '../i18n'
import { useT } from '../useT'
import { BoosterIcon, DecorArt, Icon, MechanicHead, objectIcon, RANK_COLORS, UpgradeIcon, type IconName } from './art'
import { Coins } from './Hud'
import { SettingsSheet } from './Settings'

function Price({ value, short }: { value: number; short?: boolean }) {
  return (
    <span className={`price-tag ${short ? 'short' : ''}`}>
      <span className="coin-icon">●</span>
      {value}
    </span>
  )
}

function TopBar() {
  const t = useT()
  const profile = useGame((s) => s.profile)
  const open = useGame((s) => s.openSheet)
  const rank = rankOf(profile)
  const ml = masterLevel(profile)
  return (
    <header className="home-top">
      <div className="player">
        <div className="avatar" style={{ borderColor: RANK_COLORS[rank.idx] }}>
          <MechanicHead rank={rank.idx} size={40} />
          <span className="avatar-lv">{ml.level}</span>
        </div>
        <div className="who">
          <span style={{ color: RANK_COLORS[rank.idx] }}>{t(`rank.${rank.idx}` as Key)}</span>
          <div className="xp">
            <i style={{ width: `${Math.round(ml.progress * 100)}%` }} />
          </div>
        </div>
      </div>
      <Coins big />
      <button className="round-btn" onClick={() => open('settings')} aria-label={t('settings.title')}>
        <Icon name="settings" size={34} />
      </button>
    </header>
  )
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <header className="sheet-head">
          <h2>{title}</h2>
          <button className="round-btn small" onClick={onClose} aria-label="×">
            ✕
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  )
}

function SkillRow({ id, highlight }: { id: UpgradeId; highlight: boolean }) {
  const t = useT()
  const profile = useGame((s) => s.profile)
  const buy = useGame((s) => s.buyUpgrade)
  const fresh = useGame((s) => s.celebrate?.what === id && s.celebrate.seq)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlight])
  const u = UPGRADES[id]
  const lvl = profile.upgrades[id]
  const price = upgradePrice(profile, id)
  return (
    <div ref={ref} className={`row ${highlight ? 'highlight' : ''} ${fresh ? 'levelup' : ''}`} key={fresh || 0}>
      <div className="row-icon">
        <UpgradeIcon id={id} size={40} />
      </div>
      <div className="row-body">
        <b>{t(`up.${id}` as Key)}</b>
        <span className="row-fx">
          {lvl > 0 ? t(`up.${id}.fx` as Key, { n: u.fx(lvl) }) : '—'}
          {price !== null && <em> → {t(`up.${id}.fx` as Key, { n: u.fx(lvl + 1) })}</em>}
        </span>
        <div className="row-pips">
          {u.prices.map((_, i) => (
            <i key={i} className={i < lvl ? 'on' : ''} />
          ))}
        </div>
      </div>
      {price === null ? (
        <span className="maxed">{t('home.max')}</span>
      ) : (
        <button className="buy" onClick={() => buy(id)}>
          <Price value={price} short={profile.coins < price} />
        </button>
      )}
      {fresh && <span className="float-up">+1</span>}
    </div>
  )
}

function SkillsSheet() {
  const focus = useGame((s) => s.focus)
  return (
    <div className="rows">
      {UPGRADE_IDS.map((id) => (
        <SkillRow key={id} id={id} highlight={focus?.spot === id} />
      ))}
    </div>
  )
}

function DecorSheet() {
  const t = useT()
  const profile = useGame((s) => s.profile)
  const buy = useGame((s) => s.buyDecor)
  return (
    <div className="grid3">
      {DECOR.map(({ id, price }) => {
        const owned = profile.decor.includes(id as DecorId)
        return (
          <button key={id} className={`decor ${owned ? 'owned' : ''}`} onClick={() => !owned && buy(id)} disabled={owned}>
            <DecorArt id={id} size={52} />
            <span className="decor-name">{t(`decor.${id}` as Key)}</span>
            {owned ? <span className="owned-tag">✓ {t('home.owned')}</span> : <Price value={price} short={profile.coins < price} />}
          </button>
        )
      })}
    </div>
  )
}

function MarketSheet() {
  const t = useT()
  const profile = useGame((s) => s.profile)
  const buy = useGame((s) => s.buyBooster)
  return (
    <>
      <div className="rows">
        {(['undo', 'oil', 'slot'] as BoosterId[]).map((id) => (
          <div className="row" key={id}>
            <div className="row-icon">
              <BoosterIcon id={id} size={36} />
            </div>
            <div className="row-body">
              <b>
                {t(`booster.${id}` as Key)} <span className="count">×{profile.boosters[id]}</span>
              </b>
              <span className="row-fx">{t(`booster.${id}.hint` as Key)}</span>
            </div>
            <button className="buy" onClick={() => buy(id)}>
              <Price value={BOOSTERS[id].price} short={profile.coins < BOOSTERS[id].price} />
            </button>
          </div>
        ))}
      </div>
      <div className="iap-card">
        <div>
          <b>{t('home.removeAds')}</b>
          <small>{t('home.removeAdsHint')}</small>
        </div>
        <span className="maxed">{t('home.soon')}</span>
      </div>
    </>
  )
}

/** Every object type the player can take apart; seen ones show their count. */
function CollectionSheet() {
  const t = useT()
  const collection = useGame((s) => s.profile.collection)
  const names = [...new Set(LEVELS.map((l) => l.name))]
  const found = names.filter((n) => collection[n]).length
  return (
    <>
      <p className="sheet-sub">{t('home.collectionCount', { n: found, total: names.length })}</p>
      <div className="grid3">
        {names.map((name) => {
          const count = collection[name] ?? 0
          const sample = LEVELS.find((l) => l.name === name)!
          return (
            <div key={name} className={`collect ${count ? 'seen' : ''}`}>
              <Icon name={objectIcon(sample.name)} size={72} />
              <span className="decor-name">{count ? t(`obj.${name}` as Key) : '???'}</span>
              {count > 0 && <span className="owned-tag">×{count}</span>}
            </div>
          )
        })}
      </div>
    </>
  )
}

const NAV: Array<{ id: Exclude<HomeSheet, null | 'settings'>; icon: IconName }> = [
  { id: 'skills', icon: 'nav-skills' },
  { id: 'decor', icon: 'nav-decor' },
  { id: 'market', icon: 'nav-shop' },
  { id: 'collection', icon: 'nav-collection' },
]

function BottomNav() {
  const t = useT()
  const profile = useGame((s) => s.profile)
  const open = useGame((s) => s.openSheet)
  const play = useGame((s) => s.play)
  const sheet = useGame((s) => s.sheet)
  const next = getLevel(profile.level)
  const canUpgrade = UPGRADE_IDS.some((id) => {
    const p = upgradePrice(profile, id)
    return p !== null && profile.coins >= p
  })
  const item = (n: (typeof NAV)[number]) => (
    <button key={n.id} className={`nav-item ${sheet === n.id ? 'on' : ''}`} onClick={() => open(sheet === n.id ? null : n.id)}>
      <Icon name={n.icon} size={34} />
      <span>{t(`home.tab.${n.id}` as Key)}</span>
      {n.id === 'skills' && canUpgrade && <i className="dot" />}
    </button>
  )
  return (
    <nav className="bottom-nav">
      {item(NAV[0])}
      {item(NAV[1])}
      <button className="play-orb" onClick={play}>
        <Icon name="play" size={34} className="play-icon" />
        <span className="play-label">{t('hud.level', { n: profile.level + 1 })}</span>
        <small>{t(`obj.${next.name}` as Key)}</small>
      </button>
      {item(NAV[2])}
      {item(NAV[3])}
    </nav>
  )
}

export function Workshop() {
  const t = useT()
  const sheet = useGame((s) => s.sheet)
  const open = useGame((s) => s.openSheet)
  const [hint, setHint] = useState(true)
  // Build the 3D scene only after the loader has painted, so the shader compile happens behind it.
  const [show3d, setShow3d] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShow3d(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  useEffect(() => {
    const id = setTimeout(() => setHint(false), 4000)
    return () => clearTimeout(id)
  }, [])
  const close = () => open(null)
  return (
    <div className="home">
      {show3d && <HomeScene />}
      {show3d && <HomeLabels />}
      <TopBar />
      {hint && <div className="home-hint">{t('home.hint')}</div>}
      <BottomNav />
      {sheet === 'skills' && (
        <Sheet title={t('home.tab.skills')} onClose={close}>
          <SkillsSheet />
        </Sheet>
      )}
      {sheet === 'decor' && (
        <Sheet title={t('home.tab.decor')} onClose={close}>
          <DecorSheet />
        </Sheet>
      )}
      {sheet === 'market' && (
        <Sheet title={t('home.tab.market')} onClose={close}>
          <MarketSheet />
        </Sheet>
      )}
      {sheet === 'collection' && (
        <Sheet title={t('home.tab.collection')} onClose={close}>
          <CollectionSheet />
        </Sheet>
      )}
      {sheet === 'settings' && (
        <Sheet title={t('settings.title')} onClose={close}>
          <SettingsSheet />
        </Sheet>
      )}
    </div>
  )
}
