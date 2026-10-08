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
      <div v-else-if="!howto.ready.value || !unlock.ready.value" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading…
      </div>
      <GameHowTo
        v-else-if="howto.showIntro.value && unlocked"
        intro
        title="Leap across the ocean to Lanka."
        @start="howto.markSeen()"
      >
        <LankaLeapRules />
      </GameHowTo>
      <div v-else class="space-y-4">
        <div ref="stageEl" class="lanka-stage relative mx-auto w-full touch-none select-none overscroll-contain">
          <canvas
            ref="canvasEl"
            class="block w-full rounded-2xl shadow-[0_18px_40px_-24px_rgba(3,105,161,0.7)] transition"
            :class="{ 'opacity-60 grayscale': !unlocked }"
            :style="{ aspectRatio: `${WORLD_WIDTH} / ${WORLD_HEIGHT}` }"
            aria-label="Lanka Leap. Tap or press Space to leap."
            role="img"
            @pointerdown.prevent="press"
            @touchstart.prevent
          />

          <button
            v-if="unlocked"
            type="button"
            class="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/40 text-white backdrop-blur"
            :aria-label="muted ? 'Play Hanuman Chalisa' : 'Mute Hanuman Chalisa'"
            :aria-pressed="!muted"
            @click="toggleMuted"
          >
            <IconVolumeOff v-if="muted" class="h-5 w-5" />
            <IconVolume v-else class="h-5 w-5" />
          </button>

          <div v-if="!unlocked" class="absolute inset-0 flex items-center justify-center p-4">
            <div class="w-full max-w-xs space-y-3 rounded-2xl bg-white p-5 text-center shadow-xl">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <IconLock class="h-6 w-6" />
              </div>
              <p class="font-display text-xl font-bold text-[hsl(var(--primary))]">Unlock Lanka Leap</p>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                Log your Daily Darshan on {{ LANKA_LEAP_UNLOCK_DAYS }} different days to open the game.
                Days count from {{ unlockFromLabel }}.
              </p>
              <template v-if="isLoggedIn">
                <div>
                  <div class="h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                    <div class="h-full rounded-full bg-amber-500 transition-all" :style="{ width: `${unlockPercent}%` }" />
                  </div>
                  <p class="mt-1.5 text-xs font-semibold tabular-nums text-amber-800">
                    {{ unlockDaysShown }} of {{ LANKA_LEAP_UNLOCK_DAYS }} days
                  </p>
                </div>
                <NuxtLink to="/niyams" class="block w-full rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white">
                  Log today’s darshan
                </NuxtLink>
              </template>
              <template v-else>
                <p class="text-xs text-[hsl(var(--muted-foreground))]">Sign in first so your darshan days can be counted.</p>
                <NuxtLink to="/login?redirect=/play/lanka-leap" class="block w-full rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white">
                  Sign in
                </NuxtLink>
              </template>
            </div>
          </div>

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
              <p v-if="savingRun" class="text-xs font-medium text-sky-700">Saving to the leaderboard…</p>
              <p v-else-if="saveError" class="text-xs font-medium text-red-600">{{ saveError }}</p>
              <p v-else-if="!isLoggedIn && lastRun.score > 0" class="text-xs text-[hsl(var(--muted-foreground))]">
                <NuxtLink to="/login?redirect=/play/lanka-leap" class="font-semibold text-sky-700 underline">Sign in</NuxtLink>
                to put your best on the all-time leaderboard.
              </p>
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

        <p class="text-center text-[11px] text-[hsl(var(--muted-foreground))]">
          Hanuman Chalisa recited by Sandeep Khurana,
          <a :href="CHALISA_SOURCE_URL" target="_blank" rel="noopener" class="underline">via Wikipedia</a>,
          <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener" class="underline">CC BY-SA 3.0</a>.
          Converted to AAC.
        </p>

        <GameHowTo>
          <LankaLeapRules />
        </GameHowTo>

        <GameLeaderboard
          :entries="boardEntries"
          :loading="boardLoading"
          all-time
          :current-user-id="auth.user.value?.uid"
          game="lanka-leap"
          rules="Ranked by highest score of all time. Signed in, your best run is checked and saved automatically."
        >
          <template v-if="!isLoggedIn">
            <NuxtLink to="/login?redirect=/play/lanka-leap" class="text-[hsl(var(--primary))] underline">Sign in</NuxtLink>
            to get on the board.
          </template>
        </GameLeaderboard>
        <GameCrowns :ids="['lanka-leap-highest']" />
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
import { IconLock, IconVolume, IconVolumeOff } from '@tabler/icons-vue'
import { LANKA_LEAP_UNLOCK_DAYS, LANKA_LEAP_UNLOCK_FROM_LABEL } from '~/composables/useLankaLeapUnlock'
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

