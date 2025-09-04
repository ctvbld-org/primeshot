import fs from 'fs/promises'
import path from 'path'

const SRC_WEB_DIR = path.resolve(process.cwd(), 'web')
const OUT_WEB_DIR = path.resolve(process.cwd(), 'dist', 'web')
const SRC_LOCALES_DIR = path.resolve(process.cwd(), 'locales')
const OUT_LOCALES_DIR = path.resolve(process.cwd(), 'dist', 'locales')

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function copyRecursive(src, dest, filterFn = () => true) {
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath, filterFn)
    } else if (entry.isFile() && filterFn(entry.name)) {
      await ensureDir(path.dirname(destPath))
      await fs.copyFile(srcPath, destPath)
    }
  }
}

// Copy CSS modules from web/* to dist/web
await ensureDir(OUT_WEB_DIR)
await copyRecursive(SRC_WEB_DIR, OUT_WEB_DIR, (name) => name.endsWith('.css'))
console.log('[common] Copied CSS modules to dist/web')

// Copy locales JSON into dist/locales for consumers to import
try {
  await ensureDir(OUT_LOCALES_DIR)
  await copyRecursive(SRC_LOCALES_DIR, OUT_LOCALES_DIR, (name) => name.endsWith('.json'))
  console.log('[common] Copied locales to dist/locales')
} catch (err) {
  console.warn('[common] Skipped copying locales:', err?.message || err)
}


