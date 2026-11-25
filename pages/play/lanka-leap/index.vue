<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-3 pb-24 pt-0 md:px-4 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <div class="sticky top-0 z-40 -mx-3 mb-4 flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-3 py-2 backdrop-blur md:top-16 md:-mx-4 md:px-4">
        <NuxtLink to="/play" class="rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          ‹ Back
        </NuxtLink>
      </div>

      <PageHeader title="Lanka Leap" subtitle="Leap the ocean with Hanumanji, cross to Lanka, fly the battle until Ravan falls, and bring Shri Ram home to Ayodhya." />

      <div v-if="!howto.ready.value || !unlock.ready.value" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading…
      </div>
      <GameHowTo
        v-else-if="howto.showIntro.value && unlocked"
        intro
        title="Leap to Lanka, then fly the battle."
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

          <div v-if="!unlocked" class="absolute inset-0 flex items-center justify-center p-4">
            <div class="w-full max-w-xs space-y-3 rounded-2xl bg-white p-5 text-center shadow-xl">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <IconLock class="h-6 w-6" />
              </div>
              <p class="font-display text-xl font-bold text-[hsl(var(--primary))]">Unlock Lanka Leap</p>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                Log your Daily Darshan on {{ LANKA_LEAP_UNLOCK_DAYS }} different days to open the game.
                Days you have already logged count.
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
              <p v-if="practiceRun" class="text-sm font-semibold text-amber-800">Practice flight. Not saved.</p>
              <p v-else-if="newBest" class="text-sm font-semibold text-emerald-700">New all-time best!</p>
              <p v-else-if="isLoggedIn && allTimeBest > 0" class="text-sm text-[hsl(var(--muted-foreground))]">All-time best: {{ allTimeBest }}</p>
              <p v-if="lastScene" class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                <span aria-hidden="true">{{ lastScene.icon }}</span> Reached {{ lastScene.name }}
              </p>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                {{ lastRun.tulsi }} tulsi {{ lastRun.tulsi === 1 ? 'leaf' : 'leaves' }}
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
          <div class="card-surface p-2"><p class="text-lg font-bold text-[hsl(var(--primary))]">{{ allTimeBest }}</p>All-time best</div>
          <div class="card-surface p-2"><p class="text-lg font-bold text-[hsl(var(--primary))]">{{ allTimeTulsi }}</p>Most tulsi</div>
        </div>

        <div v-if="unlocked" class="mx-auto max-w-sm space-y-2 text-center">
          <p class="text-xs font-semibold text-amber-900">Practice from</p>
          <div class="flex flex-wrap justify-center gap-1.5">
            <button
              v-for="scene in PRACTICE_SCENES"
              :key="scene.id"
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-semibold"
              :class="practiceRun && practiceScene === scene.id ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-950'"
              :aria-pressed="practiceRun && practiceScene === scene.id"
              @click="startPractice(scene.id)"
            >
              {{ scene.label }}
            </button>
            <button
              v-if="practiceRun"
              type="button"
              class="rounded-full bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white"
              @click="togglePractice"
            >
              Back to today’s flight
            </button>
          </div>
          <p class="text-[11px] leading-snug text-[hsl(var(--muted-foreground))]">
            A hit flickers instead of ending the flight, and nothing is saved.
            {{ isAdminUser ? 'Admins practise on today’s course.' : 'Practice uses its own course, not today’s.' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <p class="flex items-center gap-1.5 text-center">
            <IconMusic class="h-4 w-4 shrink-0 text-orange-600" />
            <span>
              Hanuman Chalisa listened to
              <strong class="tabular-nums text-[hsl(var(--primary))]">{{ chalisaListens }}</strong>
              {{ chalisaListens === 1 ? 'time' : 'times' }}
            </span>
          </p>
          <button
            v-if="unlocked"
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
            :aria-label="muted ? 'Turn on the Hanuman Chalisa and sounds' : 'Mute the Hanuman Chalisa and sounds'"
            :aria-pressed="!muted"
            @click="toggleMuted"
          >
            <IconVolumeOff v-if="muted" class="h-4 w-4" />
            <IconVolume v-else class="h-4 w-4" />
          </button>
        </div>

        <GameHowTo>
          <LankaLeapRules />
        </GameHowTo>

        <GameLeaderboard
          :entries="boardEntries"
          :loading="boardLoading"
          all-time
          show-all
          mark-most-tulsi
          :badge="boardBadge"
          :current-user-id="auth.user.value?.uid"
          game="lanka-leap"
          rules="Ranked by highest score of all time. A tulsi leaf marks who has collected the most leaves. Signed in, your best run is checked and saved automatically."
        >
          <template v-if="!isLoggedIn">
            <NuxtLink to="/login?redirect=/play/lanka-leap" class="text-[hsl(var(--primary))] underline">Sign in</NuxtLink>
            to get on the board.
          </template>
        </GameLeaderboard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AYODHYA_AT,
  calmFor,
  createRun,
  flameTop,
  gapShift,
  heroRadius,
  lankaLeapSeed,
  step,
  HERO_RADIUS,
  HERO_X,
  BATTLE_AT,
  BRIDGE_AT,
  FIRE_AT,
  LANKA_AT,
  MUDRIKA_AT,
  RAVAN_AT,
  PILLAR_WIDTH,
  SEA_LEVEL,
  SIMHIKA_REACH,
  CALM_TICKS,
  TICK_MS,
  WORLD_HEIGHT,
  WORLD_WIDTH
} from '~/functions/shared/lankaLeap.mjs'
import { IconLock, IconMusic, IconVolume, IconVolumeOff } from '@tabler/icons-vue'
import { LANKA_LEAP_UNLOCK_DAYS } from '~/composables/useLankaLeapUnlock'
import { ukDateId } from '~/utils/gameDay'
type RunState = ReturnType<typeof createRun>
type Obstacle = RunState['course'][number]
type Phase = 'ready' | 'playing' | 'paused' | 'over'
type DeathCause = NonNullable<RunState['cause']>

interface DayRecord {
  best: number
  bestTulsi: number
  runs: number
  reachedLanka: boolean
  /** Leap ticks of the best-scoring run, kept so it can be verified once scores are submitted. */
  bestLeaps: number[]
  /** Leap ticks of the run that collected the most tulsi today. */
  bestTulsiLeaps: number[]
  bestTulsiScore: number
}

const dateId = ukDateId()
const seed = lankaLeapSeed(dateId)
const storageKey = `lanka-leap:${dateId}`
const howto = useHowToPlay('lanka-leap', ['lanka-leap:'])
const { markDone } = useDailyGameCompletion('lanka-leap')

const auth = useAuth()
const achievements = useAchievements()
const isLoggedIn = computed(() => !!auth.user.value)

const unlock = useLankaLeapUnlock()
const { isAdminUser } = useAdminAccess()
const unlocked = computed(() => unlock.unlocked.value)
const unlockDaysShown = computed(() => Math.min(unlock.daysDone.value, LANKA_LEAP_UNLOCK_DAYS))
const unlockPercent = computed(() => (unlockDaysShown.value / LANKA_LEAP_UNLOCK_DAYS) * 100)

const CHALISA_SRC = '/games/lanka-leap/hanuman-chalisa.mp3'
const MUTED_KEY = 'lanka-leap:muted'
const LISTENS_KEY = 'lanka-leap:chalisa-listens'
const muted = ref(false)
const chalisaListens = ref(0)
let chalisa: HTMLAudioElement | null = null

/** One listen is one complete play of the track. Pausing a run does not count. */
function onChalisaEnded() {
  if (!chalisa || !Number.isFinite(chalisa.duration) || chalisa.duration < 60) return
  chalisaListens.value++
  try {
    localStorage.setItem(LISTENS_KEY, String(chalisaListens.value))
  } catch {}
  if (muted.value || phase.value !== 'playing') return
  chalisa.currentTime = 0
  void chalisa.play().catch(() => {})
}

/** Must run inside the tap that starts or resumes a run, or mobile browsers refuse to play. */
function playChalisa() {
  if (muted.value) return
  if (!chalisa) {
    chalisa = new Audio(CHALISA_SRC)
    chalisa.loop = false
    chalisa.volume = 0.55
    chalisa.addEventListener('ended', onChalisaEnded)
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
const sound = useGameSound(muted)
const buzz = sound.buzz
const {
  entries: boardEntries,
  loading: boardLoading,
  refetch: refetchBoard
} = useGameLeaderboard('lanka-leap', { allTime: true, sort: 'desc' })
const savingRun = ref(false)
const saveError = ref('')
/** Highest score sent this session, so a run is never sent twice. */
let lastSentScore = 0
let lastSentTulsi = 0

const myRecord = computed(() =>
  boardEntries.value.find(entry => entry.userId === auth.user.value?.uid)?.score ?? 0
)
const myBestTulsi = computed(() =>
  boardEntries.value.find(entry => entry.userId === auth.user.value?.uid)?.tulsi ?? 0
)

/** The callable replays the leaps and keeps a score or tulsi total only if it beats what is stored. */
async function sendRun(score: number, tulsi: number, runLeaps: number[]) {
  if (!auth.user.value || !runLeaps.length || (score <= 0 && tulsi <= 0)) return
  const worthScore = score > myRecord.value && score > lastSentScore
  const worthTulsi = tulsi > myBestTulsi.value && tulsi > lastSentTulsi
  if (!worthScore && !worthTulsi) return
  if (worthScore) lastSentScore = score
  if (worthTulsi) lastSentTulsi = tulsi
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

const canvasEl = ref<HTMLCanvasElement | null>(null)
const stageEl = ref<HTMLDivElement | null>(null)
const phase = ref<Phase>('ready')
const lastRun = ref<{ score: number; tulsi: number; reachedLanka: boolean; reachedBridge: boolean; reachedBattle: boolean; reachedRavan: boolean; reachedAyodhya: boolean; cause: DeathCause } | null>(null)
const newBest = ref(false)
/** Admin practice. A hit flickers instead of ending the flight, and the score is not saved. */
const practiceRun = ref(false)
let practiceTainted = false
const day = reactive<DayRecord>({ best: 0, bestTulsi: 0, runs: 0, reachedLanka: false, bestLeaps: [], bestTulsiLeaps: [], bestTulsiScore: 0 })
const allTimeBest = computed(() => Math.max(myRecord.value, day.best))
const allTimeTulsi = computed(() => Math.max(myBestTulsi.value, day.bestTulsi))

watch([() => auth.user.value?.uid, boardLoading], ([uid, loading]) => {
  if (!uid || loading) return
  if (day.bestLeaps.length) void sendRun(day.best, 0, day.bestLeaps)
  if (day.bestTulsiLeaps.length) void sendRun(day.bestTulsiScore, day.bestTulsi, day.bestTulsiLeaps)
})

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
let riderSheet: HTMLImageElement | null = null

/** The furthest scene a score reaches. Scenes sit at fixed gates, so the score alone says it. */
const SCENES = [
  { from: AYODHYA_AT + 1, name: 'Home to Ayodhya', short: 'Ayodhya', icon: '🪔' },
  { from: RAVAN_AT + 1, name: 'Ravan has fallen', short: 'Ravan', icon: '🏹' },
  { from: BATTLE_AT + 1, name: 'The battle', short: 'Battle', icon: '⚔️' },
  { from: BRIDGE_AT + 1, name: 'The crossing', short: 'Crossing', icon: '🌉' },
  { from: FIRE_AT + 1, name: 'Lanka alight', short: 'Lanka', icon: '🔥' },
  { from: LANKA_AT + 1, name: 'Ashok Vatika', short: 'Vatika', icon: '🌳' },
] as const

function sceneFor(score: number) {
  return SCENES.find(scene => score >= scene.from) ?? null
}

function boardBadge(entry: { score?: number }) {
  const scene = sceneFor(entry.score || 0)
  return scene ? `${scene.icon} ${scene.short}` : undefined
}

/** Practice can start at any scene. Admins fly today’s course; everyone else a practice course. */
const PRACTICE_SCENES = [
  { id: 'ocean', label: 'Ocean', gate: 0 },
  { id: 'lanka', label: 'Lanka', gate: LANKA_AT - 2 },
  { id: 'crossing', label: 'Crossing', gate: BRIDGE_AT - 2 },
  { id: 'battle', label: 'Battle', gate: BATTLE_AT - 2 },
  { id: 'home', label: 'Way home', gate: RAVAN_AT - 1 },
] as const
type PracticeScene = typeof PRACTICE_SCENES[number]['id']
const practiceScene = ref<PracticeScene>('ocean')

/** Flies a practice run on autopilot to a scene, then hands it over level with the next gap. */
function practiceRunFrom(scene: PracticeScene) {
  const s = createRun(isAdminUser.value ? seed : `${seed}:practice`, true)
  const gate = PRACTICE_SCENES.find(item => item.id === scene)?.gate ?? 0
  while (s.score < gate && s.tick < 60 * 60 * 15) {
    const next = s.course.find(o => o.x + PILLAR_WIDTH > s.distance + HERO_X - 10)
    const aim = next ? (next.gapTop + Math.min(next.gapBottom, SEA_LEVEL)) / 2 + gapShift(next, s.swing) + 10 : SEA_LEVEL / 2
    step(s, s.y > aim && s.vy > -1)
  }
  if (gate > 0) {
    const next = s.course.find(o => !o.passed)
    if (next) s.y = (next.gapTop + Math.min(next.gapBottom, SEA_LEVEL)) / 2 + gapShift(next, s.swing)
    s.vy = 0
    s.graceTicks = 0
    s.tulsi = 0
  }
  s.events.length = 0
  return s
}

/** Today’s best run, re-flown tick for tick from its saved leaps. */
let ghost: RunState | null = null
let ghostLeaps: number[] = []
let ghostNext = 0

function startGhost() {
  ghost = null
  if (run.practice || day.best < 3 || !day.bestLeaps.length) return
  ghost = createRun(seed)
  ghostLeaps = day.bestLeaps
  ghostNext = 0
}

function stepGhost() {
  if (!ghost?.alive) return
  const leap = ghostLeaps[ghostNext] === ghost.tick
  if (leap) ghostNext++
  step(ghost, leap)
}

type Spark = { x: number; y: number; vx: number; vy: number; born: number; life: number; color: string; size: number; fall: number }
type Popup = { text: string; x: number; y: number; born: number; color: string }
let sparks: Spark[] = []
let popups: Popup[] = []
let fireworksUntil = 0
let nextFirework = 0

function burst(x: number, y: number, count: number, colors: readonly string[], speed: number, fall = 0.00025, size = 1) {
  const now = performance.now()
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const v = speed * (0.35 + Math.random() * 0.65)
    sparks.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      born: now,
      life: 500 + Math.random() * 500,
      color: colors[i % colors.length]!,
      size: (1.6 + Math.random() * 2) * size,
      fall
    })
  }
  if (sparks.length > 600) sparks = sparks.slice(-600)
}

function popup(text: string, color: string) {
  popups.push({ text, x: HERO_X + 30, y: run.y - 34, born: performance.now(), color })
}

const GOLD = ['#fde68a', '#fbbf24', '#f59e0b', '#fff7ed'] as const
const FESTIVE = ['#fde68a', '#fb7185', '#f97316', '#a78bfa', '#34d399', '#fff7ed'] as const

/** Clearance between the head and the gate edges while inside a gate, for the close-shave sparkle. */
let shaveGate = -1
let shaveMin = Infinity
const SHAVE_PX = 6

function trackShave() {
  const r = heroRadius(run)
  const hx = run.distance + HERO_X
  for (let i = run.firstActive; i < run.course.length; i++) {
    const o = run.course[i]!
    if (o.x - r > hx) break
    if (o.x + PILLAR_WIDTH + r < hx || o.kind === 'simhika') continue
    const shift = gapShift(o, run.swing)
    let clear = run.y - r - (o.gapTop + shift)
    if (o.gapBottom < SEA_LEVEL) clear = Math.min(clear, o.gapBottom + shift - (run.y + r))
    if (o.index !== shaveGate) {
      shaveGate = o.index
      shaveMin = Infinity
    }
    shaveMin = Math.min(shaveMin, clear)
  }
}

const DEMON_SRC = {
  surasa: '/games/lanka-leap/surasa.webp',
  simhika: '/games/lanka-leap/simhika.webp',
  mainak: '/games/lanka-leap/mainak.webp',
  lankini: '/games/lanka-leap/lankini.webp',
} as const
const SCENE_SRC = {
  siege: '/games/lanka-leap/bg-siege.jpg',
  battle: '/games/lanka-leap/bg-battle.jpg',
  home: '/games/lanka-leap/bg-home.jpg',
  ayodhya: '/games/lanka-leap/bg-ayodhya.jpg',
} as const
const demonImages: Partial<Record<keyof typeof DEMON_SRC, HTMLImageElement>> = {}
const sceneImages: Partial<Record<keyof typeof SCENE_SRC, HTMLImageElement>> = {}

function demonImage(key: keyof typeof DEMON_SRC) {
  const img = demonImages[key]
  return img?.complete && img.naturalWidth ? img : null
}

/** Frame rectangles in the sprite sheet; (ax, ay) is the head, which sits on the hit circle. */
type HeroFrame = readonly [x: number, y: number, w: number, h: number, ax: number, ay: number]
const HERO_SHEET_SRC = '/games/lanka-leap/hanuman-sheet.webp'
const RIDER_SHEET_SRC = '/games/lanka-leap/riders-sheet.webp'
const HERO_SHEET_SCALE = 0.45
const RIDER_SCALE = 0.86
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
/**
 * Riders sheet: eight frames a row, each a separate figure. Rows overlap by a few
 * pixels, so the boxes are trimmed to each figure. Ram draws and looses, then Lakshman.
 */
const RAM_SHOT: HeroFrame[] = [
  [4, 6, 130, 136, 88, 95],
  [136, 4, 126, 136, 215, 94],
  [262, 5, 130, 136, 344, 94],
  [396, 6, 126, 137, 475, 95],
  [522, 7, 123, 134, 599, 96],
  [645, 6, 139, 135, 725, 95],
  [789, 6, 117, 136, 858, 96],
  [905, 7, 119, 134, 984, 96],
]
const LAKSHMAN_SHOT: HeroFrame[] = [
  [5, 142, 129, 135, 87, 230],
  [136, 140, 126, 135, 215, 229],
  [264, 140, 128, 136, 345, 230],
  [396, 141, 126, 137, 474, 232],
  [522, 142, 123, 134, 599, 231],
  [645, 142, 139, 134, 724, 232],
  [789, 142, 117, 134, 858, 232],
  [905, 143, 119, 132, 983, 232],
]
const FIRE_TAIL: HeroFrame[] = [
  [6, 283, 132, 90, 95, 331],
  [139, 281, 126, 92, 226, 330],
  [268, 282, 125, 91, 355, 331],
  [395, 285, 126, 89, 481, 333],
  [523, 283, 131, 88, 608, 330],
  [656, 283, 126, 90, 741, 331],
  [782, 281, 123, 92, 867, 330],
  [908, 283, 116, 90, 989, 331],
]
const SANJIVINI: HeroFrame[] = [
  [8, 372, 124, 131, 83, 450],
  [136, 374, 124, 125, 209, 449],
  [263, 374, 125, 127, 336, 449],
  [392, 374, 124, 126, 467, 451],
  [521, 375, 122, 128, 592, 451],
  [648, 375, 125, 123, 719, 451],
  [777, 375, 123, 128, 850, 452],
  [904, 374, 120, 130, 977, 451],
]

type HeroLook = { frame: HeroFrame; scale: number; sheet: 'hero' | 'rider' }

function heroLook(now: number): HeroLook {
  const tick = Math.floor(now / 90)
  if (run.carryingMountain) {
    const flap = Math.floor(now / 80)
    return { frame: SANJIVINI[flap % SANJIVINI.length]!, scale: RIDER_SCALE, sheet: 'rider' }
  }
  if (!run.reachedRavan && (run.reachedBattle || battleGlow() > 0.45)) {
    const step = Math.floor(now / 70)
    const brother = Math.floor(step / 24) % 2 === 0 ? RAM_SHOT : LAKSHMAN_SHOT
    return { frame: brother[step % 8]!, scale: RIDER_SCALE, sheet: 'rider' }
  }
  if (fireBlend() > 0.2) {
    const flare = Math.floor(now / 65)
    return { frame: FIRE_TAIL[flare % FIRE_TAIL.length]!, scale: RIDER_SCALE, sheet: 'rider' }
  }
  if (phase.value === 'over' && run.reachedLanka) return { frame: HERO_CHEER, scale: HERO_SHEET_SCALE, sheet: 'hero' }
  if (phase.value === 'playing' || phase.value === 'paused') {
    if (run.vy < -1.5) return { frame: HERO_RISE[tick % HERO_RISE.length]!, scale: HERO_SHEET_SCALE, sheet: 'hero' }
    if (run.vy > 5) return { frame: HERO_DIVE[tick % HERO_DIVE.length]!, scale: HERO_SHEET_SCALE, sheet: 'hero' }
  }
  return { frame: HERO_GLIDE[tick % HERO_GLIDE.length]!, scale: HERO_SHEET_SCALE, sheet: 'hero' }
}

const DEATH_TITLES: Record<DeathCause, string> = {
  rock: 'Struck a rock',
  sea: 'Into the ocean',
  surasa: 'Surasa blocked the way',
  simhika: 'Simhika seized your shadow',
  lankini: 'Lankini stopped you at the gate',
  vatika: 'Caught in Ashok Vatika',
  tower: 'Struck a palace wall',
  fire: 'Caught in the flames',
  stone: 'Struck the bridge',
  field: 'Struck on the battlefield',
  ravan: 'Ravan’s chariot',
  time: 'Out of time'
}
const DEATH_TIPS: Record<DeathCause, string> = {
  rock: 'Short, steady taps keep Hanumanji level through the gaps.',
  sea: 'Tap a little sooner to stay above the waves.',
  surasa: 'Take the blue Laghima orb just before Surasa to become tiny.',
  simhika: 'Stay high over the dark water. Simhika drags you down.',
  lankini: 'The gate to Lanka is wide. Aim for the middle.',
  vatika: 'The ashoka trees are solid. Fly the lit gaps between their branches.',
  tower: 'The rooftops are solid. Thread the gap above the fire.',
  fire: 'Over Lanka the flames rise. Stay in the top of each gap.',
  stone: 'The stones of the bridge are solid. Fly above the vanaras.',
  field: 'The chariots rise and fall. Time the leap through the moving gap.',
  ravan: 'His chariot fills the gate. Fly the gap above it.',
  time: 'What a flight!'
}
const deathTitle = computed(() => {
  if (!lastRun.value) return ''
  return lastRun.value.reachedAyodhya ? 'Shri Ram is home' : DEATH_TITLES[lastRun.value.cause]
})
const lastScene = computed(() => lastRun.value ? sceneFor(lastRun.value.score) : null)
const deathTip = computed(() => {
  if (!lastRun.value) return ''
  if (lastRun.value.reachedAyodhya) {
    return 'Shri Ram is home. The Deepavali gates go on as far as you can fly.'
  }
  if (lastRun.value.cause === 'field' && lastRun.value.reachedRavan) {
    return 'The way home swings fast and closes in. Take the golden Pushpak and the gates slow for a while.'
  }
  return DEATH_TIPS[lastRun.value.cause]
})

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
    day.bestTulsiLeaps = Array.isArray(data.bestTulsiLeaps) ? data.bestTulsiLeaps : []
    day.bestTulsiScore = Number(data.bestTulsiScore) || 0
  } catch {}
}

