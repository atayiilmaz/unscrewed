import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3, type OrthographicCamera } from 'three'
import { useGame } from '../game/store'
import { Stats } from '../scene/Stats'
import { AdaptiveDpr, maxDpr } from '../scene/AdaptiveDpr'
import { Particles } from '../scene/Particles'
import { LabelProjector } from './labels'
import { Mechanic } from './Mechanic'
import { Room } from './Room'
import { World } from './World'

/** Isometric view direction (from target to camera). */
const VIEW = new Vector3(1, 1.05, 1).normalize()
const PAN_LIMIT = 9
const DRAG_THRESHOLD_PX = 10
/** World units across the screen at zoom 1 (portrait phones). */
const BASE_SPAN = 16

/** Resolves once the workshop has drawn a few frames (shaders compiled), for the loader. */
let markReady: () => void = () => {}
export const homeReady = new Promise<void>((r) => (markReady = r))

function ReadySignal() {
  const frames = useRef(0)
  useFrame(() => {
    if (++frames.current === 3) markReady()
  })
  return null
}

/**
 * Everything that casts a shadow in the workshop is static, so the shadow map is redrawn only
 * after something changes (boot, purchases, level-ups) instead of every frame.
 */
function ShadowsOnDemand() {
  const { gl } = useThree()
  const until = useRef(0)
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    until.current = performance.now() + 1500
    return useGame.subscribe((s, prev) => {
      if (s.profile.decor !== prev.profile.decor || s.profile.upgrades !== prev.profile.upgrades) until.current = performance.now() + 1200
    })
  }, [gl])
  useFrame(() => {
    if (performance.now() < until.current) gl.shadowMap.needsUpdate = true
  })
  return null
}

export const cameraTarget = { x: 1.1, z: 1.1, zoom: 1, goalX: 1.1, goalZ: 1.1 }

/** Drag to pan, pinch or wheel to zoom; eases toward whatever the player tapped. */
function CameraRig() {
  const { camera, gl, size } = useThree()
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef(0)
  /** A pan starts only after the finger travels this far, so taps never nudge the camera. */
  const dragging = useRef(false)
  const travel = useRef(0)

  useEffect(() => {
    const el = gl.domElement
    const right = new Vector3(1, 0, -1).normalize()
    const down = new Vector3(1, 0, 1).normalize()
    const down2 = () => {
      const ps = [...pointers.current.values()]
      return ps.length === 2 ? Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) : 0
    }
    const onDown = (e: PointerEvent) => {
      if (pointers.current.size === 0) {
        dragging.current = false
        travel.current = 0
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      pinch.current = down2()
    }
    const onMove = (e: PointerEvent) => {
      const prev = pointers.current.get(e.pointerId)
      if (!prev) return
      const dx = e.clientX - prev.x
      const dy = e.clientY - prev.y
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.current.size === 2) {
        const d = down2()
        if (pinch.current > 0) cameraTarget.zoom = Math.min(1.9, Math.max(0.6, cameraTarget.zoom * (d / pinch.current)))
        pinch.current = d
        return
      }
      travel.current += Math.hypot(dx, dy)
      if (!dragging.current) {
        if (travel.current < DRAG_THRESHOLD_PX) return
        dragging.current = true
      }
      const unit = BASE_SPAN / (Math.min(size.width, size.height * 0.62) * cameraTarget.zoom)
      cameraTarget.goalX = Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, cameraTarget.goalX - (right.x * dx + down.x * dy * 1.4) * unit))
      cameraTarget.goalZ = Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, cameraTarget.goalZ - (right.z * dx + down.z * dy * 1.4) * unit))
    }
    const onUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId)
      pinch.current = down2()
    }
    const onWheel = (e: WheelEvent) => {
      cameraTarget.zoom = Math.min(1.9, Math.max(0.6, cameraTarget.zoom * (e.deltaY > 0 ? 0.92 : 1.08)))
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl, size.width])

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 6)
    cameraTarget.x += (cameraTarget.goalX - cameraTarget.x) * k
    cameraTarget.z += (cameraTarget.goalZ - cameraTarget.z) * k
    const cam = camera as OrthographicCamera
    cam.position.set(cameraTarget.x + VIEW.x * 40, VIEW.y * 40, cameraTarget.z + VIEW.z * 40)
    cam.lookAt(cameraTarget.x, 0, cameraTarget.z)
    // Landscape screens (desktop browsers) frame the room by height so it is not blown up.
    const zoom = (Math.min(size.width, size.height * 0.62) / BASE_SPAN) * cameraTarget.zoom
    if (Math.abs(cam.zoom - zoom) > 0.01) {
      cam.zoom += (zoom - cam.zoom) * k
      cam.updateProjectionMatrix()
    }
  })
  return null
}

export function HomeScene() {
  const quality = useGame((s) => s.profile.settings.quality)
  const high = quality === 'high'
  return (
    <Canvas
      className="home-canvas"
      orthographic
      shadows={high}
      dpr={maxDpr(high)}
      gl={{ antialias: !high || maxDpr(high) < 2, powerPreference: 'high-performance' }}
      camera={{ position: [40, 40, 40], zoom: 25, near: 0.1, far: 200 }}
    >
      <color attach="background" args={['#9fd4ff']} />
      <fog attach="fog" args={['#9fd4ff', 70, 110]} />
      <hemisphereLight args={['#dff1ff', '#6b8f5a', 1.1]} />
      <directionalLight
        position={[12, 22, 8]}
        intensity={2.2}
        color="#fff4dc"
        castShadow={high}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0004}
      />
      <AdaptiveDpr high={high} />
      <CameraRig />
      {high && <ShadowsOnDemand />}
      <ReadySignal />
      <World />
      <Room />
      <Mechanic />
      <Particles />
      {import.meta.env.DEV && <Stats name="home" />}
      <LabelProjector />
    </Canvas>
  )
}
