import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import type { Group, Mesh } from 'three'
import type { UpgradeId } from '../game/profile'
import { pegboardTexture, woodTexture } from '../scene/textures'

/**
 * Workshop stations, one per skill, modelled after concept/stations.png. Each grows with its level
 * so upgrades show up in the room. Models face +z (toward the room) and stand on the origin.
 */

const BLUE = '#2f63d8'
const BLUE_DARK = '#244ea8'
const ORANGE_WOOD = '#d98a3d'
const STEEL = '#b4bfd2'
const DARK = '#2b3350'
const HANDLES = ['#ff4f5e', '#3d8bff', '#ffc928', '#3fcf6b', '#a46bff', '#ff8a2b']

function useWood(x = 1, y = 1) {
  return useMemo(() => woodTexture(x, y), [x, y])
}

/** Blue drawer cabinet with a wooden top: the base of the tray table and the counter. */
function Cabinet({ w, d, h, drawers, open = false }: { w: number; d: number; h: number; drawers: number; open?: boolean }) {
  const wood = useWood(w / 2, 0.5)
  return (
    <group>
      <RoundedBox smoothness={2} bevelSegments={2} args={[w, h - 0.1, d]} radius={0.06} position={[0, (h - 0.1) / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={BLUE} roughness={0.55} />
      </RoundedBox>
      <RoundedBox smoothness={2} bevelSegments={2} args={[w + 0.12, 0.12, d + 0.1]} radius={0.04} position={[0, h - 0.04, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} />
      </RoundedBox>
      {Array.from({ length: drawers }, (_, i) => {
        const dw = (w - 0.2) / drawers
        const x = -w / 2 + 0.1 + dw * (i + 0.5)
        return (
          <group key={i} position={[x, h * 0.62, d / 2 + 0.01]}>
            <RoundedBox smoothness={2} bevelSegments={2} args={[dw - 0.06, h * 0.28, 0.04]} radius={0.02}>
              <meshStandardMaterial color={BLUE_DARK} roughness={0.5} />
            </RoundedBox>
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[Math.min(0.28, dw * 0.4), 0.04, 0.03]} />
              <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        )
      })}
      {open && (
        <mesh position={[0, h * 0.24, d / 2 - 0.2]}>
          <boxGeometry args={[w - 0.16, h * 0.34, 0.4]} />
          <meshStandardMaterial color="#1d2f63" />
        </mesh>
      )}
    </group>
  )
}

function Bin({ color, x, y = 0, z = 0 }: { color: string; x: number; y?: number; z?: number }) {
  return (
    <RoundedBox smoothness={2} bevelSegments={2} args={[0.42, 0.22, 0.32]} radius={0.04} position={[x, y + 0.11, z]} castShadow>
      <meshStandardMaterial color={color} roughness={0.5} />
    </RoundedBox>
  )
}

function Crate({ x, y = 0, z = 0 }: { x: number; y?: number; z?: number }) {
  const wood = useWood(0.3, 0.3)
  return (
    <RoundedBox smoothness={2} bevelSegments={2} args={[0.4, 0.26, 0.32]} radius={0.02} position={[x, y + 0.13, z]} castShadow>
      <meshStandardMaterial map={wood} color="#c9a07a" />
    </RoundedBox>
  )
}

/* ---------- Tool wall (Master Kit) ---------- */

function Screwdriver({ color, x, y }: { color: string; x: number; y: number }) {
  return (
    <group position={[x, y, 0.2]}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.065, 0.055, 0.3, 10]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.32, 6]} />
        <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  )
}

