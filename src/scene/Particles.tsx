import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { Color, Object3D, type InstancedMesh } from 'three'

/** Pooled particle bursts (sparks, confetti, dust) rendered as one instanced mesh. */
const MAX = 400

interface P {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  spin: number
  life: number
  max: number
  size: number
  gravity: number
  color: Color
}

const pool: P[] = []

export type Burst = 'sparks' | 'confetti' | 'dust'

export function emit(kind: Burst, x: number, y: number, z: number, colors: string[] = ['#ffd36b']) {
  const count = kind === 'confetti' ? 36 : kind === 'dust' ? 18 : 12
  for (let i = 0; i < count && pool.length < MAX; i++) {
    const a = Math.random() * Math.PI * 2
    const speed = kind === 'confetti' ? 3 + Math.random() * 5 : kind === 'dust' ? 0.8 + Math.random() * 1.5 : 2.5 + Math.random() * 3
    pool.push({
      x,
      y,
      z,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed + (kind === 'confetti' ? 4 : 0),
      vz: Math.random() * 2,
      spin: (Math.random() - 0.5) * 20,
      life: 0,
      max: kind === 'confetti' ? 1.2 : kind === 'dust' ? 0.7 : 0.35,
      size: kind === 'confetti' ? 0.14 : kind === 'dust' ? 0.22 : 0.06,
      gravity: kind === 'dust' ? -1 : 14,
      color: new Color(colors[i % colors.length]),
    })
  }
}

const dummy = new Object3D()

export function Particles() {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    pool.length = 0
  }, [])

  useFrame((_, dt) => {
    const m = mesh.current
    if (!m) return
    for (let i = pool.length - 1; i >= 0; i--) {
      const p = pool[i]
      p.life += dt
      if (p.life >= p.max) {
        pool.splice(i, 1)
        continue
      }
      p.vy -= p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      p.vx *= 0.98
    }
    for (let i = 0; i < MAX; i++) {
      const p = pool[i]
      if (!p) {
        dummy.scale.setScalar(0)
      } else {
        const k = 1 - p.life / p.max
        dummy.position.set(p.x, p.y, p.z)
        dummy.rotation.set(p.life * p.spin, p.life * p.spin * 0.7, 0)
        dummy.scale.set(p.size * (0.4 + k), p.size * (0.4 + k) * 0.6, p.size * 0.3)
        m.setColorAt(i, p.color)
      }
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}
