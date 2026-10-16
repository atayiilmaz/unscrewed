import { RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Matrix4, Vector3, type Group, type InstancedMesh, type PerspectiveCamera } from 'three'
import { BOX_LEAVE_MS, useGame } from '../game/store'
import type { BoxState } from '../game/types'
import { boxAnchors, COLORS, LAYOUT, traySlotPos } from './layout'
import { emit } from './Particles'
import { pegboardTexture, woodTexture } from './textures'

/** Keeps the whole portrait field in view for any screen aspect. */
export function FitCamera() {
  const { camera, size } = useThree()
  useFrame(() => {
    const cam = camera as PerspectiveCamera
    const half = Math.tan((cam.fov * Math.PI) / 360)
    const aspect = size.width / size.height
    const dist = Math.max(LAYOUT.view.h / 2 / half, LAYOUT.view.w / 2 / (half * aspect))
    cam.position.set(0, -1.9, dist)
    cam.lookAt(0, -0.8, 0)
  })
  return null
}

export function Backdrop() {
  const tex = useMemo(() => pegboardTexture(9, 15), [])
  return (
    <mesh position={[0, 0, -1.4]} receiveShadow>
      <planeGeometry args={[36, 60]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  )
}

function Holes({ points }: { points: Array<[number, number]> }) {
  const hole = useRef<InstancedMesh>(null)
  const rim = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new Matrix4()
    points.forEach(([x, y], i) => {
      m.makeTranslation(x, y, 0.015)
      hole.current?.setMatrixAt(i, m)
      m.makeTranslation(x, y, 0.017)
      rim.current?.setMatrixAt(i, m)
    })
    if (hole.current) hole.current.instanceMatrix.needsUpdate = true
    if (rim.current) rim.current.instanceMatrix.needsUpdate = true
  }, [points])
  return (
    <>
      <instancedMesh ref={hole} args={[undefined, undefined, points.length]}>
        <circleGeometry args={[0.2, 16]} />
        <meshStandardMaterial color="#3b2412" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={rim} args={[undefined, undefined, points.length]}>
        <ringGeometry args={[0.2, 0.26, 16]} />
        <meshStandardMaterial color="#8f5f33" roughness={1} />
      </instancedMesh>
    </>
  )
}

export function Board() {
  const { w, h } = LAYOUT.board
  const level = useGame((s) => s.game.level)
  const wood = useMemo(() => woodTexture(1, 1.1), [])
  return (
    <group>
      <RoundedBox smoothness={2} bevelSegments={2} args={[w, h, 0.5]} radius={0.22} position={[0, 0, -0.3]} castShadow receiveShadow>
        <meshStandardMaterial color="#a8703f" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0, -0.04]} receiveShadow>
        <boxGeometry args={[w - 0.4, h - 0.4, 0.1]} />
        <meshStandardMaterial map={wood} roughness={0.7} />
      </mesh>
      {/* Threaded holes stay behind once a screw is out: two instanced draws for all of them. */}
      <Holes key={level.id} points={level.plates.flatMap((p) => p.screws.map((s) => [s.x, s.y] as [number, number]))} />
    </group>
  )
}

const RIM = '#ffc928'
const boxTarget = new Vector3()

