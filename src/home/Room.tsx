import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import { CanvasTexture, SRGBColorSpace, TextureLoader, type Group } from 'three'
import { getLevel } from '../game/levels'
import { DECOR, UPGRADE_IDS, type DecorId, type UpgradeId } from '../game/profile'
import { useGame } from '../game/store'
import { translate } from '../i18n'
import { COLORS } from '../scene/layout'
import { iconUrl } from '../ui/art'
import { BENCH, DECOR_SPOTS, ROOM, STATIONS } from './layout'
import { STATION_MODELS } from './Stations'
import { floorTexture, woodTexture } from '../scene/textures'

const { w: RW, d: RD, wall: WH } = ROOM

/** Taps that end a camera drag should not count as a tap on whatever is under the finger. */
const isTap = (e: ThreeEvent<MouseEvent>) => e.delta < 8

function signTexture(text: string) {
  const c = document.createElement('canvas')
  c.width = 768
  c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#1b2140'
  g.fillRect(0, 0, 768, 128)
  g.strokeStyle = '#ffb02e'
  g.lineWidth = 10
  g.strokeRect(8, 8, 752, 112)
  g.font = '800 52px "Baloo 2", system-ui, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillStyle = '#ffb02e'
  g.fillText(text, 384, 70)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  return tex
}

