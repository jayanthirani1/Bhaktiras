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
/** Padding for the iOS home-screen icon, which is masked into a squircle. */
const APPLE_PAD = 0.16

const innerMarkup = readFileSync(sourcePath, 'utf8')
  .replace(/<\?xml[\s\S]*?\?>/, '')
  .replace(/<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')

/**
 * Android renders a notification badge from the ALPHA CHANNEL ONLY — colour is
 * discarded and every opaque pixel becomes solid white. A normal, fully opaque
 * icon therefore shows up as a plain white square in the status bar, which is
 * exactly what happened when the badge pointed at notification-icon.png.
 *
 * So the badge has to be a flat silhouette on a transparent background: all
 * fills forced to white, no background plate.
 */
const silhouetteMarkup = innerMarkup.replace(/fill:\s*#[0-9a-fA-F]{3,8}/g, 'fill: #fff')

function wrappedSvg(canvas, padRatio, { background = BACKGROUND, markup = innerMarkup } = {}) {
  const pad = canvas * padRatio
  const inner = canvas - pad * 2
  const scale = Math.min(inner / VIEW_WIDTH, inner / VIEW_HEIGHT)
  const width = VIEW_WIDTH * scale
  const height = VIEW_HEIGHT * scale
  const x = (canvas - width) / 2
  const y = (canvas - height) / 2
  const plate = background ? `<rect width="${canvas}" height="${canvas}" fill="${background}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">
  ${plate}
  <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}">
    ${markup}
  </svg>
</svg>`
}

function renderPng(canvas, padRatio, options = {}) {
  const resvg = new Resvg(wrappedSvg(canvas, padRatio, options), {
    fitTo: { mode: 'width', value: canvas },
    // Omitting `background` leaves the canvas transparent, which the badge needs.
    ...(options.background === null ? {} : { background: options.background ?? BACKGROUND })
  })
  return resvg.render().asPng()
}

mkdirSync(outDir, { recursive: true })

const regularSizes = [32, 48, 72, 96, 128, 180, 192, 256, 512, 1024]
for (const size of regularSizes) {
  writeFileSync(resolve(outDir, `icon-${size}.png`), renderPng(size, 0.08))
}

// iOS masks this into a squircle, so the mark needs margin or it looks cropped
// and zoomed on the home screen. 0.08 put the logo hard against the edges.
writeFileSync(resolve(outDir, 'apple-touch-icon.png'), renderPng(180, APPLE_PAD))
writeFileSync(resolve(outDir, 'favicon-32.png'), renderPng(32, 0.08))
writeFileSync(resolve(outDir, 'notification-icon.png'), renderPng(192, 0.08))
writeFileSync(
  resolve(outDir, 'notification-badge.png'),
  renderPng(96, 0.12, { background: null, markup: silhouetteMarkup })
)
writeFileSync(resolve(outDir, 'icon-maskable-192.png'), renderPng(192, 0.2))
writeFileSync(resolve(outDir, 'icon-maskable-512.png'), renderPng(512, 0.2))

console.log('Wrote app icons to public/')
