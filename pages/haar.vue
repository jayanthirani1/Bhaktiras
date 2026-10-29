<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-3 pb-28 pt-8 md:px-4 md:pt-12">
    <div v-if="phase !== 'checking'" class="mx-auto max-w-md">
      <!-- Holding the heading for two seconds is the game master's reset; nothing on screen says so. -->
      <header
        class="select-none [-webkit-touch-callout:none]"
        @pointerdown="startResetHold"
        @pointerup="cancelResetHold"
        @pointerleave="cancelResetHold"
        @pointercancel="cancelResetHold"
        @contextmenu.prevent
      >
        <p class="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-red-700">
          Classified · Internal investigation
        </p>
        <PageHeader
          title="Case File: The Missing Haar"
          subtitle="Off the record. Rebuild the Haar’s last route before the Abhishek bell."
        />
      </header>

      <div v-if="phase === 'intro'" class="card-surface space-y-4 p-6 text-[15px] leading-relaxed text-[hsl(var(--foreground))]/85">
        <p>
          This morning the <span class="font-semibold text-[hsl(var(--foreground))]">Original Haar</span>, worn by Maharaj at the
          prathista in Bhuj, was moved from the main vault to the staging area. Minutes later it was gone.
        </p>
        <p>
          The CCTV for the theft window is corrupted. All we have left are the corridor door logs: fragments of the
          route the Haar took. Put them back together, Bhaktos.
        </p>
        <div class="rounded-xl bg-[hsl(var(--muted))] p-4">
          <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">How to play</p>
          <ol class="list-decimal space-y-1.5 pl-5 text-sm">
            <li><span class="font-semibold">Tap a corridor section</span> to turn it.</li>
            <li>Sections light up <span class="font-semibold text-amber-700">gold</span> once they connect to the staging area.</li>
            <li>Rebuild the route to the door the Haar left through.</li>
          </ol>
        </div>
        <button type="button" class="btn-primary w-full justify-center" @click="phase = 'playing'">
          Open the case file
        </button>
      </div>

      <template v-else>
        <div
          class="mx-auto grid w-full max-w-[22rem] items-center gap-1"
          :style="{ gridTemplateColumns: '2rem repeat(5, minmax(0, 1fr)) 2rem' }"
        >
          <div
            class="flex flex-col items-center justify-end pb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700"
            :style="{ gridColumn: HAAR_TRAIL_START.col + 2, gridRow: 1 }"
          >
            <IconPackage class="h-5 w-5" aria-hidden="true" />
            <span class="whitespace-nowrap">Staging area</span>
          </div>

          <div
            v-for="door in HAAR_TRAIL_DOORS"
            :key="door.id"
            class="relative flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors"
            :class="[
              trace.reached.has(door.id) ? 'text-amber-700' : 'text-[hsl(var(--muted-foreground))]',
              door.side === W || door.side === E ? 'h-full flex-col justify-center' : 'justify-center pt-1'
            ]"
            :style="doorPlacement(door)"
            :aria-label="trace.reached.has(door.id) ? door.label : 'An unknown door'"
          >
            <component :is="trace.reached.has(door.id) ? DOOR_ICONS[door.id] : IconDoor" class="h-5 w-5 shrink-0" aria-hidden="true" />
            <span v-if="!trace.reached.has(door.id)">?</span>
            <!-- A side door's name runs up the gutter, out of the layout, so it never stretches its row. -->
            <span
              v-else-if="door.side === W || door.side === E"
              class="pointer-events-none absolute bottom-full mb-1 whitespace-nowrap [writing-mode:vertical-rl]"
              :class="door.side === W ? 'rotate-180' : ''"
            >{{ door.label }}</span>
            <span v-else class="whitespace-nowrap">{{ door.label }}</span>
          </div>

          <button
            v-for="(kind, index) in HAAR_TRAIL_TILES"
            :key="index"
            type="button"
            class="relative aspect-square w-full overflow-hidden rounded-lg border bg-[hsl(var(--card))] transition-colors [touch-action:manipulation]"
            :class="[
              trace.lit.has(index) ? 'border-amber-400' : 'border-[hsl(var(--border))]',
              hinted === index ? 'ring-4 ring-amber-400' : ''
            ]"
            :style="{ gridColumn: (index % HAAR_TRAIL_SIZE) + 2, gridRow: Math.floor(index / HAAR_TRAIL_SIZE) + 2 }"
            :disabled="phase === 'solved'"
            :aria-label="`Corridor section, row ${Math.floor(index / HAAR_TRAIL_SIZE) + 1}, column ${(index % HAAR_TRAIL_SIZE) + 1}${trace.lit.has(index) ? ', on the route' : ''}`"
            @click="turn(index)"
          >
            <svg
              viewBox="0 0 100 100"
              class="h-full w-full transition-transform duration-200 ease-out"
              :style="{ transform: `rotate(${turns[index] * 90}deg)` }"
              aria-hidden="true"
            >
              <g v-for="side in sidesOf(kind)" :key="side">
                <line
                  x1="50" y1="50" :x2="EDGE[side][0]" :y2="EDGE[side][1]"
                  stroke-width="26" stroke-linecap="round"
                  :class="trace.lit.has(index) ? 'stroke-amber-100' : 'stroke-stone-100'"
                />
                <line
                  x1="50" y1="50" :x2="EDGE[side][0]" :y2="EDGE[side][1]"
                  stroke-width="7" stroke-linecap="round"
                  :stroke-dasharray="trace.lit.has(index) ? undefined : '7 8'"
                  :class="trace.lit.has(index) ? 'stroke-amber-500' : 'stroke-stone-300'"
                />
              </g>
              <circle cx="50" cy="50" :r="kind === 'end' ? 12 : 9" :class="trace.lit.has(index) ? 'fill-amber-500' : 'fill-stone-300'" />
            </svg>
          </button>
        </div>

        <p
          v-if="phase === 'playing' && decoyFound"
          class="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm leading-relaxed text-amber-900"
          role="status"
        >
          The route ends at the Security post. The guard stepped away and the CCTV went dark. Convenient, but the Haar
          didn’t stop here. Someone wants you looking at security. <span class="font-semibold">Keep tracing.</span>
        </p>

        <div v-if="phase === 'playing'" class="mt-5 flex justify-center gap-2">
          <button type="button" class="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[hsl(var(--border))] px-4 text-sm font-semibold" @click="hint">
            <IconBulb class="h-4 w-4" aria-hidden="true" />
            Hint<span v-if="hintsUsed" class="tabular-nums text-[hsl(var(--muted-foreground))]">· {{ hintsUsed }}</span>
          </button>
          <button type="button" class="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[hsl(var(--border))] px-4 text-sm font-semibold" @click="restart">
            <IconRefresh class="h-4 w-4" aria-hidden="true" />
            Reset the route
          </button>
        </div>

        <section v-if="phase === 'solved'" ref="evidenceSection" class="mt-6 scroll-mt-20 space-y-4">
          <div class="rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-4 text-center" role="status">
            <p class="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-emerald-800">
              <IconCircleCheck class="h-5 w-5" aria-hidden="true" />
              Puzzle 7 complete
            </p>
            <p class="mt-2 text-sm font-medium text-emerald-900">
              Route confirmed: staging area → restricted corridor → Ankut prep.
            </p>
          </div>

          <div class="card-surface p-4">
            <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Evidence recovered</h2>
            <p class="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">Add it to the case file.</p>
            <div class="mt-3 overflow-hidden rounded-xl bg-[hsl(var(--muted))]">
              <button v-if="evidence" type="button" class="group relative block w-full" aria-label="Enlarge the evidence image" @click="enlarged = true">
                <img :src="evidence.image" alt="Recovered evidence" class="mx-auto block w-full">
                <span class="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white">
                  <IconZoomIn class="h-4 w-4" aria-hidden="true" />
                  Tap to enlarge
                </span>
              </button>
              <div v-else-if="evidenceError" class="space-y-3 p-6 text-center text-sm">
                <p>The evidence file wouldn’t open. Check the connection and try again.</p>
                <button type="button" class="btn-primary text-sm" @click="loadEvidence">Try again</button>
              </div>
              <div v-else class="flex aspect-[3/4] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
                <IconFileSearch class="mr-2 h-5 w-5 animate-pulse" aria-hidden="true" />
                Decrypting the evidence file…
              </div>
            </div>
          </div>

          <div v-if="evidence" class="card-surface p-4">
            <div class="flex items-start justify-between gap-3">
              <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">{{ evidence.chain.title }}</h2>
              <span v-if="evidence.chain.placeholder" class="shrink-0 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Placeholder
              </span>
            </div>
            <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ evidence.chain.intro }}</p>
            <ol class="mt-4 space-y-3">
              <li v-for="(entry, i) in evidence.chain.entries" :key="i" class="flex gap-3">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-white">{{ i + 1 }}</span>
                <div class="min-w-0 pt-0.5">
                  <p class="font-mono text-xs font-semibold text-amber-700">{{ entry.time }}</p>
                  <p class="text-[15px] leading-snug text-[hsl(var(--foreground))]">{{ entry.text }}</p>
                </div>
              </li>
            </ol>
          </div>

          <p v-if="evidence" class="flex items-start gap-2 rounded-xl bg-[hsl(var(--primary))] p-4 text-sm font-medium leading-relaxed text-white">
            <IconArrowRight class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Take this to <span class="font-bold">Room 2, Puzzle 5</span>. The Haar alone won’t close this case.</span>
          </p>
        </section>
      </template>
    </div>

    <Teleport to="body">
      <div
        v-if="enlarged && evidence"
        class="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-3"
        role="dialog"
        aria-modal="true"
        aria-label="Evidence image"
        @click.self="enlarged = false"
      >
        <img :src="evidence.image" alt="Recovered evidence" class="h-full w-full object-contain [touch-action:pinch-zoom]">
        <button
          type="button"
          class="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white"
          aria-label="Close"
          @click="enlarged = false"
        >
          <IconX class="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  IconArrowRight,
  IconBulb,
  IconCircleCheck,
  IconDoor,
  IconFileSearch,
  IconPackage,
  IconRefresh,
  IconShieldLock,
  IconToolsKitchen2,
  IconX,
  IconZoomIn
} from '@tabler/icons-vue'
import {
  E,
  HAAR_TILE_BASE,
  HAAR_TRAIL_DOORS,
  HAAR_TRAIL_GOAL,
  HAAR_TRAIL_SIZE,
  HAAR_TRAIL_SOLUTION,
  HAAR_TRAIL_SOLVED_KEY,
  HAAR_TRAIL_START,
  HAAR_TRAIL_START_ROTATIONS,
  HAAR_TRAIL_TILES,
  HAAR_TRAIL_UNLOCK_KEY,
  N,
  S,
  W,
  isHaarBoard,
  tileOpenings,
  traceHaarTrail,
  turnsToReach,
  type HaarDoor,
  type HaarDoorId,
  type HaarEvidence,
  type HaarTileKind
} from '~/data/haarTrail'