function Box({ box, index }: { box: BoxState; index: number }) {
  const group = useRef<Group>(null)
  const lid = useRef<Group>(null)
  const born = useRef(-1)
  const leftAt = useRef(-1)
  const anchor = useRef(new Vector3())
  useEffect(() => () => void boxAnchors.delete(box.uid), [box.uid])

  useFrame(({ clock }, dt) => {
    const g = group.current
    if (!g) return
    const now = clock.elapsedTime
    if (born.current < 0) {
      born.current = now
      g.position.set(index === 0 ? -9 : 9, LAYOUT.boxY, 0)
    }
    const target = boxTarget.set(index === 0 ? -LAYOUT.boxX : LAYOUT.boxX, LAYOUT.boxY, 0)
    if (box.leaving) {
      if (leftAt.current < 0) {
        leftAt.current = now
        emit('confetti', g.position.x, g.position.y + 0.4, 1, [COLORS[box.color], '#ffffff', '#ffd36b'])
      }
      const k = Math.min(1, (now - leftAt.current) / (BOX_LEAVE_MS / 1000))
      // Little hop, then off the top of the screen.
      target.y += k < 0.35 ? Math.sin((k / 0.35) * Math.PI) * 0.35 : (k - 0.35) * 14
      g.position.lerp(target, 1 - Math.exp(-dt * 30))
    } else {
      g.position.lerp(target, 1 - Math.exp(-dt * 10))
    }
    anchor.current.copy(g.position)
    boxAnchors.set(box.uid, anchor.current)
    // Lid stands open behind the bin and slams shut as it leaves.
    if (lid.current) {
      const shut = leftAt.current < 0 ? 0 : Math.min(1, (now - leftAt.current) / 0.16)
      lid.current.rotation.x = Math.PI * 0.8 * (1 - shut)
    }
  })

  const color = COLORS[box.color]
  return (
    <group ref={group}>
      {/* Parts organiser after the concept: coloured shell, three compartments, a clear lid with a yellow rim and latch. */}
      <RoundedBox smoothness={2} bevelSegments={2} args={[2.8, 1.25, 0.7]} radius={0.18} castShadow>
        <meshStandardMaterial color={color} roughness={0.35} />
      </RoundedBox>
      <RoundedBox smoothness={2} bevelSegments={2} args={[2.8, 0.14, 0.72]} radius={0.06} position={[0, 0.58, 0.01]}>
        <meshStandardMaterial color={RIM} roughness={0.35} />
      </RoundedBox>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[(i - 1) * LAYOUT.boxSlotGap, 0.03, 0.3]}>
          <RoundedBox smoothness={2} bevelSegments={2} args={[0.7, 0.84, 0.1]} radius={0.08}>
            <meshStandardMaterial color="#1d2a52" roughness={0.7} />
          </RoundedBox>
          <mesh position={[0, 0, 0.06]}>
            <circleGeometry args={[0.24, 24]} />
            <meshStandardMaterial color={color} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
      <group ref={lid} position={[0, 0.6, 0.36]}>
        <RoundedBox smoothness={2} bevelSegments={2} args={[2.8, 1.25, 0.08]} radius={0.06} position={[0, -0.62, 0.02]}>
          <meshPhysicalMaterial color="#dff3ff" transparent opacity={0.35} roughness={0.05} clearcoat={1} depthWrite={false} />
        </RoundedBox>
        <RoundedBox smoothness={2} bevelSegments={2} args={[2.86, 1.3, 0.05]} radius={0.06} position={[0, -0.62, -0.01]}>
          <meshStandardMaterial color={RIM} transparent opacity={0.9} />
        </RoundedBox>
        <RoundedBox smoothness={2} bevelSegments={2} args={[0.5, 0.2, 0.08]} radius={0.04} position={[0, -1.22, 0.06]}>
          <meshStandardMaterial color={RIM} roughness={0.35} />
        </RoundedBox>
      </group>
    </group>
  )
}

export function Boxes() {
  const boxes = useGame((s) => s.game.boxes)
  return (
    <group>
      {boxes.map((b, i) => (
        <Box key={b.uid} box={b} index={i} />
      ))}
    </group>
  )
}

export function Tray() {
  const n = useGame((s) => s.game.tray.length)
  const filled = useGame((s) => s.game.tray.filter(Boolean).length)
  const danger = n - filled <= 1
  return (
    <group>
      {/* Steel magnetic tray with a pocket per slot; glows red when one slot is left */}
      <RoundedBox smoothness={2} bevelSegments={2} args={[n * LAYOUT.traySlotGap + 0.45, 1.35, 0.3]} radius={0.22} position={[0, LAYOUT.trayY, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={danger ? '#c9505e' : '#aeb8cc'} roughness={0.25} metalness={0.85} emissive={danger ? '#5a0010' : '#000'} emissiveIntensity={0.4} />
      </RoundedBox>
      {Array.from({ length: n }, (_, i) => (
        <RoundedBox smoothness={2} bevelSegments={2} key={i} args={[LAYOUT.traySlotGap - 0.18, 1.0, 0.1]} radius={0.12} position={traySlotPos(i, n).setZ(0.12)}>
          <meshStandardMaterial color="#6b768e" roughness={0.35} metalness={0.8} />
        </RoundedBox>
      ))}
    </group>
  )
}