const auth = useAuth()
const achievements = useAchievements()
const isLoggedIn = computed(() => !!auth.user.value)

const unlock = useLankaLeapUnlock()
const unlocked = computed(() => unlock.unlocked.value)
const unlockFromLabel = LANKA_LEAP_UNLOCK_FROM_LABEL
const unlockDaysShown = computed(() => Math.min(unlock.daysDone.value, LANKA_LEAP_UNLOCK_DAYS))
const unlockPercent = computed(() => (unlockDaysShown.value / LANKA_LEAP_UNLOCK_DAYS) * 100)

const CHALISA_SRC = '/games/lanka-leap/hanuman-chalisa.m4a'
const CHALISA_SOURCE_URL = 'https://en.wikipedia.org/wiki/File:Shri_Hanuman_Chalisa_Harmony_Voices.ogg'
const MUTED_KEY = 'lanka-leap:muted'
const muted = ref(false)
let chalisa: HTMLAudioElement | null = null

/** Must run inside the tap that starts or resumes a run, or mobile browsers refuse to play. */
function playChalisa() {
  if (muted.value) return
  if (!chalisa) {
    chalisa = new Audio(CHALISA_SRC)
    chalisa.loop = true
    chalisa.volume = 0.55
  }
  void chalisa.play().catch(() => {})
}

function pauseChalisa() {
  chalisa?.pause()
}

function toggleMuted() {
  muted.value = !muted.value
  try {
    localStorage.setItem(MUTED_KEY, muted.value ? '1' : '0')
  } catch {}
  if (muted.value) pauseChalisa()
  else if (phase.value === 'playing') playChalisa()
}
const {
  entries: boardEntries,
  loading: boardLoading,
  refetch: refetchBoard
} = useGameLeaderboard('lanka-leap', { allTime: true, sort: 'desc' })
const savingRun = ref(false)
const saveError = ref('')
/** Highest score sent this session, so a run is never sent twice. */
let lastSentScore = 0

const myRecord = computed(() =>
  boardEntries.value.find(entry => entry.userId === auth.user.value?.uid)?.score ?? 0
)

/** The callable replays the leaps and keeps the score only if it beats the stored record. */
async function sendRun(score: number, runLeaps: number[]) {
  if (!auth.user.value || score <= 0 || score <= myRecord.value || score <= lastSentScore) return
  lastSentScore = score
  savingRun.value = true
  saveError.value = ''
  try {
    await achievements.processResult('lanka-leap', {
      userName: auth.userName.value || auth.userEmail.value || 'Player',
      dateId,
      leaps: runLeaps
    })
    await refetchBoard()
  } catch {
    saveError.value = 'Could not save your score to the leaderboard.'
  } finally {
    savingRun.value = false
  }
}

watch([() => auth.user.value?.uid, boardLoading], ([uid, loading]) => {
  if (uid && !loading && day.bestLeaps.length) void sendRun(day.best, day.bestLeaps)
})

const canvasEl = ref<HTMLCanvasElement | null>(null)
const stageEl = ref<HTMLDivElement | null>(null)
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
let heroSheet: HTMLImageElement | null = null

const DEMON_SRC = {
  surasa: '/games/lanka-leap/surasa.webp',
  simhika: '/games/lanka-leap/simhika.webp',
  mainak: '/games/lanka-leap/mainak.webp',
  lankini: '/games/lanka-leap/lankini.webp',
} as const
const demonImages: Partial<Record<keyof typeof DEMON_SRC, HTMLImageElement>> = {}

function demonImage(key: keyof typeof DEMON_SRC) {
  const img = demonImages[key]
  return img?.complete && img.naturalWidth ? img : null
}

