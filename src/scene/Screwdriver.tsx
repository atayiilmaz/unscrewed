import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Quaternion, Vector3, type Group } from 'three'
import { useGame } from '../game/store'
import type { Head } from '../game/types'
import { plateZ, SCREW_Z_ABOVE_PLATE, unscrewSeconds } from './layout'

/** Handle colour per bit, so the tool in hand matches the belt. */
const HANDLE: Record<Head, string> = { phillips: '#ff4f5e', flat: '#ffc928', hex: '#3d8bff', torx: '#3fcf6b' }

/** The tool leans toward the camera and to the right so it reads as a screwdriver, not a dot. */
const AXIS = new Vector3(0.5, -0.35, 1).normalize()
const ORIENT = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), AXIS)
const APPROACH_S = 0.09
const LEAVE_S = 0.22
const RUST_S = 0.18

/**
 * A screwdriver that drops onto the tapped screw, turns it out (following it up), then lifts away.
 * Modelled along +Y with the tip at the origin.
 */
export function Screwdriver() {
  const outer = useRef<Group>(null)
  const spin = useRef<Group>(null)
  const anim = useRef({ seq: 0, start: -1, kind: 'out' as 'out' | 'rust', at: new Vector3() })
  const bit = useGame((s) => s.game.bit)

  useFrame(({ clock }) => {
    const g = outer.current
    const sp = spin.current
    if (!g || !sp) return
    const { turn, game, profile } = useGame.getState()
    const a = anim.current
    const now = clock.elapsedTime

    if (turn && turn.seq !== a.seq) {
      a.seq = turn.seq
      a.start = now
      a.kind = turn.kind
      const screw = game.screws[turn.screwId]
      const layer = game.plates[screw.plateId].def.layer
      a.at.set(screw.def.x, screw.def.y, plateZ(layer) + SCREW_Z_ABOVE_PLATE + 0.16)
    }
    if (a.start < 0) {
      g.visible = false
      return
    }

    const work = a.kind === 'rust' ? RUST_S : unscrewSeconds(profile.upgrades.speed)
    const t = now - a.start
    const total = APPROACH_S + work + LEAVE_S
    if (t > total) {
      a.start = -1
      g.visible = false
      return
    }
    g.visible = true

    let lift = 0
    let rise = 0
    let jiggle = 0
    if (t < APPROACH_S) {
      lift = (1 - t / APPROACH_S) * 1.2
    } else if (t < APPROACH_S + work) {
      const k = (t - APPROACH_S) / work
      if (a.kind === 'out') {
        sp.rotation.y = -k * Math.PI * 4
        rise = k * 0.9
      } else {
        // Rusty: strains back and forth without giving.
        sp.rotation.y = Math.sin(k * Math.PI * 6) * 0.35
        jiggle = Math.sin(k * 80) * 0.03
      }
    } else {
      const k = (t - APPROACH_S - work) / LEAVE_S
      lift = k * 1.6
      rise = a.kind === 'out' ? 0.9 : 0
    }
    g.position.copy(a.at).addScaledVector(AXIS, lift)
    g.position.z += rise
    g.position.x += jiggle
    g.scale.setScalar(1.35 * (t > APPROACH_S + work ? 1 - ((t - APPROACH_S - work) / LEAVE_S) * 0.4 : 1))
  })

  const handle = HANDLE[bit]
  return (
    <group ref={outer} quaternion={ORIENT} scale={1.35} visible={false}>
      <group ref={spin}>
        {/* Tip and shaft */}
        <mesh position={[0, 0.06, 0]}>
          <coneGeometry args={[0.08, 0.14, 12]} />
          <meshStandardMaterial color="#d9dee8" metalness={0.95} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 1.4, 14]} />
          <meshStandardMaterial color="#d9dee8" metalness={0.95} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.55, 0]}>
          <cylinderGeometry args={[0.13, 0.1, 0.3, 18]} />
          <meshStandardMaterial color="#9aa3b2" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Grippy handle */}
        <mesh position={[0, 2.3, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.2, 1.3, 20]} />
          <meshStandardMaterial color={handle} roughness={0.35} />
        </mesh>
        {[1.85, 2.1, 2.35, 2.6].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <torusGeometry args={[0.235, 0.025, 6, 20]} />
            <meshStandardMaterial color="#1b2140" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 2.98, 0]}>
          <sphereGeometry args={[0.24, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={handle} roughness={0.35} />
        </mesh>
      </group>
    </group>
  )
}
