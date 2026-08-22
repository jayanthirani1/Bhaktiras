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
        <div v-if="!playedElsewhere && !loading && !finished" class="ml-auto flex gap-2">
          <button type="button" class="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-semibold" @click="clearGrid">Clear</button>
          <button type="button" class="rounded-full border border-[hsl(var(--border))] px-3 py-1.5 text-sm font-semibold" @click="useHint">Hint</button>
        </div>
      </div>

      <PageHeader title="Surya Chandra" subtitle="Fill the grid with suns and moons. Three of each in every row and column — never three in a line." />

      <GamePlayedElsewhere
        v-if="playedElsewhere"
        title="Surya Chandra"
        :summary="elsewhereSummary"
      />
      <div v-else-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading today's puzzle…
      </div>
      <div v-else class="space-y-4">
        <div class="mx-auto w-full max-w-[22rem]">
          <div
            class="grid items-center justify-items-center"
            :style="{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr) 12px) minmax(0, 1fr)', gridTemplateRows: 'repeat(5, minmax(0, 1fr) 12px) minmax(0, 1fr)' }"
          >
            <template v-for="r in 6" :key="`row-${r}`">
              <template v-for="c in 6" :key="`cell-${r}-${c}`">
                <button
                  type="button"
                  class="flex aspect-square w-full items-center justify-center rounded-xl border text-lg sm:text-xl"
                  :class="cellClass(r - 1, c - 1)"
                  :disabled="finished || isGiven(r - 1, c - 1)"
                  :aria-label="cellAria(r - 1, c - 1)"
                  :style="{ gridColumn: `${(c - 1) * 2 + 1}`, gridRow: `${(r - 1) * 2 + 1}` }"
                  @click="toggleCell(r - 1, c - 1)"
                >
                  <span v-if="board[r - 1][c - 1] === 1">☀️</span>
                  <span v-else-if="board[r - 1][c - 1] === 0">🌙</span>
                </button>
                <span
                  v-if="c < 6"
                  class="text-xs font-black text-[hsl(var(--primary))]"
                  :style="{ gridColumn: `${(c - 1) * 2 + 2}`, gridRow: `${(r - 1) * 2 + 1}` }"
                >{{ linkMark(r - 1, c - 1, r - 1, c) }}</span>
              </template>
              <template v-if="r < 6">
                <span
                  v-for="c in 6"
                  :key="`vlink-${r}-${c}`"
                  class="text-xs font-black text-[hsl(var(--primary))]"
                  :style="{ gridColumn: `${(c - 1) * 2 + 1}`, gridRow: `${(r - 1) * 2 + 2}` }"
                >{{ linkMark(r - 1, c - 1, r, c - 1) }}</span>
              </template>
            </template>
          </div>
        </div>

        <p class="text-center text-sm text-[hsl(var(--muted-foreground))]">
          Tap a cell to cycle sun, moon, empty.
          <span v-if="moves"> · {{ moves }} move{{ moves === 1 ? '' : 's' }}</span>
        </p>

        <div v-if="!finished" class="flex justify-center">
          <button
            type="button"
            class="rounded-full border border-[hsl(var(--border))] px-5 py-2 text-sm font-semibold disabled:opacity-40"
            :disabled="history.length === 0"
            @click="undoMove"
          >
            Undo
          </button>
        </div>

        <div v-if="hasViolation && !finished" class="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
          <p class="font-semibold">That placement breaks a rule.</p>
          <p class="text-xs opacity-80">Three of each per row and column, never three in a line, and honour every = and ×.</p>
        </div>

        <div v-if="finished" class="card-surface space-y-3 p-6 text-center">
          <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">
            {{ hintsUsed === 0 ? 'Perfect balance!' : 'Grid complete!' }}
          </h2>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">{{ resultSummary }}</p>
          <div class="flex flex-wrap justify-center gap-2">
            <button type="button" class="rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white" @click="shareResult">
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
            <NuxtLink v-else-if="!isLoggedIn" to="/login?redirect=/play/surya-chandra" class="self-center text-sm font-semibold text-[hsl(var(--primary))] underline">
              Sign in to submit your result
            </NuxtLink>
          </div>
          <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
        </div>

        <details class="card-surface p-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          <summary class="cursor-pointer font-semibold text-[hsl(var(--primary))]">How to play</summary>
          <ol class="mt-3 list-decimal space-y-2 pl-5">
            <li>Fill every cell with a <span class="font-semibold text-[hsl(var(--foreground))]">sun</span> or a <span class="font-semibold text-[hsl(var(--foreground))]">moon</span>.</li>
            <li>Each row and each column must have <span class="font-semibold text-[hsl(var(--foreground))]">three suns and three moons</span>.</li>
            <li>Never place <span class="font-semibold text-[hsl(var(--foreground))]">three of the same</span> next to each other in a row or column.</li>
            <li><span class="font-semibold text-[hsl(var(--foreground))]">=</span> means the two cells are the same. <span class="font-semibold text-[hsl(var(--foreground))]">×</span> means they are opposite.</li>
          </ol>
        </details>

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
import {
  boardIsSolved,
  cellViolations,
  cloneBoard,
  cyclePlayCell,
  emptyBoard,
  getTangoHint,
  type TangoCell
} from '~/utils/tango'

