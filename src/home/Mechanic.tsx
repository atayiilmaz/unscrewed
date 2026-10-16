import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { rankOf } from '../game/profile'
import { useGame, type Spot } from '../game/store'
import { emit } from '../scene/Particles'
import { RANK_COLORS } from '../ui/art'
import { BENCH, HUB, SPOTS } from './layout'

/**
 * The workshop mechanic: a jointed low-poly figure animated procedurally. He works at the bench,
 * wanders off to use a station now and then, walks to whatever the player taps, and cheers when
 * something is bought.
 */

const SKIN = '#f5c6a0'
const BLUSH = '#f29a8a'
const HAIR = '#5a3420'
const DENIM = '#2f63d8'
const DENIM_LIGHT = '#4a7ef0'
const SHIRT = '#f4efe6'
const BOOT = '#7a4626'
const SOLE = '#3b2412'
const BUTTON = '#ffc928'
/** Hip height: chibi proportions, the head is about a third of his height. */
const HIP = 0.6
const WALK_SPEED = 2.2

type Action = 'idle' | 'walk' | 'work' | 'reach' | 'spray' | 'type' | 'drill' | 'bend' | 'cheer'

const ACTION_AT: Record<Spot, Action> = {
  bench: 'work',
  kit: 'reach',
  tray: 'bend',
  rust: 'spray',
  coin: 'type',
  speed: 'drill',
}

interface Brain {
  x: number
  z: number
  heading: number
  action: Action
  /** Waypoints still to walk, then what to do on arrival. */
  path: Array<[number, number]>
  goal: Spot
  until: number
  phase: number
  lastFocus: number
  lastCelebrate: number
  nextSpark: number
}

