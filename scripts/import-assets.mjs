/**
 * Turns the raw art in assets-in/ into game-ready files in public/:
 *   - slices the icon sheets into named icons (blob detection, so uneven grids are fine)
 *   - cleans the faint alpha haze left by background removal
 *   - resizes and converts to WebP, and builds the app / PWA icon set
 *
 * Run with `npm run import:assets` after dropping new art into assets-in/.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const IN = join(root, 'assets-in')
const OUT = join(root, 'public')

const SHEETS = {
  'sheet-A': { cols: 4, rows: 4, names: ['coin', 'coins', 'gem', 'gift', 'undo', 'oil', 'slot', 'hourglass', 'lock', 'check', 'star', 'trophy', 'play', 'pause', 'restart', 'home'] },
  'sheet-B': {
    cols: 4,
    rows: 4,
    names: ['skill-kit', 'skill-tray', 'skill-rust', 'skill-coin', 'skill-speed', 'nav-skills', 'nav-decor', 'nav-shop', 'nav-collection', 'settings', 'sound-on', 'sound-off', 'music', 'vibration', 'language', 'support'],
  },
  'sheet-C': {
    cols: 4,
    rows: 4,
    names: ['bit-phillips', 'bit-flat', 'bit-hex', 'bit-torx', 'rank-0', 'rank-1', 'rank-2', 'rank-3', 'rank-4', 'rusty-screw', 'new-screw', 'screw-box', 'toolbox', 'broken-plate', 'sparks', 'confetti'],
  },
  'sheet-D': { cols: 3, rows: 3, names: ['decor-lamp', 'decor-plant', 'decor-radio', 'decor-poster', 'decor-clock', 'decor-toolbox', 'decor-vise', 'decor-robot', 'decor-trophy'] },
  'sheet-E': {
    cols: 4,
    rows: 3,
    names: ['obj-car', 'obj-clock', 'obj-robot', 'obj-guitar', 'obj-gamepad', 'obj-radio', 'obj-camera', 'obj-plane', 'obj-house', 'obj-flower', 'obj-bike', 'obj-rocket'],
  },
}

const ICON_SIZE = 192
const BLOCK = 4
const SOLID = 60
const HAZE = 18

async function out(path, pipeline) {
  const file = join(OUT, path)
  await mkdir(dirname(file), { recursive: true })
  await pipeline.toFile(file)
  return file
}

/** Labels connected opaque regions on a coarse grid (BLOCK×BLOCK pixels per cell). */
function blobs(data, w, h) {
  const gw = Math.ceil(w / BLOCK)
  const gh = Math.ceil(h / BLOCK)
  const solid = new Uint8Array(gw * gh)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > SOLID) solid[Math.floor(y / BLOCK) * gw + Math.floor(x / BLOCK)] = 1
  const label = new Int32Array(gw * gh).fill(-1)
  const comps = []
  for (let i = 0; i < solid.length; i++) {
    if (!solid[i] || label[i] >= 0) continue
    const id = comps.length
    const comp = { id, n: 0, sx: 0, sy: 0, x0: Infinity, y0: Infinity, x1: -1, y1: -1 }
    const stack = [i]
    label[i] = id
    while (stack.length) {
      const j = stack.pop()
      const x = j % gw
      const y = (j - x) / gw
      comp.n++
      comp.sx += x
      comp.sy += y
      comp.x0 = Math.min(comp.x0, x)
      comp.y0 = Math.min(comp.y0, y)
      comp.x1 = Math.max(comp.x1, x)
      comp.y1 = Math.max(comp.y1, y)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
          const k = ny * gw + nx
          if (solid[k] && label[k] < 0) {
            label[k] = id
            stack.push(k)
          }
        }
    }
    comps.push(comp)
  }
  return { comps, label, gw, gh }
}

