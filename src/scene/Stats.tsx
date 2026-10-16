import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'

/**
 * Dev-only renderer stats for automated performance checks: draw calls, triangles, programs and
 * a rolling average frame time, published on window.__stats[name].
 */
export function Stats({ name }: { name: string }) {
  const { gl, scene } = useThree()
  const times = useRef<number[]>([])
  const last = useRef(performance.now())
  useFrame(() => {
    const now = performance.now()
    times.current.push(now - last.current)
    last.current = now
    if (times.current.length > 120) times.current.shift()
    const avg = times.current.reduce((a, b) => a + b, 0) / times.current.length
    const w = window as unknown as { __stats?: Record<string, unknown> }
    w.__stats ??= {}
    w.__stats[name] = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      programs: gl.info.programs?.length ?? 0,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      frameMs: +avg.toFixed(1),
    }
    ;(w as unknown as { __scenes?: Record<string, unknown> }).__scenes = { ...((w as unknown as { __scenes?: object }).__scenes ?? {}), [name]: scene }
  })
  return null
}
