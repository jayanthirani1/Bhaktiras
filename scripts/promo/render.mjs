/**
 * Turns the captured screens and the shot list into finished video files.
 *
 * The pass is deterministic by construction: frame N's appearance is computed
 * from N alone and pushed into the stage, so a screenshot that takes 200ms does
 * not make the footage play back faster. Frames go straight down a pipe into
 * ffmpeg rather than to disk — a thousand 1080p stills is a quarter of a
 * gigabyte we never need to keep.
 *
 *   node render.mjs                     # both shapes, reusing the capture cache
 *   node render.mjs --capture           # re-photograph the app first
 *   node render.mjs --only=vertical     # one shape
 *   node render.mjs --stills=2,8,31     # PNGs at those seconds, no encode
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ffmpegPath from 'ffmpeg-static'
import { launch } from './browser.mjs'
import { capture } from './capture.mjs'
import { DISSOLVE, FORMATS, FPS, SCREENS, SHOTS, scrollStops } from './scenes.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(HERE, '.cache', 'screens')
const OUT = path.join(HERE, 'out')

const MARKS = {
  wordmark: pathToFileURL(path.join(HERE, '..', '..', 'public', 'Bhaktiras - Text.svg')).href,
  mark: pathToFileURL(path.join(HERE, '..', '..', 'public', 'Bhaktiras - Main.svg')).href
}

/* -- easing ------------------------------------------------------------- */

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeInOutSine = p => -(Math.cos(Math.PI * p) - 1) / 2
const easeOutCubic = p => 1 - Math.pow(1 - p, 3)
/** 0 before `from`, 1 after `to`, eased in between. */
const ramp = (value, from, to) => easeInOutSine(clamp01((value - from) / (to - from)))

/* -- the captured screens ------------------------------------------------ */

/**
 * Indexes the capture cache: for each screen, the file for every scroll stop.
 * Panning is then a lookup rather than a transform, which keeps the sticky
 * header and the tab bar pinned exactly where the app puts them.
 */
function loadScreens() {
  const screens = new Map()
  for (const screen of SCREENS) {
    const dir = path.join(CACHE, screen.id)
    if (!fs.existsSync(dir)) throw new Error(`No capture for "${screen.id}" — run with --capture`)
    const files = fs.readdirSync(dir).filter(name => name.endsWith('.jpg')).sort()
    const manifest = path.join(dir, 'stops.json')
    const stops = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, 'utf8')) : scrollStops(screen)
    screens.set(screen.id, { stops, files: files.map(name => pathToFileURL(path.join(dir, name)).href) })
  }
  return screens
}

/**
 * The frame showing `scrollY`, snapped to the nearest stop that was captured.
 * A nearest search rather than arithmetic, because the capture clamps stops to
 * the foot of a short page and the spacing is then no longer even.
 */
function frameAt(screen, scrollY) {
  let best = 0
  let bestGap = Infinity
  for (let index = 0; index < screen.stops.length; index++) {
    const gap = Math.abs(screen.stops[index] - scrollY)
    if (gap < bestGap) { bestGap = gap; best = index }
  }
  return screen.files[Math.min(best, screen.files.length - 1)]
}

/* -- the timeline -------------------------------------------------------- */

/** Start times, overlapping each shot with the next by one dissolve. */
function schedule() {
  let at = 0
  return SHOTS.map(shot => {
    const timed = { ...shot, start: at, end: at + shot.dur }
    at += shot.dur - DISSOLVE
    return timed
  })
}

const TIMELINE = schedule()
const TOTAL = TIMELINE[TIMELINE.length - 1].end

/**
 * How present a shot is at time `t`, counting its dissolves in and out. The
 * last shot never dissolves out: the film should end on the closing card, not
 * on the blank frame behind it.
 */
function presence(shot, t, isLast) {
  if (t <= shot.start || t >= shot.end) return 0
  const fadeIn = shot.start === 0 ? 0.7 : DISSOLVE
  const rising = ramp(t, shot.start, shot.start + fadeIn)
  if (isLast) return rising
  return Math.min(rising, 1 - ramp(t, shot.end - DISSOLVE, shot.end))
}

/**
 * Captions fade fully out before the shot hands over and fade in only after the
 * handover has finished, so the two shots never fight over the one text layer.
 */
function wordsPresence(shot, t) {
  const local = t - shot.start
  return Math.min(ramp(local, 0.30, 0.95), 1 - ramp(local, shot.dur - 0.85, shot.dur - 0.30))
}

