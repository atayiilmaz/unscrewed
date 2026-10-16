import type { BoosterId, DecorId, UpgradeId } from '../game/profile'
import type { Head } from '../game/types'

/**
 * Game art. Icons are WebP files cut from the art sheets by `npm run import:assets`
 * (see scripts/import-assets.mjs); these components only pick the right file.
 */

export type IconName =
  | 'coin' | 'coins' | 'gem' | 'gift' | 'undo' | 'oil' | 'slot' | 'hourglass' | 'lock' | 'check' | 'star' | 'trophy'
  | 'play' | 'pause' | 'restart' | 'home'
  | `skill-${UpgradeId}` | 'nav-skills' | 'nav-decor' | 'nav-shop' | 'nav-collection'
  | 'settings' | 'sound-on' | 'sound-off' | 'music' | 'vibration' | 'language' | 'support'
  | `bit-${Head}` | `rank-${0 | 1 | 2 | 3 | 4}` | 'rusty-screw' | 'new-screw' | 'screw-box' | 'toolbox' | 'broken-plate' | 'sparks' | 'confetti'
  | `decor-${DecorId}` | `obj-${string}` | 'avatar'

export const iconUrl = (name: IconName) => `${import.meta.env.BASE_URL}ui/${name}.webp`

export function Icon({ name, size = 32, className }: { name: IconName; size?: number; className?: string }) {
  return <img className={className} src={iconUrl(name)} width={size} height={size} alt="" draggable={false} decoding="async" />
}

/** Rank colours (cap colour on the rank badges), used for borders and the 3D mechanic's cap. */
export const RANK_COLORS = ['#3d8bff', '#3fcf6b', '#ff8a2b', '#a46bff', '#ffc928']

const UPGRADE_ICON: Record<UpgradeId, IconName> = { kit: 'skill-kit', tray: 'skill-tray', rust: 'skill-rust', coin: 'skill-coin', speed: 'skill-speed' }

export const BoosterIcon = ({ id, size = 26 }: { id: BoosterId; size?: number }) => <Icon name={id} size={size} />
export const UpgradeIcon = ({ id, size = 40 }: { id: UpgradeId; size?: number }) => <Icon name={UPGRADE_ICON[id]} size={size} />
export const DecorArt = ({ id, size = 56 }: { id: DecorId; size?: number }) => <Icon name={`decor-${id}`} size={size} />
export const BitIcon = ({ head, size = 30 }: { head: Head; size?: number }) => <Icon name={`bit-${head}`} size={size} />

/** Collection picture of an object type; level names double as object keys. */
const OBJECTS = new Set(['car', 'clock', 'robot', 'guitar', 'gamepad', 'radio', 'camera', 'plane', 'house', 'flower', 'bike', 'rocket'])
export const objectIcon = (name: string): IconName => (OBJECTS.has(name) ? `obj-${name}` : name === 'tut3' ? 'broken-plate' : 'new-screw')

/** The mechanic's face with his rank cap pinned to the corner. */
export function MechanicHead({ rank, size = 44 }: { rank: number; size?: number }) {
  return (
    <span className="mech-head" style={{ width: size, height: size }}>
      <img src={iconUrl('avatar')} width={size} height={size} alt="" draggable={false} />
      <img className="mech-rank" src={iconUrl(`rank-${rank as 0 | 1 | 2 | 3 | 4}`)} width={size * 0.55} height={size * 0.55} alt="" draggable={false} />
    </span>
  )
}
