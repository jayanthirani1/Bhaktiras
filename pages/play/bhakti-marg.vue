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

      <PageHeader title="Bhakti Marg" subtitle="Find your path. Discover the hidden spiritual words by tracing through the grid." />

      <GamePlayedElsewhere
        v-if="playedElsewhere"
        title="Bhakti Marg"
        :summary="elsewhereSummary"
      />
      <div v-else-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading today's puzzle…
      </div>
      <div v-else class="space-y-4">
        <!-- Word slots -->
        <div class="card-surface space-y-2 p-4">
          <div
            v-for="(word, index) in puzzle.words"
            :key="word.word"
            class="flex items-center gap-2"
          >
            <div
              class="flex gap-0.5"
              :class="solvedIndices.includes(index) ? 'opacity-100' : 'opacity-60'"
            >
              <span
                v-for="(_, i) in word.word.length"
                :key="i"
                class="flex h-8 w-8 items-center justify-center rounded border text-sm font-bold uppercase sm:h-9 sm:w-9"
                :class="solvedIndices.includes(index)
                  ? `${wordColors[index % wordColors.length]} text-white border-transparent`
                  : 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]'"
              >
                {{ solvedIndices.includes(index) ? word.word[i] : '' }}
              </span>
            </div>
            <span
              v-if="solvedIndices.includes(index) && word.meaning"
              class="ml-2 text-xs text-[hsl(var(--muted-foreground))]"
            >
              {{ word.meaning }}
            </span>
          </div>
        </div>

        <!-- Grid -->
        <div
          class="card-surface relative mx-auto p-4"
          :style="{ maxWidth: `${puzzle.gridSize * 56 + 32}px` }"
        >
          <div
            class="grid gap-1"
            :style="{ gridTemplateColumns: `repeat(${puzzle.gridSize}, 1fr)` }"
            @pointerdown="startDrag"
            @pointermove="continueDrag"
            @pointerup="endDrag"
            @pointerleave="endDrag"
          >
            <button
              v-for="(letter, idx) in flatGrid"
              :key="idx"
              type="button"
              :data-row="Math.floor(idx / puzzle.gridSize)"
              :data-col="idx % puzzle.gridSize"
              class="flex aspect-square items-center justify-center rounded-lg text-lg font-bold uppercase transition-all sm:text-xl"
              :class="getCellClass(Math.floor(idx / puzzle.gridSize), idx % puzzle.gridSize)"
              :disabled="isWall(Math.floor(idx / puzzle.gridSize), idx % puzzle.gridSize) || finished"
            >
              {{ letter }}
            </button>
          </div>
        </div>

        <!-- Current path display -->
        <div v-if="currentPath.length > 0 && !finished" class="text-center">
          <p class="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            Current: <span class="font-bold text-[hsl(var(--foreground))]">{{ currentWord }}</span>
          </p>
        </div>

        <!-- Progress -->
        <p class="text-center text-sm text-[hsl(var(--muted-foreground))]">
          {{ solvedIndices.length }}/{{ puzzle.words.length }} words found
          <span v-if="hintsUsed"> · {{ hintsUsed }} hint{{ hintsUsed === 1 ? '' : 's' }}</span>
        </p>

        <!-- Controls -->
        <div v-if="!finished" class="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            class="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold"
            @click="clearCurrentPath"
          >
            Clear
          </button>
          <button
            type="button"
            class="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold"
            @click="useHint"
          >
            Hint (+5s)
          </button>
        </div>

        <!-- Feedback -->
        <p v-if="feedback" class="text-center text-sm font-semibold" :class="feedbackOk ? 'text-emerald-700' : 'text-amber-700'">
          {{ feedback }}
        </p>

        <!-- Completed state -->
        <div v-if="finished" class="card-surface space-y-3 p-6 text-center">
          <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">
            {{ hintsUsed === 0 ? 'Perfect path!' : 'Path complete!' }}
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
            <NuxtLink v-else-if="!isLoggedIn" to="/login?redirect=/play/bhakti-marg" class="self-center text-sm font-semibold text-[hsl(var(--primary))] underline">
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
import {
  posKey,
  areAdjacent,
  isWall as checkWall,
  getPathWord,
  checkWordMatch,
  getUsedCellsFromSolved,
  isPuzzleComplete,
  getHintForWord,
  type CellPosition
} from '~/utils/bhaktiMarg'