/** Frame rectangles in the sprite sheet; (ax, ay) is the head, which sits on the hit circle. */
type HeroFrame = readonly [x: number, y: number, w: number, h: number, ax: number, ay: number]
const HERO_SHEET_SRC = '/games/lanka-leap/hanuman-sheet.webp'
const HERO_SHEET_SCALE = 0.45
const HERO_GLIDE: HeroFrame[] = [
  [26, 41, 235, 148, 183, 105],
  [279, 41, 231, 148, 425, 106],
  [533, 41, 239, 148, 686, 107],
  [793, 41, 223, 148, 943, 106],
]
const HERO_RISE: HeroFrame[] = [
  [32, 244, 225, 173, 168, 315],
  [283, 244, 231, 173, 429, 315],
  [548, 244, 220, 173, 680, 309],
  [795, 244, 221, 173, 932, 309],
]
const HERO_DIVE: HeroFrame[] = [
  [49, 442, 210, 204, 189, 547],
  [308, 442, 201, 204, 453, 549],
]
const HERO_CHEER: HeroFrame = [804, 442, 183, 204, 902, 506]

function heroFrame(now: number): HeroFrame {
  if (phase.value === 'over' && run.reachedLanka) return HERO_CHEER
  const tick = Math.floor(now / 90)
  if (phase.value === 'playing' || phase.value === 'paused') {
    if (run.vy < -1.5) return HERO_RISE[tick % HERO_RISE.length]!
    if (run.vy > 5) return HERO_DIVE[tick % HERO_DIVE.length]!
  }
  return HERO_GLIDE[tick % HERO_GLIDE.length]!
}

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
  if (!available || !unlocked.value) return
  if (phase.value === 'ready') {
    phase.value = 'playing'
    pendingLeap = true
    playChalisa()
  } else if (phase.value === 'playing') {
    pendingLeap = true
  } else if (phase.value === 'paused') {
    phase.value = 'playing'
    playChalisa()
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
  void sendRun(run.score, leaps.slice())
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
  if (!document.hidden && !unlocked.value) void unlock.refresh()
}

watch(phase, (next) => {
  if (next !== 'playing') pauseChalisa()
})

function fitCanvas() {
  const el = canvasEl.value
  if (!el) return
  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  const width = Math.round(el.clientWidth * dpr)
  const height = Math.round(el.clientHeight * dpr)
  if (el.width !== width) el.width = width
  if (el.height !== height) el.height = height
}

/** Safari's pinch gesture events ignore touch-action, so cancel them inside the game. */
function blockGesture(event: Event) {
  event.preventDefault()
}

watch(stageEl, (el, old) => {
  for (const type of ['gesturestart', 'gesturechange']) {
    old?.removeEventListener(type, blockGesture)
    el?.addEventListener(type, blockGesture, { passive: false })
  }
})

watch(canvasEl, (el) => {
  resizeObserver?.disconnect()
  ctx = el ? el.getContext('2d') : null
  if (!el) return
  fitCanvas()
  resizeObserver = new ResizeObserver(fitCanvas)
  resizeObserver.observe(el)
})

onMounted(() => {
  heroSheet = new Image()
  heroSheet.src = HERO_SHEET_SRC
  for (const [key, src] of Object.entries(DEMON_SRC) as Array<[keyof typeof DEMON_SRC, string]>) {
    const img = new Image()
    img.src = src
    demonImages[key] = img
  }
  loadDay()
  try {
    muted.value = localStorage.getItem(MUTED_KEY) === '1'
  } catch {}
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
  pauseChalisa()
  chalisa = null
})

// ---------------------------------------------------------------------------
// Drawing. Obstacles are still placeholder artwork.
// ---------------------------------------------------------------------------

