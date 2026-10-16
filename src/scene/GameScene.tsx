import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { NeutralToneMapping, PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { stepPhysics } from '../game/physics'
import { useGame } from '../game/store'
import { Backdrop, Board, Boxes, FitCamera, Tray } from './Field'
import { Stats } from './Stats'
import { AdaptiveDpr, maxDpr } from './AdaptiveDpr'
import { Particles } from './Particles'
import { Plate } from './Plate'
import { Screw } from './Screw'
import { Screwdriver } from './Screwdriver'

/** Studio reflections generated locally, so shiny screws work offline. */
function Env() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.55
    return () => {
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

function Physics() {
  useFrame((_, dt) => stepPhysics(dt))
  return null
}

function Level() {
  const level = useGame((s) => s.game.level)
  return (
    <group>
      {level.plates.map((p) => (
        <Plate key={p.id} def={p} />
      ))}
      {level.plates.flatMap((p) => p.screws.map((s) => <Screw key={s.id} id={s.id} />))}
    </group>
  )
}

export function GameScene({ active }: { active: boolean }) {
  const runId = useGame((s) => s.runId)
  const high = useGame((s) => s.profile.settings.quality === 'high')
  return (
    <Canvas frameloop={active ? 'always' : 'never'} shadows={high} dpr={maxDpr(high)} gl={{ toneMapping: NeutralToneMapping, antialias: !high || maxDpr(high) < 2, powerPreference: 'high-performance' }} camera={{ fov: 38, near: 0.1, far: 100 }}>
      <color attach="background" args={['#18213d']} />
      <Env />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[4, 6, 12]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />
      <AdaptiveDpr high={high} />
      <FitCamera />
      <Physics />
      <Backdrop />
      <Board />
      <group key={runId}>
        <Level />
        <Boxes />
      </group>
      <Tray />
      <Screwdriver />
      <Particles />
      {import.meta.env.DEV && <Stats name="game" />}
    </Canvas>
  )
}
