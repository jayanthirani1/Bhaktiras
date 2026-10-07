<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-3 pb-24 pt-0 md:px-4 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <div class="sticky top-0 z-40 -mx-3 mb-4 flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-3 py-2 backdrop-blur md:top-16 md:-mx-4 md:px-4">
        <NuxtLink to="/play" class="rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          ‹ Back
        </NuxtLink>
        <span class="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-sm font-semibold tabular-nums text-[hsl(var(--primary))]">
          Best today: {{ day.best }}
        </span>
        <span class="ml-auto rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">Prototype</span>
      </div>

      <PageHeader title="Lanka Leap" subtitle="Leap across the ocean with Hanumanji. Every gate you pass scores a point." />

      <div v-if="!available" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Lanka Leap is coming soon.
      </div>
      <div v-else-if="!howto.ready.value" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading…
      </div>
      <GameHowTo
        v-else-if="howto.showIntro.value"
        intro
        title="Leap across the ocean to Lanka."
        @start="howto.markSeen()"
      >
        <LankaLeapRules />
      </GameHowTo>
      <div v-else class="space-y-4">
        <div class="relative mx-auto w-full" :style="{ maxWidth: 'calc((100dvh - 11rem) * 0.625)' }">
          <canvas
            ref="canvasEl"
            class="block w-full touch-none select-none rounded-2xl shadow-[0_18px_40px_-24px_rgba(3,105,161,0.7)]"
            :style="{ aspectRatio: `${WORLD_WIDTH} / ${WORLD_HEIGHT}` }"
            aria-label="Lanka Leap. Tap or press Space to leap."
            role="img"
            @pointerdown.prevent="press"
          />

          <button
            v-if="phase === 'paused'"
            type="button"
            class="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/45 text-lg font-bold text-white"
            @click="press"
          >
            Paused · tap to continue
          </button>

          <div v-if="phase === 'over' && lastRun" class="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/45 p-4">
            <div class="w-full max-w-xs space-y-3 rounded-2xl bg-white p-5 text-center shadow-xl">
              <p class="text-xs font-bold uppercase tracking-wide text-sky-700">{{ deathTitle }}</p>
              <p class="font-display text-5xl font-bold text-[hsl(var(--primary))]">{{ lastRun.score }}</p>
              <p v-if="newBest" class="text-sm font-semibold text-emerald-700">New best today!</p>
              <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Best today: {{ day.best }}</p>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                {{ lastRun.tulsi }} tulsi {{ lastRun.tulsi === 1 ? 'leaf' : 'leaves' }}<span v-if="lastRun.reachedLanka"> · reached Lanka</span>
              </p>
              <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ deathTip }}</p>
              <button
                type="button"
                class="w-full rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white"
                @click="restart"
              >
                Fly again
              </button>
            </div>
          </div>
        </div>

        <div class="mx-auto grid max-w-sm grid-cols-3 gap-2 text-center text-xs text-[hsl(var(--muted-foreground))]">
          <div class="card-surface p-2"><p class="text-lg font-bold text-[hsl(var(--primary))]">{{ day.runs }}</p>Runs today</div>
          <div class="card-surface p-2"><p class="text-lg font-bold text-[hsl(var(--primary))]">{{ day.best }}</p>Best score</div>
          <div class="card-surface p-2"><p class="text-lg font-bold text-[hsl(var(--primary))]">{{ day.bestTulsi }}</p>Most tulsi</div>
        </div>

        <GameHowTo>
          <LankaLeapRules />
        </GameHowTo>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  createRun,
  heroRadius,
  lankaLeapSeed,
  step,
  HERO_RADIUS,
  HERO_X,
  LANKA_AT,
  PILLAR_WIDTH,
  SEA_LEVEL,
  SIMHIKA_REACH,
  TICK_MS,
  WORLD_HEIGHT,
  WORLD_WIDTH
} from '~/functions/shared/lankaLeap.mjs'
import { ukDateId } from '~/utils/gameDay'
import { showPrototypeGames } from '~/utils/prototypeGames'

type RunState = ReturnType<typeof createRun>
type Obstacle = RunState['course'][number]
type Phase = 'ready' | 'playing' | 'paused' | 'over'
type DeathCause = NonNullable<RunState['cause']>