function draw(now: number) {
  const el = canvasEl.value
  if (!ctx || !el || !el.width) return
  const c = ctx
  const scale = el.width / WORLD_WIDTH
  c.setTransform(scale, 0, 0, scale, 0, 0)
  const d = run.distance

  drawSky(c, d, now)
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

/** Cloud outlines as overlapping puffs: [dx, dy, radius]. */
const CLOUD_SHAPES: ReadonlyArray<ReadonlyArray<readonly [number, number, number]>> = [
  [[0, 0, 13], [16, -9, 17], [36, -5, 15], [52, 1, 11], [26, 4, 13]],
  [[0, 0, 10], [14, -8, 14], [32, -13, 18], [52, -5, 14], [67, 1, 10], [34, 3, 13]],
  [[0, 0, 11], [16, -10, 15], [33, -3, 12], [18, 3, 11]],
]
const SUN_X = 318
const SUN_Y = 150
const HORIZON_Y = SEA_LEVEL - 36

function drawCloud(c: CanvasRenderingContext2D, x: number, y: number, size: number, shape: number, alpha: number) {
  const puffs = CLOUD_SHAPES[shape % CLOUD_SHAPES.length]!
  const outline = new Path2D()
  for (const [dx, dy, r] of puffs) {
    outline.moveTo(dx + r, dy)
    outline.arc(dx, dy, r, 0, Math.PI * 2)
  }
  c.save()
  c.globalAlpha = alpha
  c.translate(x, y)
  c.scale(size, size)

  c.save()
  c.translate(3, 6)
  c.fillStyle = 'rgba(14, 116, 144, 0.14)'
  c.fill(outline)
  c.restore()

  c.strokeStyle = 'rgba(56, 132, 190, 0.5)'
  c.lineWidth = 4 / size
  c.stroke(outline)
  const body = c.createLinearGradient(0, -30, 0, 16)
  body.addColorStop(0, '#ffffff')
  body.addColorStop(0.6, '#f0f8ff')
  body.addColorStop(1, '#cfe6f7')
  c.fillStyle = body
  c.fill(outline)

  c.fillStyle = 'rgba(255, 255, 255, 0.95)'
  c.beginPath()
  for (const [dx, dy, r] of puffs) {
    c.moveTo(dx - r * 0.25 + r * 0.5, dy - r * 0.35)
    c.arc(dx - r * 0.25, dy - r * 0.35, r * 0.5, 0, Math.PI * 2)
  }
  c.fill()
  c.restore()
}

function drawCloudLayer(c: CanvasRenderingContext2D, d: number, count: number, parallax: number, seed: number, size: number, alpha: number) {
  const span = WORLD_WIDTH + 200
  for (let i = 0; i < count; i++) {
    const x = ((((i + seed) * 173 - d * parallax) % span) + span) % span - 100
    const y = 50 + (((i + seed) * 67) % 240)
    drawCloud(c, x, y, size * (0.85 + ((i + seed) % 3) * 0.15), i + seed, alpha)
  }
}

function drawSun(c: CanvasRenderingContext2D, now: number) {
  const halo = c.createRadialGradient(SUN_X, SUN_Y, 24, SUN_X, SUN_Y, 160)
  halo.addColorStop(0, 'rgba(255, 247, 205, 0.9)')
  halo.addColorStop(0.3, 'rgba(254, 240, 138, 0.3)')
  halo.addColorStop(1, 'rgba(254, 240, 138, 0)')
  c.fillStyle = halo
  c.fillRect(SUN_X - 160, SUN_Y - 160, 320, 320)

  c.save()
  c.translate(SUN_X, SUN_Y)
  c.rotate(now / 12000)
  const rays = c.createRadialGradient(0, 0, 34, 0, 0, 140)
  rays.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
  rays.addColorStop(1, 'rgba(255, 255, 255, 0)')
  c.fillStyle = rays
  c.beginPath()
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6
    c.moveTo(0, 0)
    c.arc(0, 0, 140, a - 0.08, a + 0.08)
    c.closePath()
  }
  c.fill()
  c.restore()

  const disc = c.createRadialGradient(SUN_X - 10, SUN_Y - 12, 4, SUN_X, SUN_Y, 36)
  disc.addColorStop(0, '#fffbe8')
  disc.addColorStop(0.55, '#fde047')
  disc.addColorStop(1, '#f59e0b')
  c.fillStyle = disc
  c.beginPath()
  c.arc(SUN_X, SUN_Y, 34, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = 'rgba(234, 138, 12, 0.8)'
  c.lineWidth = 2.5
  c.stroke()
  c.fillStyle = 'rgba(255, 255, 255, 0.55)'
  c.beginPath()
  c.ellipse(SUN_X - 12, SUN_Y - 14, 9, 5, -0.6, 0, Math.PI * 2)
  c.fill()
}

function drawBirds(c: CanvasRenderingContext2D, d: number, now: number) {
  c.strokeStyle = 'rgba(30, 58, 138, 0.45)'
  c.lineWidth = 1.5
  c.lineCap = 'round'
  const span = WORLD_WIDTH + 120
  for (let i = 0; i < 3; i++) {
    const x = ((((i * 131) - d * 0.12 + now * 0.012) % span) + span) % span - 60
    const y = 210 + i * 26 + Math.sin(now / 900 + i) * 6
    const flap = Math.sin(now / 140 + i * 2) * 3
    c.beginPath()
    c.moveTo(x - 6, y - 2 - flap)
    c.quadraticCurveTo(x - 3, y - 3, x, y)
    c.quadraticCurveTo(x + 3, y - 3, x + 6, y - 2 - flap)
    c.stroke()
  }
}

function drawFarSea(c: CanvasRenderingContext2D, d: number, now: number) {
  const far = c.createLinearGradient(0, HORIZON_Y, 0, SEA_LEVEL)
  far.addColorStop(0, '#8fd8f7')
  far.addColorStop(1, '#3fb6e8')
  c.fillStyle = far
  c.fillRect(0, HORIZON_Y, WORLD_WIDTH, SEA_LEVEL - HORIZON_Y)
  c.fillStyle = 'rgba(255, 255, 255, 0.7)'
  c.fillRect(0, HORIZON_Y, WORLD_WIDTH, 1.5)

  for (let i = 0; i < 7; i++) {
    const glint = 0.35 + Math.sin(now / 400 + i * 1.9) * 0.3
    c.fillStyle = `rgba(255, 251, 220, ${Math.max(0, glint)})`
    const w = 26 - i * 3
    c.fillRect(SUN_X - w / 2 + Math.sin(now / 700 + i) * 4, HORIZON_Y + 4 + i * 4.5, w, 1.5)
  }

  c.fillStyle = 'rgba(255, 255, 255, 0.35)'
  const span = WORLD_WIDTH + 30
  for (let i = 0; i < 9; i++) {
    const x = ((((i * 61) - d * 0.2) % span) + span) % span - 15
    c.fillRect(x, HORIZON_Y + 8 + ((i * 11) % 22), 10 + (i % 3) * 4, 1)
  }
}

function drawSky(c: CanvasRenderingContext2D, d: number, now: number) {
  const sky = c.createLinearGradient(0, 0, 0, HORIZON_Y)
  sky.addColorStop(0, '#1d8fe0')
  sky.addColorStop(0.45, '#6cc6f5')
  sky.addColorStop(0.85, '#c9ecfb')
  sky.addColorStop(1, '#fdeccc')
  c.fillStyle = sky
  c.fillRect(0, 0, WORLD_WIDTH, HORIZON_Y)

  drawSun(c, now)
  drawCloudLayer(c, d, 5, 0.08, 7, 0.55, 0.65)
  drawBirds(c, d, now)
  drawCloudLayer(c, d, 4, 0.3, 0, 1, 1)
  drawFarSea(c, d, now)
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

/**
 * Draws a sprite rising out of the sea: `top` is the sprite's top edge and `centerX` lines up with
 * `anchorX` across its width. If it ends above the sea, its bottom row is stretched down to the water.
 */
function drawFromSea(c: CanvasRenderingContext2D, img: HTMLImageElement, centerX: number, top: number, width: number, anchorX = 0.5) {
  const height = width * img.naturalHeight / img.naturalWidth
  const left = centerX - width * anchorX
  c.drawImage(img, left, top, width, height)
  const bottom = top + height
  if (bottom < SEA_LEVEL + 8) {
    const inset = 6
    const insetWorld = inset * height / img.naturalHeight
    c.drawImage(img, 0, img.naturalHeight - inset, img.naturalWidth, 2, left, bottom - insetWorld, width, SEA_LEVEL + 9 - bottom + insetWorld)
  }
}

/** Surasa's sprite ends in a cut-off neck; a drawn neck carries it down into the sea. */
function drawSurasa(c: CanvasRenderingContext2D, img: HTMLImageElement, centerX: number, top: number) {
  const width = 132
  const left = centerX - width * 0.45
  const neckTop = top + width * (img.naturalHeight - 12) / img.naturalWidth
  if (neckTop < SEA_LEVEL + 8) {
    const neckLeft = left + width * 0.27
    const split = left + width * 0.486
    const neckRight = left + width * 0.596
    const bottom = SEA_LEVEL + 9
    c.fillStyle = '#7d8d22'
    c.fillRect(neckLeft, neckTop, split - neckLeft, bottom - neckTop)
    c.fillStyle = '#0a5a2c'
    c.fillRect(split, neckTop, neckRight - split, bottom - neckTop)
    c.fillStyle = 'rgba(255, 255, 255, 0.14)'
    c.fillRect(neckLeft + 4, neckTop, 5, bottom - neckTop)
    c.strokeStyle = 'rgba(40, 50, 10, 0.5)'
    c.lineWidth = 1.5
    c.beginPath()
    for (let y = neckTop + 10; y < bottom; y += 13) {
      c.moveTo(neckLeft, y)
      c.lineTo(split, y + 2)
    }
    c.stroke()
    c.strokeStyle = '#0a2e0a'
    c.lineWidth = 2.5
    c.beginPath()
    c.moveTo(neckLeft, neckTop)
    c.lineTo(neckLeft, bottom)
    c.moveTo(neckRight, neckTop)
    c.lineTo(neckRight, bottom)
    c.stroke()
  }
  c.drawImage(img, left, top, width, width * img.naturalHeight / img.naturalWidth)
}

function drawStormColumn(c: CanvasRenderingContext2D, sx: number, bottom: number) {
  const outline = new Path2D()
  outline.rect(sx, -10, PILLAR_WIDTH, bottom - 4)
  for (let i = 0; i < 4; i++) {
    const x = sx + 4 + (PILLAR_WIDTH - 8) * (i / 3)
    const r = i === 1 || i === 2 ? 14 : 12
    outline.moveTo(x + r, bottom - 13)
    outline.arc(x, bottom - 13, r, 0, Math.PI * 2)
  }
  c.strokeStyle = 'rgba(51, 65, 85, 0.6)'
  c.lineWidth = 3
  c.stroke(outline)
  const body = c.createLinearGradient(sx, 0, sx + PILLAR_WIDTH, 0)
  body.addColorStop(0, '#d5dee8')
  body.addColorStop(0.55, '#b4c2d1')
  body.addColorStop(1, '#8a9bb0')
  c.fillStyle = body
  c.fill(outline)
  c.fillStyle = 'rgba(255, 255, 255, 0.55)'
  c.beginPath()
  for (let i = 0; i < 4; i++) {
    const x = sx + 1 + (PILLAR_WIDTH - 8) * (i / 3)
    c.moveTo(x + 5, bottom - 17)
    c.arc(x, bottom - 17, 5, 0, Math.PI * 2)
  }
  c.fill()
  c.fillStyle = 'rgba(255, 255, 255, 0.25)'
  for (let y = bottom - 70; y > -10; y -= 56) {
    c.beginPath()
    c.ellipse(sx + 20, y, 12, 7, 0, 0, Math.PI * 2)
    c.ellipse(sx + 40, y - 22, 9, 5, 0, 0, Math.PI * 2)
    c.fill()
  }
}

function drawRockPillar(c: CanvasRenderingContext2D, sx: number, top: number) {
  const outline = new Path2D()
  outline.moveTo(sx - 2, SEA_LEVEL + 8)
  outline.lineTo(sx + 2, top + 14)
  outline.quadraticCurveTo(sx + 4, top + 2, sx + 16, top)
  outline.lineTo(sx + PILLAR_WIDTH - 14, top + 1)
  outline.quadraticCurveTo(sx + PILLAR_WIDTH - 2, top + 3, sx + PILLAR_WIDTH - 1, top + 16)
  outline.lineTo(sx + PILLAR_WIDTH + 3, SEA_LEVEL + 8)
  outline.closePath()
  const body = c.createLinearGradient(sx, 0, sx + PILLAR_WIDTH, 0)
  body.addColorStop(0, '#a8a29e')
  body.addColorStop(0.5, '#8a817c')
  body.addColorStop(1, '#5f5752')
  c.fillStyle = body
  c.fill(outline)
  c.strokeStyle = '#3f3a36'
  c.lineWidth = 2.5
  c.stroke(outline)

  c.strokeStyle = 'rgba(63, 58, 54, 0.45)'
  c.lineWidth = 1.5
  c.beginPath()
  for (let y = top + 34; y < SEA_LEVEL; y += 46) {
    c.moveTo(sx + 10, y)
    c.lineTo(sx + 26, y + 6)
    c.moveTo(sx + 38, y + 22)
    c.lineTo(sx + 54, y + 16)
  }
  c.stroke()
  c.fillStyle = '#4d7c0f'
  c.beginPath()
  c.ellipse(sx + PILLAR_WIDTH / 2, top + 3, PILLAR_WIDTH / 2 - 6, 5, 0, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#84cc16'
  c.beginPath()
  c.ellipse(sx + PILLAR_WIDTH / 2 - 6, top + 1, PILLAR_WIDTH / 2 - 16, 3, 0, 0, Math.PI * 2)
  c.fill()
}

function drawGateTower(c: CanvasRenderingContext2D, sx: number, bottom: number) {
  const body = c.createLinearGradient(sx, 0, sx + PILLAR_WIDTH, 0)
  body.addColorStop(0, '#b45309')
  body.addColorStop(0.35, '#fbbf24')
  body.addColorStop(0.6, '#f59e0b')
  body.addColorStop(1, '#92400e')
  c.fillStyle = body
  c.fillRect(sx, -10, PILLAR_WIDTH, bottom - 4)
  c.strokeStyle = '#78350f'
  c.lineWidth = 2.5
  c.strokeRect(sx, -10, PILLAR_WIDTH, bottom - 4)

  for (let y = bottom - 54; y > -10; y -= 48) {
    c.fillStyle = '#fcd34d'
    c.fillRect(sx - 3, y, PILLAR_WIDTH + 6, 7)
    c.strokeRect(sx - 3, y, PILLAR_WIDTH + 6, 7)
    c.fillStyle = '#dc2626'
    c.beginPath()
    c.arc(sx + PILLAR_WIDTH / 2, y - 18, 5, 0, Math.PI * 2)
    c.fill()
    c.stroke()
  }

  c.fillStyle = '#fcd34d'
  c.beginPath()
  c.moveTo(sx - 8, bottom - 16)
  c.lineTo(sx + PILLAR_WIDTH + 8, bottom - 16)
  c.lineTo(sx + PILLAR_WIDTH + 8, bottom - 6)
  for (let i = 4; i >= 0; i--) {
    const x = sx - 8 + ((PILLAR_WIDTH + 16) / 5) * i
    c.quadraticCurveTo(x + (PILLAR_WIDTH + 16) / 10, bottom + 2, x, bottom - 6)
  }
  c.closePath()
  c.fill()
  c.stroke()
}

function drawObstacle(c: CanvasRenderingContext2D, o: Obstacle, sx: number, now: number) {
  const mid = sx + PILLAR_WIDTH / 2

  if (o.kind === 'simhika') {
    const depth = SEA_LEVEL - o.reachY + 30
    c.save()
    c.translate(mid, SEA_LEVEL)
    c.scale((PILLAR_WIDTH / 2 + SIMHIKA_REACH) / depth, 1)
    const haze = c.createRadialGradient(0, 0, 0, 0, 0, depth)
    haze.addColorStop(0, 'rgba(46, 16, 101, 0.65)')
    haze.addColorStop(0.8, 'rgba(76, 29, 149, 0.4)')
    haze.addColorStop(1, 'rgba(76, 29, 149, 0)')
    c.fillStyle = haze
    c.fillRect(-depth, -depth, depth * 2, depth)
    c.restore()
    const img = demonImage('simhika')
    if (img) drawFromSea(c, img, mid + Math.sin(now / 700) * 4, o.reachY - 16 + Math.sin(now / 450) * 5, 236)
    drawLabel(c, 'Simhika', mid, o.reachY - 24)
  }

  if (o.kind === 'lankini') {
    drawGateTower(c, sx, o.gapTop)
    const img = demonImage('lankini')
    if (img) {
      const aspect = img.naturalHeight / img.naturalWidth
      const width = Math.min(205, Math.max(110, (SEA_LEVEL + 10 - o.gapBottom) / (aspect * 0.9)))
      drawFromSea(c, img, mid, o.gapBottom - width * aspect * 0.1, width)
    } else {
      drawRockPillar(c, sx, o.gapBottom)
    }
    drawLabel(c, 'Lankini’s gate', mid, o.gapTop - 22)
  } else {
    drawStormColumn(c, sx, o.gapTop)
    if (o.kind === 'surasa') {
      const img = demonImage('surasa')
      if (img) drawSurasa(c, img, mid + Math.sin(now / 500) * 3, o.gapBottom - 12)
      else drawRockPillar(c, sx, o.gapBottom)
      drawLabel(c, 'Surasa', mid, o.gapTop - 22)
    } else if (o.kind === 'mainak') {
      const img = demonImage('mainak')
      if (img) {
        const top = o.gapBottom - 30
        const width = Math.min(260, Math.max(190, (SEA_LEVEL + 10 - top) * img.naturalWidth / img.naturalHeight))
        drawFromSea(c, img, mid, top, width)
      } else {
        drawRockPillar(c, sx, o.gapBottom)
      }
      drawLabel(c, 'Mainak', mid, o.gapTop - 22)
    } else if (o.gapBottom < SEA_LEVEL) {
      drawRockPillar(c, sx, o.gapBottom)
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

function waveY(x: number, base: number, amp: number, shift: number) {
  return base + Math.sin(x * 0.05 + shift) * amp + Math.sin(x * 0.115 + shift * 1.7) * amp * 0.4
}

function traceWave(c: CanvasRenderingContext2D, base: number, amp: number, offset: number, shift: number) {
  c.moveTo(0, waveY(offset, base, amp, shift))
  for (let x = 8; x <= WORLD_WIDTH; x += 8) c.lineTo(x, waveY(x + offset, base, amp, shift))
}

function drawSea(c: CanvasRenderingContext2D, d: number, now: number) {
  const t = now * 0.003

  c.fillStyle = 'rgba(3, 105, 161, 0.55)'
  c.beginPath()
  traceWave(c, SEA_LEVEL - 4, 3, d * 0.7 + 40, t * 0.8 + 2)
  c.lineTo(WORLD_WIDTH, WORLD_HEIGHT)
  c.lineTo(0, WORLD_HEIGHT)
  c.closePath()
  c.fill()

  const sea = c.createLinearGradient(0, SEA_LEVEL, 0, WORLD_HEIGHT)
  sea.addColorStop(0, '#22b5ee')
  sea.addColorStop(0.45, '#0784c3')
  sea.addColorStop(1, '#0b3f68')
  c.fillStyle = sea
  c.beginPath()
  traceWave(c, SEA_LEVEL, 3, d, t)
  c.lineTo(WORLD_WIDTH, WORLD_HEIGHT)
  c.lineTo(0, WORLD_HEIGHT)
  c.closePath()
  c.fill()

  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.strokeStyle = 'rgba(240, 249, 255, 0.95)'
  c.lineWidth = 2.5
  c.beginPath()
  traceWave(c, SEA_LEVEL, 3, d, t)
  c.stroke()

  c.strokeStyle = 'rgba(186, 230, 253, 0.35)'
  c.lineWidth = 1.5
  for (const [depth, speed] of [[15, 0.8], [30, 0.6]] as const) {
    c.beginPath()
    traceWave(c, SEA_LEVEL + depth, 2, d * speed + depth * 7, t * 0.7 + depth)
    c.stroke()
  }

  const span = WORLD_WIDTH + 40
  for (let i = 0; i < 10; i++) {
    const twinkle = Math.sin(now / 280 + i * 1.7)
    if (twinkle <= 0.2) continue
    const x = ((((i * 97) - d * 0.9) % span) + span) % span - 20
    const y = SEA_LEVEL + 10 + ((i * 23) % 36)
    c.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`
    c.beginPath()
    c.moveTo(x - 5 * twinkle, y)
    c.lineTo(x, y - 1.5)
    c.lineTo(x + 5 * twinkle, y)
    c.lineTo(x, y + 1.5)
    c.closePath()
    c.fill()
  }
}

function drawHero(c: CanvasRenderingContext2D, now: number) {
  if (run.graceTicks > 0 && Math.floor(now / 90) % 2 === 0) return
  const r = heroRadius(run)
  const bob = phase.value === 'ready' ? Math.sin(now / 300) * 6 : 0
  const tilt = phase.value === 'ready' ? 0 : Math.max(-0.2, Math.min(0.35, run.vy * 0.035))

  c.save()
  c.translate(HERO_X, run.y + bob)
  c.rotate(tilt)
  c.scale(r / HERO_RADIUS, r / HERO_RADIUS)
  if (run.shield || run.shrinkTicks > 0) {
    c.shadowColor = run.shrinkTicks > 0 ? 'rgba(56, 189, 248, 0.95)' : 'rgba(250, 204, 21, 0.95)'
    c.shadowBlur = 14 + Math.sin(now / 160) * 6
  }
  if (heroSheet?.complete && heroSheet.naturalWidth) {
    const [x, y, w, h, ax, ay] = heroFrame(now)
    const s = HERO_SHEET_SCALE
    c.drawImage(heroSheet, x, y, w, h, (x - ax) * s, (y - ay) * s, w * s, h * s)
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

<style scoped>
/* Sized from the small viewport height, which stays put while the mobile address bar slides in and out. */
.lanka-stage {
  max-width: calc((100vh - 11rem) * 0.625);
  max-width: calc((100svh - 11rem) * 0.625);
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
</style>