function saveDay() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(day))
  } catch {}
}

function press() {
  if (!unlocked.value) return
  sound.unlock()
  if (phase.value === 'ready') {
    phase.value = 'playing'
    pendingLeap = true
    if (run.tick === 0) startGhost()
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
  run = practiceRun.value ? practiceRunFrom(practiceScene.value) : createRun(seed)
  if (!practiceRun.value) practiceTainted = false
  ghost = null
  sparks = []
  popups = []
  fireworksUntil = 0
  shaveGate = -1
  leaps = []
  pendingLeap = false
  banner = null
  sceneCard = null
  lastRun.value = null
  newBest.value = false
  phase.value = 'ready'
}

function startPractice(scene: PracticeScene) {
  practiceScene.value = scene
  practiceRun.value = true
  practiceTainted = true
  restart()
  const label = PRACTICE_SCENES.find(item => item.id === scene)?.label
  if (scene !== 'ocean' && label) showBanner(`Practice from ${label}`)
}

function togglePractice() {
  practiceRun.value = !practiceRun.value
  if (practiceRun.value) practiceTainted = true
  const flying = phase.value === 'playing'
  restart()
  if (flying) {
    phase.value = 'playing'
    playChalisa()
  }
}

function showBanner(text: string) {
  banner = { text, until: performance.now() + 1800 }
}

/** A chapter title over the flight as each part of the story begins. */
let sceneCard: { title: string; line: string; born: number } | null = null
const SCENE_CARD_MS = 2800

function showSceneCard(title: string, line: string) {
  sceneCard = { title, line, born: performance.now() }
  banner = null
}

function handleEvents() {
  for (const event of run.events) {
    reactTo(event)
    if (event === 'laghima') showBanner('Laghima: Hanumanji becomes tiny')
    else if (event === 'mainak') showBanner('Mainak rises to help: one hit forgiven')
    else if (event === 'shield-break') showBanner('Mainak’s blessing is spent')
    else if (event === 'lanka') showSceneCard('Lanka', 'Lankini steps aside. Enter, Hanumanji')
    else if (event === 'mudrika') showBanner('Sita Mata receives Shri Ram’s ring. Her blessing forgives one hit')
    else if (event === 'fire') showSceneCard('Lanka Dahan', 'Hanumanji’s tail is set alight. Lanka burns')
    else if (event === 'bridge') showSceneCard('Ram Setu', 'Shri Ram and Lakshman cross with the vanaras')
    else if (event === 'sanjeevani') showBanner('Sanjeevani: Hanumanji carries the mountain')
    else if (event === 'battle') showSceneCard('Yuddha', 'The battle for Lanka')
    else if (event === 'revive') showBanner('Lakshman revives. Shri Ram and Lakshman ride on')
    else if (event === 'ayodhya') showSceneCard('Ayodhya', 'Jai Shri Ram! Shri Ram is home')
    else if (event === 'ravan') showSceneCard('Vijaya', 'Ravan has fallen. Fly for Ayodhya')
    else if (event === 'pushpak') showBanner('Pushpak: the way home steadies')
  }
}

/** Sound, vibration and sparkle for each moment of the flight. None of it touches the simulation. */
function reactTo(event: RunState['events'][number]) {
  const hy = run.y
  if (event === 'leap') sound.play('leap')
  else if (event === 'tulsi') {
    sound.play('tulsi')
    burst(HERO_X + 16, hy, 8, ['#4ade80', '#bbf7d0'], 0.08)
  } else if (event === 'laghima' || event === 'mainak' || event === 'sanjeevani' || event === 'pushpak' || event === 'mudrika') {
    sound.play('power')
    buzz(20)
    const colors = event === 'laghima' ? ['#7dd3fc', '#e0f2fe'] : event === 'sanjeevani' ? ['#4ade80', '#dcfce7'] : GOLD
    burst(HERO_X, hy, 26, colors, 0.16)
  } else if (event === 'shield-break') {
    sound.play('shield-break')
    buzz([30, 40, 30])
    burst(HERO_X, hy, 18, ['#facc15', '#a16207'], 0.2)
  } else if (event === 'lanka' || event === 'fire' || event === 'bridge' || event === 'battle' || event === 'ravan' || event === 'revive') {
    sound.play(event === 'revive' ? 'power' : 'scene')
    buzz([20, 50, 20])
    burst(HERO_X, hy, 40, event === 'fire' ? ['#fb923c', '#fde68a', '#ef4444'] : GOLD, 0.22)
  } else if (event === 'ayodhya') {
    sound.play('ayodhya')
    buzz([40, 60, 40, 60, 90])
    fireworksUntil = performance.now() + 6500
    nextFirework = 0
    burst(HERO_X, hy, 60, FESTIVE, 0.26)
  } else if (event === 'score') {
    if (shaveMin > 0 && shaveMin < SHAVE_PX && run.graceTicks === 0) {
      sound.play('shave')
      buzz(10)
      burst(HERO_X + 10, hy, 14, ['#fef08a', '#ffffff'], 0.14)
      popup('Close shave!', '#fef08a')
    }
    shaveGate = -1
    shaveMin = Infinity
  }
}

function endRun() {
  const cause = run.cause || 'rock'
  lastRun.value = { score: run.score, tulsi: run.tulsi, reachedLanka: run.reachedLanka, reachedBridge: run.reachedBridge, reachedBattle: run.reachedBattle, reachedRavan: run.reachedRavan, reachedAyodhya: run.reachedAyodhya, cause }
  sound.play('dead')
  if (practiceTainted || run.practice) {
    newBest.value = false
    overAt = performance.now()
    phase.value = 'over'
    if (navigator.vibrate) navigator.vibrate(40)
    return
  }
  day.runs++
  newBest.value = isLoggedIn.value && run.score > myRecord.value
  if (run.score > day.best) {
    day.best = run.score
    day.bestLeaps = leaps.slice()
  }
  if (run.tulsi > day.bestTulsi) {
    day.bestTulsi = run.tulsi
    day.bestTulsiLeaps = leaps.slice()
    day.bestTulsiScore = run.score
  }
  day.reachedLanka = day.reachedLanka || run.reachedLanka
  saveDay()
  void markDone({ score: day.best, detail: `Best ${day.best}${day.reachedLanka ? ' · reached Lanka' : ''}` })
  void sendRun(run.score, run.tulsi, leaps.slice())
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
      stepGhost()
      handleEvents()
      trackShave()
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
  riderSheet = new Image()
  riderSheet.src = RIDER_SHEET_SRC
  for (const [key, src] of Object.entries(DEMON_SRC) as Array<[keyof typeof DEMON_SRC, string]>) {
    const img = new Image()
    img.src = src
    demonImages[key] = img
  }
  for (const [key, src] of Object.entries(SCENE_SRC) as Array<[keyof typeof SCENE_SRC, string]>) {
    const img = new Image()
    img.src = src
    sceneImages[key] = img
  }
  loadDay()
  try {
    muted.value = localStorage.getItem(MUTED_KEY) === '1'
    chalisaListens.value = Number(localStorage.getItem(LISTENS_KEY)) || 0
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
  chalisa?.removeEventListener('ended', onChalisaEnded)
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
  const siege = siegeCover()
  if (siege < 0.98) {
    c.save()
    c.globalAlpha = 1 - siege
    drawLanka(c, d)
    c.restore()
  }
  const vatika = vatikaCover()
  if (vatika > 0.02) drawVatikaNight(c, d, now, vatika)
  const alight = fireBlend()
  if (alight > 0.02) drawCityAblaze(c, d, now, alight)
  for (const o of run.course) {
    const sx = o.x - d
    if (sx > WORLD_WIDTH + SIMHIKA_REACH) break
    if (sx + PILLAR_WIDTH < -SIMHIKA_REACH) continue
    drawObstacle(c, o, sx, now)
  }
  drawSea(c, d, now)
  if (fireBlend() > 0.08) drawEmbers(c, d, now)
  if (bridgeGlow() > 0.02) drawCrossing(c, d, now)
  if (battleGlow() > 0.05 && battleCover() < 0.12) drawBattleStorm(c, d, now)
  if (run.reachedRavan && homeCover() < 0.45 && arrivalCover() < 0.45) drawHomewind(c, d, now)
  drawBestMark(c, d)
  drawGhost(c, now)
  drawHero(c, now)
  spawnTailEmbers(now)
  drawEffects(c, now)
  drawSceneCard(c, now)
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

/** 0 over the open sea, 1 once Lanka is alight. Evening gathers as the gate approaches. */
function cityGlow() {
  if (run.reachedLanka) return 1
  const gate = run.course[LANKA_AT]
  if (!gate) return 0
  const ahead = gate.x - run.distance
  const t = (700 - ahead) / 700
  return Math.max(0, Math.min(0.72, t * 0.72))
}

/** 0 on the ocean, rising to 1 as Nala's bridge comes into view. */
function bridgeGlow() {
  if (run.reachedBridge) return 1
  const gate = run.course[BRIDGE_AT]
  if (!gate) return 0
  const ahead = gate.x - run.distance
  return Math.max(0, Math.min(1, (520 - ahead) / 520))
}

/** 0 on the bridge, rising to 1 as the battlefield comes into view. */
function battleGlow() {
  if (run.reachedBattle) return 1
  const gate = run.course[BATTLE_AT]
  if (!gate) return 0
  const ahead = gate.x - run.distance
  return Math.max(0, Math.min(1, (480 - ahead) / 480))
}

/** A hint of dawn as the chariot approaches, then full morning once Ravan has fallen. */
function ravanGlow() {
  if (run.reachedRavan) return 1
  const gate = run.course[RAVAN_AT]
  if (!gate) return 0
  const ahead = gate.x - run.distance
  return Math.max(0, Math.min(0.28, (420 - ahead) / 420 * 0.28))
}

/** The street catches light just after Lankini’s gate, and fades as the bridge begins. */
/** Lanka catches light as the last ashoka tree of the garden passes, and fades as the bridge begins. */
function fireBlend() {
  if (!run.reachedLanka) return 0
  const gate = run.course[FIRE_AT - 1]
  if (!gate) return 0
  const lit = clamp01((run.distance - (gate.x + PILLAR_WIDTH)) / 180)
  return lit * (1 - bridgeGlow())
}

/** Night in Ashok Vatika: from Lankini’s gate until the fire takes the city. */
function vatikaCover() {
  if (!run.reachedLanka) return 0
  const gate = run.course[LANKA_AT]
  if (!gate) return 0
  const enter = clamp01((run.distance - gate.x + 60) / 320)
  const last = run.course[FIRE_AT - 1]
  const leave = last ? clamp01((run.distance - (last.x + PILLAR_WIDTH)) / 180) : 0
  return enter * (1 - leave)
}

function mixHex(from: string, to: string, t: number) {
  const u = t < 0 ? 0 : t > 1 ? 1 : t
  const A = parseInt(from.slice(1), 16)
  const B = parseInt(to.slice(1), 16)
  const channels = [16, 8, 0].map((shift) => {
    const a = (A >> shift) & 255
    const b = (B >> shift) & 255
    return Math.round(a + (b - a) * u)
  })
  return `rgb(${channels.join(',')})`
}

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

function clamp01(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

function pastRavanDistance() {
  const gate = run.course[RAVAN_AT]
  if (!gate || !run.reachedRavan) return 0
  return Math.max(0, run.distance - gate.x)
}

/** How far the flight is past a gate that is already on the course. Later gates are not built yet, so the pan must not wait for them. */
function fromGate(index: number) {
  const gate = run.course[index]
  if (!gate) return 0
  return run.distance - gate.x
}

/** Golden Lanka, from the first sight of the city through the bridge. */
function siegeCover() {
  const approach = run.reachedLanka ? 1 : cityGlow() / 0.72
  return clamp01(approach) * (1 - battleGlow())
}

/** Twilight battle, held until Ravan’s chariot has passed. */
function battleCover() {
  if (!run.reachedRavan) return battleGlow()
  return 1 - clamp01(pastRavanDistance() / 1200)
}

/** The coast and Pushpak, then a fade as Ayodhya’s lamps come up. */
function homeCover() {
  if (!run.reachedRavan) return 0
  const past = pastRavanDistance()
  const rise = clamp01(past / 1000)
  const fall = 1 - clamp01((past - 2800) / 1600)
  return rise * Math.max(0, fall)
}

/** Diyas along the river, full by the time Ayodhya’s arch comes into view. Holds through the bonus gates. */
function arrivalCover() {
  if (!run.reachedRavan) return 0
  return clamp01((pastRavanDistance() - 2400) / 1600)
}

function sceneOpen() {
  return 1 - Math.max(siegeCover(), battleCover(), homeCover(), arrivalCover())
}

/** Open sky only, above the towers, so a slower pan does not shear the city. */
const SCENE_SKY_PORTION = 0.3
let sceneSkyCanvas: HTMLCanvasElement | null = null

function drawScene(c: CanvasRenderingContext2D, key: keyof typeof SCENE_SRC, pan: number, alpha: number, now: number) {
  const img = sceneImages[key]
  if (!img || !img.complete || !img.naturalWidth || alpha < 0.02) return
  const srcH = img.naturalHeight
  const srcW = img.naturalWidth
  const scale = SEA_LEVEL / srcH
  const windowW = Math.min(srcW, WORLD_WIDTH / scale)
  const maxX = Math.max(0, srcW - windowW)
  const sx = maxX * clamp01(pan)
  c.save()
  c.globalAlpha = alpha
  c.beginPath()
  c.rect(0, 0, WORLD_WIDTH, SEA_LEVEL)
  c.clip()
  c.drawImage(img, sx, 0, windowW, srcH, 0, 0, WORLD_WIDTH, SEA_LEVEL)

  const skySrcH = srcH * SCENE_SKY_PORTION
  const skyDestH = SEA_LEVEL * SCENE_SKY_PORTION
  if (!sceneSkyCanvas) {
    sceneSkyCanvas = document.createElement('canvas')
    sceneSkyCanvas.width = WORLD_WIDTH
    sceneSkyCanvas.height = Math.ceil(skyDestH)
  }
  const scratch = sceneSkyCanvas.getContext('2d')
  if (scratch) {
    const skyWindow = Math.min(srcW, WORLD_WIDTH / (skyDestH / skySrcH))
    const drift = (now * 0.000012) % 0.22
    const skySx = Math.max(0, srcW - skyWindow) * clamp01(pan * 0.55 + drift)
    scratch.globalCompositeOperation = 'source-over'
    scratch.globalAlpha = 1
    scratch.clearRect(0, 0, WORLD_WIDTH, sceneSkyCanvas.height)
    scratch.drawImage(img, skySx, 0, skyWindow, skySrcH, 0, 0, WORLD_WIDTH, skyDestH)
    scratch.globalCompositeOperation = 'destination-in'
    const fade = scratch.createLinearGradient(0, skyDestH * 0.42, 0, skyDestH)
    fade.addColorStop(0, 'rgba(0,0,0,1)')
    fade.addColorStop(1, 'rgba(0,0,0,0)')
    scratch.fillStyle = fade
    scratch.fillRect(0, 0, WORLD_WIDTH, sceneSkyCanvas.height)
    c.drawImage(sceneSkyCanvas, 0, 0)
  }
  c.restore()
}

function drawSceneClouds(c: CanvasRenderingContext2D, d: number, now: number, cover: number) {
  if (cover < 0.04) return
  drawCloudLayer(c, d * 0.35 + now * 0.02, 4, 0.12, 3, 0.85, 0.5 * cover)
  drawCloudLayer(c, d * 0.15 + now * 0.055, 3, 0.4, 13, 1.15, 0.78 * cover)
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
  const t = cityGlow() * (1 - bridgeGlow())
  const sky = c.createLinearGradient(0, 0, 0, HORIZON_Y)
  sky.addColorStop(0, mixHex('#1d8fe0', '#14081f', t))
  sky.addColorStop(0.45, mixHex('#6cc6f5', '#3b246b', t))
  sky.addColorStop(0.85, mixHex('#c9ecfb', '#9a3412', t))
  sky.addColorStop(1, mixHex('#fdeccc', '#fdba74', t))
  c.fillStyle = sky
  c.fillRect(0, 0, WORLD_WIDTH, HORIZON_Y)

  if (t < 0.98) {
    c.save()
    c.globalAlpha = 1 - t
    drawSun(c, now)
    c.restore()
  }
  if (t > 0.08) drawMoon(c, t)
  drawCloudLayer(c, d, 5, 0.08, 7, 0.55, 0.65 * (1 - t * 0.5))
  if (t < 0.92) {
    c.save()
    c.globalAlpha = 1 - t
    drawBirds(c, d, now)
    c.restore()
  }
  drawCloudLayer(c, d, 4, 0.3, 0, 1, 1 - t * 0.35)
  if (t < 0.98) {
    c.save()
    c.globalAlpha = 1 - t
    drawFarSea(c, d, now)
    c.restore()
  }
  const open = sceneOpen()
  if (t > 0.12 && open > 0.04) drawCityHorizon(c, d, now, t * open)

  const dust = battleGlow() * (1 - ravanGlow()) * open
  if (dust > 0.02) {
    c.save()
    c.globalAlpha = dust
    const haze = c.createLinearGradient(0, 0, 0, HORIZON_Y)
    haze.addColorStop(0, '#292524')
    haze.addColorStop(0.55, '#7c2d12')
    haze.addColorStop(1, '#fdba74')
    c.fillStyle = haze
    c.fillRect(0, 0, WORLD_WIDTH, HORIZON_Y)
    c.restore()
  }
  const victory = ravanGlow() * open
  if (victory > 0.02) {
    c.save()
    c.globalAlpha = victory
    const dawn = c.createLinearGradient(0, 0, 0, HORIZON_Y)
    dawn.addColorStop(0, '#38bdf8')
    dawn.addColorStop(0.6, '#fde68a')
    dawn.addColorStop(1, '#fff7ed')
    c.fillStyle = dawn
    c.fillRect(0, 0, WORLD_WIDTH, HORIZON_Y)
    c.restore()
  }

  const siege = siegeCover()
  const battle = battleCover()
  const home = homeCover()
  const arrival = arrivalCover()
  drawScene(c, 'siege', clamp01((fromGate(LANKA_AT) + 700) / 7500), siege, now)
  drawScene(c, 'battle', clamp01((fromGate(BATTLE_AT) + 480) / 9600), battle, now)
  const past = pastRavanDistance()
  drawScene(c, 'home', clamp01(past / 4000), home, now)
  drawScene(c, 'ayodhya', clamp01((past - 2400) / 4800), arrival, now)
  drawSceneClouds(c, d, now, Math.max(siege, battle, home, arrival))
}

function drawMoon(c: CanvasRenderingContext2D, t: number) {
  c.save()
  c.globalAlpha = Math.min(1, (t - 0.08) / 0.5)
  c.fillStyle = '#fef9c3'
  c.beginPath()
  c.arc(78, 92, 16, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = mixHex('#1d8fe0', '#14081f', Math.min(t, 1))
  c.beginPath()
  c.arc(86, 86, 13, 0, Math.PI * 2)
  c.fill()
  c.restore()
}

function drawCityHorizon(c: CanvasRenderingContext2D, d: number, now: number, t: number) {
  c.save()
  c.globalAlpha = Math.min(1, (t - 0.12) / 0.5)
  const bases = [28, 46, 34, 62, 40, 78, 36, 54, 30, 70, 44, 58]
  const span = WORLD_WIDTH + 80
  c.fillStyle = '#3b0764'
  for (let i = 0; i < bases.length; i++) {
    const height = bases[i]!
    const x = ((((i * 48) - d * 0.15) % span) + span) % span - 40
    c.fillRect(x, HORIZON_Y - height, 30, height + 8)
    c.beginPath()
    c.moveTo(x - 2, HORIZON_Y - height)
    c.lineTo(x + 15, HORIZON_Y - height - 12)
    c.lineTo(x + 32, HORIZON_Y - height)
    c.fill()
    if (t > 0.45 && i % 2 === 0) {
      const flicker = 0.45 + Math.sin(now / 180 + i) * 0.35
      c.fillStyle = `rgba(251, 146, 60, ${Math.max(0.2, flicker)})`
      c.fillRect(x + 8, HORIZON_Y - height + 10, 5, 7)
      c.fillRect(x + 17, HORIZON_Y - height + 22, 5, 7)
      c.fillStyle = '#3b0764'
    }
  }
  if (t > 0.55) {
    const glow = c.createLinearGradient(0, HORIZON_Y - 20, 0, HORIZON_Y + 8)
    glow.addColorStop(0, 'rgba(251, 146, 60, 0)')
    glow.addColorStop(1, 'rgba(234, 88, 12, 0.55)')
    c.fillStyle = glow
    c.fillRect(0, HORIZON_Y - 20, WORLD_WIDTH, 28)
  }
  c.restore()
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

/**
 * Nala’s bridge: floating stones, each carved with Shri Ram’s name, which is why
 * they floated. Both columns fill exactly the area that strikes Hanumanji.
 */
function drawBridgeStone(c: CanvasRenderingContext2D, o: Obstacle, sx: number) {
  const mid = sx + PILLAR_WIDTH / 2
  drawFlightPath(c, sx, o.gapTop, o.gapBottom)
  drawStoneColumn(c, sx, 0, o.gapTop, 'down')
  drawStoneColumn(c, sx, o.gapBottom, SEA_LEVEL, 'up')
  if (o.kind === 'setu') drawLabel(c, 'Nala’s bridge', mid, o.gapTop - 30)
}

function drawStoneColumn(c: CanvasRenderingContext2D, sx: number, y0: number, y1: number, edge: 'up' | 'down') {
  if (y1 - y0 < 1) return
  const stone = c.createLinearGradient(sx, 0, sx + PILLAR_WIDTH, 0)
  stone.addColorStop(0, '#57534e')
  stone.addColorStop(0.45, '#a8a29e')
  stone.addColorStop(1, '#44403c')
  c.fillStyle = stone
  c.fillRect(sx, y0, PILLAR_WIDTH, y1 - y0)
  c.strokeStyle = 'rgba(41, 37, 36, 0.55)'
  c.lineWidth = 1.5
  const gapEnd = edge === 'down' ? y1 : y0
  const away = edge === 'down' ? -1 : 1
  let row = 0
  for (let y = gapEnd + away * 26; edge === 'down' ? y > y0 : y < y1; y += away * 26) {
    c.beginPath()
    c.moveTo(sx + 2, y)
    c.lineTo(sx + PILLAR_WIDTH - 2, y)
    const joint = sx + (row % 2 === 0 ? 24 : 40)
    c.moveTo(joint, y)
    c.lineTo(joint, y - away * 26)
    c.stroke()
    row++
  }
  const slabY = edge === 'down' ? y1 - 20 : y0
  c.fillStyle = '#d6d3d1'
  c.fillRect(sx, slabY, PILLAR_WIDTH, 20)
  c.fillStyle = '#c2410c'
  c.font = '700 12px "Noto Sans Devanagari", "Kohinoor Devanagari", system-ui, sans-serif'
  c.textAlign = 'center'
  c.fillText('श्री राम', sx + PILLAR_WIDTH / 2, slabY + 15)
  c.strokeStyle = '#292524'
  c.lineWidth = 2.5
  c.strokeRect(sx + 1.25, y0 + 1.25, PILLAR_WIDTH - 2.5, y1 - y0 - 2.5)
}

/**
 * A rakshasa chariot of the battle: a war mast with its banner above the gap,
 * and below it the chariot itself, canopy, gold trim and a turning spoked wheel.
 * Both fill exactly the area that strikes Hanumanji and move with the gap.
 */
function drawChariot(c: CanvasRenderingContext2D, o: Obstacle, sx: number, shift: number) {
  const mid = sx + PILLAR_WIDTH / 2
  const top = o.gapTop + shift
  const bottom = o.gapBottom + shift
  drawFlightPath(c, sx, top, bottom)

  if (top > 1) {
    const mast = c.createLinearGradient(sx, 0, sx + PILLAR_WIDTH, 0)
    mast.addColorStop(0, '#292524')
    mast.addColorStop(0.5, '#57534e')
    mast.addColorStop(1, '#1c1917')
    c.fillStyle = mast
    c.fillRect(sx, 0, PILLAR_WIDTH, top)
    c.fillStyle = '#7f1d1d'
    const bannerTop = Math.max(6, top - 130)
    c.beginPath()
    c.moveTo(sx + 10, bannerTop)
    c.lineTo(sx + PILLAR_WIDTH - 10, bannerTop)
    c.lineTo(sx + PILLAR_WIDTH - 10, Math.max(bannerTop + 10, top - 46))
    c.lineTo(mid, Math.max(bannerTop + 20, top - 34))
    c.lineTo(sx + 10, Math.max(bannerTop + 10, top - 46))
    c.closePath()
    c.fill()
    c.fillStyle = '#fbbf24'
    if (top - 46 - bannerTop > 30) {
      c.beginPath()
      c.moveTo(mid, bannerTop + 8)
      c.lineTo(mid + 9, bannerTop + 18)
      c.lineTo(mid, bannerTop + 28)
      c.lineTo(mid - 9, bannerTop + 18)
      c.closePath()
      c.fill()
    }
    c.fillRect(sx, top - 12, PILLAR_WIDTH, 5)
    c.fillStyle = '#a16207'
    for (let i = 0; i < 4; i++) {
      c.beginPath()
      c.moveTo(sx + 4 + i * 15, top - 7)
      c.lineTo(sx + 11.5 + i * 15, top - 1)
      c.lineTo(sx + 19 + i * 15, top - 7)
      c.closePath()
      c.fill()
    }
    c.strokeStyle = '#0c0a09'
    c.lineWidth = 2.5
    c.strokeRect(sx + 1.25, 1.25, PILLAR_WIDTH - 2.5, top - 2.5)
  }

  const body = c.createLinearGradient(sx, 0, sx + PILLAR_WIDTH, 0)
  body.addColorStop(0, '#450a0a')
  body.addColorStop(0.5, '#991b1b')
  body.addColorStop(1, '#3f0a0a')
  c.fillStyle = body
  c.fillRect(sx, bottom, PILLAR_WIDTH, SEA_LEVEL - bottom)
  c.fillStyle = '#fbbf24'
  c.beginPath()
  c.moveTo(sx + 4, bottom + 16)
  c.quadraticCurveTo(mid, bottom - 2, sx + PILLAR_WIDTH - 4, bottom + 16)
  c.closePath()
  c.fill()
  c.fillRect(sx, bottom + 16, PILLAR_WIDTH, 4)
  c.fillRect(sx, bottom + 40, PILLAR_WIDTH, 3)
  const hub = bottom + 66
  if (hub + 22 < SEA_LEVEL + 10) {
    const spin = run.distance / 22
    c.strokeStyle = '#fbbf24'
    c.lineWidth = 3
    c.beginPath()
    c.arc(mid, hub, 20, 0, Math.PI * 2)
    c.stroke()
    c.lineWidth = 1.6
    for (let k = 0; k < 8; k++) {
      const a = spin + (k * Math.PI) / 4
      c.beginPath()
      c.moveTo(mid, hub)
      c.lineTo(mid + Math.cos(a) * 20, hub + Math.sin(a) * 20)
      c.stroke()
    }
    c.fillStyle = '#fde68a'
    c.beginPath()
    c.arc(mid, hub, 4, 0, Math.PI * 2)
    c.fill()
  }
  c.strokeStyle = '#1c0505'
  c.lineWidth = 2.5
  c.strokeRect(sx + 1.25, bottom + 1.25, PILLAR_WIDTH - 2.5, SEA_LEVEL - bottom - 2.5)
}

function drawRavan(c: CanvasRenderingContext2D, o: Obstacle, sx: number, shift: number) {
  const mid = sx + PILLAR_WIDTH / 2
  const top = o.gapTop + shift
  const bottom = o.gapBottom + shift
  const sink = o.passed ? Math.min(150, Math.max(0, HERO_X - sx - PILLAR_WIDTH)) : 0
  c.save()
  c.translate(0, sink)
  const aura = c.createLinearGradient(sx, top - 40, sx, top + 20)
  aura.addColorStop(0, 'rgba(239, 68, 68, 0)')
  aura.addColorStop(1, 'rgba(239, 68, 68, 0.45)')
  c.fillStyle = aura
  c.fillRect(sx - 18, top - 48, PILLAR_WIDTH + 36, 56)
  c.fillStyle = '#7f1d1d'
  c.fillRect(sx - 2, 0, PILLAR_WIDTH + 4, top)
  c.fillStyle = '#fbbf24'
  c.fillRect(sx - 2, Math.max(0, top - 8), PILLAR_WIDTH + 4, 8)

  c.fillStyle = '#991b1b'
  c.fillRect(sx - 8, bottom + 24, PILLAR_WIDTH + 16, 34)
  c.strokeStyle = '#fbbf24'
  c.lineWidth = 3
  c.beginPath()
  c.arc(sx + 8, bottom + 66, 11, 0, Math.PI * 2)
  c.arc(sx + PILLAR_WIDTH - 8, bottom + 66, 11, 0, Math.PI * 2)
  c.stroke()

  c.fillStyle = '#7f1d1d'
  c.fillRect(mid - 9, bottom + 2, 18, 26)
  for (let i = 0; i < 9; i++) {
    const spread = -1 + (i / 4)
    const hx = mid + spread * 16
    const hy = bottom - 6 + Math.abs(spread) * 8
    const crown = i === 4
    c.fillStyle = '#f6d7b0'
    c.beginPath()
    c.arc(hx, hy, crown ? 7 : 4.2, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#fbbf24'
    c.fillRect(hx - (crown ? 5 : 3), hy - (crown ? 12 : 8), crown ? 10 : 6, 3)
  }
  if (!o.passed) drawLabel(c, 'Ravan', mid, top - 16)
  c.restore()
}

/**
 * Ayodhya's gate columns on the way home. Each column fills exactly the area that
 * strikes Hanumanji, outlined dark so it holds against the bright city, and the
 * open gap glows like a doorway with chevrons pointing through it.
 */
function drawDawnGate(c: CanvasRenderingContext2D, o: Obstacle, sx: number, shift: number) {
  const top = o.gapTop + shift
  const bottom = o.gapBottom + shift
  drawFlightPath(c, sx, top, bottom)
  drawGateColumn(c, sx, 0, top, 'down')
  if (bottom < SEA_LEVEL) drawGateColumn(c, sx, bottom, SEA_LEVEL, 'up')
}

/** The last gate home: golden columns under bhagwa flags, with the city’s name over the way through. */
function drawAyodhyaArch(c: CanvasRenderingContext2D, o: Obstacle, sx: number) {
  const top = o.gapTop
  const bottom = o.gapBottom
  const mid = sx + PILLAR_WIDTH / 2
  drawFlightPath(c, sx, top, bottom)
  drawGateColumn(c, sx, 0, top, 'down', GOLD_COLUMN)
  drawGateColumn(c, sx, bottom, SEA_LEVEL, 'up', GOLD_COLUMN)
  for (const fx of [sx + 10, sx + PILLAR_WIDTH - 12]) {
    c.fillStyle = '#7c2d12'
    c.fillRect(fx, bottom - 30, 2, 30)
    c.fillStyle = '#f97316'
    c.beginPath()
    c.moveTo(fx + 2, bottom - 30)
    c.lineTo(fx + 16, bottom - 25)
    c.lineTo(fx + 2, bottom - 19)
    c.closePath()
    c.fill()
  }
  if (!o.passed) drawLabel(c, 'Ayodhya', mid, top + 22)
}

function drawFlightPath(c: CanvasRenderingContext2D, sx: number, top: number, bottom: number) {
  const mid = (top + bottom) / 2
  const light = c.createLinearGradient(0, top, 0, bottom)
  light.addColorStop(0, 'rgba(255, 251, 235, 0.15)')
  light.addColorStop(0.5, 'rgba(255, 251, 235, 0.5)')
  light.addColorStop(1, 'rgba(255, 251, 235, 0.15)')
  c.fillStyle = light
  c.fillRect(sx, top, PILLAR_WIDTH, bottom - top)
  c.strokeStyle = 'rgba(180, 83, 9, 0.55)'
  c.lineWidth = 3
  c.lineCap = 'round'
  c.lineJoin = 'round'
  for (let i = 0; i < 3; i++) {
    const x = sx + 14 + i * 14
    c.beginPath()
    c.moveTo(x, mid - 7)
    c.lineTo(x + 7, mid)
    c.lineTo(x, mid + 7)
    c.stroke()
  }
}

type ColumnPalette = { dark: string; light: string; shade: string; band: string; cap: string; bead: string; outline: string }
const MAROON_COLUMN: ColumnPalette = { dark: '#5b0f14', light: '#9f1d22', shade: '#3f0a0e', band: '#f59e0b', cap: '#fbbf24', bead: '#ea580c', outline: '#2a0607' }
const GOLD_COLUMN: ColumnPalette = { dark: '#92400e', light: '#f59e0b', shade: '#78350f', band: '#fff7ed', cap: '#fde68a', bead: '#dc2626', outline: '#451a03' }

/** `edge` is the end that faces the gap: the bottom of an upper column, the top of a lower one. */
function drawGateColumn(c: CanvasRenderingContext2D, sx: number, y0: number, y1: number, edge: 'up' | 'down', palette = MAROON_COLUMN) {
  if (y1 - y0 < 1) return
  const body = c.createLinearGradient(sx, 0, sx + PILLAR_WIDTH, 0)
  body.addColorStop(0, palette.dark)
  body.addColorStop(0.45, palette.light)
  body.addColorStop(1, palette.shade)
  c.fillStyle = body
  c.fillRect(sx, y0, PILLAR_WIDTH, y1 - y0)

  c.fillStyle = palette.band
  const gapEnd = edge === 'down' ? y1 : y0
  const away = edge === 'down' ? -1 : 1
  for (let y = gapEnd + away * 44; edge === 'down' ? y > y0 : y < y1; y += away * 56) {
    c.fillRect(sx + 3, y - 2, PILLAR_WIDTH - 6, 4)
  }

  const capY = edge === 'down' ? y1 - 14 : y0
  c.fillStyle = palette.cap
  c.fillRect(sx, capY, PILLAR_WIDTH, 14)
  c.fillStyle = palette.bead
  for (let i = 0; i < 6; i++) {
    c.beginPath()
    c.arc(sx + 7 + i * 10, capY + 7, 3.6, 0, Math.PI * 2)
    c.fill()
  }

  c.strokeStyle = palette.outline
  c.lineWidth = 2.5
  c.strokeRect(sx + 1.25, y0 + 1.25, PILLAR_WIDTH - 2.5, y1 - y0 - 2.5)
}

/**
 * The causeway grows behind Hanumanji from Nala’s first stone. Vanaras carry
 * rocks along it, one splashes a new stone into the sea at its end, and Shri Ram
 * and Lakshman walk at the head of the army.
 */
function drawCrossing(c: CanvasRenderingContext2D, d: number, now: number) {
  const setu = run.course[BRIDGE_AT]
  if (!setu) return
  c.save()
  c.globalAlpha = Math.min(1, bridgeGlow() * 1.4) * (1 - battleGlow())
  const start = setu.x - d - 30
  const battle = run.course[BATTLE_AT]
  const end = Math.min(HERO_X - 30, battle ? battle.x - d : WORLD_WIDTH + 40)
  if (end > start) {
    const from = Math.max(-20, start)
    c.fillStyle = '#78716c'
    c.fillRect(from, SEA_LEVEL - 6, end - from, 12)
    for (let x = Math.floor((from - start) / 22) * 22 + start; x < end; x += 22) {
      c.fillStyle = (Math.round((x - start) / 22) % 2) ? '#a8a29e' : '#d6d3d1'
      c.beginPath()
      c.roundRect(x, SEA_LEVEL - 9, 20, 10, 4)
      c.fill()
    }
    const t = (now % 1100) / 1100
    const dropX = end + 8
    if (t < 0.6) {
      c.fillStyle = '#a8a29e'
      c.beginPath()
      c.arc(dropX, SEA_LEVEL - 70 + (t / 0.6) * 66, 6, 0, Math.PI * 2)
      c.fill()
    } else {
      const ring = (t - 0.6) / 0.4
      c.strokeStyle = `rgba(255, 255, 255, ${0.9 * (1 - ring)})`
      c.lineWidth = 2
      c.beginPath()
      c.ellipse(dropX, SEA_LEVEL, 6 + ring * 18, 2 + ring * 4, 0, 0, Math.PI * 2)
      c.stroke()
    }
  }
  for (const o of run.course) {
    if (o.kind !== 'stone' && o.kind !== 'setu') continue
    const sx = o.x - d
    if (sx > WORLD_WIDTH + 40) break
    if (sx < -220) continue
    for (let i = 0; i < 3; i++) {
      const x = sx + PILLAR_WIDTH + 24 + i * 52
      if (x > end) continue
      drawVanara(c, x, SEA_LEVEL - 8, 1 + (i % 2) * 0.2, now / 170 + o.index + i, i !== 1)
    }
  }
  // Shri Ram and Lakshman walk at the head of the causeway, just behind Hanumanji.
  if (end - start > 60) {
    drawBrother(c, end - 22, SEA_LEVEL - 8, 'ram', now)
    drawBrother(c, end - 50, SEA_LEVEL - 8, 'lakshman', now + 300)
    if (run.score <= BRIDGE_AT + 3) {
      drawLabel(c, 'Shri Ram', end - 22, SEA_LEVEL - 96)
      drawLabel(c, 'Lakshman', end - 50, SEA_LEVEL - 86)
    }
  }
  c.restore()
}

/** A vanara walking the causeway, often with a rock held overhead for the next stone. */
function drawVanara(c: CanvasRenderingContext2D, x: number, y: number, scale: number, phase: number, carrying: boolean) {
  const step = Math.sin(phase)
  const hop = Math.abs(step) * 2.5 * scale
  c.save()
  c.translate(x, y - hop)
  c.scale(scale, scale)
  c.strokeStyle = '#7c2d12'
  c.lineWidth = 3
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(-2, -8)
  c.lineTo(-4 + step * 3, 0)
  c.moveTo(2, -8)
  c.lineTo(4 - step * 3, 0)
  c.stroke()
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(-5, -12)
  c.bezierCurveTo(-16, -10, -16, -26, -9, -27)
  c.stroke()
  c.fillStyle = '#9a3412'
  c.beginPath()
  c.ellipse(0, -15, 6, 8, 0, 0, Math.PI * 2)
  c.fill()
  c.beginPath()
  c.arc(0, -27, 5.5, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#fed7aa'
  c.beginPath()
  c.ellipse(1.5, -26, 3.4, 3, 0, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = '#9a3412'
  c.lineWidth = 2.4
  c.beginPath()
  if (carrying) {
    c.moveTo(-4, -19)
    c.lineTo(-5, -34)
    c.moveTo(4, -19)
    c.lineTo(5, -34)
  } else {
    c.moveTo(-4, -19)
    c.lineTo(-7 - step * 2, -10)
    c.moveTo(4, -19)
    c.lineTo(7 + step * 2, -10)
  }
  c.stroke()
  if (carrying) {
    c.fillStyle = '#a8a29e'
    c.beginPath()
    c.ellipse(0, -39, 8, 6, 0, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#c2410c'
    c.font = '700 5px system-ui, sans-serif'
    c.textAlign = 'center'
    c.fillText('राम', 0, -37)
  }
  c.restore()
}

/** Shri Ram, blue as in the riders sheet, and Lakshman, each with a bow, walking at the head of the army. */
function drawBrother(c: CanvasRenderingContext2D, x: number, y: number, who: 'ram' | 'lakshman', now: number) {
  const ram = who === 'ram'
  const skin = ram ? '#60a5fa' : '#fcd9b6'
  const dhoti = ram ? '#facc15' : '#fb923c'
  const step = Math.sin(now / 220)
  c.save()
  c.translate(x, y)
  c.strokeStyle = skin
  c.lineWidth = 3.5
  c.lineCap = 'round'
  c.beginPath()
  c.moveTo(-3, -18)
  c.lineTo(-4 + step * 3, 0)
  c.moveTo(3, -18)
  c.lineTo(4 - step * 3, 0)
  c.stroke()
  c.fillStyle = dhoti
  c.beginPath()
  c.moveTo(-8, -32)
  c.lineTo(8, -32)
  c.lineTo(7, -15)
  c.lineTo(-7, -15)
  c.closePath()
  c.fill()
  c.fillStyle = skin
  c.beginPath()
  c.roundRect(-7, -50, 14, 19, 4)
  c.fill()
  c.fillStyle = '#dc2626'
  c.beginPath()
  c.moveTo(-7, -49)
  c.lineTo(7, -36)
  c.lineTo(5, -33)
  c.lineTo(-7, -45)
  c.closePath()
  c.fill()
  c.fillStyle = skin
  c.beginPath()
  c.arc(0, -57, 7, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#1c1917'
  c.beginPath()
  c.arc(-1, -60, 7, Math.PI * 0.95, Math.PI * 2.05)
  c.fill()
  c.fillStyle = '#fbbf24'
  c.beginPath()
  c.moveTo(-7, -61)
  c.lineTo(-5, -71)
  c.lineTo(-2, -64)
  c.lineTo(0, -74)
  c.lineTo(2, -64)
  c.lineTo(5, -71)
  c.lineTo(7, -61)
  c.closePath()
  c.fill()
  c.strokeStyle = '#92400e'
  c.lineWidth = 2
  c.beginPath()
  c.arc(11, -40, 17, -1.2, 1.2)
  c.stroke()
  c.strokeStyle = 'rgba(254, 243, 199, 0.9)'
  c.lineWidth = 0.8
  c.beginPath()
  c.moveTo(11 + 17 * Math.cos(-1.2), -40 + 17 * Math.sin(-1.2))
  c.lineTo(11 + 17 * Math.cos(1.2), -40 + 17 * Math.sin(1.2))
  c.stroke()
  c.restore()
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
      // Struck by Hanumanji, she bows as he passes and gives way.
      const bow = o.passed ? clamp01((run.distance + HERO_X - (o.x + PILLAR_WIDTH)) / 140) : 0
      c.save()
      c.translate(mid, SEA_LEVEL)
      c.rotate(0.3 * bow)
      c.translate(-mid, -SEA_LEVEL + 22 * bow)
      drawFromSea(c, img, mid, o.gapBottom - width * aspect * 0.1, width)
      c.restore()
    } else {
      drawRockPillar(c, sx, o.gapBottom)
    }
    drawLabel(c, o.passed ? 'Lankini bows' : 'Lankini’s gate', mid, o.gapTop - 22)
  } else if (o.kind === 'vatika') {
    drawAshokaGate(c, o, sx, now)
  } else if (o.kind === 'roof') {
    drawRoof(c, o, sx, now)
  } else if (o.kind === 'setu' || o.kind === 'stone') {
    drawBridgeStone(c, o, sx)
  } else if (o.kind === 'field') {
    drawChariot(c, o, sx, gapShift(o, run.swing))
  } else if (o.kind === 'ravan') {
    drawRavan(c, o, sx, gapShift(o, run.swing))
  } else if (o.kind === 'dawn') {
    drawDawnGate(c, o, sx, gapShift(o, run.swing))
  } else if (o.kind === 'ayodhya') {
    drawAyodhyaArch(c, o, sx)
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
  const py = p.y + gapShift(o, run.swing)
  const pulse = 1 + Math.sin(now / 180) * 0.12
  if (p.kind === 'sanjeevani') {
    const glow = c.createRadialGradient(px, py, 2, px, py, 16 * pulse)
    glow.addColorStop(0, '#dcfce7')
    glow.addColorStop(1, '#15803d')
    c.fillStyle = glow
    c.beginPath()
    c.arc(px, py, 13 * pulse, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#166534'
    c.beginPath()
    c.ellipse(px - 6, py, 7, 3.5, -0.6, 0, Math.PI * 2)
    c.ellipse(px + 6, py, 7, 3.5, 0.6, 0, Math.PI * 2)
    c.fill()
    drawLabel(c, 'Sanjeevani', px, py - 18)
  } else if (p.kind === 'mudrika') {
    drawMudrika(c, px, py, pulse, now)
    drawLabel(c, 'Shri Ram’s ring', px, py - 22)
  } else if (p.kind === 'pushpak') {
    drawPushpak(c, px, py, pulse)
    drawLabel(c, 'Pushpak', px, py - 28)
  } else if (p.kind === 'tulsi') {
    c.fillStyle = '#16a34a'
    c.save()
    c.translate(px, py)
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
    const glow = c.createRadialGradient(px, py, 2, px, py, 14 * pulse)
    glow.addColorStop(0, p.kind === 'laghima' ? '#e0f2fe' : '#fef9c3')
    glow.addColorStop(1, p.kind === 'laghima' ? '#0284c7' : '#ca8a04')
    c.fillStyle = glow
    c.beginPath()
    c.arc(px, py, 12 * pulse, 0, Math.PI * 2)
    c.fill()
  }
}

/** Ram’s flying vimana: a golden hull under a small spired canopy. */
function drawPushpak(c: CanvasRenderingContext2D, px: number, py: number, pulse: number) {
  c.save()
  c.translate(px, py)
  c.scale(1.35, 1.35)
  const glow = c.createRadialGradient(0, 0, 2, 0, 0, 20 * pulse)
  glow.addColorStop(0, 'rgba(255, 251, 235, 0.95)')
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)')
  c.fillStyle = glow
  c.beginPath()
  c.arc(0, 0, 20 * pulse, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#b45309'
  c.beginPath()
  c.moveTo(-15, 1)
  c.quadraticCurveTo(0, 11, 15, 1)
  c.lineTo(11, -1)
  c.lineTo(-11, -1)
  c.closePath()
  c.fill()
  c.fillStyle = '#fbbf24'
  c.beginPath()
  c.moveTo(-8, -1)
  c.quadraticCurveTo(-8, -11, 0, -13)
  c.quadraticCurveTo(8, -11, 8, -1)
  c.closePath()
  c.fill()
  c.fillStyle = '#fef3c7'
  c.fillRect(-1, -18, 2, 6)
  c.fillStyle = '#dc2626'
  c.beginPath()
  c.moveTo(1, -18)
  c.lineTo(7, -16)
  c.lineTo(1, -14)
  c.closePath()
  c.fill()
  c.restore()
}

function waveY(x: number, base: number, amp: number, shift: number) {
  return base + Math.sin(x * 0.05 + shift) * amp + Math.sin(x * 0.115 + shift * 1.7) * amp * 0.4
}

function traceWave(c: CanvasRenderingContext2D, base: number, amp: number, offset: number, shift: number) {
  c.moveTo(0, waveY(offset, base, amp, shift))
  for (let x = 8; x <= WORLD_WIDTH; x += 8) c.lineTo(x, waveY(x + offset, base, amp, shift))
}

/** Moonlit garden behind Ravan’s palace: deep blue over the golden city, ashoka silhouettes and fireflies. */
function drawVatikaNight(c: CanvasRenderingContext2D, d: number, now: number, alpha: number) {
  c.save()
  c.globalAlpha = alpha
  const sky = c.createLinearGradient(0, 0, 0, SEA_LEVEL)
  sky.addColorStop(0, 'rgba(15, 23, 72, 0.92)')
  sky.addColorStop(0.65, 'rgba(30, 41, 99, 0.82)')
  sky.addColorStop(1, 'rgba(20, 83, 45, 0.85)')
  c.fillStyle = sky
  c.fillRect(0, 0, WORLD_WIDTH, SEA_LEVEL)
  for (let i = 0; i < 26; i++) {
    const x = (i * 97 + 13) % WORLD_WIDTH
    const y = 20 + ((i * 53) % 220)
    c.fillStyle = `rgba(255, 255, 255, ${0.35 + 0.35 * Math.sin(now / 600 + i)})`
    c.fillRect(x, y, 1.6, 1.6)
  }
  c.fillStyle = '#fef9c3'
  c.beginPath()
  c.arc(318, 92, 22, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = 'rgba(254, 249, 195, 0.18)'
  c.beginPath()
  c.arc(318, 92, 40, 0, Math.PI * 2)
  c.fill()
  const span = WORLD_WIDTH + 160
  for (let i = 0; i < 7; i++) {
    const x = ((((i * 131) - d * 0.3) % span) + span) % span - 80
    const h = 120 + (i % 3) * 40
    drawAshokaSilhouette(c, x, SEA_LEVEL - 8, h, 'rgba(6, 46, 30, 0.9)')
  }
  for (let i = 0; i < 14; i++) {
    const x = ((((i * 61) - d * 0.45 + now * 0.01) % span) + span) % span - 80
    const y = SEA_LEVEL - 60 - ((i * 37) % 200) + Math.sin(now / 500 + i) * 10
    c.fillStyle = `rgba(253, 224, 71, ${0.45 + 0.4 * Math.sin(now / 260 + i * 2)})`
    c.beginPath()
    c.arc(x, y, 1.8, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

function drawAshokaSilhouette(c: CanvasRenderingContext2D, x: number, base: number, height: number, color: string) {
  c.fillStyle = color
  c.fillRect(x - 3, base - height * 0.55, 6, height * 0.55)
  for (const [dx, dy, r] of [[0, -0.75, 0.22], [-0.16, -0.6, 0.16], [0.16, -0.62, 0.17], [0, -0.95, 0.15]] as const) {
    c.beginPath()
    c.ellipse(x + dx * height, base + dy * height, r * height * 0.7, r * height, 0, 0, Math.PI * 2)
    c.fill()
  }
}

function drawGardenFloor(c: CanvasRenderingContext2D, d: number) {
  const floor = c.createLinearGradient(0, SEA_LEVEL - 10, 0, WORLD_HEIGHT)
  floor.addColorStop(0, '#166534')
  floor.addColorStop(0.3, '#14532d')
  floor.addColorStop(1, '#052e16')
  c.fillStyle = floor
  c.fillRect(0, SEA_LEVEL - 4, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL + 4)
  c.strokeStyle = 'rgba(134, 239, 172, 0.45)'
  c.lineWidth = 1.2
  for (let x = -((d * 0.9) % 9); x < WORLD_WIDTH; x += 9) {
    c.beginPath()
    c.moveTo(x, SEA_LEVEL)
    c.lineTo(x + 2, SEA_LEVEL - 7)
    c.stroke()
  }
}

/**
 * An ashoka tree as a gate: a hanging canopy above the gap and a trunk below,
 * each filling exactly the area that strikes Hanumanji, with the gap lit between.
 */
function drawAshokaGate(c: CanvasRenderingContext2D, o: Obstacle, sx: number, now: number) {
  const top = o.gapTop
  const bottom = o.gapBottom
  const mid = sx + PILLAR_WIDTH / 2
  drawFlightPath(c, sx, top, bottom)

  const leaves = c.createLinearGradient(sx, 0, sx + PILLAR_WIDTH, 0)
  leaves.addColorStop(0, '#14532d')
  leaves.addColorStop(0.5, '#15803d')
  leaves.addColorStop(1, '#052e16')
  c.fillStyle = leaves
  c.fillRect(sx, 0, PILLAR_WIDTH, top)
  c.fillStyle = 'rgba(134, 239, 172, 0.35)'
  for (let y = top - 22; y > 0; y -= 30) {
    for (let i = 0; i < 3; i++) {
      c.beginPath()
      c.ellipse(sx + 12 + i * 20, y - (i % 2) * 10, 9, 5, -0.5, 0, Math.PI * 2)
      c.fill()
    }
  }
  c.fillStyle = '#f97316'
  for (let i = 0; i < 5; i++) {
    c.beginPath()
    c.arc(sx + 8 + i * 12, top - 6 - (i % 2) * 5, 3.2, 0, Math.PI * 2)
    c.fill()
  }

  const bark = c.createLinearGradient(sx, 0, sx + PILLAR_WIDTH, 0)
  bark.addColorStop(0, '#3f2a1d')
  bark.addColorStop(0.45, '#78522f')
  bark.addColorStop(1, '#2a1a10')
  c.fillStyle = bark
  c.fillRect(sx, bottom, PILLAR_WIDTH, SEA_LEVEL - bottom)
  c.strokeStyle = 'rgba(28, 16, 8, 0.6)'
  c.lineWidth = 1.5
  for (let y = bottom + 22; y < SEA_LEVEL; y += 26) {
    c.beginPath()
    c.moveTo(sx + 10, y)
    c.quadraticCurveTo(mid, y + 8, sx + PILLAR_WIDTH - 10, y - 2)
    c.stroke()
  }
  c.fillStyle = '#16a34a'
  c.fillRect(sx, bottom, PILLAR_WIDTH, 12)
  c.fillStyle = '#f97316'
  for (let i = 0; i < 5; i++) {
    c.beginPath()
    c.arc(sx + 8 + i * 12, bottom + 6, 3, 0, Math.PI * 2)
    c.fill()
  }

  c.strokeStyle = '#052e16'
  c.lineWidth = 2.5
  c.strokeRect(sx + 1.25, 1.25, PILLAR_WIDTH - 2.5, top - 2.5)
  c.strokeRect(sx + 1.25, bottom + 1.25, PILLAR_WIDTH - 2.5, SEA_LEVEL - bottom - 2.5)

  if (o.index === MUDRIKA_AT) drawSitaMata(c, sx + PILLAR_WIDTH + 30, SEA_LEVEL - 14, now)
}

/** Sita Mata beneath the ashoka tree, shown as a lotus in a soft halo rather than drawn as a figure. */
function drawSitaMata(c: CanvasRenderingContext2D, x: number, y: number, now: number) {
  const pulse = 1 + Math.sin(now / 500) * 0.06
  const halo = c.createRadialGradient(x, y - 14, 2, x, y - 14, 34 * pulse)
  halo.addColorStop(0, 'rgba(255, 251, 235, 0.95)')
  halo.addColorStop(0.5, 'rgba(253, 224, 71, 0.4)')
  halo.addColorStop(1, 'rgba(253, 224, 71, 0)')
  c.fillStyle = halo
  c.beginPath()
  c.arc(x, y - 14, 34 * pulse, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#f9a8d4'
  for (const angle of [-0.9, -0.45, 0, 0.45, 0.9]) {
    c.save()
    c.translate(x, y - 4)
    c.rotate(angle)
    c.beginPath()
    c.ellipse(0, -9, 4.5, 10, 0, 0, Math.PI * 2)
    c.fill()
    c.restore()
  }
  c.fillStyle = '#fde68a'
  c.beginPath()
  c.arc(x, y - 6, 3, 0, Math.PI * 2)
  c.fill()
  drawLabel(c, 'Sita Mata', x, y - 46)
}

/** Shri Ram’s signet ring, carried to Sita Mata. */
function drawMudrika(c: CanvasRenderingContext2D, px: number, py: number, pulse: number, now: number) {
  const glow = c.createRadialGradient(px, py, 2, px, py, 18 * pulse)
  glow.addColorStop(0, 'rgba(255, 251, 235, 0.9)')
  glow.addColorStop(1, 'rgba(250, 204, 21, 0)')
  c.fillStyle = glow
  c.beginPath()
  c.arc(px, py, 18 * pulse, 0, Math.PI * 2)
  c.fill()
  c.strokeStyle = '#ca8a04'
  c.lineWidth = 4
  c.beginPath()
  c.ellipse(px, py + 2, 8.5, 7.5, 0, 0, Math.PI * 2)
  c.stroke()
  c.strokeStyle = '#fde68a'
  c.lineWidth = 1.4
  c.beginPath()
  c.ellipse(px, py + 2, 8.5, 7.5, 0, Math.PI * 1.1, Math.PI * 1.7)
  c.stroke()
  c.fillStyle = '#dc2626'
  c.beginPath()
  c.moveTo(px, py - 11)
  c.lineTo(px + 4.5, py - 6)
  c.lineTo(px, py - 2)
  c.lineTo(px - 4.5, py - 6)
  c.closePath()
  c.fill()
  c.fillStyle = `rgba(255, 255, 255, ${0.6 + 0.4 * Math.sin(now / 200)})`
  c.fillRect(px - 1, py - 9, 2, 2)
}

/**
 * A palace of golden Lanka: carved gold bands, arched windows and an outline.
 * `burn` runs from 0 to 1 once Hanumanji’s burning tail has passed it.
 */
function drawPalaceWall(c: CanvasRenderingContext2D, sx: number, y0: number, y1: number, burn = 0, now = 0) {
  const body = c.createLinearGradient(sx, 0, sx + PILLAR_WIDTH, 0)
  body.addColorStop(0, '#7f1d1d')
  body.addColorStop(0.4, '#b45309')
  body.addColorStop(1, '#431407')
  c.fillStyle = body
  c.fillRect(sx, y0, PILLAR_WIDTH, y1 - y0)
  c.fillStyle = '#fbbf24'
  for (let y = y1 - 46; y > y0 + 6; y -= 72) c.fillRect(sx + 2, y, PILLAR_WIDTH - 4, 4)
  for (let y = y1 - 32; y > y0 + 10; y -= 36) {
    for (const wx of [sx + 9, sx + PILLAR_WIDTH - 21]) {
      const flicker = burn > 0 ? 0.5 + 0.5 * Math.sin(now / 80 + wx + y) : 0
      c.fillStyle = burn > 0
        ? `rgba(${249}, ${Math.round(115 + 80 * flicker)}, 22, ${0.6 + 0.4 * burn})`
        : 'rgba(254, 243, 199, 0.85)'
      c.beginPath()
      c.moveTo(wx, y + 14)
      c.lineTo(wx, y + 5)
      c.arc(wx + 6, y + 5, 6, Math.PI, 0)
      c.lineTo(wx + 12, y + 14)
      c.closePath()
      c.fill()
      if (burn > 0.3) {
        c.fillStyle = `rgba(254, 215, 170, ${0.7 * burn})`
        c.beginPath()
        c.moveTo(wx + 1, y + 2)
        c.quadraticCurveTo(wx + 6, y - 16 - 9 * flicker * burn, wx + 11, y + 2)
        c.closePath()
        c.fill()
      }
    }
  }
  if (burn > 0) {
    c.fillStyle = `rgba(220, 38, 38, ${0.32 * burn})`
    c.fillRect(sx, y0, PILLAR_WIDTH, y1 - y0)
  }
  c.strokeStyle = '#451a03'
  c.lineWidth = 2
  c.strokeRect(sx + 1, y0, PILLAR_WIDTH - 2, y1 - y0)
}

function drawFlames(c: CanvasRenderingContext2D, sx: number, top: number, bottom: number, now: number) {
  if (top >= bottom - 4) return
  const glow = c.createLinearGradient(0, top, 0, bottom)
  glow.addColorStop(0, 'rgba(254, 240, 138, 0.2)')
  glow.addColorStop(0.35, 'rgba(249, 115, 22, 0.9)')
  glow.addColorStop(1, 'rgba(153, 27, 27, 0.95)')
  c.fillStyle = glow
  c.beginPath()
  c.moveTo(sx - 4, bottom)
  const tongues = 5
  for (let i = 0; i <= tongues; i++) {
    const x = sx - 4 + ((PILLAR_WIDTH + 8) * i) / tongues
    const flicker = Math.sin(now / 90 + i * 1.7) * 7
    const tip = i % 2 === 0 ? top + flicker : top + 14 + flicker * 0.35
    c.lineTo(x, Math.min(bottom, Math.max(top - 4, tip)))
  }
  c.lineTo(sx + PILLAR_WIDTH + 4, bottom)
  c.closePath()
  c.fill()
}

function drawRoof(c: CanvasRenderingContext2D, o: Obstacle, sx: number, now: number) {
  const burn = clamp01((run.distance + HERO_X - o.x - 10) / 30)
  drawPalaceWall(c, sx, -20, o.gapTop, burn, now)
  c.fillStyle = '#fcd34d'
  c.beginPath()
  c.moveTo(sx - 6, o.gapTop)
  c.lineTo(sx + PILLAR_WIDTH / 2, o.gapTop - 14)
  c.lineTo(sx + PILLAR_WIDTH + 6, o.gapTop)
  c.closePath()
  c.fill()

  const flames = flameTop(o, run.distance + HERO_X)
  drawPalaceWall(c, sx, o.gapBottom, SEA_LEVEL + 12, burn, now)
  c.fillStyle = '#44403c'
  c.fillRect(sx - 4, o.gapBottom - 8, PILLAR_WIDTH + 8, 10)
  drawFlames(c, sx, flames, o.gapBottom + 16, now + o.index * 40)
}

function drawEmbers(c: CanvasRenderingContext2D, d: number, now: number) {
  const span = WORLD_WIDTH + 40
  for (let i = 0; i < 16; i++) {
    const x = ((((i * 73) - d * 0.55) % span) + span) % span - 20
    const rise = ((now * 0.04 + i * 37) % 220)
    const y = SEA_LEVEL - 20 - rise
    const alpha = 0.25 + (1 - rise / 220) * 0.6
    c.fillStyle = i % 3 === 0 ? `rgba(254, 240, 138, ${alpha})` : `rgba(249, 115, 22, ${alpha})`
    c.fillRect(x, y, i % 2 === 0 ? 2 : 3, 2)
  }
}
function drawSea(c: CanvasRenderingContext2D, d: number, now: number) {
  const alight = fireBlend()
  const dust = battleGlow() * (1 - ravanGlow())
  const water = (1 - alight) * (1 - dust)
  if (water > 0.02) {
    c.save()
    c.globalAlpha = water
    drawOcean(c, d, now)
    c.restore()
  }
  const garden = vatikaCover()
  if (garden > 0.02) {
    c.save()
    c.globalAlpha = garden
    drawGardenFloor(c, d)
    c.restore()
  }
  if (alight > 0.02 && dust < 0.98) {
    c.save()
    c.globalAlpha = alight * (1 - dust)
    drawBurningStreet(c, d, now)
    c.restore()
  }
  if (dust > 0.02) {
    c.save()
    c.globalAlpha = dust
    drawBattlefield(c, d, now)
    c.restore()
  }
}

function drawBattlefield(c: CanvasRenderingContext2D, d: number, now: number) {
  const ground = c.createLinearGradient(0, SEA_LEVEL - 8, 0, WORLD_HEIGHT)
  ground.addColorStop(0, '#d6b48a')
  ground.addColorStop(0.35, '#92400e')
  ground.addColorStop(1, '#44403c')
  c.fillStyle = ground
  c.fillRect(0, SEA_LEVEL - 6, WORLD_WIDTH, WORLD_HEIGHT - SEA_LEVEL + 6)
  c.fillStyle = 'rgba(120, 53, 15, 0.35)'
  const span = WORLD_WIDTH + 40
  for (let i = 0; i < 8; i++) {
    const x = ((((i * 68) - d * 0.35) % span) + span) % span - 20
    c.fillRect(x, SEA_LEVEL - 28 - (i % 3) * 10, 6, 34 + (i % 3) * 10)
    c.beginPath()
    c.moveTo(x + 6, SEA_LEVEL - 28 - (i % 3) * 10)
    c.lineTo(x + 22, SEA_LEVEL - 20 - (i % 3) * 10)
    c.lineTo(x + 6, SEA_LEVEL - 14 - (i % 3) * 10)
    c.fill()
  }
  c.fillStyle = `rgba(180, 83, 9, ${0.15 + Math.sin(now / 300) * 0.05})`
  c.fillRect(0, SEA_LEVEL - 18, WORLD_WIDTH, 16)
}

function drawBattleStorm(c: CanvasRenderingContext2D, d: number, now: number) {
  const dust = battleGlow() * (1 - ravanGlow())
  if (dust < 0.04) return
  c.save()
  c.globalAlpha = dust
  const span = WORLD_WIDTH + 120
  for (let i = 0; i < 9; i++) {
    const travel = (now * 0.28 + i * 97) % span
    const x = travel - 50
    const y = 150 + ((i * 53) % 300)
    c.strokeStyle = i % 2 === 0 ? '#fde68a' : '#fb923c'
    c.lineWidth = 1.6
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x + 22, y - 2)
    c.stroke()
    c.fillStyle = '#f97316'
    c.beginPath()
    c.moveTo(x + 22, y - 5)
    c.lineTo(x + 30, y - 2)
    c.lineTo(x + 22, y + 1)
    c.closePath()
    c.fill()
  }
  for (let i = 0; i < 6; i++) {
    const x = ((((i * 83) - d * 0.15) % span) + span) % span - 30
    const y = 80 + ((i * 41) % 160)
    const puff = 10 + (i % 3) * 6
    c.fillStyle = `rgba(68, 64, 60, ${0.18 + (i % 3) * 0.06})`
    c.beginPath()
    c.ellipse(x, y, puff, puff * 0.45, 0, 0, Math.PI * 2)
    c.fill()
  }
  const flash = Math.sin(now / 90)
  if (flash > 0.65) {
    c.fillStyle = `rgba(254, 240, 138, ${(flash - 0.65) * 1.4})`
    c.beginPath()
    c.arc(260 + Math.sin(now / 200) * 40, 220, 8, 0, Math.PI * 2)
    c.fill()
  }
  c.restore()
}

function drawHomewind(c: CanvasRenderingContext2D, d: number, now: number) {
  const rush = Math.min(1, Math.max(0, run.score - RAVAN_AT) / 24)
  c.save()
  c.globalAlpha = 0.18 + rush * 0.45
  c.strokeStyle = 'rgba(255, 251, 235, 0.85)'
  c.lineWidth = 1.5
  const span = WORLD_WIDTH + 40
  for (let i = 0; i < 8; i++) {
    const x = ((((i * 71) - d * (0.8 + rush)) % span) + span) % span - 20
    const y = 70 + ((i * 67) % 420)
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x + 18 + rush * 22, y)
    c.stroke()
  }
  c.fillStyle = '#fb7185'
  for (let i = 0; i < 7; i++) {
    const x = ((((i * 89) - d * 0.45) % span) + span) % span - 10
    const y = 40 + ((now * 0.02 + i * 80) % 520)
    c.globalAlpha = 0.35 + rush * 0.4
    c.beginPath()
    c.ellipse(x, y, 3.5, 2, -0.6, 0, Math.PI * 2)
    c.fill()
  }
  c.globalAlpha = 0.35 + rush * 0.4
  c.fillStyle = '#fff7ed'
  const spires = [34, 52, 28, 64, 40, 48]
  for (let i = 0; i < spires.length; i++) {
    const height = spires[i]!
    const x = ((((i * 70) - d * 0.08) % (WORLD_WIDTH + 80)) + WORLD_WIDTH + 80) % (WORLD_WIDTH + 80) - 40
    c.beginPath()
    c.moveTo(x, HORIZON_Y)
    c.lineTo(x + 8, HORIZON_Y - height)
    c.lineTo(x + 16, HORIZON_Y)
    c.fill()
    c.fillRect(x + 6, HORIZON_Y - height - 8, 4, 8)
  }
  c.restore()
}

function drawOcean(c: CanvasRenderingContext2D, d: number, now: number) {
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

function drawBurningStreet(c: CanvasRenderingContext2D, d: number, now: number) {
  const shift = now * 0.004
  const street = c.createLinearGradient(0, SEA_LEVEL - 8, 0, WORLD_HEIGHT)
  street.addColorStop(0, '#fb923c')
  street.addColorStop(0.18, '#c2410c')
  street.addColorStop(1, '#1c0a08')
  c.fillStyle = street
  c.beginPath()
  traceWave(c, SEA_LEVEL, 4, d * 0.35, shift)
  c.lineTo(WORLD_WIDTH, WORLD_HEIGHT)
  c.lineTo(0, WORLD_HEIGHT)
  c.closePath()
  c.fill()

  c.fillStyle = 'rgba(254, 240, 138, 0.9)'
  c.beginPath()
  traceWave(c, SEA_LEVEL - 10, 6, d * 0.55, shift + 1)
  c.lineTo(WORLD_WIDTH, SEA_LEVEL + 4)
  c.lineTo(0, SEA_LEVEL + 4)
  c.closePath()
  c.fill()
}

function drawHero(c: CanvasRenderingContext2D, now: number) {
  if (run.graceTicks > 0 && Math.floor(now / 90) % 2 === 0) return
  const r = heroRadius(run)
  const bob = phase.value === 'ready' ? Math.sin(now / 300) * 6 : 0
  const look = heroLook(now)
  const rawTilt = phase.value === 'ready' ? 0 : Math.max(-0.2, Math.min(0.35, run.vy * 0.035))
  const tilt = look.sheet === 'rider' ? rawTilt * 0.4 : rawTilt

  c.save()
  c.translate(HERO_X, run.y + bob)
  c.rotate(tilt)
  c.scale(r / HERO_RADIUS, r / HERO_RADIUS)
  const alight = fireBlend()
  const lifted = run.carryingMountain || run.greatLeap || run.floatTicks > 0
  const fighting = !run.reachedRavan && (run.reachedBattle || battleGlow() > 0.45)
  const calm = calmFor(run)
  if (run.shield || run.shrinkTicks > 0 || alight > 0.05 || lifted || fighting || calm > 0) {
    c.shadowColor = run.shrinkTicks > 0
      ? 'rgba(56, 189, 248, 0.95)'
      : calm > 0
        ? `rgba(253, 224, 71, ${0.5 + 0.45 * calm})`
        : lifted
        ? 'rgba(22, 163, 74, 0.95)'
        : fighting
          ? 'rgba(251, 191, 36, 0.9)'
          : alight > 0.05
            ? 'rgba(249, 115, 22, 0.95)'
            : 'rgba(250, 204, 21, 0.95)'
    c.shadowBlur = 14 + Math.sin(now / 160) * 6
  }
  const sheet = look.sheet === 'rider' ? riderSheet : heroSheet
  if (sheet?.complete && sheet.naturalWidth) {
    const [x, y, w, h, ax, ay] = look.frame
    const s = look.scale
    c.drawImage(sheet, x, y, w, h, (x - ax) * s, (y - ay) * s, w * s, h * s)
  } else if (heroSheet?.complete && heroSheet.naturalWidth) {
    const [x, y, w, h, ax, ay] = HERO_GLIDE[0]!
    const s = HERO_SHEET_SCALE
    c.drawImage(heroSheet, x, y, w, h, (x - ax) * s, (y - ay) * s, w * s, h * s)
  } else {
    c.fillStyle = '#f97316'
    c.beginPath()
    c.arc(0, 0, HERO_RADIUS, 0, Math.PI * 2)
    c.fill()
  }
  if (alight > 0.05 && look.sheet !== 'rider') {
    c.globalAlpha = alight
    drawTailFlame(c, now)
  }
  c.restore()
}

function drawTailFlame(c: CanvasRenderingContext2D, now: number) {
  const flicker = Math.sin(now / 70)
  c.fillStyle = '#fde68a'
  c.beginPath()
  c.ellipse(-46, 10, 10, 7 + flicker, -0.4, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#f97316'
  c.beginPath()
  c.ellipse(-58, 14, 12, 8 + flicker, -0.2, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#b91c1c'
  c.beginPath()
  c.ellipse(-70, 16, 8, 5, 0.2, 0, Math.PI * 2)
  c.fill()
}

/**
 * Lanka burning on the horizon: fires and smoke rise from more of the city the
 * deeper Hanumanji flies into it, so the burning spreads behind him.
 */
function drawCityAblaze(c: CanvasRenderingContext2D, d: number, now: number, alpha: number) {
  const spread = clamp01((run.score - FIRE_AT + 2) / (BRIDGE_AT - FIRE_AT))
  const fires = 2 + Math.round(spread * 7)
  const span = WORLD_WIDTH + 200
  c.save()
  c.globalAlpha = alpha
  const haze = c.createLinearGradient(0, SEA_LEVEL - 260, 0, SEA_LEVEL)
  haze.addColorStop(0, 'rgba(127, 29, 29, 0)')
  haze.addColorStop(1, `rgba(234, 88, 12, ${0.15 + 0.3 * spread})`)
  c.fillStyle = haze
  c.fillRect(0, SEA_LEVEL - 260, WORLD_WIDTH, 260)
  for (let i = 0; i < fires; i++) {
    const x = ((((i * 151 + 40) - d * 0.18) % span) + span) % span - 100
    const base = SEA_LEVEL - 70 - (i % 3) * 18
    for (let k = 0; k < 4; k++) {
      const rise = ((now * 0.02 + k * 40 + i * 17) % 160)
      const r = 12 + rise * 0.22
      c.fillStyle = `rgba(41, 37, 36, ${0.35 * (1 - rise / 160)})`
      c.beginPath()
      c.arc(x + Math.sin(rise / 30 + i) * 8, base - 20 - rise, r, 0, Math.PI * 2)
      c.fill()
    }
    const flicker = Math.sin(now / 90 + i * 2)
    c.fillStyle = 'rgba(249, 115, 22, 0.85)'
    c.beginPath()
    c.moveTo(x - 14, base + 6)
    c.quadraticCurveTo(x - 4, base - 18 - flicker * 6, x, base - 30 - flicker * 8)
    c.quadraticCurveTo(x + 6, base - 14, x + 14, base + 6)
    c.closePath()
    c.fill()
    c.fillStyle = 'rgba(254, 240, 138, 0.9)'
    c.beginPath()
    c.moveTo(x - 6, base + 4)
    c.quadraticCurveTo(x, base - 14 - flicker * 4, x + 6, base + 4)
    c.closePath()
    c.fill()
  }
  c.restore()
}

/** Sparks shed by the burning tail while Lanka is alight. */
let nextTailEmber = 0
function spawnTailEmbers(now: number) {
  if (phase.value !== 'playing' || fireBlend() < 0.2 || now < nextTailEmber) return
  nextTailEmber = now + 45
  const r = heroRadius(run) / HERO_RADIUS
  sparks.push({
    x: HERO_X - 52 * r,
    y: run.y - 30 * r,
    vx: -0.06 - Math.random() * 0.05,
    vy: -0.02 - Math.random() * 0.04,
    born: now,
    life: 500 + Math.random() * 400,
    color: Math.random() < 0.4 ? '#fde68a' : '#f97316',
    size: 1.2 + Math.random() * 1.6,
    fall: -0.00004
  })
}

function drawSceneCard(c: CanvasRenderingContext2D, now: number) {
  if (!sceneCard) return
  const t = now - sceneCard.born
  if (t > SCENE_CARD_MS) {
    sceneCard = null
    return
  }
  const fade = Math.min(1, t / 350, (SCENE_CARD_MS - t) / 500)
  const y = 196
  c.save()
  c.globalAlpha = fade
  const band = c.createLinearGradient(0, y - 46, 0, y + 30)
  band.addColorStop(0, 'rgba(30, 27, 75, 0)')
  band.addColorStop(0.3, 'rgba(30, 27, 75, 0.72)')
  band.addColorStop(0.7, 'rgba(30, 27, 75, 0.72)')
  band.addColorStop(1, 'rgba(30, 27, 75, 0)')
  c.fillStyle = band
  c.fillRect(0, y - 46, WORLD_WIDTH, 76)
  c.strokeStyle = 'rgba(251, 191, 36, 0.9)'
  c.lineWidth = 1.5
  const reach = 120 * Math.min(1, t / 600)
  for (const ly of [y - 32, y + 18]) {
    c.beginPath()
    c.moveTo(WORLD_WIDTH / 2 - reach, ly)
    c.lineTo(WORLD_WIDTH / 2 + reach, ly)
    c.stroke()
  }
  c.textAlign = 'center'
  c.fillStyle = '#fde68a'
  c.font = '700 26px Cinzel, Georgia, serif'
  c.fillText(sceneCard.title, WORLD_WIDTH / 2, y - 2)
  c.fillStyle = '#fff'
  c.font = '600 12px system-ui, sans-serif'
  c.fillText(sceneCard.line, WORLD_WIDTH / 2, y + 12)
  c.restore()
}

/** A faint Hanumanji flying today’s best run. */
function drawGhost(c: CanvasRenderingContext2D, now: number) {
  if (!ghost?.alive || !heroSheet?.complete || !heroSheet.naturalWidth) return
  const gx = HERO_X + ghost.distance - run.distance
  if (gx < -80 || gx > WORLD_WIDTH + 80) return
  const r = heroRadius(ghost)
  const [x, y, w, h, ax, ay] = HERO_GLIDE[Math.floor(now / 90) % HERO_GLIDE.length]!
  const s = HERO_SHEET_SCALE
  c.save()
  c.globalAlpha = 0.34
  c.translate(gx, ghost.y)
  c.rotate(Math.max(-0.2, Math.min(0.35, ghost.vy * 0.035)))
  c.scale(r / HERO_RADIUS, r / HERO_RADIUS)
  c.drawImage(heroSheet, x, y, w, h, (x - ax) * s, (y - ay) * s, w * s, h * s)
  c.restore()
  c.save()
  c.globalAlpha = 0.75
  drawLabel(c, 'Best', gx, ghost.y - 28)
  c.restore()
}

/** A line across the sky at the gate where today’s best flight ended. */
function drawBestMark(c: CanvasRenderingContext2D, d: number) {
  if (run.practice || day.best <= run.score) return
  const gate = run.course[day.best]
  if (!gate) return
  const x = gate.x - d + PILLAR_WIDTH / 2
  if (x < -20 || x > WORLD_WIDTH + 20) return
  c.save()
  c.strokeStyle = 'rgba(255, 251, 235, 0.8)'
  c.lineWidth = 2
  c.setLineDash([6, 8])
  c.beginPath()
  c.moveTo(x, 172)
  c.lineTo(x, SEA_LEVEL)
  c.stroke()
  c.setLineDash([])
  c.restore()
  drawLabel(c, `Your best · ${day.best}`, Math.min(x, WORLD_WIDTH - 44), 166)
}

function drawEffects(c: CanvasRenderingContext2D, now: number) {
  if (now < fireworksUntil && now >= nextFirework) {
    nextFirework = now + 200 + Math.random() * 180
    const colors = [FESTIVE[Math.floor(Math.random() * FESTIVE.length)]!, '#fff7ed']
    burst(40 + Math.random() * (WORLD_WIDTH - 80), 110 + Math.random() * 200, 56, colors, 0.24, 0.00012, 1.5)
  }
  if (sparks.length) {
    sparks = sparks.filter(p => now - p.born < p.life)
    for (const p of sparks) {
      const t = now - p.born
      const fade = 1 - t / p.life
      c.globalAlpha = Math.max(0, fade)
      c.fillStyle = p.color
      c.beginPath()
      c.arc(p.x + p.vx * t, p.y + p.vy * t + p.fall * t * t, p.size * (0.5 + fade * 0.5), 0, Math.PI * 2)
      c.fill()
    }
    c.globalAlpha = 1
  }
  if (popups.length) {
    popups = popups.filter(p => now - p.born < 900)
    c.textAlign = 'center'
    c.font = 'bold 15px system-ui, sans-serif'
    c.lineWidth = 4
    for (const p of popups) {
      const t = (now - p.born) / 900
      c.globalAlpha = 1 - t * t
      const y = p.y - t * 26
      c.strokeStyle = 'rgba(30, 27, 75, 0.75)'
      c.strokeText(p.text, p.x, y)
      c.fillStyle = p.color
      c.fillText(p.text, p.x, y)
    }
    c.globalAlpha = 1
  }
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
  const act = run.reachedAyodhya
    ? { name: `Deepavali · ${run.score - AYODHYA_AT - 1} bonus`, bar: '#f59e0b', ink: '#92400e', span: 1, done: 1 }
    : run.reachedRavan || ravanGlow() > 0.45
    ? { name: 'Home to Ayodhya', bar: '#d97706', ink: '#92400e', span: AYODHYA_AT - RAVAN_AT, done: Math.max(0, run.score - RAVAN_AT - 1) }
    : run.reachedBattle || battleGlow() > 0.45
      ? { name: 'The battle', bar: '#9f1239', ink: '#881337', span: RAVAN_AT - BATTLE_AT, done: Math.max(0, run.score - BATTLE_AT) }
      : run.reachedBridge || bridgeGlow() > 0.55
        ? { name: 'The crossing', bar: '#d97706', ink: '#92400e', span: BATTLE_AT - BRIDGE_AT, done: Math.max(0, run.score - BRIDGE_AT) }
        : run.reachedLanka && run.score < FIRE_AT
          ? { name: 'Ashok Vatika', bar: '#16a34a', ink: '#14532d', span: FIRE_AT - LANKA_AT - 1, done: Math.max(0, run.score - LANKA_AT - 1) }
        : run.reachedLanka
          ? { name: 'Lanka alight', bar: '#ea580c', ink: '#7c2d12', span: BRIDGE_AT - FIRE_AT + 1, done: Math.max(0, run.score - FIRE_AT + 1) }
          : { name: 'To Lanka', bar: '#d97706', ink: '#1e3a8a', span: LANKA_AT, done: run.score }
  c.fillStyle = act.bar
  c.fillRect(barX, 76, barWidth * Math.min(act.done / act.span, 1), 6)
  c.font = 'bold 11px system-ui, sans-serif'
  c.fillStyle = act.ink
  c.fillText(act.name, WORLD_WIDTH / 2, 96)
  if (run.practice) {
    c.fillStyle = '#b45309'
    c.fillText('Practice', WORLD_WIDTH / 2, 112)
  }

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
  if (run.calmTicks > 0) {
    const y = run.shrinkTicks > 0 || run.shield ? 56 : 18
    c.fillStyle = 'rgba(217, 119, 6, 0.9)'
    c.fillRect(WORLD_WIDTH - 94, y, 80 * (run.calmTicks / CALM_TICKS), 8)
    c.font = 'bold 11px system-ui, sans-serif'
    c.fillText('Pushpak', WORLD_WIDTH - 94, y + 22)
  }
  if (run.carryingMountain) {
    c.textAlign = 'left'
    c.fillStyle = '#15803d'
    c.font = 'bold 11px system-ui, sans-serif'
    c.fillText('Sanjeevani', 14, 48)
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