interface DayRecord {
  best: number
  bestTulsi: number
  runs: number
  reachedLanka: boolean
  /** Leap ticks of the best run, kept so it can be verified once scores are submitted. */
  bestLeaps: number[]
}

const available = showPrototypeGames()
const dateId = ukDateId()
const seed = lankaLeapSeed(dateId)
const storageKey = `lanka-leap:${dateId}`
const howto = useHowToPlay('lanka-leap', ['lanka-leap:'])
const { markDone } = useDailyGameCompletion('lanka-leap')

const canvasEl = ref<HTMLCanvasElement | null>(null)
const phase = ref<Phase>('ready')
const lastRun = ref<{ score: number; tulsi: number; reachedLanka: boolean; cause: DeathCause } | null>(null)
const newBest = ref(false)
const day = reactive<DayRecord>({ best: 0, bestTulsi: 0, runs: 0, reachedLanka: false, bestLeaps: [] })

let run: RunState = createRun(seed)
let leaps: number[] = []
let pendingLeap = false
let accumulator = 0
let lastFrame = 0
let overAt = 0
let rafId = 0
let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let banner: { text: string; until: number } | null = null
let heroSprite: HTMLImageElement | null = null

/** World-unit size of the Hanumanji sprite; the anchor (head and chest) sits on the hit circle. */
const HERO_SPRITE = { src: '/games/lanka-leap/hanuman.png', width: 96, aspect: 0.758, anchorX: 0.628, anchorY: 0.346 }

const DEATH_TITLES: Record<DeathCause, string> = {
  rock: 'Struck a rock',
  sea: 'Into the ocean',
  surasa: 'Surasa blocked the way',
  simhika: 'Simhika seized your shadow',
  lankini: 'Lankini stopped you at the gate',
  time: 'Out of time'
}
const DEATH_TIPS: Record<DeathCause, string> = {
  rock: 'Short, steady taps keep Hanumanji level through the gaps.',
  sea: 'Tap a little sooner to stay above the waves.',
  surasa: 'Take the blue Laghima orb just before Surasa to become tiny.',
  simhika: 'Stay high over the dark water. Simhika drags you down.',
  lankini: 'The gate to Lanka is wide. Aim for the middle.',
  time: 'What a flight!'
}
const deathTitle = computed(() => lastRun.value ? DEATH_TITLES[lastRun.value.cause] : '')
const deathTip = computed(() => lastRun.value ? DEATH_TIPS[lastRun.value.cause] : '')

function loadDay() {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    const data = JSON.parse(raw) as Partial<DayRecord>
    day.best = Number(data.best) || 0
    day.bestTulsi = Number(data.bestTulsi) || 0
    day.runs = Number(data.runs) || 0
    day.reachedLanka = data.reachedLanka === true
    day.bestLeaps = Array.isArray(data.bestLeaps) ? data.bestLeaps : []
  } catch {}
}

function saveDay() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(day))
  } catch {}
}

function press() {
  if (!available) return
  if (phase.value === 'ready') {
    phase.value = 'playing'
    pendingLeap = true
  } else if (phase.value === 'playing') {
    pendingLeap = true
  } else if (phase.value === 'paused') {
    phase.value = 'playing'
  } else if (phase.value === 'over' && performance.now() - overAt > 500) {
    restart()
  }
}

function restart() {
  run = createRun(seed)
  leaps = []
  pendingLeap = false
  banner = null
  lastRun.value = null
  newBest.value = false
  phase.value = 'ready'
}

function showBanner(text: string) {
  banner = { text, until: performance.now() + 1800 }
}

function handleEvents() {
  for (const event of run.events) {
    if (event === 'laghima') showBanner('Laghima: Hanumanji becomes tiny')
    else if (event === 'mainak') showBanner('Mainak rises to help: one hit forgiven')
    else if (event === 'shield-break') showBanner('Mainak’s blessing is spent')
    else if (event === 'lanka') showBanner('Jay Hanuman! You reached Lanka')
  }
}

