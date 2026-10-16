import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { ExtrudeGeometry, Shape, type Group } from 'three'

/** The neighbourhood around the workshop: grass, street, traffic, trees and houses. */

const GRASS = '#86c76a'
const ROAD_Z = 10.5

function Tree({ x, z, s = 1, hue = 0 }: { x: number; z: number; s?: number; hue?: number }) {
  const ref = useRef<Group>(null)
  const phase = x * 0.37 + z * 0.71
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.8 + phase) * 0.025
  })
  const leaf = ['#4fae4f', '#3f9a48', '#5cbf55'][hue % 3]
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.2, 8]} />
        <meshStandardMaterial color="#8a5a3a" />
      </mesh>
      <group ref={ref} position={[0, 1.1, 0]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <coneGeometry args={[1.0, 1.8, 8]} />
          <meshStandardMaterial color={leaf} flatShading />
        </mesh>
        <mesh position={[0, 1.6, 0]} castShadow>
          <coneGeometry args={[0.75, 1.4, 8]} />
          <meshStandardMaterial color={leaf} flatShading />
        </mesh>
      </group>
    </group>
  )
}

function Bush({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.35, z]} castShadow>
      <icosahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial color="#5cb85a" flatShading />
    </mesh>
  )
}

/** Gable roof: a triangle (depth × rise) extruded along the house's width. */
function Roof({ w, d, rise, color }: { w: number; d: number; rise: number; color: string }) {
  const geo = useMemo(() => {
    const s = new Shape()
    s.moveTo(-d / 2 - 0.3, 0)
    s.lineTo(d / 2 + 0.3, 0)
    s.lineTo(0, rise)
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: w + 0.4, bevelEnabled: false })
    g.translate(0, 0, -(w + 0.4) / 2)
    g.rotateY(Math.PI / 2)
    return g
  }, [w, d, rise])
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  )
}

function House({ x, z, w, d, h, wall, roof, rot = 0 }: { x: number; z: number; w: number; d: number; h: number; wall: string; roof: string; rot?: number }) {
  const windows = Math.max(1, Math.floor(w / 2.2))
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <group position={[0, h, 0]}>
        <Roof w={w} d={d} rise={d * 0.38} color={roof} />
      </group>
      {Array.from({ length: windows }, (_, i) => (
        <mesh key={i} position={[-w / 2 + (w / windows) * (i + 0.5), h * 0.55, d / 2 + 0.01]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshStandardMaterial color="#ffe9a8" emissive="#ffcf6b" emissiveIntensity={0.35} />
        </mesh>
      ))}
      <mesh position={[w / 2 - 1, 0.8, d / 2 + 0.01]}>
        <planeGeometry args={[0.9, 1.6]} />
        <meshStandardMaterial color="#7a4a2a" />
      </mesh>
    </group>
  )
}

/** Classic black lantern street lamp with a warm glow. */
function StreetLamp({ x }: { x: number }) {
  return (
    <group position={[x, 0, ROAD_Z - 2.6]}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.2, 10]} />
        <meshStandardMaterial color="#1f2233" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 2.8, 10]} />
        <meshStandardMaterial color="#1f2233" metalness={0.4} />
      </mesh>
      <mesh position={[0, 3.0, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 0.12, 8]} />
        <meshStandardMaterial color="#1f2233" />
      </mesh>
      <mesh position={[0, 3.3, 0]}>
        <cylinderGeometry args={[0.2, 0.15, 0.5, 6]} />
        <meshStandardMaterial color="#ffe6a3" emissive="#ffc24d" emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[0, 3.62, 0]}>
        <coneGeometry args={[0.28, 0.22, 6]} />
        <meshStandardMaterial color="#1f2233" />
      </mesh>
    </group>
  )
}

/** White picket fence running along x. */
function Fence({ x, z, length, rot = 0 }: { x: number; z: number; length: number; rot?: number }) {
  const posts = Math.max(2, Math.round(length / 0.45))
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      {Array.from({ length: posts }, (_, i) => (
        <mesh key={i} position={[-length / 2 + (i * length) / (posts - 1), 0.4, 0]} castShadow>
          <boxGeometry args={[0.14, 0.8, 0.06]} />
          <meshStandardMaterial color="#f7f4ec" />
        </mesh>
      ))}
      {[0.25, 0.6].map((y) => (
        <mesh key={y} position={[0, y, -0.05]}>
          <boxGeometry args={[length, 0.07, 0.04]} />
          <meshStandardMaterial color="#f7f4ec" />
        </mesh>
      ))}
    </group>
  )
}

const CAR_COLORS = ['#e0453f', '#2f63d8', '#ffc928', '#3fcf6b']

