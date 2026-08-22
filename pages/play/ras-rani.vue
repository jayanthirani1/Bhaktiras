<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-3 pb-24 pt-0 md:px-4 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <div class="sticky top-0 z-40 -mx-3 mb-4 flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-3 py-2 backdrop-blur md:top-16 md:-mx-4 md:px-4">
        <NuxtLink to="/play" class="rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          ‹ Back
        </NuxtLink>
        <span class="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-sm font-semibold tabular-nums text-[hsl(var(--primary))]">
          ⏱ {{ timer.display.value }}
        </span>
      </div>

      <PageHeader title="Ras Rani 🍯" subtitle="Find the nectar. Place one droplet in each row, column, and colored region. No two can touch." />

      <GamePlayedElsewhere
        v-if="playedElsewhere"
        title="Ras Rani"
        :summary="elsewhereSummary"
      />
      <div v-else-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading today's puzzle…
      </div>
      <div v-else class="space-y-4">
        <!-- Region legend -->
        <div class="card-surface flex flex-wrap gap-2 p-3">
          <div
            v-for="region in uniqueRegions"
            :key="region.id"
            class="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium"
            :class="region.color"
          >
            <span>{{ region.name }}</span>
            <span class="text-[10px] opacity-70">({{ region.meaning }})</span>
          </div>
        </div>

        <!-- Grid -->
        <div
          class="card-surface relative mx-auto p-4"
          :style="{ maxWidth: `${puzzle.gridSize * 52 + 32}px` }"
        >
          <div
            class="grid gap-0.5"
            :style="{ gridTemplateColumns: `repeat(${puzzle.gridSize}, 1fr)` }"
          >
            <button
              v-for="(_, idx) in puzzle.gridSize * puzzle.gridSize"
              :key="idx"
              type="button"
              :data-row="Math.floor(idx / puzzle.gridSize)"
              :data-col="idx % puzzle.gridSize"
              class="flex aspect-square items-center justify-center border-2 text-lg font-bold transition-all sm:text-xl"
              :class="getCellClass(Math.floor(idx / puzzle.gridSize), idx % puzzle.gridSize)"
              :disabled="finished"
              @click="toggleCell(Math.floor(idx / puzzle.gridSize), idx % puzzle.gridSize)"
            >
              <span v-if="grid[Math.floor(idx / puzzle.gridSize)][idx % puzzle.gridSize] === 'queen'">🍯</span>
              <span v-else-if="grid[Math.floor(idx / puzzle.gridSize)][idx % puzzle.gridSize] === 'marked'" class="text-sm opacity-50">✕</span>
            </button>
          </div>
        </div>

        <!-- Progress -->
        <p class="text-center text-sm text-[hsl(var(--muted-foreground))]">
          {{ queenCount }}/{{ puzzle.gridSize }} nectar droplets placed
          <span v-if="moves > 0"> · {{ moves }} move{{ moves === 1 ? '' : 's' }}</span>
        </p>

        <!-- Controls -->
        <div v-if="!finished" class="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            class="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold"
            @click="clearGrid"
          >
            Clear
          </button>
          <button
            type="button"
            class="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold"
            @click="undoMove"
            :disabled="history.length === 0"
          >
            Undo
          </button>
          <button
            type="button"
            class="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold"
            :class="autoMark ? 'bg-[hsl(var(--primary))] text-white' : ''"
            @click="autoMark = !autoMark"
          >
            Auto-mark {{ autoMark ? 'ON' : 'OFF' }}
          </button>
          <button
            type="button"
            class="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold"
            @click="useHint"
          >
            Hint (+10s)
          </button>
        </div>

        <!-- Feedback -->
        <p v-if="feedback" class="text-center text-sm font-semibold" :class="feedbackOk ? 'text-emerald-700' : 'text-amber-700'">
          {{ feedback }}
        </p>

        <!-- Violations warning -->
        <div v-if="hasViolation && !finished" class="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
          <p class="font-semibold">Rule violation detected!</p>
          <p class="text-xs opacity-80">Check rows, columns, regions, and adjacency.</p>
        </div>

        <!-- Completed state -->
        <div v-if="finished" class="card-surface space-y-3 p-6 text-center">
          <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">
            {{ hintsUsed === 0 ? 'Perfect nectar!' : 'Nectar found!' }}
          </h2>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">
            {{ resultSummary }}
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              class="rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white"
              @click="shareResult"
            >
              {{ shareCopied ? 'Copied!' : 'Share result' }}
            </button>
            <button
              v-if="isLoggedIn && !scoreSubmitted"
              type="button"
              class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              :disabled="submitting"
              @click="submitToLeaderboard"
            >
              {{ submitting ? 'Submitting…' : 'Submit to leaderboard' }}
            </button>
            <NuxtLink v-else-if="!isLoggedIn" to="/login?redirect=/play/ras-rani" class="self-center text-sm font-semibold text-[hsl(var(--primary))] underline">
              Sign in to submit your result
            </NuxtLink>
          </div>
          <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
        </div>

        <GameLeaderboard
          :entries="entries"
          :loading="boardLoading"
          :date-id="dateId"
          :current-user-id="auth.user.value?.uid"
          :format-score="formatBoardScore"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ukDateId } from '~/utils/gameDay'