function Walls() {
  const lang = useGame((s) => s.profile.lang)
  const floor = useMemo(() => floorTexture(RW / 4, RD / 4), [])
  const sign = useMemo(() => signTexture(translate(lang, 'app.name').toUpperCase()), [lang])
  return (
    <group>
      {/* Floor tiles */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial map={floor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.1, RD / 2]} receiveShadow castShadow>
        <boxGeometry args={[RW + 0.4, 0.2, 0.3]} />
        <meshStandardMaterial color="#5a6480" />
      </mesh>
      <mesh position={[RW / 2, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.3, 0.2, RD]} />
        <meshStandardMaterial color="#5a6480" />
      </mesh>

      {/* Back wall with windows */}
      <group position={[0, 0, -RD / 2]}>
        <mesh position={[0, WH / 2, -0.15]} receiveShadow castShadow>
          <boxGeometry args={[RW + 0.3, WH, 0.3]} />
          <meshStandardMaterial color="#e9dcc4" />
        </mesh>
        <mesh position={[0, 0.35, 0.02]}>
          <boxGeometry args={[RW, 0.7, 0.04]} />
          <meshStandardMaterial color="#c9b79a" />
        </mesh>
        {[3.3].map((x) => (
          <group key={x} position={[x, 2.0, 0.02]}>
            <mesh>
              <planeGeometry args={[1.8, 1.1]} />
              <meshStandardMaterial color="#9fd8ff" emissive="#6fc0ff" emissiveIntensity={0.25} />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <boxGeometry args={[0.06, 1.1, 0.04]} />
              <meshStandardMaterial color="#fff" />
            </mesh>
          </group>
        ))}
        {/* Roof sign */}
        <mesh position={[0, WH + 0.55, -0.1]}>
          <boxGeometry args={[6.2, 1.1, 0.16]} />
          <meshStandardMaterial color="#1b2140" />
        </mesh>
        <mesh position={[0, WH + 0.55, 0]}>
          <planeGeometry args={[6, 1]} />
          <meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.35} />
        </mesh>
      </group>

      {/* Left wall */}
      <group position={[-RW / 2, 0, 0]}>
        <mesh position={[-0.15, WH / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.3, WH, RD]} />
          <meshStandardMaterial color="#f3e7d0" />
        </mesh>
        <mesh position={[0.02, 0.35, 0]} rotation-y={Math.PI / 2}>
          <boxGeometry args={[RD, 0.7, 0.04]} />
          <meshStandardMaterial color="#c9b79a" />
        </mesh>
        <group position={[0.02, 2.0, 1.2]} rotation-y={Math.PI / 2}>
          <mesh>
            <planeGeometry args={[1.6, 1.1]} />
            <meshStandardMaterial color="#9fd8ff" emissive="#6fc0ff" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[1.6, 0.06, 0.04]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </group>
      </group>

      {/* Ceiling lamps over the bench */}
      {[-1.2, 1.2].map((x) => (
        <group key={x} position={[x, WH - 0.2, -3.4]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
            <meshStandardMaterial color={INK_COLOR} />
          </mesh>
          <mesh position={[0, -0.25, 0]}>
            <coneGeometry args={[0.3, 0.25, 16, 1, true]} />
            <meshStandardMaterial color="#ffb02e" side={2} />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshStandardMaterial color="#fff" emissive="#fff3c4" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

const INK_COLOR = '#2b3350'

/** Miniature of the next level, lying on the bench. */
function JobModel() {
  const levelIdx = useGame((s) => s.profile.level)
  const level = getLevel(levelIdx)
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = BENCH.top + 0.08 + Math.sin(clock.elapsedTime * 1.5) * 0.015
  })
  const s = 0.13
  return (
    <group ref={ref} position={[0, BENCH.top + 0.08, BENCH.pos[2] + 0.05]} rotation-x={-Math.PI / 2 + 0.25}>
      <RoundedBox args={[8.6 * s, 9.8 * s, 0.08]} radius={0.03} position={[0, 0, -0.05]} castShadow>
        <meshStandardMaterial color="#c9783a" />
      </RoundedBox>
      {level.plates.map((p) => (
        <group key={p.id} position={[p.x * s, p.y * s, 0.02 + p.layer * 0.025]} rotation-z={p.angle}>
          {p.shape === 'disc' ? (
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[(p.w / 2) * s, (p.w / 2) * s, 0.02, 24]} />
              <meshStandardMaterial color={p.tint} transparent opacity={0.9} />
            </mesh>
          ) : (
            <RoundedBox args={[p.w * s, p.h * s, 0.02]} radius={0.008}>
              <meshStandardMaterial color={p.tint} transparent opacity={0.9} />
            </RoundedBox>
          )}
        </group>
      ))}
      {level.plates.flatMap((p) =>
        p.screws.map((sc) => (
          <mesh key={sc.id} position={[sc.x * s, sc.y * s, 0.05 + p.layer * 0.025]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 10]} />
            <meshStandardMaterial color={COLORS[sc.color]} metalness={0.3} roughness={0.3} />
          </mesh>
        )),
      )}
    </group>
  )
}

function Bench() {
  const wood = useMemo(() => woodTexture(1, 0.4), [])
  const play = useGame((s) => s.play)
  const focus = useGame((s) => s.focusSpot)
  return (
    <group
      position={BENCH.pos}
      onClick={(e) => {
        if (!isTap(e)) return
        e.stopPropagation()
        focus('bench')
        play()
      }}
    >
      <RoundedBox args={[BENCH.w, 0.16, BENCH.d]} radius={0.05} position={[0, BENCH.top - 0.08, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} />
      </RoundedBox>
      <RoundedBox args={[BENCH.w - 0.2, 0.7, BENCH.d - 0.15]} radius={0.05} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial color="#7a4a2a" />
      </RoundedBox>
      {[-1.2, 0, 1.2].map((x) => (
        <mesh key={x} position={[x, 0.55, BENCH.d / 2 - 0.06]}>
          <boxGeometry args={[1.0, 0.3, 0.04]} />
          <meshStandardMaterial color="#9a6440" />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- Decor ---------- */

function Spin({ speed, children, axis = 'y' }: { speed: number; children: ReactNode; axis?: 'y' | 'z' }) {
  const ref = useRef<Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation[axis] -= dt * speed
  })
  return <group ref={ref}>{children}</group>
}

function Bob({ amp = 0.03, speed = 2, children }: { amp?: number; speed?: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = Math.abs(Math.sin(clock.elapsedTime * speed)) * amp
  })
  return <group ref={ref}>{children}</group>
}

/** Framed poster on the wall, showing the poster artwork from the icon sheet. */
function Poster() {
  const art = useMemo(() => {
    const tex = new TextureLoader().load(iconUrl('decor-poster'))
    tex.colorSpace = SRGBColorSpace
    return tex
  }, [])
  return (
    <mesh>
      <planeGeometry args={[1.4, 1.4]} />
      <meshStandardMaterial map={art} transparent alphaTest={0.3} />
    </mesh>
  )
}

const decorModels: Record<DecorId, ReactNode> = {
  lamp: (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.07, 18]} />
        <meshStandardMaterial color="#ff8a2b" roughness={0.35} />
      </mesh>
      {/* Two-segment orange arm with dark joints */}
      <mesh position={[0, 0.28, 0]} rotation-z={0.35}>
        <cylinderGeometry args={[0.03, 0.03, 0.48, 8]} />
        <meshStandardMaterial color="#ff8a2b" />
      </mesh>
      <mesh position={[-0.08, 0.5, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color="#2b3350" />
      </mesh>
      <mesh position={[0.08, 0.62, 0]} rotation-z={-0.9}>
        <cylinderGeometry args={[0.028, 0.028, 0.38, 8]} />
        <meshStandardMaterial color="#ff8a2b" />
      </mesh>
      <mesh position={[0.28, 0.66, 0.02]} rotation-z={-2.3}>
        <coneGeometry args={[0.17, 0.26, 16, 1, true]} />
        <meshStandardMaterial color="#ff8a2b" side={2} roughness={0.35} />
      </mesh>
      <mesh position={[0.33, 0.6, 0.02]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#fff" emissive="#fff3c4" emissiveIntensity={1.5} />
      </mesh>
      <pointLight position={[0.35, 0.5, 0.1]} intensity={3} distance={3} color="#ffd98a" />
    </group>
  ),
  vise: (
    <group>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.35]} />
        <meshStandardMaterial color="#4a5578" />
      </mesh>
      <mesh position={[-0.15, 0.25, 0]}>
        <boxGeometry args={[0.2, 0.3, 0.32]} />
        <meshStandardMaterial color="#3d8bff" />
      </mesh>
      <mesh position={[0.12, 0.25, 0]}>
        <boxGeometry args={[0.2, 0.3, 0.32]} />
        <meshStandardMaterial color="#3d8bff" />
      </mesh>
      <mesh position={[0.4, 0.22, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color="#c9d1e0" metalness={0.8} />
      </mesh>
    </group>
  ),
  radio: (
    <Bob amp={0.03} speed={4}>
      <Table w={0.9} d={0.6} h={0.7} />
      <group position={[0, 0.76, 0]}>
        <RoundedBox args={[0.7, 0.42, 0.3]} radius={0.06} position={[0, 0.21, 0]} castShadow>
          <meshStandardMaterial color="#35d9a0" />
        </RoundedBox>
        <mesh position={[-0.15, 0.21, 0.16]}>
          <circleGeometry args={[0.13, 18]} />
          <meshStandardMaterial color="#1f6b55" />
        </mesh>
        <mesh position={[0.25, 0.6, 0]} rotation-z={-0.4}>
          <cylinderGeometry args={[0.01, 0.01, 0.5, 6]} />
          <meshStandardMaterial color="#c9d1e0" />
        </mesh>
      </group>
    </Bob>
  ),
  clock: (
    <group rotation-x={Math.PI / 2}>
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshStandardMaterial color="#2f63d8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.051, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.01, 32]} />
        <meshStandardMaterial color="#f6ead2" />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.34, 0.06, Math.cos((i / 12) * Math.PI * 2) * 0.34]} rotation-y={(i / 12) * Math.PI * 2}>
          <boxGeometry args={[0.025, 0.01, i % 3 === 0 ? 0.09 : 0.05]} />
          <meshStandardMaterial color="#1b2140" />
        </mesh>
      ))}
      <group position={[0, 0.07, 0]} rotation-x={-Math.PI / 2}>
        <Spin speed={1.2} axis="z">
          <mesh position={[0, 0.15, 0.01]}>
            <boxGeometry args={[0.035, 0.3, 0.01]} />
            <meshStandardMaterial color="#2f63d8" />
          </mesh>
        </Spin>
        <Spin speed={0.1} axis="z">
          <mesh position={[0, 0.1, 0.02]}>
            <boxGeometry args={[0.05, 0.2, 0.01]} />
            <meshStandardMaterial color="#e0453f" />
          </mesh>
        </Spin>
      </group>
    </group>
  ),
  poster: <Poster />,
  toolbox: (
    <group>
      <RoundedBox args={[1.0, 0.5, 0.55]} radius={0.06} position={[0, 0.25, 0]} castShadow>
        <meshStandardMaterial color="#ff4f5e" />
      </RoundedBox>
      <mesh position={[0, 0.25, 0.28]}>
        <boxGeometry args={[0.2, 0.14, 0.02]} />
        <meshStandardMaterial color="#ffd83d" />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <torusGeometry args={[0.2, 0.035, 6, 14, Math.PI]} />
        <meshStandardMaterial color="#2b3350" />
      </mesh>
    </group>
  ),
  plant: (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.26, 0.6, 14]} />
        <meshStandardMaterial color="#ff8a4c" />
      </mesh>
      <Spin speed={0.15}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos(i * 1.3) * 0.15, 0.95, Math.sin(i * 1.3) * 0.15]} rotation={[Math.cos(i) * 0.4, i, Math.sin(i * 1.3) * 0.4]} castShadow>
            <coneGeometry args={[0.16, 0.9, 6]} />
            <meshStandardMaterial color={i % 2 ? '#47b83a' : '#5fcf4f'} flatShading />
          </mesh>
        ))}
      </Spin>
    </group>
  ),
  robot: (
    <Bob amp={0.05} speed={1.6}>
      {/* Colourful toy robot: blue body, yellow chest plate, red joints */}
      <RoundedBox args={[0.56, 0.56, 0.42]} radius={0.08} position={[0, 0.62, 0]} castShadow>
        <meshStandardMaterial color="#2f63d8" />
      </RoundedBox>
      <RoundedBox args={[0.32, 0.28, 0.05]} radius={0.03} position={[0, 0.62, 0.22]}>
        <meshStandardMaterial color="#ffc928" />
      </RoundedBox>
      <Spin speed={0.8}>
        <RoundedBox args={[0.5, 0.38, 0.4]} radius={0.08} position={[0, 1.12, 0]} castShadow>
          <meshStandardMaterial color="#2f63d8" />
        </RoundedBox>
        {[-0.11, 0.11].map((x) => (
          <group key={x} position={[x, 1.14, 0.21]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
              <meshStandardMaterial color="#ffc928" />
            </mesh>
            <mesh position={[0, 0, 0.02]} rotation-x={Math.PI / 2}>
              <circleGeometry args={[0.05, 14]} />
              <meshStandardMaterial color="#1b2140" emissive="#ffd83d" emissiveIntensity={0.25} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.38, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.14, 6]} />
          <meshStandardMaterial color="#3fcf6b" />
        </mesh>
        <mesh position={[0, 1.47, 0]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color="#e0453f" />
        </mesh>
      </Spin>
      {[-0.36, 0.36].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.75, 0]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshStandardMaterial color="#e0453f" />
          </mesh>
          <mesh position={[x * 1.05, 0.52, 0]}>
            <capsuleGeometry args={[0.06, 0.24, 4, 8]} />
            <meshStandardMaterial color="#3fcf6b" />
          </mesh>
        </group>
      ))}
      {[-0.14, 0.14].map((x) => (
        <RoundedBox key={x} args={[0.16, 0.34, 0.22]} radius={0.04} position={[x, 0.17, 0]}>
          <meshStandardMaterial color="#e0453f" />
        </RoundedBox>
      ))}
    </Bob>
  ),
  trophy: (
    <Spin speed={0.6}>
      <RoundedBox args={[0.32, 0.16, 0.32]} radius={0.03} position={[0, 0.08, 0]}>
        <meshStandardMaterial color="#1f2233" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.1, 0.162]}>
        <planeGeometry args={[0.16, 0.06]} />
        <meshStandardMaterial color="#ffc928" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.035, 0.06, 0.16, 10]} />
        <meshStandardMaterial color="#ffc928" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.19, 0.08, 0.28, 16, 1, true]} />
        <meshStandardMaterial color="#ffc928" metalness={0.85} roughness={0.2} side={2} emissive="#7a5200" emissiveIntensity={0.3} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.2, 0.48, 0]} rotation-z={side * 0.2}>
          <torusGeometry args={[0.07, 0.02, 6, 12]} />
          <meshStandardMaterial color="#ffc928" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
    </Spin>
  ),
}