function Wrench({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0.2]}>
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[0.08, 0.6, 0.04]} />
        <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.1, 0.04, 6, 14, Math.PI * 1.45]} />
        <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Pliers({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0.2]}>
      {[-1, 1].map((side) => (
        <group key={side} rotation-z={side * 0.18}>
          <mesh position={[side * 0.05, -0.2, 0]}>
            <boxGeometry args={[0.06, 0.34, 0.05]} />
            <meshStandardMaterial color="#ff4f5e" roughness={0.4} />
          </mesh>
          <mesh position={[side * 0.02, 0.1, 0]}>
            <boxGeometry args={[0.05, 0.24, 0.04]} />
            <meshStandardMaterial color={STEEL} metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function ToolWall({ level }: { level: number }) {
  const peg = useMemo(() => pegboardTexture(2.6, 1.6), [])
  const wood = useWood(1, 0.2)
  const W = 3.0
  const H = 1.9
  const tools: ReactNode[] = []
  const slots = [-1.1, -0.75, -0.4, -0.05, 0.3, 0.65, 1.0]
  const kinds: Array<'d' | 'w' | 'p'> = ['d', 'w', 'd', 'd', 'p', 'w', 'd']
  const count = [2, 4, 6, 7][Math.min(level, 3)]
  for (let i = 0; i < count; i++) {
    const x = slots[i]
    const k = kinds[i]
    tools.push(k === 'd' ? <Screwdriver key={i} color={HANDLES[i % HANDLES.length]} x={x} y={2.1} /> : k === 'w' ? <Wrench key={i} x={x} y={2.0} /> : <Pliers key={i} x={x} y={2.1} />)
  }
  return (
    <group>
      {/* Navy pegboard in a wooden frame with blue corner blocks */}
      <mesh position={[0, 1.95, 0.1]} receiveShadow>
        <boxGeometry args={[W - 0.2, H - 0.2, 0.05]} />
        <meshStandardMaterial map={peg} />
      </mesh>
      {[
        [0, 1.95 + H / 2 - 0.06, W, 0.14],
        [0, 1.95 - H / 2 + 0.06, W, 0.14],
      ].map(([x, y, w, h], i) => (
        <RoundedBox smoothness={2} bevelSegments={2} key={i} args={[w, h, 0.16]} radius={0.03} position={[x, y, 0.12]} castShadow>
          <meshStandardMaterial map={wood} color={ORANGE_WOOD} />
        </RoundedBox>
      ))}
      {[-1, 1].map((side) => (
        <RoundedBox smoothness={2} bevelSegments={2} key={side} args={[0.14, H, 0.16]} radius={0.03} position={[side * (W / 2 - 0.07), 1.95, 0.12]} castShadow>
          <meshStandardMaterial map={wood} color={ORANGE_WOOD} />
        </RoundedBox>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <RoundedBox smoothness={2} bevelSegments={2} key={`${sx}${sy}`} args={[0.24, 0.24, 0.2]} radius={0.04} position={[sx * (W / 2 - 0.07), 1.95 + sy * (H / 2 - 0.06), 0.14]}>
            <meshStandardMaterial color={BLUE} />
          </RoundedBox>
        )),
      )}
      {tools}
      {level >= 3 && (
        <group>
          {/* Gold wrench plaque and a hammer for the full kit */}
          <RoundedBox smoothness={2} bevelSegments={2} args={[0.9, 0.3, 0.08]} radius={0.06} position={[0, 1.95 + H / 2 + 0.1, 0.2]}>
            <meshStandardMaterial color="#ffc928" metalness={0.6} roughness={0.3} emissive="#7a5200" emissiveIntensity={0.3} />
          </RoundedBox>
          <group position={[1.18, 1.7, 0.22]} rotation-z={0.1}>
            <mesh position={[0, -0.1, 0]}>
              <boxGeometry args={[0.07, 0.6, 0.06]} />
              <meshStandardMaterial color="#c9783a" />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.28, 0.12, 0.12]} />
              <meshStandardMaterial color="#5a6480" metalness={0.7} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  )
}

/* ---------- Tray table (Wide Tray) ---------- */

function TrayTable({ level }: { level: number }) {
  const trays = 1 + level
  const width = [1.5, 2.2, 2.6][Math.min(level, 2)]
  return (
    <group>
      <Cabinet w={width} d={0.95} h={0.95} drawers={level + 1} open={level >= 1} />
      {Array.from({ length: trays }, (_, i) => (
        <group key={i} position={[-((trays - 1) * 0.42) + i * 0.84, 1.03, 0]}>
          <RoundedBox smoothness={2} bevelSegments={2} args={[0.72, 0.1, 0.55]} radius={0.03}>
            <meshStandardMaterial color="#9aa6bd" metalness={0.75} roughness={0.3} />
          </RoundedBox>
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[-0.22 + (k % 3) * 0.22, 0.08, -0.1 + Math.floor(k / 3) * 0.2]} rotation-z={k * 0.7} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.055, 0.055, 0.05, 10]} />
              <meshStandardMaterial color={HANDLES[(i * 2 + k) % HANDLES.length]} roughness={0.35} />
            </mesh>
          ))}
        </group>
      ))}
      {level >= 1 &&
        ['#ff4f5e', '#ffc928', BLUE].slice(0, level + 1).map((c, i) => <Bin key={c} color={c} x={-width / 2 + 0.4 + i * 0.6} y={0.06} z={0.18} />)}
    </group>
  )
}