const EDGE: Record<number, [number, number]> = { [N]: [50, 0], [E]: [100, 50], [S]: [50, 100], [W]: [0, 50] }
const DOOR_ICONS: Record<HaarDoorId, typeof IconDoor> = { ankut: IconToolsKitchen2, security: IconShieldLock }
const RESET_HOLD_MS = 2000

/**
 * `turns` only ever counts up, so a tile always spins clockwise on screen;
 * the puzzle reads it modulo four.
 */
const turns = ref<number[]>([...HAAR_TRAIL_START_ROTATIONS])
const rotations = computed(() => turns.value.map(t => t % 4))
const trace = computed(() => traceHaarTrail(rotations.value))

const phase = ref<'checking' | 'intro' | 'playing' | 'solved'>('checking')
const decoyFound = ref(false)
const hintsUsed = ref(0)
const hinted = ref<number | null>(null)
const evidence = ref<HaarEvidence | null>(null)
const evidenceError = ref(false)
const enlarged = ref(false)
const evidenceSection = ref<HTMLElement | null>(null)
let hintTimer: ReturnType<typeof setTimeout> | undefined
let resetTimer: ReturnType<typeof setTimeout> | undefined

function sidesOf(kind: HaarTileKind) {
  return [N, E, S, W].filter(side => HAAR_TILE_BASE[kind] & side)
}

