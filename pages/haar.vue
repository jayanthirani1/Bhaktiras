<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-3 pb-24 pt-8 md:px-4 md:pt-12">
    <div v-if="phase !== 'checking'" class="mx-auto max-w-md">
      <PageHeader title="The Haar Trail" subtitle="Ghanshyam Maharaj’s haar is missing. Follow the petals." />

      <div v-if="phase === 'intro'" class="card-surface space-y-4 p-6 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
        <p>
          Shayan aarti is close, and the haar has gone from the sinhasan. Whoever took it left in a hurry —
          <span class="font-semibold text-[hsl(var(--foreground))]">petals fell from the haar as they ran</span>.
        </p>
        <ol class="list-decimal space-y-2 pl-5">
          <li><span class="font-semibold text-[hsl(var(--foreground))]">Tap a tile</span> to turn it.</li>
          <li>Petals light up once they join the trail from the <span class="font-semibold text-[hsl(var(--foreground))]">sinhasan</span>.</li>
          <li>Rebuild the trail all the way to the door the thief used.</li>
        </ol>
        <button type="button" class="btn-primary w-full justify-center" @click="phase = 'playing'">
          Follow the trail
        </button>
      </div>

      <template v-else>
        <div
          class="mx-auto grid w-full max-w-[22rem] items-center gap-1"
          :style="{ gridTemplateColumns: '2rem repeat(5, minmax(0, 1fr)) 2rem' }"
        >
          <div
            class="flex flex-col items-center justify-end pb-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--golden-900))]"
            :style="{ gridColumn: HAAR_TRAIL_START.col + 2, gridRow: 1 }"
          >
            <IconFlower class="h-5 w-5" aria-hidden="true" />
            Sinhasan
          </div>

          <div
            v-for="door in HAAR_TRAIL_DOORS"
            :key="door.id"
            class="relative flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors"
            :class="[
              trace.reached.has(door.id) ? 'text-orange-600' : 'text-[hsl(var(--muted-foreground))]',
              door.side === W || door.side === E ? 'h-full flex-col justify-center' : 'justify-center pt-1'
            ]"
            :style="doorPlacement(door)"
            :aria-label="trace.reached.has(door.id) ? door.label : 'A door'"
          >
            <IconDoorExit v-if="trace.reached.has(door.id)" class="h-5 w-5 shrink-0" aria-hidden="true" />
            <IconDoor v-else class="h-5 w-5 shrink-0" aria-hidden="true" />
            <span v-if="!trace.reached.has(door.id)">?</span>
            <!-- A side door's name runs up the gutter, out of the layout, so it never stretches its row. -->
            <span
              v-else-if="door.side === W || door.side === E"
              class="pointer-events-none absolute bottom-full mb-1 whitespace-nowrap [writing-mode:vertical-rl]"
              :class="door.side === W ? 'rotate-180' : ''"
            >{{ door.label }}</span>
            <span v-else>{{ door.label }}</span>
          </div>

          <button
            v-for="(kind, index) in HAAR_TRAIL_TILES"
            :key="index"
            type="button"
            class="relative aspect-square w-full overflow-hidden rounded-lg border bg-[hsl(var(--card))] [touch-action:manipulation]"
            :class="[
              trace.lit.has(index) ? 'border-orange-300' : 'border-[hsl(var(--border))]',
              hinted === index ? 'ring-4 ring-amber-400' : ''
            ]"
            :style="{ gridColumn: (index % HAAR_TRAIL_SIZE) + 2, gridRow: Math.floor(index / HAAR_TRAIL_SIZE) + 2 }"
            :disabled="phase === 'solved'"
            :aria-label="`Row ${Math.floor(index / HAAR_TRAIL_SIZE) + 1}, column ${(index % HAAR_TRAIL_SIZE) + 1}${trace.lit.has(index) ? ', on the trail' : ''}`"
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
                  stroke-width="24" stroke-linecap="round"
                  :class="trace.lit.has(index) ? 'stroke-orange-100' : 'stroke-stone-200'"
                />
                <ellipse
                  v-for="(at, p) in [0.42, 0.78]"
                  :key="p"
                  :cx="50 + (EDGE[side][0] - 50) * at"
                  :cy="50 + (EDGE[side][1] - 50) * at"
                  rx="7" ry="4.5"
                  :transform="`rotate(${p ? 35 : -35} ${50 + (EDGE[side][0] - 50) * at} ${50 + (EDGE[side][1] - 50) * at})`"
                  :class="trace.lit.has(index) ? (p ? 'fill-rose-500' : 'fill-orange-500') : 'fill-stone-300'"
                />
              </g>
              <circle cx="50" cy="50" :r="kind === 'end' ? 13 : 10" :class="trace.lit.has(index) ? 'fill-amber-400' : 'fill-stone-300'" />
            </svg>
          </button>
        </div>

        <p v-if="phase === 'playing' && decoyFound" class="mt-5 rounded-xl bg-amber-50 p-4 text-center text-sm leading-relaxed text-amber-900">
          The petals stop at the Decoration store… but the haar isn’t here.
          Someone wanted you to look this way. Find where the trail really goes.
        </p>

        <div v-if="phase === 'playing'" class="mt-5 flex justify-center gap-2">
          <button type="button" class="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold" @click="hint">
            <IconBulb class="h-4 w-4" aria-hidden="true" />
            Hint<span v-if="hintsUsed" class="tabular-nums text-[hsl(var(--muted-foreground))]">· {{ hintsUsed }}</span>
          </button>
          <button type="button" class="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold" @click="restart">
            <IconRefresh class="h-4 w-4" aria-hidden="true" />
            Start again
          </button>
        </div>

        <section v-if="phase === 'solved'" class="card-surface mt-6 p-5 text-center">
          <p class="font-display text-xl font-semibold text-[hsl(var(--primary))]">The trail ends at the kitchen door.</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Look closely at what was left behind.</p>
          <div class="mt-4 overflow-hidden rounded-xl bg-[hsl(var(--muted))]">
            <img v-if="evidenceUrl" :src="evidenceUrl" alt="The evidence" class="mx-auto block w-full">
            <div v-else-if="evidenceError" class="space-y-3 p-6 text-sm">
              <p>The evidence wouldn’t open. Check the connection and try again.</p>
              <button type="button" class="btn-primary text-sm" @click="loadEvidence">Try again</button>
            </div>
            <div v-else class="flex aspect-[3/4] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
              <IconCamera class="mr-2 h-5 w-5 animate-pulse" aria-hidden="true" />
              Developing the evidence…
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconBulb, IconCamera, IconDoor, IconDoorExit, IconFlower, IconRefresh } from '@tabler/icons-vue'
import {
  E,
  HAAR_TILE_BASE,
  HAAR_TRAIL_DOORS,
  HAAR_TRAIL_GOAL,
  HAAR_TRAIL_SIZE,
  HAAR_TRAIL_SOLUTION,
  HAAR_TRAIL_START,
  HAAR_TRAIL_START_ROTATIONS,
  HAAR_TRAIL_TILES,
  HAAR_TRAIL_UNLOCK_KEY,
  N,
  S,
  W,
  tileOpenings,
  traceHaarTrail,
  turnsToReach,
  type HaarDoor,
  type HaarTileKind
} from '~/data/haarTrail'