/* ---------- Rust corner (Rust Breaker) ---------- */

function Barrel() {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 1.1, 20]} />
        <meshStandardMaterial color="#3a6fc4" roughness={0.6} />
      </mesh>
      {/* Rust patches */}
      {[
        [0.4, 0.3, 0.3],
        [-0.2, 0.75, 1.9],
        [0.1, 0.95, 3.6],
        [0.3, 0.6, 4.9],
      ].map(([, y, a], i) => (
        <mesh key={i} position={[Math.sin(a) * 0.425, y, Math.cos(a) * 0.425]} rotation-y={a}>
          <circleGeometry args={[0.13 + (i % 2) * 0.05, 9]} />
          <meshStandardMaterial color="#b5652c" roughness={1} />
        </mesh>
      ))}
      {[0.2, 0.9].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[0.43, 0.03, 6, 24]} />
          <meshStandardMaterial color="#2a4f94" />
        </mesh>
      ))}
      <mesh position={[0.15, 1.11, 0.1]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 10]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
    </group>
  )
}

function RustStation({ level }: { level: number }) {
  return (
    <group>
      <group position={[-0.7, 0, 0]}>
        <Barrel />
      </group>
      {level >= 1 && (
        <group position={[0.2, 0, -0.1]}>
          {/* Metal shelf with spray cans, a jerry can and a bucket */}
          {[-0.4, 0.4].flatMap((x) =>
            [-0.2, 0.2].map((z) => (
              <mesh key={`${x}${z}`} position={[x, 0.75, z]}>
                <boxGeometry args={[0.05, 1.5, 0.05]} />
                <meshStandardMaterial color={DARK} metalness={0.5} />
              </mesh>
            )),
          )}
          {[0.35, 0.85, 1.35].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[0.9, 0.04, 0.45]} />
              <meshStandardMaterial color="#c9783a" />
            </mesh>
          ))}
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[-0.25 + i * 0.25, 1.02, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.3, 10]} />
              <meshStandardMaterial color={['#ff4f5e', '#3d8bff', '#ffc928'][i]} metalness={0.3} roughness={0.35} />
            </mesh>
          ))}
          <RoundedBox smoothness={2} bevelSegments={2} args={[0.3, 0.32, 0.18]} radius={0.04} position={[0.15, 0.55, 0]}>
            <meshStandardMaterial color="#3fa34d" />
          </RoundedBox>
          <mesh position={[-0.6, 0.15, 0.35]}>
            <cylinderGeometry args={[0.16, 0.14, 0.3, 14]} />
            <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      )}
      {level >= 2 && (
        <group position={[1.05, 0, 0]}>
          {/* Teal oiling machine with a gauge and a hose */}
          <RoundedBox smoothness={2} bevelSegments={2} args={[0.7, 1.2, 0.55]} radius={0.12} position={[0, 0.65, 0]} castShadow>
            <meshStandardMaterial color="#35c9b4" roughness={0.45} />
          </RoundedBox>
          <mesh position={[0, 1.45, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.08, 18]} />
            <meshStandardMaterial color={STEEL} metalness={0.7} />
          </mesh>
          <mesh position={[0, 1.45, 0.045]} rotation-x={Math.PI / 2}>
            <circleGeometry args={[0.13, 18]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <mesh position={[0, 0.85, 0.28]}>
            <circleGeometry args={[0.1, 16]} />
            <meshStandardMaterial color="#ffc928" emissive="#ffb000" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0.38, 0.7, 0.1]} rotation-y={Math.PI / 2}>
            <torusGeometry args={[0.25, 0.04, 8, 20, Math.PI * 1.3]} />
            <meshStandardMaterial color={DARK} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/* ---------- Counter (Haggling) ---------- */

function CoinStack({ x, z, n }: { x: number; z: number; n: number }) {
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[0, i * 0.045, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 14]} />
          <meshStandardMaterial color="#ffc928" metalness={0.7} roughness={0.25} emissive="#7a5200" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  )
}