function doorPlacement(door: HaarDoor) {
  if (door.side === N) return { gridColumn: door.col + 2, gridRow: 1 }
  if (door.side === S) return { gridColumn: door.col + 2, gridRow: HAAR_TRAIL_SIZE + 2 }
  return { gridColumn: door.side === W ? 1 : HAAR_TRAIL_SIZE + 2, gridRow: door.row + 2 }
}

function turn(index: number, by = 1) {
  if (phase.value !== 'playing') return
  const next = [...turns.value]
  next[index] += by
  turns.value = next
}

/** Puts the next wrong section of the real route right, walking out from the staging area. */
function hint() {
  const step = HAAR_TRAIL_SOLUTION.find(s => tileOpenings(s.index, rotations.value[s.index]) !== s.openings)
  if (!step) return
  turn(step.index, turnsToReach(step.index, rotations.value[step.index], step.openings) ?? 0)
  hintsUsed.value++
  hinted.value = step.index
  clearTimeout(hintTimer)
  hintTimer = setTimeout(() => { hinted.value = null }, 1500)
}

function restart() {
  turns.value = turns.value.map((t, i) => t + ((HAAR_TRAIL_START_ROTATIONS[i] - t % 4 + 4) % 4))
  decoyFound.value = false
  hintsUsed.value = 0
}