import { formatElapsed } from '~/composables/useGameTimer'
import { getRegionColor } from '~/data/rasRaniPuzzles'
import {
  createEmptyGrid,
  getQueenPositions,
  checkViolations,
  hasViolations,
  isPuzzleSolved,
  autoMarkInvalidCells,
  getHint,
  cycleCell,
  type CellState
} from '~/utils/rasRani'

const STORAGE_KEY = `ras-rani:${ukDateId()}`
const { puzzle, loading } = useRasRaniPuzzle()
const timer = useGameTimer(`ras-rani-timer:${ukDateId()}`)
const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const { playedElsewhere, result: elsewhereResult, markDone } = useDailyGameCompletion('ras-rani')
const { entries, loading: boardLoading, dateId, submitScore } = useGameLeaderboard('ras-rani', { sort: 'asc' })

const grid = ref<CellState[][]>([])
const history = ref<CellState[][][]>([])
const moves = ref(0)
const hintsUsed = ref(0)
const autoMark = ref(false)
const feedback = ref('')
const feedbackOk = ref(false)
const shareCopied = ref(false)
const scoreSubmitted = ref(false)
const submitting = ref(false)
const submitError = ref('')

const queenCount = computed(() => getQueenPositions(grid.value).length)
const violations = computed(() => checkViolations(grid.value, puzzle.value))
const hasViolation = computed(() => hasViolations(grid.value, puzzle.value))
const finished = computed(() => isPuzzleSolved(grid.value, puzzle.value))

const uniqueRegions = computed(() => {
  const seen = new Set<string>()
  const regions: Array<{ id: string; name: string; color: string; meaning: string }> = []
  for (const row of puzzle.value.regionGrid) {
    for (const regionId of row) {
      if (!seen.has(regionId)) {
        seen.add(regionId)
        const region = puzzle.value.regions.find(r => r.id === regionId)
        if (region) {
          regions.push({
            id: region.id,
            name: region.name,
            color: region.color,
            meaning: region.meaning || ''
          })
        }
      }
    }
  }
  return regions
})

const resultSummary = computed(() => [
  `${puzzle.value.gridSize} droplets`,
  timer.display.value,
  `${moves.value} move${moves.value === 1 ? '' : 's'}`,
  `${hintsUsed.value} hint${hintsUsed.value === 1 ? '' : 's'}`
].join(' · '))

const elsewhereSummary = computed(() => {
  const result = elsewhereResult.value
  return [result?.detail, result?.timeMs != null ? formatElapsed(result.timeMs) : ''].filter(Boolean).join(' · ')
})

function getCellClass(row: number, col: number): string {
  const regionId = puzzle.value.regionGrid[row][col]
  const baseColor = getRegionColor(regionId)
  const state = grid.value[row]?.[col]
  const key = `${row},${col}`

  let violationClass = ''
  if (state === 'queen') {
    if (violations.value.row.has(row) || violations.value.col.has(col)) {
      violationClass = 'ring-2 ring-red-500'
    }
    if (violations.value.region.has(regionId)) {
      violationClass = 'ring-2 ring-red-500'
    }
    if (violations.value.adjacent.has(key)) {
      violationClass = 'ring-2 ring-red-500'
    }
  }

  return `${baseColor} ${violationClass}`
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      puzzleId: puzzle.value.id,
      grid: grid.value,
      moves: moves.value,
      hintsUsed: hintsUsed.value,
      finished: finished.value,
      scoreSubmitted: scoreSubmitted.value
    }))
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (data.puzzleId !== puzzle.value.id) return false
    grid.value = Array.isArray(data.grid) ? data.grid : createEmptyGrid(puzzle.value)
    moves.value = Number(data.moves) || 0
    hintsUsed.value = Number(data.hintsUsed) || 0
    scoreSubmitted.value = !!data.scoreSubmitted
    return true
  } catch {
    return false
  }
}

