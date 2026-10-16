import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { BufferAttribute, BufferGeometry, Color, Matrix4, Mesh, MeshStandardMaterial, type Group, type Material, type Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Collapses a static subtree into a handful of meshes so it costs a few draw calls instead of one
 * per part. Meshes are grouped by everything that cannot be baked (texture, transparency,
 * roughness, emission, shadow flags); their colours go into vertex colours, so differently
 * coloured parts still share one draw.
 *
 * The originals stay in the tree but are hidden (they still receive taps). Mark moving parts with
 * `userData={{ noMerge: true }}` to leave them, and their children, alone. Remount (change `key`)
 * when the content changes.
 */
export function StaticMerge({ children }: { children: ReactNode }) {
  const root = useRef<Group>(null)

  useLayoutEffect(() => {
    const group = root.current
    if (!group) return
    group.updateWorldMatrix(true, true)
    const toLocal = new Matrix4().copy(group.matrixWorld).invert()

    const buckets = new Map<string, { material: MeshStandardMaterial; geos: BufferGeometry[]; cast: boolean; receive: boolean }>()
    const hidden: Object3D[] = []

    const visit = (o: Object3D) => {
      if (o.userData.noMerge || o.userData.merged) return
      const mesh = o as Mesh
      if (mesh.isMesh && !('isInstancedMesh' in mesh) && mesh.visible && !Array.isArray(mesh.material)) {
        const mat = mesh.material as Material
        if (mat instanceof MeshStandardMaterial && !mat.vertexColors) {
          const key = [
            mat.type,
            mat.map?.uuid ?? '',
            mat.transparent ? mat.opacity.toFixed(2) : 'o',
            mat.roughness.toFixed(2),
            mat.metalness.toFixed(2),
            mat.emissiveIntensity > 0 ? mat.emissive.getHexString() + mat.emissiveIntensity.toFixed(2) : '',
            mat.flatShading ? 'f' : '',
            mat.side,
            mesh.castShadow ? 'c' : '',
            mesh.receiveShadow ? 'r' : '',
          ].join('|')
          let bucket = buckets.get(key)
          if (!bucket) {
            const material = mat.clone() as MeshStandardMaterial
            material.vertexColors = true
            // With a map the texture already carries colour; tinting is multiplied in per vertex.
            material.color = new Color(1, 1, 1)
            bucket = { material, geos: [], cast: mesh.castShadow, receive: mesh.receiveShadow }
            buckets.set(key, bucket)
          }
          bucket.geos.push(bake(mesh, toLocal, mat.color))
          hidden.push(mesh)
          // Its children may be static too; keep visiting.
        }
      }
      for (const child of o.children) visit(child)
    }
    for (const child of group.children) visit(child)

    const merged: Mesh[] = []
    for (const { material, geos, cast, receive } of buckets.values()) {
      const geometry = mergeGeometries(geos, false)
      for (const g of geos) g.dispose()
      if (!geometry) continue
      const m = new Mesh(geometry, material)
      m.castShadow = cast
      m.receiveShadow = receive
      m.userData.merged = true
      m.matrixAutoUpdate = false
      merged.push(m)
      group.add(m)
    }
    for (const h of hidden) {
      h.visible = false
      h.matrixAutoUpdate = false
    }

    return () => {
      for (const m of merged) {
        group.remove(m)
        m.geometry.dispose()
        ;(m.material as Material).dispose()
      }
      for (const h of hidden) {
        h.visible = true
        h.matrixAutoUpdate = true
      }
    }
  }, [])

  return <group ref={root}>{children}</group>
}

/** World-baked, non-indexed copy with exactly position / normal / uv / color. */
function bake(mesh: Mesh, toLocal: Matrix4, color: Color): BufferGeometry {
  let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
  const keep = new BufferGeometry()
  keep.setAttribute('position', g.getAttribute('position'))
  if (!g.getAttribute('normal')) g.computeVertexNormals()
  keep.setAttribute('normal', g.getAttribute('normal'))
  const count = keep.getAttribute('position').count
  keep.setAttribute('uv', g.getAttribute('uv') ?? new BufferAttribute(new Float32Array(count * 2), 2))
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  keep.setAttribute('color', new BufferAttribute(colors, 3))
  g = keep
  g.applyMatrix4(new Matrix4().multiplyMatrices(toLocal, mesh.matrixWorld))
  return g
}