function Register({ gold }: { gold: boolean }) {
  return (
    <group>
      <RoundedBox smoothness={2} bevelSegments={2} args={[0.7, 0.32, 0.55]} radius={0.06} position={[0, 0.16, 0]} castShadow>
        <meshStandardMaterial color={gold ? '#ffc928' : '#e0453f'} metalness={gold ? 0.75 : 0.1} roughness={0.3} />
      </RoundedBox>
      <RoundedBox smoothness={2} bevelSegments={2} args={[0.5, 0.06, 0.3]} radius={0.02} position={[0, 0.34, 0.06]}>
        <meshStandardMaterial color={DARK} />
      </RoundedBox>
      <mesh position={[0, 0.55, -0.15]} rotation-x={-0.25}>
        <boxGeometry args={[0.46, 0.26, 0.06]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      <mesh position={[0, 0.55, -0.115]} rotation-x={-0.25}>
        <planeGeometry args={[0.38, 0.18]} />
        <meshStandardMaterial color="#9fffe0" emissive="#35d9a0" emissiveIntensity={0.6} />
      </mesh>
      {gold && (
        <group position={[0.42, 0.3, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
            <meshStandardMaterial color={STEEL} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshStandardMaterial color="#ff4f5e" />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Counter({ level }: { level: number }) {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 1.7 + Math.sin(clock.elapsedTime * 2) * 0.05
  })
  return (
    <group>
      <Cabinet w={2.6} d={0.95} h={1.12} drawers={2} />
      <group position={[0.75, 0.06, 0.35]}>
        <Crate x={0} />
        <Bin color="#ffc928" x={0} y={0.26} />
      </group>
      {level >= 1 && (
        <group position={[0.5, 1.15, -0.05]}>
          <Register gold={level >= 5} />
        </group>
      )}
      {level >= 2 && <CoinStack x={-0.35} z={0.15} n={2 + level * 2} />}
      {level >= 3 && <CoinStack x={-0.65} z={-0.12} n={level * 2} />}
      {level >= 4 && <CoinStack x={-0.95} z={0.18} n={level + 3} />}
      {level >= 1 && (
        <mesh ref={ref} position={[0, 1.7, 0.5]} rotation-x={Math.PI / 2} userData={{ noMerge: true }}>
          <cylinderGeometry args={[0.16, 0.16, 0.04, 16]} />
          <meshStandardMaterial color="#ffc928" metalness={0.7} roughness={0.25} emissive="#ffb000" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  )
}

/* ---------- Drill corner (Power Drill) ---------- */

function Stool() {
  return (
    <group>
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.12, 20]} />
        <meshStandardMaterial color="#e0453f" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.57 + 0.78) * 0.22, 0.3, Math.sin(i * 1.57 + 0.78) * 0.22]} rotation={[Math.sin(i * 1.57 + 0.78) * 0.15, 0, -Math.cos(i * 1.57 + 0.78) * 0.15]}>
          <cylinderGeometry args={[0.035, 0.035, 0.62, 6]} />
          <meshStandardMaterial color="#9a5a2e" />
        </mesh>
      ))}
    </group>
  )
}