async function sliceSheet(name, { cols, rows, names }) {
  const { data, info } = await sharp(join(IN, 'icons', `${name}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const { comps, label, gw, gh } = blobs(data, w, h)
  const cellW = gw / cols
  const cellH = gh / rows
  const owner = new Map()
  for (const c of comps) {
    if (c.n < 8) continue
    const col = Math.min(cols - 1, Math.floor(c.sx / c.n / cellW))
    const row = Math.min(rows - 1, Math.floor(c.sy / c.n / cellH))
    const cell = row * cols + col
    if (!owner.has(cell)) owner.set(cell, [])
    owner.get(cell).push(c)
  }

  for (let cell = 0; cell < names.length; cell++) {
    const parts = owner.get(cell)
    if (!parts) throw new Error(`${name}: nothing found for ${names[cell]}`)
    const ids = new Set(parts.map((p) => p.id))
    const gx0 = Math.max(0, Math.min(...parts.map((p) => p.x0)) - 1)
    const gy0 = Math.max(0, Math.min(...parts.map((p) => p.y0)) - 1)
    const gx1 = Math.min(gw - 1, Math.max(...parts.map((p) => p.x1)) + 1)
    const gy1 = Math.min(gh - 1, Math.max(...parts.map((p) => p.y1)) + 1)
    const x0 = gx0 * BLOCK
    const y0 = gy0 * BLOCK
    const cw = Math.min(w, (gx1 + 1) * BLOCK) - x0
    const ch = Math.min(h, (gy1 + 1) * BLOCK) - y0
    // Keep only this icon's pixels (plus its soft edge), dropping neighbours and background haze.
    const crop = Buffer.alloc(cw * ch * 4)
    const near = (bx, by) => {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = bx + dx
          const ny = by + dy
          if (nx >= 0 && ny >= 0 && nx < gw && ny < gh && ids.has(label[ny * gw + nx])) return true
        }
      return false
    }
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const si = ((y0 + y) * w + (x0 + x)) * 4
        const di = (y * cw + x) * 4
        const keep = near(Math.floor((x0 + x) / BLOCK), Math.floor((y0 + y) / BLOCK)) && data[si + 3] > HAZE
        if (!keep) continue
        crop[di] = data[si]
        crop[di + 1] = data[si + 1]
        crop[di + 2] = data[si + 2]
        crop[di + 3] = data[si + 3]
      }
    const pad = Math.round(Math.max(cw, ch) * 0.04)
    await out(
      `ui/${names[cell]}.webp`,
      sharp(crop, { raw: { width: cw, height: ch, channels: 4 } })
        .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 88, alphaQuality: 90 }),
    )
  }
  console.log(`${name}: ${names.length} icons`)
}

/** Clears the faint haze around a transparent image and trims it. */
async function cleanAlpha(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 3; i < data.length; i += 4) if (data[i] <= HAZE) data[i] = 0
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 1 })
}

async function brand() {
  const b = (f) => join(IN, 'brand', f)
  const logo = await (await cleanAlpha(b('logo.png'))).png().toBuffer()
  await out('brand/logo.webp', sharp(logo).resize({ width: 900 }).webp({ quality: 88, alphaQuality: 90 }))
  const mark = await (await cleanAlpha(b('logo-mark.png'))).png().toBuffer()
  await out('brand/logo-mark.webp', sharp(mark).resize({ height: 384 }).webp({ quality: 88 }))
  const screw = await (await cleanAlpha(b('loader-screw.png'))).png().toBuffer()
  await out('brand/loader-screw.webp', sharp(screw).resize({ height: 128 }).webp({ quality: 88 }))
  await out('brand/splash-bg.webp', sharp(b('splash-bg.png')).webp({ quality: 78 }))
  await out('brand/splash-landscape.webp', sharp(b('splash-landscape.png')).webp({ quality: 78 }))

  // App / PWA icons from the square app icon.
  for (const [path, size] of [
    ['icons/icon-512.png', 512],
    ['icons/icon-192.png', 192],
    ['apple-touch-icon.png', 180],
    ['favicon-64.png', 64],
  ])
    await out(path, sharp(b('app-icon.png')).resize(size, size).png({ compressionLevel: 9 }))
  await mkdir(join(root, 'resources'), { recursive: true })
  await sharp(b('app-icon.png')).resize(1024, 1024).png().toFile(join(root, 'resources', 'icon.png'))
  // Native launch screen mark (for Capacitor's splash generator later).
  await sharp(mark).resize({ height: 640 }).png().toFile(join(root, 'resources', 'splash-mark.png'))
  console.log('brand: logo, mark, loader, splash, app icons')
}

/** The mechanic's face from the turnaround sheet, used as the player avatar. */
async function avatar() {
  await out(
    'ui/avatar.webp',
    sharp(join(IN, 'concept', 'mechanic-turnaround.png')).extract({ left: 118, top: 92, width: 312, height: 312 }).resize(160, 160).webp({ quality: 85 }),
  )
  console.log('avatar')
}

async function textures() {
  const t = (f) => join(IN, 'textures', f)
  await out('tex/wood.webp', sharp(t('wood-board.png')).resize(1024, 1024).webp({ quality: 82 }))
  await out('tex/pegboard.webp', sharp(t('pegboard.png')).resize(512, 512).webp({ quality: 82 }))
  await out('tex/floor.webp', sharp(t('floor-tile.png')).resize(1024, 1024).webp({ quality: 80 }))
  console.log('textures: wood, pegboard, floor')
}

for (const [name, sheet] of Object.entries(SHEETS)) await sliceSheet(name, sheet)
await brand()
await avatar()
await textures()
await writeFile(join(OUT, 'ui', 'names.json'), JSON.stringify(Object.values(SHEETS).flatMap((s) => s.names).concat('avatar'), null, 1))