const STORAGE_KEY = `bhakti-marg:${ukDateId()}`
const { puzzle, loading } = useSuryaChandraPuzzle()
const timer = useGameTimer(`bhakti-marg-timer:${ukDateId()}`)
const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const { playedElsewhere, result: elsewhereResult, markDone } = useDailyGameCompletion('bhakti-marg')
const { entries, loading: boardLoading, dateId, submitScore } = useGameLeaderboard('bhakti-marg', { sort: 'asc' })
const achievements = useAchievements()

const board = ref<TangoCell[][]>(emptyBoard())
const history = ref<TangoCell[][][]>([])
const moves = ref(0)
const hintsUsed = ref(0)
const shareCopied = ref(false)
const scoreSubmitted = ref(false)
const submitting = ref(false)
const submitError = ref('')

const violations = computed(() => cellViolations(board.value, puzzle.value.links))
const hasViolation = computed(() => violations.value.size > 0)
const finished = computed(() => boardIsSolved(board.value, puzzle.value.links))

const resultSummary = computed(() => [
  timer.display.value,
  `${moves.value} move${moves.value === 1 ? '' : 's'}`,
  `${hintsUsed.value} hint${hintsUsed.value === 1 ? '' : 's'}`
].join(' · '))

const elsewhereSummary = computed(() => {
  const result = elsewhereResult.value
  return [result?.detail, result?.timeMs != null ? formatElapsed(result.timeMs) : ''].filter(Boolean).join(' · ')
})

function isGiven(row: number, col: number) {
  return puzzle.value.given[row]?.[col] != null
}

function linkMark(ar: number, ac: number, br: number, bc: number) {
  const link = puzzle.value.links.find(item =>
    (item.ar === ar && item.ac === ac && item.br === br && item.bc === bc)
    || (item.ar === br && item.ac === bc && item.br === ar && item.bc === ac)
  )
  if (!link) return ''
  return link.kind === 'same' ? '=' : '×'
}

function cellClass(row: number, col: number) {
  const given = isGiven(row, col)
  const bad = violations.value.has(`${row},${col}`)
  return [
    given ? 'bg-amber-50 border-amber-300' : 'bg-white border-[hsl(var(--border))]',
    bad ? 'ring-2 ring-red-500' : '',
    finished.value || given ? '' : 'hover:bg-[hsl(var(--muted))]'
  ].join(' ')
}

function cellAria(row: number, col: number) {
  const value = board.value[row][col]
  const symbol = value === 1 ? 'sun' : value === 0 ? 'moon' : 'empty'
  return `${symbol}, row ${row + 1}, column ${col + 1}`
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      puzzleId: puzzle.value.id,
      board: board.value,
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
    if (data.puzzleId !== puzzle.value.id || !Array.isArray(data.board)) return false
    board.value = data.board
    moves.value = Number(data.moves) || 0
    hintsUsed.value = Number(data.hintsUsed) || 0
    scoreSubmitted.value = !!data.scoreSubmitted
    return true
  } catch {
    return false
  }
}

function toggleCell(row: number, col: number) {
  if (finished.value || isGiven(row, col)) return
  timer.ensureStarted()
  history.value = [...history.value, cloneBoard(board.value)]
  if (history.value.length > 50) history.value = history.value.slice(-50)
  const next = cyclePlayCell(board.value[row][col], false)
  board.value = board.value.map((line, ri) => line.map((cell, ci) => (ri === row && ci === col ? next : cell)))
  moves.value += 1
  saveState()
  if (boardIsSolved(board.value, puzzle.value.links)) finishGame()
}

function clearGrid() {
  history.value = [...history.value, cloneBoard(board.value)]
  board.value = cloneBoard(puzzle.value.given)
  saveState()
}

function undoMove() {
  if (!history.value.length) return
  board.value = history.value.pop()!
  saveState()
}

function useHint() {
  const hint = getTangoHint(board.value, puzzle.value)
  if (!hint) return
  hintsUsed.value += 1
  timer.addPenalty(10_000)
  history.value = [...history.value, cloneBoard(board.value)]
  board.value = board.value.map((line, ri) => line.map((cell, ci) => (ri === hint.row && ci === hint.col ? hint.value : cell)))
  moves.value += 1
  saveState()
  if (boardIsSolved(board.value, puzzle.value.links)) finishGame()
}

function finishGame() {
  timer.stop()
  saveState()
  void markDone({
    score: moves.value,
    timeMs: timer.elapsedMs.value,
    detail: `${moves.value} moves · ${hintsUsed.value} hints`
  })
}

function shareResult() {
  const grid = board.value.map(row => row.map(cell => cell === 1 ? '☀️' : '🌙').join('')).join('\n')
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/surya-chandra` : ''
  const text = [`Bhaktiras Surya Chandra`, timer.display.value, `${moves.value} moves · ${hintsUsed.value} hints`, '', grid, '', shareUrl].join('\n').trimEnd()
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      shareCopied.value = true
      setTimeout(() => { shareCopied.value = false }, 2000)
    })
  }
}

function formatBoardScore(entry: { score?: number, timeMs?: number }) {
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
    await achievements.processResult('bhakti-marg', {
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
  if (done && uid && !scoreSubmitted.value && !submitting.value) void submitToLeaderboard()
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
    board.value = cloneBoard(puzzle.value.given)
    moves.value = 0
    hintsUsed.value = 0
    scoreSubmitted.value = false
  }
  syncPlayTimer()
}, { immediate: true })

watch(playedElsewhere, () => { syncPlayTimer() })

useHead({ title: 'Surya Chandra · Bhaktiras' })
</script>
