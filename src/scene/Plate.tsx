import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, ExtrudeGeometry, Path, Shape, type Group, type MeshStandardMaterial } from 'three'
import { getBody } from '../game/physics'
import { useGame } from '../game/store'
import type { PlateDef } from '../game/types'
import { plateZ } from './layout'
import { emit } from './Particles'
import { feel } from '../services/feel'

const DEPTH = 0.12

function outline(def: PlateDef) {
  const { w, h } = def
  const shape = new Shape()
  if (def.shape === 'disc') {
    shape.absarc(0, 0, w / 2, 0, Math.PI * 2, false)
    return shape
  }
  const r = Math.min(h / 2, w / 2, 0.45)
  shape.moveTo(-w / 2 + r, -h / 2)
  shape.lineTo(w / 2 - r, -h / 2)
  shape.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false)
  shape.lineTo(w / 2, h / 2 - r)
  shape.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false)
  shape.lineTo(-w / 2 + r, h / 2)
  shape.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(-w / 2, -h / 2 + r)
  shape.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false)
  return shape
}

function plateGeometry(def: PlateDef) {
  const shape = outline(def)
  // Screw holes, in plate-local coordinates.
  const c = Math.cos(-def.angle)
  const s = Math.sin(-def.angle)
  for (const screw of def.screws) {
    const dx = screw.x - def.x
    const dy = screw.y - def.y
    const hole = new Path()
    hole.absarc(dx * c - dy * s, dx * s + dy * c, 0.2, 0, Math.PI * 2, true)
    shape.holes.push(hole)
  }
  const geo = new ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.03, bevelSegments: 1, curveSegments: def.shape === 'disc' ? 28 : 8 })
  geo.translate(0, 0, -DEPTH / 2)
  return geo
}

export function Plate({ def }: { def: PlateDef }) {
  const group = useRef<Group>(null)
  const mat = useRef<MeshStandardMaterial>(null)
  const geometry = useMemo(() => plateGeometry(def), [def])
  const side = useMemo(() => new Color(def.tint).multiplyScalar(0.62), [def.tint])
  const flash = useRef(0)
  const dusted = useRef(false)
  const lastSeq = useRef(0)

  useFrame((_, dt) => {
    const body = getBody(def.id)
    const g = group.current
    if (!body || !g) return
    g.visible = !body.gone
    if (body.mode === 'fall' && !dusted.current) {
      dusted.current = true
      emit('dust', body.x, body.y, plateZ(def.layer) + 0.3, ['#f4e3c8', def.tint])
      feel.plateDrop()
    }
    g.position.set(body.x, body.y, plateZ(def.layer) + (body.mode === 'fall' ? 0.8 : 0))
    g.rotation.z = body.angle

    const fb = useGame.getState().feedback
    if (fb && fb.seq !== lastSeq.current) {
      lastSeq.current = fb.seq
      if (fb.kind === 'covered' && fb.plateId === def.id) flash.current = 1
    }
    flash.current = Math.max(0, flash.current - dt * 2.5)
    if (mat.current) mat.current.emissiveIntensity = flash.current * (0.6 + 0.4 * Math.sin(flash.current * 30))
  })

  return (
    <group ref={group}>
      <mesh geometry={geometry} renderOrder={def.layer + 1} castShadow receiveShadow>
        <meshStandardMaterial attach="material-1" color={side} transparent opacity={0.95} roughness={0.3} depthWrite={false} />
        <meshStandardMaterial
          attach="material-0"
          ref={mat}
          color={def.tint}
          transparent
          opacity={0.86}
          roughness={0.22}
          metalness={0}
          emissive="#ffffff"
          emissiveIntensity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
