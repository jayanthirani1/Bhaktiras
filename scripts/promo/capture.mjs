/**
 * Photographs the running app, one viewport shot per scroll stop.
 *
 * Output lands in `.cache/screens/<id>/0000.jpg`, numbered in scroll order, and
 * is what the compositor pans through. Re-run this when the app or its content
 * changes; `render.mjs` reuses the cache otherwise, because a capture pass costs
 * minutes and the compositing pass is the one you iterate on.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from './browser.mjs'
import { DEVICE, SCREENS, scrollStops } from './scenes.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(HERE, '.cache', 'screens')

/** The deployed site. Point `PROMO_BASE` at localhost:3000 to film a branch. */
const BASE = (process.env.PROMO_BASE || 'https://sksswoolwich-bhaktiras--skssw-bhaktiras.europe-west4.hosted.app').replace(/\/$/, '')

/**
 * Hides the things that belong to a dev session rather than to the app: the
 * Nuxt devtools tab, and any cookie or notification prompt that would otherwise
 * be filmed. Also stops smooth-scrolling, which fights with scripted scrolling.
 */
const DRESS_THE_SET = `
  html { scroll-behavior: auto !important; }
  /* A scrollbar down the side of every shot gives the footage away as a
     desktop browser; a real handset does not show one. */
  ::-webkit-scrollbar { display: none !important; }
  #nuxt-devtools-anchor,
  .nuxt-devtools-panel,
  [data-testid="push-prompt"] { display: none !important; }
`

async function captureScreen(context, screen) {
  const dir = path.join(CACHE, screen.id)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })

  const page = await context.newPage()
  await page.goto(BASE + screen.route, { waitUntil: 'domcontentloaded', timeout: 60000 })
  // Firestore keeps a channel open, so `networkidle` never fires. Give the
  // content, the web fonts and the images a fixed beat to land instead.
  await page.waitForTimeout(5000)
  await page.addStyleTag({ content: DRESS_THE_SET })
  await page.evaluate(() => document.fonts?.ready)

  if (screen.prepare) await screen.prepare(page)

  // A shot list can ask for more scroll than a page has. Clamping here, and
  // recording what was actually used, keeps the compositor honest: it pans to
  // the bottom of a short page instead of holding a frame it thinks is halfway.
  const limit = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  const stops = scrollStops(screen).map(y => Math.min(y, Math.max(0, limit)))
  fs.writeFileSync(path.join(dir, 'stops.json'), JSON.stringify(stops))

  for (const [index, y] of stops.entries()) {
    await page.evaluate(offset => window.scrollTo(0, offset), y)
    // One frame for the scroll to paint, plus a beat for anything that reveals
    // on scroll. Long enough to be reliable, short enough that a screen with
    // seventy stops still finishes in under a minute.
    await page.waitForTimeout(120)
    await page.screenshot({
      path: path.join(dir, String(index).padStart(4, '0') + '.jpg'),
      type: 'jpeg',
      quality: 92
    })
  }
  await page.close()
  console.log(`  ${screen.id}: ${stops.length} stops (${stops[0]}–${stops[stops.length - 1]}px)`)
}

/** `only` re-photographs a subset of screens, for iterating on one shot. */
export async function capture(only) {
  const wanted = only?.length ? SCREENS.filter(screen => only.includes(screen.id)) : SCREENS
  console.log(`Capturing from ${BASE}`)
  const browser = await launch()
  const context = await browser.newContext({
    viewport: { width: DEVICE.width, height: DEVICE.height },
    deviceScaleFactor: DEVICE.scale,
    isMobile: true,
    hasTouch: true
  })
  for (const screen of wanted) await captureScreen(context, screen)
  await browser.close()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await capture(process.argv.slice(2).filter(arg => !arg.startsWith('--')))
}