function Limb({ len, r, color }: { len: number; r: number; color: string }) {
  return (
    <mesh position={[0, -len / 2, 0]} castShadow>
      <capsuleGeometry args={[r, len - r * 2, 4, 10]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  )
}

export function Mechanic() {
  const rank = useGame((s) => rankOf(s.profile).idx)
  const suit = RANK_COLORS[rank]

  const root = useRef<Group>(null)
  const hips = useRef<Group>(null)
  const torso = useRef<Group>(null)
  const head = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const elbowL = useRef<Group>(null)
  const elbowR = useRef<Group>(null)
  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const kneeL = useRef<Group>(null)
  const kneeR = useRef<Group>(null)
  const tool = useRef<Group>(null)
  const eyes = useRef<Group>(null)

  const brain = useRef<Brain>({
    x: SPOTS.bench.stand[0],
    z: SPOTS.bench.stand[1],
    heading: SPOTS.bench.face,
    action: 'work',
    path: [],
    goal: 'bench',
    until: 6,
    phase: 0,
    lastFocus: 0,
    lastCelebrate: 0,
    nextSpark: 0,
  })

  const goTo = (b: Brain, spot: Spot) => {
    const target = SPOTS[spot].stand
    const far = Math.hypot(target[0] - b.x, target[1] - b.z) > 0.2
    // Route through the open middle of the room so he never cuts through the bench.
    b.path = far ? [HUB, target] : [target]
    if (Math.hypot(HUB[0] - b.x, HUB[1] - b.z) < 1.5 || Math.hypot(HUB[0] - target[0], HUB[1] - target[1]) < 1.5) b.path = [target]
    b.goal = spot
    b.action = 'walk'
  }

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const now = clock.elapsedTime
    const b = brain.current
    const { focus, celebrate, profile } = useGame.getState()

    // Player intent first: walk to the tapped station, cheer after a purchase.
    if (focus && focus.seq !== b.lastFocus) {
      b.lastFocus = focus.seq
      goTo(b, focus.spot)
    }
    if (celebrate && celebrate.seq !== b.lastCelebrate) {
      b.lastCelebrate = celebrate.seq
      if (b.action !== 'walk') {
        b.action = 'cheer'
        b.until = now + 1.4
      }
    }

    if (b.action === 'walk') {
      const [tx, tz] = b.path[0]
      const dx = tx - b.x
      const dz = tz - b.z
      const dist = Math.hypot(dx, dz)
      const step = WALK_SPEED * dt
      const want = Math.atan2(dx, dz)
      b.heading += Math.atan2(Math.sin(want - b.heading), Math.cos(want - b.heading)) * Math.min(1, dt * 10)
      if (dist <= step) {
        b.x = tx
        b.z = tz
        b.path.shift()
        if (b.path.length === 0) {
          b.action = ACTION_AT[b.goal]
          b.until = now + (b.goal === 'bench' ? 7 + Math.random() * 6 : 2.5 + Math.random() * 1.5)
        }
      } else {
        b.x += (dx / dist) * step
        b.z += (dz / dist) * step
      }
      b.phase += dt * 9
    } else {
      // Turn to face the work.
      const face = SPOTS[b.goal].face
      b.heading += Math.atan2(Math.sin(face - b.heading), Math.cos(face - b.heading)) * Math.min(1, dt * 6)
      b.phase += dt * 6
      if (now > b.until) {
        if (b.action === 'cheer') {
          b.action = ACTION_AT[b.goal]
          b.until = now + 3
        } else if (b.goal === 'bench') {
          // Wander to a station that has been upgraded at least once, or any if none.
          const owned = (Object.keys(profile.upgrades) as Array<keyof typeof profile.upgrades>).filter((k) => profile.upgrades[k] > 0)
          const pool = owned.length > 0 ? owned : (Object.keys(profile.upgrades) as Spot[])
          goTo(b, pool[Math.floor(Math.random() * pool.length)])
        } else {
          goTo(b, 'bench')
        }
      }
    }

    // Sparks fly while he works at the bench.
    if (b.action === 'work' && now > b.nextSpark) {
      b.nextSpark = now + 0.5 + Math.random() * 0.7
      emit('sparks', BENCH.pos[0] + (Math.random() - 0.5) * 0.4, BENCH.top + 0.15, BENCH.pos[2] + 0.35, ['#ffe08a', '#ffffff', '#ffb02e'])
    }

    pose(b, now)
  })

  /** Sets every joint for the current action. */
  const pose = (b: Brain, now: number) => {
    const r = root.current
    if (!r || !hips.current || !torso.current || !head.current) return
    const p = b.phase
    let hipY = HIP
    let lean = 0
    let headYaw = 0
    let headPitch = 0
    let jump = 0
    const set = (g: Group | null, x: number, y = 0, z = 0) => g && g.rotation.set(x, y, z)

    switch (b.action) {
      case 'walk': {
        const s = Math.sin(p)
        set(legL.current, s * 0.7)
        set(legR.current, -s * 0.7)
        set(kneeL.current, Math.max(0, -Math.cos(p)) * 0.9)
        set(kneeR.current, Math.max(0, Math.cos(p)) * 0.9)
        set(armL.current, -s * 0.6, 0, 0.12)
        set(armR.current, s * 0.6, 0, -0.12)
        set(elbowL.current, -0.4)
        set(elbowR.current, -0.4)
        hipY += Math.abs(Math.cos(p)) * 0.045
        lean = 0.08
        break
      }
      case 'work': {
        // Leaning over the bench, right hand turning a screwdriver, left hand steadying the job.
        set(legL.current, 0.05)
        set(legR.current, -0.05)
        set(kneeL.current, 0.1)
        set(kneeR.current, 0.1)
        set(armL.current, -1.1, 0, 0.3)
        set(elbowL.current, -0.5)
        set(armR.current, -1.25, 0, -0.2)
        set(elbowR.current, -0.6, Math.sin(now * 14) * 0.6)
        lean = 0.35
        headPitch = 0.15
        hipY -= 0.03
        break
      }
      case 'reach': {
        const up = (Math.sin(p * 0.6) + 1) / 2
        set(legL.current, 0)
        set(legR.current, 0)
        set(kneeL.current, 0)
        set(kneeR.current, 0)
        set(armR.current, -2.6 + up * 0.5, 0, -0.1)
        set(elbowR.current, -0.2)
        set(armL.current, 0.1, 0, 0.15)
        set(elbowL.current, -0.2)
        headPitch = -0.35
        break
      }
      case 'bend': {
        set(legL.current, -0.5)
        set(legR.current, -0.5)
        set(kneeL.current, 1.0)
        set(kneeR.current, 1.0)
        set(armL.current, -1.0, 0, 0.2)
        set(armR.current, -1.0 + Math.sin(p) * 0.25, 0, -0.2)
        set(elbowL.current, -0.4)
        set(elbowR.current, -0.4)
        hipY -= 0.16
        lean = 0.5
        headPitch = 0.3
        break
      }
      case 'spray': {
        set(legL.current, 0.15)
        set(legR.current, -0.15)
        set(kneeL.current, 0.05)
        set(kneeR.current, 0.05)
        set(armR.current, -1.45, Math.sin(p * 1.5) * 0.4, -0.1)
        set(elbowR.current, -0.1)
        set(armL.current, 0.2, 0, 0.2)
        set(elbowL.current, -0.3)
        lean = 0.15
        headPitch = 0.2
        break
      }
      case 'type': {
        set(legL.current, 0)
        set(legR.current, 0)
        set(kneeL.current, 0)
        set(kneeR.current, 0)
        set(armL.current, -0.9 + Math.sin(now * 18) * 0.08, 0, 0.25)
        set(armR.current, -0.9 + Math.cos(now * 18) * 0.08, 0, -0.25)
        set(elbowL.current, -0.8)
        set(elbowR.current, -0.8)
        lean = 0.12
        headPitch = 0.05
        break
      }
      case 'drill': {
        const buzz = Math.sin(now * 60) * 0.01
        set(legL.current, 0.2)
        set(legR.current, -0.2)
        set(kneeL.current, 0.15)
        set(kneeR.current, 0.15)
        set(armL.current, -1.3, 0, 0.3)
        set(armR.current, -1.3, 0, -0.3)
        set(elbowL.current, -0.3)
        set(elbowR.current, -0.3)
        lean = 0.2 + buzz * 4
        hipY += buzz
        break
      }
      case 'cheer': {
        const k = (Math.sin(now * 9) + 1) / 2
        jump = k * 0.35
        set(legL.current, -0.2 * k)
        set(legR.current, -0.2 * k)
        set(kneeL.current, 0.6 * k)
        set(kneeR.current, 0.6 * k)
        set(armL.current, -2.9, 0, 0.35 + k * 0.2)
        set(armR.current, -2.9, 0, -0.35 - k * 0.2)
        set(elbowL.current, 0)
        set(elbowR.current, 0)
        headPitch = -0.3
        break
      }
      default: {
        set(legL.current, 0)
        set(legR.current, 0)
        set(kneeL.current, 0)
        set(kneeR.current, 0)
        set(armL.current, 0, 0, 0.1)
        set(armR.current, 0, 0, -0.1)
        set(elbowL.current, -0.15)
        set(elbowR.current, -0.15)
      }
    }
    // Breathing and glancing around keep him alive even when still.
    if (b.action !== 'walk' && b.action !== 'work') headYaw = Math.sin(now * 0.7) * 0.35
    r.position.set(b.x, jump, b.z)
    r.rotation.y = b.heading
    hips.current.position.y = hipY + Math.sin(now * 2.2) * 0.008
    torso.current.rotation.x = lean
    head.current.rotation.set(headPitch, headYaw, 0)
    if (tool.current) tool.current.visible = b.action !== 'type'
    // Blink every few seconds.
    if (eyes.current) eyes.current.scale.y = (now + 0.7) % 3.6 < 0.13 ? 0.12 : 1
  }

  return (
    <group ref={root} scale={1.15}>
      {/* Contact shadow blob */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.42, 20]} />
        <meshBasicMaterial color="#000" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <group ref={hips} position={[0, HIP, 0]}>
        {/* Legs: denim with rolled cuffs, chunky boots */}
        {([
          [legL, kneeL, -0.15],
          [legR, kneeR, 0.15],
        ] as const).map(([leg, knee, x], i) => (
          <group key={i} ref={leg} position={[x, 0, 0]}>
            <Limb len={0.3} r={0.12} color={DENIM} />
            <group ref={knee} position={[0, -0.27, 0]}>
              <Limb len={0.22} r={0.11} color={DENIM} />
              <mesh position={[0, -0.17, 0]}>
                <cylinderGeometry args={[0.125, 0.125, 0.07, 14]} />
                <meshStandardMaterial color={DENIM_LIGHT} roughness={0.8} />
              </mesh>
              <RoundedBox args={[0.22, 0.13, 0.32]} radius={0.06} position={[0, -0.26, 0.05]} castShadow>
                <meshStandardMaterial color={BOOT} roughness={0.7} />
              </RoundedBox>
              <mesh position={[0, -0.32, 0.05]}>
                <boxGeometry args={[0.23, 0.035, 0.33]} />
                <meshStandardMaterial color={SOLE} />
              </mesh>
            </group>
          </group>
        ))}

        <group ref={torso}>
          {/* Round belly in overalls, white tee on top */}
          <mesh position={[0, 0.17, 0]} scale={[1, 0.9, 0.85]} castShadow>
            <sphereGeometry args={[0.36, 20, 16]} />
            <meshStandardMaterial color={DENIM} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.42, 0]} scale={[1, 0.8, 0.85]} castShadow>
            <sphereGeometry args={[0.32, 20, 16]} />
            <meshStandardMaterial color={SHIRT} roughness={0.9} />
          </mesh>
          {/* Bib, straps, screw buttons and the screwdriver in the pocket */}
          <RoundedBox args={[0.34, 0.28, 0.08]} radius={0.04} position={[0, 0.36, 0.26]}>
            <meshStandardMaterial color={DENIM} roughness={0.8} />
          </RoundedBox>
          <RoundedBox args={[0.16, 0.1, 0.03]} radius={0.015} position={[0.04, 0.32, 0.31]}>
            <meshStandardMaterial color={DENIM_LIGHT} roughness={0.8} />
          </RoundedBox>
          <mesh position={[0.08, 0.42, 0.3]} rotation-z={-0.15}>
            <cylinderGeometry args={[0.022, 0.022, 0.12, 8]} />
            <meshStandardMaterial color="#ff4f5e" />
          </mesh>
          {[-0.13, 0.13].map((x) => (
            <group key={x}>
              <mesh position={[x, 0.55, 0.12]} rotation-x={0.5}>
                <boxGeometry args={[0.07, 0.3, 0.03]} />
                <meshStandardMaterial color={DENIM} roughness={0.8} />
              </mesh>
              <mesh position={[x, 0.48, 0.29]} rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.04, 0.04, 0.025, 14]} />
                <meshStandardMaterial color={BUTTON} metalness={0.4} roughness={0.3} />
              </mesh>
            </group>
          ))}

          {/* Head */}
          <group ref={head} position={[0, 0.9, 0.02]}>
            <mesh castShadow scale={[1, 0.96, 0.94]}>
              <sphereGeometry args={[0.34, 24, 20]} />
              <meshStandardMaterial color={SKIN} roughness={0.75} />
            </mesh>
            {/* Curly hair around the back and sides */}
            {[
              [-0.26, -0.02, -0.12],
              [0.26, -0.02, -0.12],
              [-0.18, -0.06, -0.24],
              [0.18, -0.06, -0.24],
              [0, -0.04, -0.3],
              [-0.3, 0.08, -0.02],
              [0.3, 0.08, -0.02],
            ].map(([x, y, z], i) => (
              <mesh key={i} position={[x, y, z]}>
                <sphereGeometry args={[0.11, 10, 8]} />
                <meshStandardMaterial color={HAIR} roughness={0.9} />
              </mesh>
            ))}
            {/* Ears */}
            {[-0.33, 0.33].map((x) => (
              <mesh key={x} position={[x, -0.02, 0.02]} scale={[0.6, 1, 0.8]}>
                <sphereGeometry args={[0.08, 10, 8]} />
                <meshStandardMaterial color={SKIN} />
              </mesh>
            ))}
            {/* Eyes, brows, cheeks */}
            <group ref={eyes}>
              {[-0.11, 0.11].map((x) => (
                <group key={x} position={[x, 0.05, 0.28]}>
                  <mesh scale={[1, 1.15, 0.5]}>
                    <sphereGeometry args={[0.065, 14, 10]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.3} />
                  </mesh>
                  <mesh position={[0, -0.005, 0.03]} scale={[1, 1.1, 0.5]}>
                    <sphereGeometry args={[0.042, 12, 10]} />
                    <meshStandardMaterial color="#3b2412" roughness={0.3} />
                  </mesh>
                  <mesh position={[0.012, 0.015, 0.05]}>
                    <sphereGeometry args={[0.012, 6, 6]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                  <mesh position={[0, 0.1, 0.01]} rotation-z={x < 0 ? -0.12 : 0.12}>
                    <capsuleGeometry args={[0.022, 0.08, 4, 8]} />
                    <meshStandardMaterial color={HAIR} />
                  </mesh>
                </group>
              ))}
              {[-0.2, 0.2].map((x) => (
                <mesh key={x} position={[x, -0.07, 0.24]} scale={[1, 0.6, 0.3]}>
                  <sphereGeometry args={[0.06, 10, 8]} />
                  <meshStandardMaterial color={BLUSH} transparent opacity={0.7} />
                </mesh>
              ))}
            </group>
            {/* Big round nose and a bushy moustache */}
            <mesh position={[0, -0.04, 0.33]}>
              <sphereGeometry args={[0.085, 14, 12]} />
              <meshStandardMaterial color="#f2a98a" roughness={0.6} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * 0.085, -0.13, 0.29]} rotation-z={side * -0.35} scale={[1.5, 0.75, 0.7]}>
                <sphereGeometry args={[0.07, 12, 10]} />
                <meshStandardMaterial color={HAIR} roughness={0.9} />
              </mesh>
            ))}
            {/* Cap in the rank colour with a leather patch, pushed back so the face reads from above */}
            <group position={[0, 0.13, -0.04]} rotation-x={-0.42}>
              <mesh scale={[1, 0.8, 1]}>
                <sphereGeometry args={[0.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={suit} roughness={0.6} />
              </mesh>
              {/* Brim: a half disc sticking out of the front */}
              <mesh position={[0, 0.0, 0.3]} rotation-x={0.05}>
                <cylinderGeometry args={[0.2, 0.2, 0.035, 20, 1, false, -Math.PI / 2, Math.PI]} />
                <meshStandardMaterial color={suit} roughness={0.6} />
              </mesh>
              <RoundedBox args={[0.15, 0.085, 0.03]} radius={0.02} position={[0, 0.13, 0.29]} rotation-x={-0.45}>
                <meshStandardMaterial color="#6b3f22" />
              </RoundedBox>
              <mesh position={[0, 0.28, 0]}>
                <sphereGeometry args={[0.035, 8, 6]} />
                <meshStandardMaterial color={suit} />
              </mesh>
            </group>
          </group>

          {/* Arms: short white sleeves, chubby hands; the right hand holds a screwdriver */}
          {([
            [armL, elbowL, -0.36, false],
            [armR, elbowR, 0.36, true],
          ] as const).map(([arm, elbow, x, right], i) => (
            <group key={i} ref={arm} position={[x, 0.5, 0]}>
              <mesh position={[0, -0.06, 0]}>
                <sphereGeometry args={[0.11, 12, 10]} />
                <meshStandardMaterial color={SHIRT} roughness={0.9} />
              </mesh>
              <Limb len={0.24} r={0.075} color={SKIN} />
              <group ref={elbow} position={[0, -0.22, 0]}>
                <Limb len={0.2} r={0.07} color={SKIN} />
                <mesh position={[0, -0.22, 0]}>
                  <sphereGeometry args={[0.09, 12, 10]} />
                  <meshStandardMaterial color={SKIN} />
                </mesh>
                {right && (
                  <group ref={tool} position={[0, -0.26, 0.05]} rotation-x={Math.PI / 2}>
                    <mesh position={[0, 0.04, 0]}>
                      <cylinderGeometry args={[0.045, 0.04, 0.16, 10]} />
                      <meshStandardMaterial color="#ff4f5e" />
                    </mesh>
                    <mesh position={[0, 0.13, 0]}>
                      <cylinderGeometry args={[0.042, 0.042, 0.03, 10]} />
                      <meshStandardMaterial color="#ffc928" />
                    </mesh>
                    <mesh position={[0, 0.25, 0]}>
                      <cylinderGeometry args={[0.013, 0.013, 0.2, 6]} />
                      <meshStandardMaterial color="#d9dee8" metalness={0.9} roughness={0.2} />
                    </mesh>
                  </group>
                )}
              </group>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}
