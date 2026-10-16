import { RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture } from 'three'

/**
 * Painted textures from public/tex (made by `npm run import:assets`). Loaded once and shared;
 * three updates the texture when the image arrives, so callers never wait. Each caller that
 * needs its own tiling gets a clone sharing the same image.
 */
const loader = new TextureLoader()
const cache = new Map<string, Texture>()

function load(name: string) {
  let tex = cache.get(name)
  if (!tex) {
    tex = loader.load(`${import.meta.env.BASE_URL}tex/${name}.webp`)
    tex.colorSpace = SRGBColorSpace
    tex.anisotropy = 4
    tex.wrapS = tex.wrapT = RepeatWrapping
    cache.set(name, tex)
  }
  return tex
}

function tiled(name: string, x: number, y: number) {
  const tex = load(name).clone()
  tex.repeat.set(x, y)
  tex.needsUpdate = true
  return tex
}

export const woodTexture = (x = 1, y = 1) => tiled('wood', x, y)
export const pegboardTexture = (x = 1, y = 1) => tiled('pegboard', x, y)
export const floorTexture = (x = 1, y = 1) => tiled('floor', x, y)