function Drill({ level }: { level: number }) {
  const bit = useRef<Group>(null)
  useFrame((_, dt) => {
    if (bit.current) bit.current.rotation.y += dt * (4 + level * 6)
  })
  if (level === 0)
    return (
      <group>
        <Stool />
        <group position={[0, 0.8, 0]} rotation-z={Math.PI / 2}>
          <RoundedBox smoothness={2} bevelSegments={2} args={[0.24, 0.5, 0.2]} radius={0.06}>
            <meshStandardMaterial color="#3d8bff" />
          </RoundedBox>
          <RoundedBox smoothness={2} bevelSegments={2} args={[0.2, 0.18, 0.18]} radius={0.04} position={[0, -0.3, 0]}>
            <meshStandardMaterial color="#ffc928" />
          </RoundedBox>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.25, 8]} />
            <meshStandardMaterial color={STEEL} metalness={0.9} />
          </mesh>
        </group>
      </group>
    )
  const body = level >= 3 ? '#a46bff' : level >= 2 ? '#3d8bff' : '#ffc928'
  const s = 0.95 + level * 0.07
  return (
    <group scale={s}>
      <RoundedBox smoothness={2} bevelSegments={2} args={[1.1, 0.2, 0.9]} radius={0.05} position={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color={level >= 3 ? '#6b3fc4' : DARK} />
      </RoundedBox>
      <RoundedBox smoothness={2} bevelSegments={2} args={[0.5, 0.5, 0.4]} radius={0.06} position={[0, 0.45, -0.15]} castShadow>
        <meshStandardMaterial color={body} />
      </RoundedBox>
      <mesh position={[0, 1.1, -0.25]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.3, 12]} />
        <meshStandardMaterial color={STEEL} metalness={0.8} roughness={0.3} />
      </mesh>
      <RoundedBox smoothness={2} bevelSegments={2} args={[0.6, 0.45, 0.6]} radius={0.1} position={[0, 1.7, 0]} castShadow>
        <meshStandardMaterial color={body} />
      </RoundedBox>
      <mesh position={[0, 0.82, 0.08]}>
        <boxGeometry args={[0.6, 0.06, 0.5]} />
        <meshStandardMaterial color="#8892a8" metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.9, 0.1]}>
        <boxGeometry args={[0.25, 0.1, 0.18]} />
        <meshStandardMaterial color="#e0453f" />
      </mesh>
      {/* Feed lever */}
      <group position={[0.32, 1.55, 0.1]} rotation-z={-0.7}>
        <mesh position={[0.15, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.02, 0.02, 0.32, 6]} />
          <meshStandardMaterial color={STEEL} metalness={0.8} />
        </mesh>
        <mesh position={[0.32, 0, 0]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color="#e0453f" />
        </mesh>
      </group>
      <group ref={bit} position={[0, 1.33, 0.1]} userData={{ noMerge: true }}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.06, 0.2, 10]} />
          <meshStandardMaterial color="#5a6480" metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <coneGeometry args={[0.03, 0.26, 6]} />
          <meshStandardMaterial color="#e8ecf4" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>
      {level >= 3 && (
        <>
          <mesh position={[0.31, 1.7, 0.15]}>
            <sphereGeometry args={[0.08, 12, 10]} />
            <meshStandardMaterial color="#fff" emissive="#ffb02e" emissiveIntensity={1.4} />
          </mesh>
        </>
      )}
    </group>
  )
}

export const STATION_MODELS: Record<UpgradeId, (p: { level: number }) => ReactNode> = {
  kit: ToolWall,
  tray: TrayTable,
  rust: RustStation,
  coin: Counter,
  speed: Drill,
}
