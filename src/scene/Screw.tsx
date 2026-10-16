import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useRef } from 'react'
import { Color, CylinderGeometry, ExtrudeGeometry, LatheGeometry, Shape, Vector2, Vector3, type Group } from 'three'
import { useGame } from '../game/store'
import type { Head } from '../game/types'
import { emit } from './Particles'
import { boxAnchors, boxSlotOffset, COLORS, plateZ, SCREW_Z_ABOVE_PLATE, traySlotPos, unscrewSeconds } from './layout'

/** Domed pan head, turned on a lathe and stood up to face the camera. */
const headGeo = new LatheGeometry(
  [
    [0.0001, 0],
    [0.315, 0],
    [0.315, 0.03],
    [0.29, 0.07],
    [0.22, 0.105],
    [0.12, 0.125],
    [0.0001, 0.13],
  ].map(([x, y]) => new Vector2(x, y)),
  32,
)
headGeo.rotateX(Math.PI / 2)
/** Threaded shank: a zig-zag profile, tapering to a point. */
const shaftGeo = new LatheGeometry(
  [
    new Vector2(0.0001, -0.68),
    ...Array.from({ length: 12 }, (_, i) => new Vector2(i % 2 === 0 ? 0.08 : Math.min(0.12, 0.05 + i * 0.012), -0.62 + i * 0.05)),
    new Vector2(0.09, 0),
    new Vector2(0.0001, 0),
  ],
  16,
)
shaftGeo.rotateX(Math.PI / 2)
const washerGeo = new CylinderGeometry(0.37, 0.37, 0.035, 32)
washerGeo.rotateX(Math.PI / 2)
washerGeo.translate(0, 0, -0.015)
const RUST = new Color('#8a4b1f')
const hexGeo = new CylinderGeometry(0.13, 0.13, 0.04, 6)
hexGeo.rotateX(Math.PI / 2)
const torxGeo = (() => {
  const s = new Shape()
  for (let i = 0; i < 12; i++) {
    const r = i % 2 === 0 ? 0.16 : 0.08
    const a = (i / 12) * Math.PI * 2
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  return new ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false })
})()
const RECESS = '#1b1f2a'

export function HeadMark({ head }: { head: Head }) {
  const z = 0.118
  switch (head) {
    case 'phillips':
      return (
        <group position={[0, 0, z]}>
          <mesh>
            <boxGeometry args={[0.36, 0.07, 0.03]} />
            <meshStandardMaterial color={RECESS} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.07, 0.36, 0.03]} />
            <meshStandardMaterial color={RECESS} />
          </mesh>
        </group>
      )
    case 'flat':
      return (
        <mesh position={[0, 0, z]}>
          <boxGeometry args={[0.44, 0.08, 0.03]} />
          <meshStandardMaterial color={RECESS} />
        </mesh>
      )
    case 'hex':
      return (
        <mesh position={[0, 0, z]} geometry={hexGeo}>
          <meshStandardMaterial color={RECESS} />
        </mesh>
      )
    case 'torx':
      return (
        <mesh position={[0, 0, z - 0.02]} geometry={torxGeo}>
          <meshStandardMaterial color={RECESS} />
        </mesh>
      )
  }
}

const tmp = new Vector3()

export function Screw({ id }: { id: string }) {
  const screw = useGame((s) => s.game.screws[id])
  const layer = useGame((s) => s.game.plates[s.game.screws[id].plateId].def.layer)
  const trayLen = useGame((s) => s.game.tray.length)
  const tap = useGame((s) => s.tap)
  const UNSCREW_S = unscrewSeconds(useGame((s) => s.profile.upgrades.speed))

  const group = useRef<Group>(null)
  const spin = useRef<Group>(null)
  const state = useRef({ removedAt: -1, status: screw.status, shake: 0, lastSeq: 0, rustKick: 0 })

  const boardPos = new Vector3(screw.def.x, screw.def.y, plateZ(layer) + SCREW_Z_ABOVE_PLATE)

  useFrame(({ clock }, dt) => {
    const g = group.current
    const sp = spin.current
    if (!g || !sp) return
    const st = state.current
    const now = clock.elapsedTime

    const fb = useGame.getState().feedback
    if (fb && fb.seq !== st.lastSeq) {
      st.lastSeq = fb.seq
      if ('screwId' in fb && fb.screwId === id) {
        if (fb.kind === 'rust') st.rustKick = 1
        else st.shake = 1
      }
    }
    st.shake = Math.max(0, st.shake - dt * 3)
    st.rustKick = Math.max(0, st.rustKick - dt * 4)

    if (screw.status === 'board') {
      st.removedAt = -1
      g.position.copy(boardPos)
      g.position.x += Math.sin(now * 60) * 0.06 * st.shake
      sp.rotation.z = -st.rustKick * 0.6
      g.scale.setScalar(1)
      g.visible = true
      return
    }

    if (st.removedAt < 0) {
      st.removedAt = now
      g.position.copy(boardPos)
      emit('sparks', boardPos.x, boardPos.y, boardPos.z + 0.2, ['#ffe08a', '#ffffff', COLORS[screw.def.color]])
    }
    const t = now - st.removedAt
    if (t < UNSCREW_S) {
      // Turn out of the hole before flying away.
      const k = t / UNSCREW_S
      sp.rotation.z = k * Math.PI * 4
      g.position.set(boardPos.x, boardPos.y, boardPos.z + k * 0.9)
      return
    }

    if (screw.status === 'tray') {
      tmp.copy(traySlotPos(screw.slot!, trayLen))
    } else {
      const anchor = boxAnchors.get(screw.boxUid!)
      if (!anchor) {
        g.visible = false
        return
      }
      tmp.copy(anchor).add(boxSlotOffset(screw.slot!))
    }
    g.visible = true
    g.position.lerp(tmp, 1 - Math.exp(-dt * 14))
    g.scale.setScalar(0.85)
    sp.rotation.z *= Math.exp(-dt * 10)
  })

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (screw.status === 'board') tap(id)
  }

  const rusty = screw.rustLeft > 0
  const color = rusty ? new Color(COLORS[screw.def.color]).lerp(RUST, 0.25 + 0.15 * screw.rustLeft) : COLORS[screw.def.color]
  return (
    <group ref={group} onPointerDown={onDown}>
      <group ref={spin}>
        <mesh geometry={headGeo} position={[0, 0, 0.02]} castShadow>
          <meshStandardMaterial color={color} roughness={rusty ? 0.9 : 0.28} metalness={rusty ? 0.15 : 0.35} />
        </mesh>
        <group position={[0, 0, 0.02]}>
          <HeadMark head={screw.def.head} />
        </group>
        <mesh geometry={washerGeo}>
          <meshStandardMaterial color="#c9ced8" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh geometry={shaftGeo}>
          <meshStandardMaterial color="#aab2c0" metalness={0.9} roughness={0.3} />
        </mesh>
        {rusty && (
          <mesh position={[0, 0, 0.06]}>
            <torusGeometry args={[0.3, 0.025 + 0.012 * screw.rustLeft, 8, 28]} />
            <meshStandardMaterial color="#7a3f17" roughness={1} />
          </mesh>
        )}
      </group>
      {/* Larger invisible hit area for fingers. */}
      <mesh visible={false}>
        <circleGeometry args={[0.45, 12]} />
      </mesh>
    </group>
  )
}