const STORAGE_KEY = `bhakti-marg:${ukDateId()}`
const { puzzle, loading } = useBhaktiMargPuzzle()
const timer = useGameTimer(`bhakti-marg-timer:${ukDateId()}`)
const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const { playedElsewhere, result: elsewhereResult, markDone } = useDailyGameCompletion('bhakti-marg')
const { entries, loading: boardLoading, dateId, submitScore } = useGameLeaderboard('bhakti-marg', { sort: 'asc' })
const achievements = useAchievements()

const wordColors = [
  'bg-emerald-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-fuchsia-500',
  'bg-rose-500',
  'bg-indigo-500'
]

const currentPath = ref<CellPosition[]>([])
const solvedIndices = ref<number[]>([])
const hintsUsed = ref(0)
const hintReveals = ref<Record<number, number>>({})
const feedback = ref('')
const feedbackOk = ref(false)
const shareCopied = ref(false)
const scoreSubmitted = ref(false)
const submitting = ref(false)
const submitError = ref('')
const isDragging = ref(false)

const flatGrid = computed(() => puzzle.value.grid.flat())
const currentWord = computed(() => getPathWord(currentPath.value, puzzle.value.grid))
const finished = computed(() => isPuzzleComplete(solvedIndices.value, puzzle.value))
const usedCells = computed(() => getUsedCellsFromSolved(solvedIndices.value, puzzle.value))

const resultSummary = computed(() => [
  `${puzzle.value.words.length} words`,
  timer.display.value,
  `${hintsUsed.value} hint${hintsUsed.value === 1 ? '' : 's'}`
].join(' · '))

const elsewhereSummary = computed(() => {
  const result = elsewhereResult.value
  return [result?.detail, result?.timeMs != null ? formatElapsed(result.timeMs) : ''].filter(Boolean).join(' · ')
})

function isWall(row: number, col: number): boolean {
  return checkWall({ row, col }, puzzle.value.walls)
}

function getCellClass(row: number, col: number): string {
  const key = posKey({ row, col })

  if (isWall(row, col)) {
    return 'bg-slate-400 text-slate-600 cursor-not-allowed'
  }

  if (usedCells.value.has(key)) {
    const wordIndex = solvedIndices.value.find(idx => {
      const path = puzzle.value.paths[idx]
      return path?.some(([r, c]) => r === row && c === col)
    })
    if (wordIndex !== undefined) {
      return `${wordColors[wordIndex % wordColors.length]} text-white`
    }
    return 'bg-emerald-500 text-white'
  }

  if (currentPath.value.some(p => p.row === row && p.col === col)) {
    return 'bg-[hsl(var(--primary))] text-white scale-105'
  }

  return 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]'
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      puzzleId: puzzle.value.id,
      solvedIndices: solvedIndices.value,
      hintsUsed: hintsUsed.value,
      hintReveals: hintReveals.value,
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
    solvedIndices.value = Array.isArray(data.solvedIndices) ? data.solvedIndices : []
    hintsUsed.value = Number(data.hintsUsed) || 0
    hintReveals.value = data.hintReveals && typeof data.hintReveals === 'object' ? data.hintReveals : {}
    scoreSubmitted.value = !!data.scoreSubmitted
    return true
  } catch {
    return false
  }
}

function getCellFromEvent(e: PointerEvent): CellPosition | null {
  const target = e.target as HTMLElement
  const row = target.dataset.row
  const col = target.dataset.col
  if (row === undefined || col === undefined) return null
  return { row: Number(row), col: Number(col) }
}

function startDrag(e: PointerEvent) {
  if (finished.value) return
  timer.ensureStarted()
  isDragging.value = true
  const pos = getCellFromEvent(e)
  if (!pos || isWall(pos.row, pos.col) || usedCells.value.has(posKey(pos))) return
  currentPath.value = [pos]
  feedback.value = ''
}