function endRun() {
  const cause = run.cause || 'rock'
  lastRun.value = { score: run.score, tulsi: run.tulsi, reachedLanka: run.reachedLanka, cause }
  day.runs++
  newBest.value = run.score > day.best
  if (newBest.value) {
    day.best = run.score
    day.bestLeaps = leaps.slice()
  }
  day.bestTulsi = Math.max(day.bestTulsi, run.tulsi)
  day.reachedLanka = day.reachedLanka || run.reachedLanka
  saveDay()
  void markDone({ score: day.best, detail: `Best ${day.best}${day.reachedLanka ? ' · reached Lanka' : ''}` })
  overAt = performance.now()
  phase.value = 'over'
  if (navigator.vibrate) navigator.vibrate(40)
}

function frame(now: number) {
  rafId = requestAnimationFrame(frame)
  const elapsed = Math.min(now - lastFrame, 250)
  lastFrame = now
  if (phase.value === 'playing') {
    accumulator += elapsed
    let steps = 0
    while (accumulator >= TICK_MS && steps < 8) {
      const leap = pendingLeap
      pendingLeap = false
      if (leap) leaps.push(run.tick)
      step(run, leap)
      handleEvents()
      accumulator -= TICK_MS
      steps++
      if (!run.alive) {
        endRun()
        break
      }
    }
  } else {
    accumulator = 0
  }
  draw(now)
}

function onKey(event: KeyboardEvent) {
  if (event.code !== 'Space' && event.key !== 'ArrowUp') return
  if (!canvasEl.value) return
  if (event.target instanceof Element && event.target.closest('button, a, input, textarea')) return
  event.preventDefault()
  press()
}

function onVisibility() {
  if (document.hidden && phase.value === 'playing') phase.value = 'paused'
}

function fitCanvas() {
  const el = canvasEl.value
  if (!el) return
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  el.width = Math.round(el.clientWidth * dpr)
  el.height = Math.round(el.clientHeight * dpr)
}

watch(canvasEl, (el) => {
  resizeObserver?.disconnect()
  ctx = el ? el.getContext('2d') : null
  if (!el) return
  fitCanvas()
  resizeObserver = new ResizeObserver(fitCanvas)
  resizeObserver.observe(el)
})

onMounted(() => {
  heroSprite = new Image()
  heroSprite.src = HERO_SPRITE.src
  loadDay()
  lastFrame = performance.now()
  rafId = requestAnimationFrame(frame)
  window.addEventListener('keydown', onKey)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('visibilitychange', onVisibility)
})

// ---------------------------------------------------------------------------
// Drawing. Placeholder artwork until the illustrated sprites are approved.
// ---------------------------------------------------------------------------

function draw(now: number) {
  const el = canvasEl.value
  if (!ctx || !el || !el.width) return
  const c = ctx
  const scale = el.width / WORLD_WIDTH
  c.setTransform(scale, 0, 0, scale, 0, 0)
  const d = run.distance

  drawSky(c, d)
  drawLanka(c, d)
  for (const o of run.course) {
    const sx = o.x - d
    if (sx > WORLD_WIDTH + SIMHIKA_REACH) break
    if (sx + PILLAR_WIDTH < -SIMHIKA_REACH) continue
    drawObstacle(c, o, sx, now)
  }
  drawSea(c, d, now)
  drawHero(c, now)
  drawHud(c)
  if (phase.value === 'ready') drawReady(c)
  if (banner && now < banner.until) drawBanner(c, banner.text, (banner.until - now) / 1800)
}

function drawCloud(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
  c.beginPath()
  c.arc(x, y, 16 * size, 0, Math.PI * 2)
  c.arc(x + 18 * size, y - 8 * size, 20 * size, 0, Math.PI * 2)
  c.arc(x + 38 * size, y, 15 * size, 0, Math.PI * 2)
  c.fill()
}

function drawSky(c: CanvasRenderingContext2D, d: number) {
  const sky = c.createLinearGradient(0, 0, 0, SEA_LEVEL)
  sky.addColorStop(0, '#38bdf8')
  sky.addColorStop(0.6, '#bae6fd')
  sky.addColorStop(1, '#fef3c7')
  c.fillStyle = sky
  c.fillRect(0, 0, WORLD_WIDTH, SEA_LEVEL)

  c.fillStyle = 'rgba(253, 230, 138, 0.9)'
  c.beginPath()
  c.arc(318, 150, 34, 0, Math.PI * 2)
  c.fill()

  c.fillStyle = 'rgba(255, 255, 255, 0.75)'
  for (let i = 0; i < 6; i++) {
    const span = WORLD_WIDTH + 160
    const x = ((((i * 157) - d * 0.25) % span) + span) % span - 80
    drawCloud(c, x, 70 + ((i * 53) % 200), 0.7 + (i % 3) * 0.2)
  }
}

