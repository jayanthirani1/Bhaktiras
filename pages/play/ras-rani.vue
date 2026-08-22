<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-3 pb-24 pt-0 md:px-4 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <div class="sticky top-0 z-40 -mx-3 mb-4 flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-3 py-2 backdrop-blur md:top-16 md:-mx-4 md:px-4">
        <NuxtLink to="/play" class="rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          ‹ Back
        </NuxtLink>
        <span class="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-sm font-semibold tabular-nums text-[hsl(var(--primary))]">
          ⏱ {{ timer.display.value }}
        </span>
        <div v-if="!playedElsewhere && !loading && !finished && !howto.showIntro.value" class="ml-auto flex gap-2">
          <button type="button" class="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-semibold" @click="clearGrid">Clear</button>
          <button type="button" class="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-semibold" @click="useHint">Hint</button>
        </div>
      </div>

      <PageHeader title="Ras Rani" subtitle="Place one nectar drop in every row, column and colour. No two can touch — not even diagonally.">
        <RasRaniTitle honey />
      </PageHeader>

      <GamePlayedElsewhere
        v-if="playedElsewhere"
        title="Ras Rani"
        :summary="elsewhereSummary"
      />
      <div v-else-if="loading || !howto.ready.value" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading today's puzzle…
      </div>
      <GameHowTo
        v-else-if="howto.showIntro.value"
        intro
        title="Place nectar drops across the garden."
        @start="beginAfterHowTo"
      >
        <ol class="list-decimal space-y-3 pl-5">
          <li>
            Your goal is to have <span class="font-semibold text-[hsl(var(--foreground))]">exactly one nectar drop</span> 🍯 in each <span class="font-semibold text-[hsl(var(--foreground))]">row, column, and colour region</span>.
          </li>
          <li>
            Tap once to place a <span class="font-semibold text-[hsl(var(--foreground))]">grey nectar mark</span> as a draft.
            Tap that cell again to place a nectar drop. Tap a drop to remove it.
          </li>
          <li>
            Two nectar drops cannot touch each other, <span class="font-semibold text-[hsl(var(--foreground))]">not even diagonally</span>.
          </li>
        </ol>
      </GameHowTo>
      <div v-else class="space-y-4">
        <div
          class="mx-auto w-full overflow-hidden rounded-xl border-2 border-slate-800"
          :style="{ maxWidth: `${Math.min(puzzle.gridSize * 56, 420)}px` }"
        >
          <div
            class="grid"
            :style="{ gridTemplateColumns: `repeat(${puzzle.gridSize}, 1fr)` }"
          >
            <button
              v-for="(_, idx) in puzzle.gridSize * puzzle.gridSize"
              :key="idx"
              :ref="el => cellRefs[idx] = el as HTMLElement"
              type="button"
              :data-row="Math.floor(idx / puzzle.gridSize)"
              :data-col="idx % puzzle.gridSize"
              class="relative flex aspect-square items-center justify-center text-lg font-bold transition-colors sm:text-xl"
              :class="[
                getCellClass(Math.floor(idx / puzzle.gridSize), idx % puzzle.gridSize),
                animatingCells.has(`${Math.floor(idx / puzzle.gridSize)},${idx % puzzle.gridSize}`) ? 'nectar-cell-glow' : ''
              ]"
              :style="cellStyle(Math.floor(idx / puzzle.gridSize), idx % puzzle.gridSize)"
              :disabled="finished"
              :aria-label="cellAria(Math.floor(idx / puzzle.gridSize), idx % puzzle.gridSize)"
              @click="toggleCell(Math.floor(idx / puzzle.gridSize), idx % puzzle.gridSize)"
            >
              <span
                v-if="grid[Math.floor(idx / puzzle.gridSize)][idx % puzzle.gridSize] === 'queen'"
                class="leading-none"
                :class="animatingCells.has(`${Math.floor(idx / puzzle.gridSize)},${idx % puzzle.gridSize}`) ? 'nectar-drop-animate' : ''"
              >🍯</span>
              <NectarIcon
                v-else-if="grid[Math.floor(idx / puzzle.gridSize)][idx % puzzle.gridSize] === 'marked'"
                class="h-[52%] w-[52%] text-slate-600"
              />
              <template v-if="animatingCells.has(`${Math.floor(idx / puzzle.gridSize)},${idx % puzzle.gridSize}`)">
                <span class="nectar-splash-particle" style="--splash-x: -8px; --splash-y: -10px;" />
                <span class="nectar-splash-particle" style="--splash-x: 8px; --splash-y: -9px;" />
                <span class="nectar-splash-particle" style="--splash-x: -10px; --splash-y: -4px;" />
                <span class="nectar-splash-particle" style="--splash-x: 10px; --splash-y: -5px;" />
                <span class="nectar-splash-particle" style="--splash-x: -4px; --splash-y: -12px;" />
                <span class="nectar-splash-particle" style="--splash-x: 5px; --splash-y: -11px;" />
              </template>
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
            class="rounded-full border border-[hsl(var(--border))] px-5 py-2 text-sm font-semibold"
            @click="undoMove"
            :disabled="history.length === 0"
          >
            Undo
          </button>
        </div>

        <!-- Feedback -->
        <p v-if="feedback" class="text-center text-sm font-semibold" :class="feedbackOk ? 'text-emerald-700' : 'text-amber-700'">
          {{ feedback }}
        </p>

        <!-- Violations warning -->
        <div v-if="hasViolation && !finished" class="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
          <p class="font-semibold">Those nectar drops cannot sit there.</p>
          <p class="text-xs opacity-80">Each row, column and colour gets one drop, and drops cannot touch — even diagonally.</p>
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
              class="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
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

        <GameHowTo>
          <ol class="list-decimal space-y-3 pl-5">
            <li>
              Your goal is to have <span class="font-semibold text-[hsl(var(--foreground))]">exactly one nectar drop</span> 🍯 in each <span class="font-semibold text-[hsl(var(--foreground))]">row, column, and colour region</span>.
            </li>
            <li>
              Tap once to place a <span class="font-semibold text-[hsl(var(--foreground))]">grey nectar mark</span> as a draft.
              Tap that cell again to place a nectar drop. Tap a drop to remove it.
            </li>
            <li>
              Two nectar drops cannot touch each other, <span class="font-semibold text-[hsl(var(--foreground))]">not even diagonally</span>.
            </li>
          </ol>
        </GameHowTo>

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
  hasViolations,
  isPuzzleSolved,
  getHint,
  regionBorderStyle,
  violationHighlightCells,
  violationHighlightStyle,
  type CellState
} from '~/utils/rasRani'

