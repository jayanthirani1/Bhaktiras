import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = resolve(rootDir, 'assets/logos/Bhaktiras - Icon.svg')
const outDir = resolve(rootDir, 'public')
const BACKGROUND = '#fdfcf9'
const VIEW_WIDTH = 249.48
const VIEW_HEIGHT = 277.27

const innerMarkup = readFileSync(sourcePath, 'utf8')
  .replace(/<\?xml[\s\S]*?\?>/, '')
  .replace(/<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')

function wrappedSvg(canvas, padRatio) {
  const pad = canvas * padRatio
  const inner = canvas - pad * 2
  const scale = Math.min(inner / VIEW_WIDTH, inner / VIEW_HEIGHT)
  const width = VIEW_WIDTH * scale
  const height = VIEW_HEIGHT * scale
  const x = (canvas - width) / 2
  const y = (canvas - height) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">
  <rect width="${canvas}" height="${canvas}" fill="${BACKGROUND}"/>
  <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}">
    ${innerMarkup}
  </svg>
</svg>`
}

function renderPng(canvas, padRatio) {
  const resvg = new Resvg(wrappedSvg(canvas, padRatio), {
    fitTo: { mode: 'width', value: canvas },
    background: BACKGROUND
  })
  return resvg.render().asPng()
}

mkdirSync(outDir, { recursive: true })

const regularSizes = [32, 48, 72, 96, 128, 180, 192, 256, 512, 1024]
for (const size of regularSizes) {
  writeFileSync(resolve(outDir, `icon-${size}.png`), renderPng(size, 0.08))
}

writeFileSync(resolve(outDir, 'apple-touch-icon.png'), renderPng(180, 0.08))
writeFileSync(resolve(outDir, 'favicon-32.png'), renderPng(32, 0.08))
writeFileSync(resolve(outDir, 'notification-icon.png'), renderPng(192, 0.08))
writeFileSync(resolve(outDir, 'icon-maskable-192.png'), renderPng(192, 0.2))
writeFileSync(resolve(outDir, 'icon-maskable-512.png'), renderPng(512, 0.2))

console.log('Wrote app icons to public/')
