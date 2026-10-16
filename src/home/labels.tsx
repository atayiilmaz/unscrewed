import { useFrame, useThree } from '@react-three/fiber'
import { Matrix4, Vector3 } from 'three'
import { useRef } from 'react'
import { DECOR, UPGRADE_IDS, upgradePrice, type DecorId, type UpgradeId } from '../game/profile'
import { useGame } from '../game/store'
import { UpgradeIcon } from '../ui/art'
import { DECOR_SPOTS, STATIONS } from './layout'

/**
 * Screen-space labels for things in the 3D workshop. The DOM lives outside the canvas; one
 * projector inside the canvas moves every label each frame, so there is no per-label renderer.
 */
const anchors = new Map<string, { pos: Vector3; el: HTMLElement | null }>()

function anchor(key: string, pos: [number, number, number]) {
  let a = anchors.get(key)
  if (!a) {
    a = { pos: new Vector3(...pos), el: null }
    anchors.set(key, a)
  }
  return (el: HTMLElement | null) => {
    a.el = el
  }
}

const tmp = new Vector3()
const lastView = new Matrix4()
const view = new Matrix4()

/** Lives inside the canvas: projects every anchor to the screen, only when the view changed. */
export function LabelProjector() {
  const { camera, size } = useThree()
  const lastSize = useRef('')
  useFrame(() => {
    const sizeKey = `${size.width}x${size.height}`
    view.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    const moved = !lastView.equals(view) || sizeKey !== lastSize.current
    // New labels (a decoration was bought) still need placing even when the camera is still.
    const pending = [...anchors.values()].some((a) => a.el && !a.el.style.transform)
    if (!moved && !pending) return
    lastView.copy(view)
    lastSize.current = sizeKey
    for (const a of anchors.values()) {
      if (!a.el) continue
      tmp.copy(a.pos).project(camera)
      const x = (tmp.x * 0.5 + 0.5) * size.width
      const y = (-tmp.y * 0.5 + 0.5) * size.height
      a.el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
    }
  })
  return null
}

const stationLabelPos = (id: UpgradeId): [number, number, number] => {
  const [x, , z] = STATIONS[id].pos
  return [x, id === 'kit' ? 3.3 : id === 'coin' ? 2.7 : 2.4, z]
}

function StationLabel({ id }: { id: UpgradeId }) {
  const level = useGame((s) => s.profile.upgrades[id])
  const profile = useGame((s) => s.profile)
  const focus = useGame((s) => s.focusSpot)
  const open = useGame((s) => s.openSheet)
  const price = upgradePrice(profile, id)
  const ready = price !== null && profile.coins >= price
  return (
    <button
      ref={anchor(`station:${id}`, stationLabelPos(id))}
      className={`station-badge ${ready ? 'ready' : ''}`}
      onClick={() => {
        focus(id)
        open('skills')
      }}
    >
      <UpgradeIcon id={id} size={22} />
      <b>{level}</b>
      {ready && <i className="up-arrow">▲</i>}
    </button>
  )
}

function DecorGhost({ id }: { id: DecorId }) {
  const open = useGame((s) => s.openSheet)
  const [x, y, z] = DECOR_SPOTS[id].pos
  return (
    <button ref={anchor(`decor:${id}`, [x, y + 0.5, z])} className="ghost-plus" onClick={() => open('decor')} aria-label={id}>
      +
    </button>
  )
}

/** Lives outside the canvas, above it. */
export function HomeLabels() {
  const owned = useGame((s) => s.profile.decor)
  return (
    <div className="labels">
      {UPGRADE_IDS.map((id) => (
        <StationLabel key={id} id={id} />
      ))}
      {/* Only the next two decorations are hinted, so the room stays readable and shows a goal. */}
      {DECOR.filter((d) => !owned.includes(d.id))
        .slice(0, 2)
        .map((d) => (
          <DecorGhost key={d.id} id={d.id} />
        ))}
    </div>
  )
}