watch(trace, ({ reached }) => {
  if (phase.value !== 'playing') return
  if (reached.has('security')) decoyFound.value = true
  if (reached.has(HAAR_TRAIL_GOAL)) {
    phase.value = 'solved'
    writeStorage(HAAR_TRAIL_SOLVED_KEY, JSON.stringify(rotations.value))
    loadEvidence()
    nextTick(() => evidenceSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
})

async function loadEvidence() {
  evidenceError.value = false
  try {
    evidence.value = await $fetch<HaarEvidence>('/api/haar-trail', {
      method: 'POST',
      body: { rotations: rotations.value }
    })
  } catch {
    evidenceError.value = true
  }
}

function readStorage(key: string) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, value)
  } catch {
    // Storage refused (some private modes); the page still works for this visit.
  }
}

/** A board saved by an earlier solve in this tab, if it still checks out. */
function savedSolve(): number[] | null {
  try {
    const board: unknown = JSON.parse(readStorage(HAAR_TRAIL_SOLVED_KEY) ?? 'null')
    return isHaarBoard(board) && traceHaarTrail(board).reached.has(HAAR_TRAIL_GOAL) ? board : null
  } catch {
    return null
  }
}

/** The game master's reset: locks everything again for the next team. */
function startResetHold() {
  clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    if (!window.confirm('Reset the case file for the next team?')) return
    writeStorage(HAAR_TRAIL_SOLVED_KEY, null)
    writeStorage(HAAR_TRAIL_UNLOCK_KEY, null)
    navigateTo('/')
  }, RESET_HOLD_MS)
}

function cancelResetHold() {
  clearTimeout(resetTimer)
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') enlarged.value = false
}

watch(enlarged, open => {
  if (open) window.addEventListener('keydown', closeOnEscape)
  else window.removeEventListener('keydown', closeOnEscape)
})

/** Only reachable through the trigger in the navigation; a typed-in URL gets the ordinary 404. */
onMounted(() => {
  let unlocked = false
  try {
    unlocked = sessionStorage.getItem(HAAR_TRAIL_UNLOCK_KEY) === '1'
    if (!unlocked) {
      sessionStorage.setItem(`${HAAR_TRAIL_UNLOCK_KEY}-probe`, '1')
      sessionStorage.removeItem(`${HAAR_TRAIL_UNLOCK_KEY}-probe`)
    }
  } catch {
    // Storage refused (some private modes), so the trigger could not have set the key either.
    unlocked = true
  }
  if (!unlocked) {
    showError({ statusCode: 404, statusMessage: 'Page not found' })
    return
  }

  const solved = savedSolve()
  if (solved) {
    turns.value = solved
    phase.value = 'solved'
    loadEvidence()
    return
  }
  phase.value = 'intro'
})

/**
 * Leaving the page locks it again, so the next team has to find the trick too.
 * A solve is kept, so a team that wanders off afterwards goes straight back to
 * the evidence; the game master's reset clears that.
 */
onBeforeUnmount(() => {
  clearTimeout(hintTimer)
  clearTimeout(resetTimer)
  window.removeEventListener('keydown', closeOnEscape)
  writeStorage(HAAR_TRAIL_UNLOCK_KEY, null)
})

useNoIndex()
useHead({ title: 'Bhaktiras' })
</script>