function Table({ w, d, h }: { w: number; d: number; h: number }) {
  return (
    <group>
      <mesh position={[0, h, 0]} castShadow>
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial color="#c9783a" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(sx * (w - 0.12)) / 2, h / 2, (sz * (d - 0.12)) / 2]}>
            <boxGeometry args={[0.07, h, 0.07]} />
            <meshStandardMaterial color="#7a4a2a" />
          </mesh>
        )),
      )}
    </group>
  )
}

function PopIn({ children, fresh }: { children: ReactNode; fresh: boolean }) {
  const ref = useRef<Group>(null)
  const t = useRef(fresh ? 0 : 1)
  useFrame((_, dt) => {
    if (!ref.current) return
    t.current = Math.min(1, t.current + dt * 2.5)
    const k = t.current
    // Overshoot ease so new things land with a bounce.
    ref.current.scale.setScalar(k >= 1 ? 1 : 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2))
  })
  return <group ref={ref}>{children}</group>
}

function DecorSlot({ id }: { id: DecorId }) {
  const owned = useGame((s) => s.profile.decor.includes(id))
  const next = useGame((s) => DECOR.filter((d) => !s.profile.decor.includes(d.id)).slice(0, 2).some((d) => d.id === id))
  const fresh = useGame((s) => s.celebrate?.what === id)
  const open = useGame((s) => s.openSheet)
  const spot = DECOR_SPOTS[id]
  return (
    <group position={spot.pos} rotation-y={spot.rot ?? 0}>
      {owned ? (
        <PopIn fresh={fresh}>{decorModels[id]}</PopIn>
      ) : next ? (
        <mesh
          position={[0, 0.3, 0]}
          onClick={(e) => {
            if (!isTap(e)) return
            e.stopPropagation()
            open('decor')
          }}
        >
          <boxGeometry args={[0.7, 0.6, 0.7]} />
          <meshStandardMaterial color="#8fd0ff" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  )
}

/* ---------- Stations with level badges ---------- */

function Station({ id }: { id: UpgradeId }) {
  const level = useGame((s) => s.profile.upgrades[id])
  const fresh = useGame((s) => s.celebrate?.what === id && s.celebrate.seq)
  const focus = useGame((s) => s.focusSpot)
  const open = useGame((s) => s.openSheet)
  const st = STATIONS[id]
  const Model = STATION_MODELS[id]
  const select = () => {
    focus(id)
    open('skills')
  }
  return (
    <group
      position={st.pos}
      rotation-y={st.rot}
      onClick={(e) => {
        if (!isTap(e)) return
        e.stopPropagation()
        select()
      }}
    >
      <PopIn key={`${level}-${fresh || 0}`} fresh={!!fresh}>
        <Model level={level} />
      </PopIn>
    </group>
  )
}

export function Room() {
  return (
    <group>
      <Walls />
      <Bench />
      <JobModel />
      {UPGRADE_IDS.map((id) => (
        <Station key={id} id={id} />
      ))}
      {DECOR.map((d) => (
        <DecorSlot key={d.id} id={d.id} />
      ))}
    </group>
  )
}