/** Everything the stage needs to draw the frame at time `t`. */
function stateAt(t, screens) {
  const live = TIMELINE
    .map((shot, index) => ({ shot, alpha: presence(shot, t, index === TIMELINE.length - 1) }))
    .filter(entry => entry.alpha > 0.0005)
    .sort((a, b) => b.alpha - a.alpha)

  const state = {
    drift: t / TOTAL,
    purple: 0,
    phone: { opacity: 0, y: 0, scale: 1, rotate: 0, a: null, b: null },
    text: { opacity: 0, y: 0, kicker: '', caption: '' },
    card: { opacity: 0, y: 0, scale: 1, heading: '', sub: '', cta: '', mark: null }
  }

  let weight = 0
  const layers = []
  for (const { shot, alpha } of live) {
    weight += alpha
    state.purple += (shot.kind === 'phone' ? 1 : 0) * alpha

    if (shot.kind === 'phone') {
      const local = t - shot.start
      const p = clamp01(local / shot.dur)
      const screen = screens.get(shot.screen)
      layers.push({ src: frameAt(screen, shot.from + (shot.to - shot.from) * easeInOutSine(p)), opacity: alpha })

      // The handset settles into place, then creeps closer — enough movement to
      // keep a four-second hold alive, not enough to read as a zoom.
      const settle = easeOutCubic(clamp01(local / 0.9))
      state.phone.opacity = Math.max(state.phone.opacity, alpha)
      state.phone.scale = 1.035 - 0.035 * settle + 0.014 * p
      state.phone.y = (1 - settle) * 26
    } else {
      const local = t - shot.start
      const settle = easeOutCubic(clamp01(local / 1.1))
      if (alpha >= (state.card.opacity || 0)) {
        state.card = {
          opacity: alpha,
          y: (1 - settle) * 22,
          scale: 1.03 - 0.03 * settle,
          heading: shot.heading || '',
          sub: shot.sub || '',
          cta: shot.cta || '',
          mark: MARKS[shot.mark] || null
        }
      }
    }
  }
  state.purple = weight ? clamp01(state.purple / weight) : 0

  // The stage carries two screen layers; during a handover the outgoing shot
  // holds the first and the incoming one dissolves in over it.
  const [first, second] = layers
  if (first) state.phone.a = { src: first.src, opacity: 1 }
  if (second) state.phone.b = { src: second.src, opacity: second.opacity / (first.opacity + second.opacity) }
  if (first && !second) state.phone.b = null

  const dominant = live.find(entry => entry.shot.kind === 'phone')
  if (dominant) {
    const words = wordsPresence(dominant.shot, t)
    state.text = {
      opacity: words,
      y: (1 - words) * 18,
      kicker: dominant.shot.kicker || '',
      caption: dominant.shot.caption || ''
    }
  }
  return state
}

/* -- rendering ----------------------------------------------------------- */

/** Pipes JPEG frames into ffmpeg and resolves when the file is written. */
function openEncoder(format) {
  fs.mkdirSync(OUT, { recursive: true })
  const file = path.join(OUT, `bhaktiras-promo-${format.id}.mp4`)
  const ffmpeg = spawn(ffmpegPath, [
    '-y',
    '-f', 'image2pipe', '-framerate', String(FPS), '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19',
    // Chroma subsampling and a moved atom: the difference between a file that
    // plays everywhere and one that plays in ffplay.
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    file
  ], { stdio: ['pipe', 'ignore', 'pipe'] })

  let stderr = ''
  ffmpeg.stderr.on('data', chunk => { stderr += chunk })
  const done = new Promise((resolve, reject) => {
    ffmpeg.on('close', code => (code === 0 ? resolve(file) : reject(new Error(`ffmpeg exited ${code}\n${stderr.slice(-2000)}`))))
  })
  return { ffmpeg, done }
}

/** Writes one frame, respecting the pipe's backpressure. */
function writeFrame(ffmpeg, buffer) {
  if (ffmpeg.stdin.write(buffer)) return Promise.resolve()
  return new Promise(resolve => ffmpeg.stdin.once('drain', resolve))
}

/** Opens the stage, sized for one output shape and with its web fonts loaded. */
async function openStage(browser, format) {
  const page = await browser.newPage({
    viewport: { width: format.width, height: format.height },
    deviceScaleFactor: 1
  })
  await page.goto(pathToFileURL(path.join(HERE, 'stage.html')).href, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(shape => window.layout(shape), format)
  return page
}

async function renderFormat(browser, format, screens) {
  const page = await openStage(browser, format)
  const { ffmpeg, done } = openEncoder(format)
  const frames = Math.round(TOTAL * FPS)
  for (let frame = 0; frame < frames; frame++) {
    const state = stateAt(frame / FPS, screens)
    await page.evaluate(next => window.paint(next), state)
    const buffer = await page.screenshot({ type: 'jpeg', quality: 94 })
    await writeFrame(ffmpeg, buffer)
    if (frame % 60 === 0) process.stdout.write(`  ${format.id}: ${frame}/${frames}\r`)
  }
  ffmpeg.stdin.end()
  await page.close()
  const file = await done
  console.log(`  ${format.id}: ${frames} frames → ${path.relative(HERE, file)}`)
}

/** Single frames to look at, so a composition change costs seconds not minutes. */
async function renderStills(browser, format, screens, seconds) {
  const page = await openStage(browser, format)
  fs.mkdirSync(OUT, { recursive: true })
  for (const second of seconds) {
    await page.evaluate(next => window.paint(next), stateAt(second, screens))
    const file = path.join(OUT, `still-${format.id}-${String(second).replace('.', 'p')}s.png`)
    await page.screenshot({ path: file })
    console.log(`  ${path.relative(HERE, file)}`)
  }
  await page.close()
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--capture')) await capture()

  const only = args.find(arg => arg.startsWith('--only='))?.split('=')[1]
  const formats = Object.values(FORMATS).filter(format => !only || format.id === only)
  const screens = loadScreens()
  const stills = args.find(arg => arg.startsWith('--stills='))?.split('=')[1]

  const browser = await launch()
  if (stills) {
    const seconds = stills.split(',').map(Number)
    for (const format of formats) await renderStills(browser, format, screens, seconds)
  } else {
    console.log(`Rendering ${TOTAL.toFixed(1)}s at ${FPS}fps`)
    for (const format of formats) await renderFormat(browser, format, screens)
  }
  await browser.close()
}

await main()