function continueDrag(e: PointerEvent) {
  if (!isDragging.value || finished.value) return
  const pos = getCellFromEvent(e)
  if (!pos || isWall(pos.row, pos.col) || usedCells.value.has(posKey(pos))) return

  const key = posKey(pos)
  const existingIndex = currentPath.value.findIndex(p => posKey(p) === key)

  if (existingIndex >= 0) {
    currentPath.value = currentPath.value.slice(0, existingIndex + 1)
    return
  }

  const lastPos = currentPath.value[currentPath.value.length - 1]
  if (lastPos && areAdjacent(lastPos, pos)) {
    currentPath.value = [...currentPath.value, pos]
  }
}

function endDrag() {
  if (!isDragging.value) return
  isDragging.value = false

  if (currentPath.value.length < 2) {
    currentPath.value = []
    return
  }

  const match = checkWordMatch(currentPath.value, puzzle.value, new Set(solvedIndices.value.map(i => puzzle.value.words[i].word)))

  if (match) {
    feedbackOk.value = true
    feedback.value = `Found: ${match.word}!`
    solvedIndices.value = [...solvedIndices.value, match.wordIndex]
    currentPath.value = []
    saveState()

    if (isPuzzleComplete(solvedIndices.value, puzzle.value)) {
      finishGame()
    }

    setTimeout(() => { feedback.value = '' }, 1500)
  } else {
    feedbackOk.value = false
    feedback.value = 'Not a word — try again'
    currentPath.value = []
    setTimeout(() => { feedback.value = '' }, 1500)
  }
}

function clearCurrentPath() {
  currentPath.value = []
  feedback.value = ''
}

function useHint() {
  const unsolvedIndex = puzzle.value.words.findIndex((_, i) => !solvedIndices.value.includes(i))
  if (unsolvedIndex < 0) return

  const revealCount = hintReveals.value[unsolvedIndex] ?? 0
  const hint = getHintForWord(unsolvedIndex, puzzle.value, revealCount)

  if (hint) {
    hintsUsed.value += 1
    hintReveals.value = { ...hintReveals.value, [unsolvedIndex]: revealCount + 1 }
    timer.addPenalty(5000)
    feedbackOk.value = true
    feedback.value = `Hint: Word ${unsolvedIndex + 1} starts at row ${hint.row + 1}, col ${hint.col + 1}`
    saveState()
    setTimeout(() => { feedback.value = '' }, 3000)
  }
}

function finishGame() {
  timer.stop()
  saveState()
  void markDone({
    score: hintsUsed.value,
    timeMs: timer.elapsedMs.value,
    detail: `${puzzle.value.words.length} words · ${hintsUsed.value} hint${hintsUsed.value === 1 ? '' : 's'}`
  })
}

function shareResult() {
  const squares = puzzle.value.words.map((_, i) =>
    solvedIndices.value.includes(i) ? (hintReveals.value[i] ? '🟨' : '🟩') : '⬜'
  ).join('')
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/bhakti-marg` : ''
  const text = [
    `Bhaktiras Bhakti Marg · ${puzzle.value.words.length} words`,
    timer.display.value,
    '',
    squares,
    '',
    shareUrl ? `Find your path: ${shareUrl}` : ''
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
  return `${entry.score ?? 0} hint${entry.score === 1 ? '' : 's'}${time}`
}

async function submitToLeaderboard() {
  if (!auth.user.value || scoreSubmitted.value || submitting.value || !finished.value) return
  submitting.value = true
  submitError.value = ''
  const userName = auth.user.value.displayName || auth.user.value.email?.split('@')[0] || 'Player'
  try {
    await submitScore({
      score: hintsUsed.value,
      timeMs: timer.elapsedMs.value,
      detail: `${puzzle.value.words.length} words`,
      userId: auth.user.value.uid,
      userName,
      userEmail: auth.user.value.email || undefined
    })
    scoreSubmitted.value = true
    saveState()

    await achievements.processResult('bhakti-marg', {
      userName,
      timeMs: timer.elapsedMs.value,
      moves: puzzle.value.words.length,
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
    solvedIndices.value = []
    hintsUsed.value = 0
    hintReveals.value = {}
    scoreSubmitted.value = false
  }
  syncPlayTimer()
}, { immediate: true })

watch(playedElsewhere, () => { syncPlayTimer() })

useHead({ title: 'Bhakti Marg · Bhaktiras' })
</script>