/** Small rounded hatchback with a cream roof, after the concept cars. */
function Car({ lane, speed, offset, color }: { lane: number; speed: number; offset: number; color: string }) {
  const ref = useRef<Group>(null)
  const dir = Math.sign(speed)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const span = 70
    const x = ((((clock.elapsedTime * speed + offset) % span) + span) % span) - span / 2
    ref.current.position.set(x, 0, ROAD_Z + lane)
  })
  return (
    <group ref={ref} rotation-y={dir > 0 ? 0 : Math.PI}>
      <RoundedBox args={[2.2, 0.7, 1.25]} radius={0.25} position={[0, 0.6, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[1.25, 0.55, 1.15]} radius={0.18} position={[-0.15, 1.12, 0]} castShadow>
        <meshStandardMaterial color="#2a3b66" roughness={0.1} metalness={0.3} />
      </RoundedBox>
      <RoundedBox args={[1.35, 0.14, 1.22]} radius={0.06} position={[-0.15, 1.42, 0]}>
        <meshStandardMaterial color="#f3e2bf" roughness={0.5} />
      </RoundedBox>
      {[-0.7, 0.7].map((wx) =>
        [-0.6, 0.6].map((wz) => (
          <group key={`${wx}${wz}`} position={[wx, 0.32, wz]} rotation-x={Math.PI / 2}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.3, 0.22, 16]} />
              <meshStandardMaterial color="#22263a" />
            </mesh>
            <mesh position={[0, wz > 0 ? 0.115 : -0.115, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.02, 12]} />
              <meshStandardMaterial color="#c9ced8" metalness={0.8} />
            </mesh>
          </group>
        )),
      )}
      {[0.38, -0.38].map((z) => (
        <mesh key={z} position={[1.1, 0.68, z]} rotation-y={Math.PI / 2}>
          <circleGeometry args={[0.12, 14]} />
          <meshStandardMaterial color="#fff" emissive="#fff3c4" emissiveIntensity={1.2} />
        </mesh>
      ))}
      <mesh position={[1.12, 0.42, 0]}>
        <boxGeometry args={[0.06, 0.1, 1.1]} />
        <meshStandardMaterial color="#c9ced8" metalness={0.8} />
      </mesh>
    </group>
  )
}

export function World() {
  return (
    <group>
      {/* Grass with a soft checker so the ground does not look flat */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color={GRASS} />
      </mesh>
      {/* Street, kerbs and pavement */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.0, ROAD_Z]} receiveShadow>
        <planeGeometry args={[90, 4.2]} />
        <meshStandardMaterial color="#4a4f63" />
      </mesh>
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[-42 + i * 4, 0.01, ROAD_Z]}>
          <planeGeometry args={[1.6, 0.16]} />
          <meshStandardMaterial color="#f4f1e6" />
        </mesh>
      ))}
      <mesh position={[0, 0.08, ROAD_Z - 2.6]} receiveShadow>
        <boxGeometry args={[90, 0.16, 1.0]} />
        <meshStandardMaterial color="#c9ccd6" />
      </mesh>
      <mesh position={[0, 0.08, ROAD_Z + 2.6]} receiveShadow>
        <boxGeometry args={[90, 0.16, 1.0]} />
        <meshStandardMaterial color="#c9ccd6" />
      </mesh>
      {/* Driveway from the street to the workshop */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 7.1]} receiveShadow>
        <planeGeometry args={[8, 4.2]} />
        <meshStandardMaterial color="#b7b2a6" />
      </mesh>

      <Car lane={-1} speed={4.5} offset={0} color={CAR_COLORS[0]} />
      <Car lane={1} speed={-3.6} offset={20} color={CAR_COLORS[1]} />
      <Car lane={-1} speed={4.5} offset={38} color={CAR_COLORS[2]} />

      {[-14, -6, 6, 14].map((x) => (
        <StreetLamp key={x} x={x} />
      ))}

      <House x={-15} z={-2} w={6} d={6} h={3.2} wall="#f3e2bf" roof="#e0533d" rot={Math.PI / 2} />
      <Fence x={-11} z={-2} length={6} rot={Math.PI / 2} />
      <Fence x={11} z={-1} length={6} rot={Math.PI / 2} />
      <Fence x={-9} z={15.4} length={6} />
      <Fence x={8} z={15.4} length={6} />
      <Fence x={-6.8} z={5.2} length={3} />
      <Fence x={6.8} z={5.2} length={3} />
      <House x={15} z={-1} w={7} d={5.5} h={3.6} wall="#7fa8e8" roof="#2b3350" rot={-Math.PI / 2} />
      <House x={-4} z={-15} w={8} d={6} h={4} wall="#ffe0c2" roof="#3fa36b" />
      <House x={9} z={-15} w={6} d={6} h={3.4} wall="#e8d9ff" roof="#8a5ad1" />
      <House x={-9} z={19} w={7} d={5} h={3.2} wall="#d9f2e4" roof="#c95a3d" rot={Math.PI} />
      <House x={8} z={19} w={6} d={5} h={3.8} wall="#fff1b8" roof="#4a6fd1" rot={Math.PI} />

      {(
        [
          [-9, -8, 1.1, 0],
          [-11, 4, 0.9, 1],
          [9, -8, 1.0, 2],
          [10.5, 4.5, 1.2, 0],
          [-18, 8, 1.3, 1],
          [19, 7, 1.1, 2],
          [-1, -10, 0.9, 0],
          [4, -10.5, 1.1, 1],
          [-17, -10, 1.4, 2],
          [18, -9, 1.2, 0],
          [-2, 16.5, 1.0, 1],
          [16, 16, 1.1, 2],
        ] as const
      ).map(([x, z, s, h], i) => (
        <Tree key={i} x={x} z={z} s={s} hue={h} />
      ))}
      {(
        [
          [-7.6, 6],
          [7.6, 6],
          [-8.2, -2],
          [8.0, -6],
          [-6.5, -7.5],
        ] as const
      ).map(([x, z], i) => (
        <Bush key={i} x={x} z={z} />
      ))}
    </group>
  )
}