const EDGE: Record<number, [number, number]> = { [N]: [50, 0], [E]: [100, 50], [S]: [50, 100], [W]: [0, 50] }

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
const evidenceUrl = ref('')
const evidenceError = ref(false)
let hintTimer: ReturnType<typeof setTimeout> | undefined

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

/** Puts the next wrong tile of the real trail right, walking out from the sinhasan. */
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
  if (reached.has('decoration')) decoyFound.value = true
  if (reached.has(HAAR_TRAIL_GOAL)) {
    phase.value = 'solved'
    loadEvidence()
  }
})

async function loadEvidence() {
  evidenceError.value = false
  try {
    const blob = await $fetch<Blob>('/api/haar-trail', {
      method: 'POST',
      body: { rotations: rotations.value },
      responseType: 'blob'
    })
    evidenceUrl.value = URL.createObjectURL(blob)
  } catch {
    evidenceError.value = true
  }
}

/** Only reachable through the trigger on /seva; a typed-in URL gets the ordinary 404. */
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
  phase.value = 'intro'
})

/** Leaving the page locks it again, so the next team has to find the trick too. */
onBeforeUnmount(() => {
  clearTimeout(hintTimer)
  if (evidenceUrl.value) URL.revokeObjectURL(evidenceUrl.value)
  try {
    sessionStorage.removeItem(HAAR_TRAIL_UNLOCK_KEY)
  } catch {
    // Nothing to clear.
  }
})

useNoIndex()
useHead({ title: 'Bhaktiras' })
</script>