const STORAGE_KEY = `ras-rani-v3:${ukDateId()}`
const { puzzle, loading } = useRasRaniPuzzle()
const timer = useGameTimer(`ras-rani-timer:${ukDateId()}`)
const howto = useHowToPlay('ras-rani', ['ras-rani', 'ras-rani-v3:', 'ras-rani-timer:'])
const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const { playedElsewhere, result: elsewhereResult, markDone } = useDailyGameCompletion('ras-rani')
const { entries, loading: boardLoading, dateId, submitScore } = useGameLeaderboard('ras-rani', { sort: 'asc' })
const achievements = useAchievements()

const grid = ref<CellState[][]>([])
const history = ref<CellState[][][]>([])
const moves = ref(0)
const hintsUsed = ref(0)
const feedback = ref('')
const feedbackOk = ref(false)
const shareCopied = ref(false)
const scoreSubmitted = ref(false)
const submitting = ref(false)
const submitError = ref('')
const animatingCells = ref<Set<string>>(new Set())
const cellRefs = ref<(HTMLElement | null)[]>([])

const queenCount = computed(() => getQueenPositions(grid.value).length)
const highlightCells = computed(() => violationHighlightCells(grid.value, puzzle.value))
const hasViolation = computed(() => hasViolations(grid.value, puzzle.value))
const finished = computed(() => isPuzzleSolved(grid.value, puzzle.value))

function cellAria(row: number, col: number) {
  const state = grid.value[row]?.[col]
  if (state === 'queen') return `Nectar drop, row ${row + 1}, column ${col + 1}`
  if (state === 'marked') return `Draft nectar, row ${row + 1}, column ${col + 1}`
  return `Empty cell, row ${row + 1}, column ${col + 1}`
}

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
  return getRegionColor(puzzle.value.regionGrid[row][col])
}

function cellStyle(row: number, col: number) {
  return {
    ...regionBorderStyle(puzzle.value, row, col),
    ...violationHighlightStyle(row, col, highlightCells.value, puzzle.value.gridSize)
  }
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

function triggerNectarAnimation(row: number, col: number) {
  const key = `${row},${col}`
  animatingCells.value = new Set([...animatingCells.value, key])
  setTimeout(() => {
    animatingCells.value = new Set([...animatingCells.value].filter(k => k !== key))
  }, 600)
}

function toggleCell(row: number, col: number) {
  if (finished.value) return
  timer.ensureStarted()

  history.value = [...history.value, grid.value.map(r => [...r])]
  if (history.value.length > 50) history.value = history.value.slice(-50)

  const current = grid.value[row][col]
  // Empty → grey tilak (draft) → nectar → empty.
  const next = current === 'empty' ? 'marked' : current === 'marked' ? 'queen' : 'empty'

  grid.value = grid.value.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? next : c))
  )

  if (next === 'queen') {
    triggerNectarAnimation(row, col)
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
    feedback.value = `That drop at row ${hint.row + 1}, column ${hint.col + 1} breaks a rule.`
  } else {
    history.value = [...history.value, grid.value.map(r => [...r])]
    grid.value = grid.value.map((r, ri) =>
      r.map((c, ci) => (ri === hint.row && ci === hint.col ? 'queen' : c))
    )
    triggerNectarAnimation(hint.row, hint.col)
    moves.value += 1
    feedbackOk.value = true
    feedback.value = `Nectar drop placed at row ${hint.row + 1}, column ${hint.col + 1}`
    if (isPuzzleSolved(grid.value, puzzle.value)) finishGame()
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
  const userName = auth.user.value.displayName || auth.user.value.email?.split('@')[0] || 'Player'
  try {
    await submitScore({
      score: moves.value,
      timeMs: timer.elapsedMs.value,
      detail: `${hintsUsed.value} hints`,
      userId: auth.user.value.uid,
      userName,
      userEmail: auth.user.value.email || undefined
    })
    scoreSubmitted.value = true
    saveState()

    await achievements.processResult('ras-rani', {
      userName,
      timeMs: timer.elapsedMs.value,
      moves: moves.value,
      hintsUsed: hintsUsed.value
    })
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

function beginAfterHowTo() {
  howto.markSeen()
  syncPlayTimer()
}

function syncPlayTimer() {
  if (!howto.ready.value || howto.showIntro.value) return
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

watch([playedElsewhere, () => howto.ready.value, () => howto.showIntro.value], () => { syncPlayTimer() })

useHead({ title: 'Ras Rani · Bhaktiras' })
</script>