function toggleCell(row: number, col: number) {
  if (finished.value) return
  timer.ensureStarted()

  history.value = [...history.value, grid.value.map(r => [...r])]
  if (history.value.length > 50) history.value = history.value.slice(-50)

  const current = grid.value[row][col]
  const next = cycleCell(current)

  grid.value = grid.value.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? next : c))
  )

  if (autoMark.value && next === 'queen') {
    grid.value = autoMarkInvalidCells(grid.value, puzzle.value)
  }

  moves.value += 1
  saveState()

  if (isPuzzleSolved(grid.value, puzzle.value)) {
    finishGame()
  }
}

function clearGrid() {
  history.value = [...history.value, grid.value.map(r => [...r])]
  grid.value = createEmptyGrid(puzzle.value)
  feedback.value = ''
  saveState()
}

function undoMove() {
  if (history.value.length === 0) return
  grid.value = history.value.pop()!
  saveState()
}

function useHint() {
  const hint = getHint(grid.value, puzzle.value)
  if (!hint) {
    feedbackOk.value = false
    feedback.value = 'No hint available'
    setTimeout(() => { feedback.value = '' }, 2000)
    return
  }

  hintsUsed.value += 1
  timer.addPenalty(10000)

  if (hint.type === 'error') {
    feedbackOk.value = false
    feedback.value = `Error at row ${hint.row + 1}, column ${hint.col + 1}`
  } else {
    feedbackOk.value = true
    feedback.value = `Place droplet at row ${hint.row + 1}, column ${hint.col + 1}`
  }

  saveState()
  setTimeout(() => { feedback.value = '' }, 3000)
}

function finishGame() {
  timer.stop()
  saveState()
  void markDone({
    score: moves.value,
    timeMs: timer.elapsedMs.value,
    detail: `${moves.value} move${moves.value === 1 ? '' : 's'} · ${hintsUsed.value} hint${hintsUsed.value === 1 ? '' : 's'}`
  })
}

function shareResult() {
  const gridEmoji = grid.value.map(row =>
    row.map(cell => cell === 'queen' ? '🍯' : '⬜').join('')
  ).join('\n')
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/ras-rani` : ''
  const text = [
    `Bhaktiras Ras Rani 🍯`,
    timer.display.value,
    `${moves.value} moves · ${hintsUsed.value} hints`,
    '',
    gridEmoji,
    '',
    shareUrl ? `Find the nectar: ${shareUrl}` : ''
  ].join('\n').trimEnd()
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      shareCopied.value = true
      setTimeout(() => { shareCopied.value = false }, 2000)
    })
  }
}

function formatBoardScore(entry: { score?: number; timeMs?: number }) {
  const time = entry.timeMs != null ? ` · ${formatElapsed(entry.timeMs)}` : ''
  return `${entry.score ?? 0} move${entry.score === 1 ? '' : 's'}${time}`
}

async function submitToLeaderboard() {
  if (!auth.user.value || scoreSubmitted.value || submitting.value || !finished.value) return
  submitting.value = true
  submitError.value = ''
  try {
    await submitScore({
      score: moves.value,
      timeMs: timer.elapsedMs.value,
      detail: `${hintsUsed.value} hints`,
      userId: auth.user.value.uid,
      userName: auth.user.value.displayName || auth.user.value.email?.split('@')[0] || 'Player',
      userEmail: auth.user.value.email || undefined
    })
    scoreSubmitted.value = true
    saveState()
  } catch (error) {
    submitError.value = (error as Error).message
  } finally {
    submitting.value = false
  }
}

watch(finished, (done, was) => {
  if (done && !was) finishGame()
})

watch([finished, () => auth.user.value?.uid], ([done, uid]) => {
  if (done && uid && !scoreSubmitted.value && !submitting.value) {
    void submitToLeaderboard()
  }
}, { immediate: true })

function syncPlayTimer() {
  if (loading.value || playedElsewhere.value) return
  if (finished.value) {
    timer.read()
    if (timer.startedAt.value && !timer.finishedAt.value) timer.stop()
    return
  }
  timer.loadOrStart()
}

watch([loading, () => puzzle.value.id], () => {
  if (loading.value) return
  if (!loadState()) {
    grid.value = createEmptyGrid(puzzle.value)
    moves.value = 0
    hintsUsed.value = 0
    scoreSubmitted.value = false
  }
  syncPlayTimer()
}, { immediate: true })

watch(playedElsewhere, () => { syncPlayTimer() })

useHead({ title: 'Ras Rani · Bhaktiras' })
</script>
