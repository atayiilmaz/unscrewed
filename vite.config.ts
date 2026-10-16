import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { zipSync } from 'fflate'
import { defineConfig, type Plugin } from 'vite'

/** Build identity: the commit (Vercel provides it; locally from git) plus the build time. */
function commit() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'local'
  }
}
const BUILT_AT = Date.now()
const BUILD_ID = `${commit()}-${BUILT_AT.toString(36)}`

/**
 * Over-the-air update bundle. After every build, zips the web app into dist/ota/ and writes
 * dist/ota/latest.json. Deployed with the site (Vercel), the native app polls latest.json and
 * swaps itself to newer web code without a store release (see src/services/ota.ts).
 */
function otaBundle(): Plugin {
  let dist = ''
  return {
    name: 'ota-bundle',
    apply: 'build',
    configResolved(config) {
      dist = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const files: Record<string, Uint8Array> = {}
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name)
          const rel = relative(dist, full)
          if (rel === 'ota' || name === '.DS_Store') continue
          if (statSync(full).isDirectory()) walk(full)
          else files[rel.split('\\').join('/')] = readFileSync(full)
        }
      }
      walk(dist)
      // Images are already compressed; store them as-is and only deflate code and text.
      const zip = zipSync(
        Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: /\.(webp|png|jpe?g)$/.test(k) ? 0 : 6 }]])),
      )
      mkdirSync(join(dist, 'ota'), { recursive: true })
      const file = `bundle-${BUILD_ID}.zip`
      writeFileSync(join(dist, 'ota', file), zip)
      writeFileSync(join(dist, 'ota', 'latest.json'), JSON.stringify({ version: BUILD_ID, builtAt: BUILT_AT, file, size: zip.length }))
      console.log(`ota: ${file} (${(zip.length / 1024 / 1024).toFixed(1)} MB)`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), otaBundle()],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __BUILT_AT__: JSON.stringify(BUILT_AT),
  },
})