function drawLanka(c: CanvasRenderingContext2D, d: number) {
  const gate = run.course[LANKA_AT]
  if (!gate) return
  const lx = gate.x - d - 40
  if (lx > WORLD_WIDTH + 40 || lx < -420) return
  const towers: Array<[number, number]> = [[0, 70], [30, 100], [58, 76], [92, 130], [124, 88], [160, 150], [200, 104], [238, 120], [276, 84], [312, 66]]
  c.fillStyle = 'rgba(217, 119, 6, 0.85)'
  for (const [offset, height] of towers) {
    const x = lx + offset
    c.fillRect(x, SEA_LEVEL - height, 26, height)
    c.beginPath()
    c.arc(x + 13, SEA_LEVEL - height, 13, Math.PI, 0)
    c.fill()
  }
}

function drawLabel(c: CanvasRenderingContext2D, text: string, x: number, y: number) {
  c.font = 'bold 12px system-ui, sans-serif'
  c.textAlign = 'center'
  c.lineWidth = 3
  c.strokeStyle = 'rgba(15, 23, 42, 0.55)'
  c.strokeText(text, x, y)
  c.fillStyle = '#fff'
  c.fillText(text, x, y)
}

function drawStormColumn(c: CanvasRenderingContext2D, sx: number, bottom: number) {
  c.fillStyle = '#cbd5e1'
  c.fillRect(sx, -10, PILLAR_WIDTH, bottom - 2)
  c.beginPath()
  for (let i = 0; i <= 3; i++) c.arc(sx + (PILLAR_WIDTH / 3) * i, bottom - 12, 12, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(100, 116, 139, 0.35)'
  c.fillRect(sx + PILLAR_WIDTH - 10, -10, 10, bottom - 2)
}

function drawObstacle(c: CanvasRenderingContext2D, o: Obstacle, sx: number, now: number) {
  const mid = sx + PILLAR_WIDTH / 2

  if (o.kind === 'simhika') {
    c.fillStyle = 'rgba(76, 29, 149, 0.5)'
    c.beginPath()
    const left = sx - SIMHIKA_REACH
    const right = sx + PILLAR_WIDTH + SIMHIKA_REACH
    c.moveTo(left, SEA_LEVEL + 6)
    const fingers = 7
    const width = (right - left) / fingers
    for (let i = 0; i < fingers; i++) {
      const x = left + i * width
      const rise = Math.sin(now / 260 + i) * 8
      c.quadraticCurveTo(x + width / 2, o.reachY - 16 + rise, x + width, o.reachY + 14)
    }
    c.lineTo(right, SEA_LEVEL + 6)
    c.closePath()
    c.fill()
    drawLabel(c, 'Simhika', mid, o.reachY - 20)
  }

  if (o.kind === 'surasa') {
    c.fillStyle = '#15803d'
    c.fillRect(sx, -10, PILLAR_WIDTH, o.gapTop + 10)
    c.fillRect(sx, o.gapBottom, PILLAR_WIDTH, SEA_LEVEL - o.gapBottom)
    c.fillStyle = '#dc2626'
    c.fillRect(sx - 5, o.gapTop - 9, PILLAR_WIDTH + 10, 9)
    c.fillRect(sx - 5, o.gapBottom, PILLAR_WIDTH + 10, 9)
    c.fillStyle = '#fff'
    c.beginPath()
    c.arc(sx + 18, o.gapTop - 26, 7, 0, Math.PI * 2)
    c.arc(sx + PILLAR_WIDTH - 18, o.gapTop - 26, 7, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#111827'
    c.beginPath()
    c.arc(sx + 16, o.gapTop - 26, 3, 0, Math.PI * 2)
    c.arc(sx + PILLAR_WIDTH - 20, o.gapTop - 26, 3, 0, Math.PI * 2)
    c.fill()
    drawLabel(c, 'Surasa', mid, o.gapTop - 44)
  } else if (o.kind === 'lankini') {
    c.fillStyle = '#d97706'
    c.fillRect(sx, -10, PILLAR_WIDTH, o.gapTop + 10)
    c.fillRect(sx, o.gapBottom, PILLAR_WIDTH, SEA_LEVEL - o.gapBottom)
    c.fillStyle = '#fbbf24'
    c.fillRect(sx - 6, o.gapTop - 12, PILLAR_WIDTH + 12, 12)
    c.fillRect(sx - 6, o.gapBottom, PILLAR_WIDTH + 12, 12)
    drawLabel(c, 'Lankini’s gate', mid, o.gapTop - 20)
  } else {
    drawStormColumn(c, sx, o.gapTop)
    if (o.kind === 'mainak') {
      const peak = c.createLinearGradient(0, o.gapBottom, 0, SEA_LEVEL)
      peak.addColorStop(0, '#facc15')
      peak.addColorStop(1, '#a16207')
      c.fillStyle = peak
      c.beginPath()
      c.moveTo(sx - 16, SEA_LEVEL)
      c.lineTo(sx, o.gapBottom)
      c.lineTo(sx + PILLAR_WIDTH, o.gapBottom)
      c.lineTo(sx + PILLAR_WIDTH + 16, SEA_LEVEL)
      c.closePath()
      c.fill()
      drawLabel(c, 'Mainak', mid, o.gapBottom + 22)
    } else if (o.gapBottom < SEA_LEVEL) {
      c.fillStyle = '#78716c'
      c.fillRect(sx, o.gapBottom, PILLAR_WIDTH, SEA_LEVEL - o.gapBottom)
      c.fillStyle = '#57534e'
      c.fillRect(sx - 4, o.gapBottom, PILLAR_WIDTH + 8, 10)
    }
  }

  const p = o.pickup
  if (!p || p.taken) return
  const px = p.x - run.distance
  const pulse = 1 + Math.sin(now / 180) * 0.12
  if (p.kind === 'tulsi') {
    c.fillStyle = '#16a34a'
    c.save()
    c.translate(px, p.y)
    c.rotate(-0.5)
    c.beginPath()
    c.ellipse(-5, 0, 8, 4, 0, 0, Math.PI * 2)
    c.fill()
    c.rotate(1)
    c.beginPath()
    c.ellipse(5, 0, 8, 4, 0, 0, Math.PI * 2)
    c.fill()
    c.restore()
  } else {
    const glow = c.createRadialGradient(px, p.y, 2, px, p.y, 14 * pulse)
    glow.addColorStop(0, p.kind === 'laghima' ? '#e0f2fe' : '#fef9c3')
    glow.addColorStop(1, p.kind === 'laghima' ? '#0284c7' : '#ca8a04')
    c.fillStyle = glow
    c.beginPath()
    c.arc(px, p.y, 12 * pulse, 0, Math.PI * 2)
    c.fill()
  }
}

function drawSea(c: CanvasRenderingContext2D, d: number, now: number) {
  const sea = c.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT)
  sea.addColorStop(0, '#0ea5e9')
  sea.addColorStop(1, '#075985')
  c.fillStyle = sea
  c.beginPath()
  c.moveTo(0, WORLD_HEIGHT)
  for (let x = 0; x <= WORLD_WIDTH; x += 10) {
    c.lineTo(x, SEA_LEVEL + Math.sin((x + d) * 0.05 + now * 0.003) * 3)
  }
  c.lineTo(WORLD_WIDTH, WORLD_HEIGHT)
  c.closePath()
  c.fill()
}

function drawHero(c: CanvasRenderingContext2D, now: number) {
  if (run.graceTicks > 0 && Math.floor(now / 90) % 2 === 0) return
  const r = heroRadius(run)
  const bob = phase.value === 'ready' ? Math.sin(now / 300) * 6 : 0
  const tilt = phase.value === 'ready' ? 0 : Math.max(-0.35, Math.min(0.6, run.vy * 0.06))

  c.save()
  c.translate(HERO_X, run.y + bob)
  c.rotate(tilt)
  c.scale(r / HERO_RADIUS, r / HERO_RADIUS)
  if (run.shield || run.shrinkTicks > 0) {
    c.shadowColor = run.shrinkTicks > 0 ? 'rgba(56, 189, 248, 0.95)' : 'rgba(250, 204, 21, 0.95)'
    c.shadowBlur = 14 + Math.sin(now / 160) * 6
  }
  if (heroSprite?.complete && heroSprite.naturalWidth) {
    const height = HERO_SPRITE.width * HERO_SPRITE.aspect
    c.drawImage(heroSprite, -HERO_SPRITE.width * HERO_SPRITE.anchorX, -height * HERO_SPRITE.anchorY, HERO_SPRITE.width, height)
  } else {
    c.fillStyle = '#f97316'
    c.beginPath()
    c.arc(0, 0, HERO_RADIUS, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

function drawHud(c: CanvasRenderingContext2D) {
  c.textAlign = 'center'
  c.font = 'bold 44px system-ui, sans-serif'
  c.lineWidth = 5
  c.strokeStyle = '#1e3a8a'
  c.strokeText(String(run.score), WORLD_WIDTH / 2, 62)
  c.fillStyle = '#fff'
  c.fillText(String(run.score), WORLD_WIDTH / 2, 62)

  const barWidth = 150
  const barX = WORLD_WIDTH / 2 - barWidth / 2
  c.fillStyle = 'rgba(255, 255, 255, 0.55)'
  c.fillRect(barX, 76, barWidth, 6)
  c.fillStyle = run.reachedLanka ? '#16a34a' : '#d97706'
  c.fillRect(barX, 76, barWidth * Math.min(run.score / LANKA_AT, 1), 6)
  c.font = 'bold 11px system-ui, sans-serif'
  c.fillStyle = '#1e3a8a'
  c.fillText(run.reachedLanka ? 'Beyond Lanka' : 'To Lanka', WORLD_WIDTH / 2, 96)

  c.textAlign = 'left'
  c.font = 'bold 16px system-ui, sans-serif'
  c.fillStyle = '#166534'
  c.fillText(`🌿 ${run.tulsi}`, 14, 28)

  if (run.shrinkTicks > 0) {
    c.fillStyle = 'rgba(2, 132, 199, 0.85)'
    c.fillRect(WORLD_WIDTH - 94, 18, 80 * (run.shrinkTicks / 150), 8)
    c.font = 'bold 11px system-ui, sans-serif'
    c.fillText('Laghima', WORLD_WIDTH - 94, 40)
  }
  if (run.shield) {
    c.fillStyle = '#ca8a04'
    c.font = 'bold 11px system-ui, sans-serif'
    c.fillText('Mainak ✦', WORLD_WIDTH - 94, run.shrinkTicks > 0 ? 56 : 28)
  }
}

function drawReady(c: CanvasRenderingContext2D) {
  c.fillStyle = 'rgba(15, 23, 42, 0.35)'
  c.fillRect(0, SEA_LEVEL / 2 + 40, WORLD_WIDTH, 80)
  c.textAlign = 'center'
  c.fillStyle = '#fff'
  c.font = 'bold 26px system-ui, sans-serif'
  c.fillText('Tap to leap', WORLD_WIDTH / 2, SEA_LEVEL / 2 + 80)
  c.font = '14px system-ui, sans-serif'
  c.fillText('or press Space', WORLD_WIDTH / 2, SEA_LEVEL / 2 + 104)
}

function drawBanner(c: CanvasRenderingContext2D, text: string, remaining: number) {
  c.globalAlpha = Math.min(1, remaining * 4)
  c.font = 'bold 14px system-ui, sans-serif'
  const width = c.measureText(text).width + 28
  c.fillStyle = 'rgba(30, 58, 138, 0.85)'
  c.beginPath()
  c.roundRect(WORLD_WIDTH / 2 - width / 2, 112, width, 30, 15)
  c.fill()
  c.fillStyle = '#fff'
  c.textAlign = 'center'
  c.fillText(text, WORLD_WIDTH / 2, 132)
  c.globalAlpha = 1
}

usePageSeo('Lanka Leap', 'Leap across the ocean to Lanka with Hanumanji. A daily satsang flying game.')
</script>
