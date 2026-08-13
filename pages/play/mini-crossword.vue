<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="mx-auto max-w-3xl">
      <NuxtLink
        to="/play"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        ← Back to games
      </NuxtLink>
      <PageHeader
        title="Mini Crossword"
        subtitle="A quick grid — race the clock. Your timer keeps ticking if you leave."
      />

      <div class="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-[hsl(var(--primary))]">
        <span class="rounded-full bg-[hsl(var(--muted))] px-3 py-1 tabular-nums">⏱ {{ timerDisplay }}</span>
        <span v-if="solved" class="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Solved</span>
      </div>

      <div v-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading mini…</div>
      <div v-else-if="!active || !layout" class="card-surface p-8 text-center text-[hsl(var(--muted-foreground))]">
        Mini crossword will appear here once it is added.
      </div>
      <div v-else class="space-y-6">
        <div v-if="puzzles.length > 1" class="flex flex-wrap gap-2">
          <button
            v-for="p in puzzles"
            :key="p.id"
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-semibold"
            :class="active?.id === p.id ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'"
            @click="select(p.id)"
          >
            {{ p.title }}
          </button>
        </div>

        <div class="card-surface overflow-x-auto p-4 sm:p-6">
          <h3 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ active.title }}</h3>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Tap a square, then type. Same square again switches across/down.
          </p>

          <div class="mt-5 flex justify-center overflow-x-auto pb-2">
            <div
              class="grid gap-px rounded-lg bg-[hsl(var(--primary))] p-px"
              :style="{ gridTemplateColumns: `repeat(${layout.cols}, minmax(2rem, 2.4rem))` }"
            >
              <button
                v-for="cell in flatCells"
                :key="cell.id"
                type="button"
                class="relative aspect-square select-none"
                :class="cellClass(cell)"
                :disabled="!cell.open || solved"
                @click="onCellClick(cell.row, cell.col)"
              >
                <span
                  v-if="cell.number"
                  class="absolute left-0.5 top-0 text-[0.55rem] font-bold leading-none text-[hsl(var(--primary))]"
                >{{ cell.number }}</span>
                <span class="font-bold uppercase tracking-wide">{{ guesses[cell.id] || '' }}</span>
              </button>
            </div>
          </div>

          <div v-if="!solved" class="mt-4">
            <CrosswordKeyboardCapture
              ref="captureRef"
              placeholder="Type letters here"
              @letter="typeLetter"
              @backspace="backspace"
              @arrow="onCaptureArrow"
            />
            <p class="mt-1.5 text-center text-xs text-[hsl(var(--muted-foreground))]">
              Tap a square, then type on your keyboard.
            </p>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <button type="button" class="btn-primary text-sm" :disabled="solved" @click="checkAnswers">Check</button>
            <button
              type="button"
              class="rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]"
              :disabled="solved"
              @click="clearGuesses"
            >
              Clear
            </button>
          </div>
          <p v-if="checked && !solved" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            {{ correctCount }} / {{ layout.words.length }} words correct
          </p>
          <div v-if="solved" class="mt-4 space-y-3 text-center">
            <p class="text-sm font-semibold text-emerald-700">Finished in {{ timerDisplay }}</p>
            <button
              v-if="isLoggedIn && !scoreSubmitted"
              type="button"
              class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
              :disabled="submitting"
              @click="submitToLeaderboard"
            >
              {{ submitting ? 'Submitting…' : 'Submit time to leaderboard' }}
            </button>
            <NuxtLink
              v-else-if="!isLoggedIn && !scoreSubmitted"
              to="/login?redirect=/play/mini-crossword"
              class="inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Sign in to submit time
            </NuxtLink>
            <p v-else-if="scoreSubmitted" class="text-sm text-emerald-700">Time on the leaderboard.</p>
            <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <section class="card-surface p-5">
            <h4 class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">Across</h4>
            <ol class="space-y-2">
              <li v-for="word in acrossWords" :key="word.key">
                <button
                  type="button"
                  class="w-full rounded-lg px-2 py-1.5 text-left text-sm"
                  :class="activeWord?.key === word.key ? 'bg-[hsl(var(--golden-100))] text-[hsl(var(--primary))]' : 'hover:bg-[hsl(var(--muted))]'"
                  @click="selectWord(word.key)"
                >
                  <span class="font-semibold">{{ word.number }}.</span>
                  {{ word.clue }}
                  <span class="text-[hsl(var(--muted-foreground))]"> ({{ word.answer.length }})</span>
                </button>
              </li>
            </ol>
          </section>
          <section class="card-surface p-5">
            <h4 class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">Down</h4>
            <ol class="space-y-2">
              <li v-for="word in downWords" :key="word.key">
                <button
                  type="button"
                  class="w-full rounded-lg px-2 py-1.5 text-left text-sm"
                  :class="activeWord?.key === word.key ? 'bg-[hsl(var(--golden-100))] text-[hsl(var(--primary))]' : 'hover:bg-[hsl(var(--muted))]'"
                  @click="selectWord(word.key)"
                >
                  <span class="font-semibold">{{ word.number }}.</span>
                  {{ word.clue }}
                  <span class="text-[hsl(var(--muted-foreground))]"> ({{ word.answer.length }})</span>
                </button>
              </li>
            </ol>
          </section>
        </div>
      </div>

      <GameLeaderboard
        :entries="entries"
        :loading="boardLoading"
        :date-id="dateId"
        :current-user-id="auth.user.value?.uid"
        :format-score="(e) => formatElapsed(e.timeMs ?? (e.score || 0) * 1000)"
      >
        Fastest finish today.
      </GameLeaderboard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cellKey, layoutCrossword, type LaidWord } from '~/utils/crosswordLayout'
import { ukDateId } from '~/utils/gameDay'
import { formatElapsed } from '~/composables/useGameTimer'

const STATE_KEY = `mini-crossword:${ukDateId()}`

const { puzzles, loading } = useMiniCrosswordPuzzles()
const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const {
  entries,
  loading: boardLoading,
  dateId,
  submitScore,
  refetch
} = useGameLeaderboard('mini-crossword', { sort: 'asc' })

const timer = useGameTimer(`mini-crossword-timer:${ukDateId()}`)
const timerDisplay = computed(() => timer.display.value)
const captureRef = ref<{ focus: () => void } | null>(null)

function focusCapture() {
  // Focus in the same user gesture when possible (required for iOS soft keyboard).
  captureRef.value?.focus()
  nextTick(() => captureRef.value?.focus())
}

const activeId = ref('')
const guesses = reactive<Record<string, string>>({})
const checked = ref(false)
const solved = ref(false)
const activeRow = ref(0)
const activeCol = ref(0)
const activeDir = ref<'across' | 'down'>('across')
const scoreSubmitted = ref(false)
const submitting = ref(false)
const submitError = ref('')

const active = computed(() => puzzles.value.find(p => p.id === activeId.value) || puzzles.value[0] || null)
const layout = computed(() => active.value ? layoutCrossword(active.value.clues) : null)
const acrossWords = computed(() => layout.value?.words.filter(w => w.direction === 'across') || [])
const downWords = computed(() => layout.value?.words.filter(w => w.direction === 'down') || [])

const flatCells = computed(() => {
  const l = layout.value
  if (!l) return []
  const out = []
  for (let r = 0; r < l.rows; r++) {
    for (let c = 0; c < l.cols; c++) {
      out.push({
        id: cellKey(r, c),
        row: r,
        col: c,
        open: !!l.letters[r][c],
        number: l.numbers[r][c]
      })
    }
  }
  return out
})

const activeWord = computed(() => {
  const l = layout.value
  if (!l) return null
  return l.words.find(w =>
    w.direction === activeDir.value
    && w.cells.some(cell => cell.row === activeRow.value && cell.col === activeCol.value)
  ) || l.words.find(w => w.cells.some(cell => cell.row === activeRow.value && cell.col === activeCol.value)) || null
})

const activeWordKeys = computed(() => new Set((activeWord.value?.cells || []).map(c => cellKey(c.row, c.col))))

function cellClass(cell: { id: string; open: boolean; row: number; col: number }) {
  if (!cell.open) return 'bg-[hsl(var(--primary))] cursor-default'
  const isActive = cell.row === activeRow.value && cell.col === activeCol.value
  const inWord = activeWordKeys.value.has(cell.id)
  const ok = (checked.value || solved.value) && isCellCorrect(cell.row, cell.col)
  const bad = checked.value && !solved.value && !!guesses[cell.id] && !isCellCorrect(cell.row, cell.col)
  return [
    'flex items-center justify-center bg-white text-sm sm:text-base text-[hsl(var(--foreground))]',
    isActive ? 'ring-2 ring-inset ring-[hsl(var(--accent))] bg-[hsl(var(--golden-100))]' : '',
    !isActive && inWord ? 'bg-[hsl(var(--golden-50))]' : '',
    ok ? 'text-emerald-700' : '',
    bad ? 'text-red-600' : ''
  ].filter(Boolean).join(' ')
}

function isCellCorrect(row: number, col: number) {
  const solution = layout.value?.letters[row]?.[col]
  if (!solution) return false
  return (guesses[cellKey(row, col)] || '') === solution
}

function isWordCorrect(word: LaidWord) {
  return word.cells.every((c, i) => (guesses[cellKey(c.row, c.col)] || '') === word.answer[i])
}

const correctCount = computed(() => layout.value?.words.filter(isWordCorrect).length || 0)

function wordsAt(row: number, col: number) {
  return (layout.value?.words || []).filter(w => w.cells.some(c => c.row === row && c.col === col))
}

function persist() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      puzzleId: activeId.value,
      guesses: { ...guesses },
      solved: solved.value,
      scoreSubmitted: scoreSubmitted.value
    }))
  } catch {}
}

function restore() {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data.puzzleId) activeId.value = data.puzzleId
    if (data.guesses && typeof data.guesses === 'object') {
      Object.keys(guesses).forEach(k => { delete guesses[k] })
      Object.assign(guesses, data.guesses)
    }
    solved.value = !!data.solved
    scoreSubmitted.value = !!data.scoreSubmitted
  } catch {}
}

function onCellClick(row: number, col: number) {
  if (solved.value || !layout.value?.letters[row][col]) return
  const here = wordsAt(row, col)
  if (activeRow.value === row && activeCol.value === col && here.length > 1) {
    activeDir.value = activeDir.value === 'across' ? 'down' : 'across'
  } else if (!here.some(w => w.direction === activeDir.value)) {
    activeDir.value = here[0]?.direction || 'across'
  }
  activeRow.value = row
  activeCol.value = col
  checked.value = false
  focusCapture()
}

function selectWord(key: string) {
  if (solved.value) return
  const word = layout.value?.words.find(w => w.key === key)
  if (!word) return
  activeDir.value = word.direction
  const empty = word.cells.find(c => !guesses[cellKey(c.row, c.col)])
  const target = empty || word.cells[0]
  activeRow.value = target.row
  activeCol.value = target.col
  checked.value = false
  focusCapture()
}

function onCaptureArrow(dir: 'left' | 'right' | 'up' | 'down') {
  if (dir === 'left' || dir === 'right') {
    activeDir.value = 'across'
    moveInWord(dir === 'right' ? 1 : -1)
  } else {
    activeDir.value = 'down'
    moveInWord(dir === 'down' ? 1 : -1)
  }
}

function moveInWord(delta: number) {
  const word = activeWord.value
  if (!word) return
  const idx = word.cells.findIndex(c => c.row === activeRow.value && c.col === activeCol.value)
  const next = word.cells[idx + delta]
  if (!next) return
  activeRow.value = next.row
  activeCol.value = next.col
}

function maybeComplete() {
  const l = layout.value
  if (!l || solved.value) return
  const openIds = flatCells.value.filter(c => c.open).map(c => c.id)
  if (!openIds.length || openIds.some(id => !guesses[id])) return
  if (!l.words.every(isWordCorrect)) return
  solved.value = true
  checked.value = true
  timer.stop()
  persist()
}

function typeLetter(letter: string) {
  if (solved.value || !layout.value?.letters[activeRow.value]?.[activeCol.value]) return
  timer.ensureStarted()
  guesses[cellKey(activeRow.value, activeCol.value)] = letter
  checked.value = false
  persist()
  moveInWord(1)
  maybeComplete()
}

function backspace() {
  if (solved.value) return
  const id = cellKey(activeRow.value, activeCol.value)
  if (guesses[id]) {
    delete guesses[id]
    checked.value = false
    persist()
    return
  }
  moveInWord(-1)
  delete guesses[cellKey(activeRow.value, activeCol.value)]
  checked.value = false
  persist()
}

function checkAnswers() {
  checked.value = true
  maybeComplete()
}

function clearGuesses() {
  if (solved.value) return
  Object.keys(guesses).forEach(k => { delete guesses[k] })
  checked.value = false
  persist()
}

function select(id: string) {
  activeId.value = id
  Object.keys(guesses).forEach(k => { delete guesses[k] })
  checked.value = false
  solved.value = false
  scoreSubmitted.value = false
  activeDir.value = 'across'
  const l = layoutCrossword(puzzles.value.find(p => p.id === id)?.clues || [])
  const first = l?.words[0]
  if (first) {
    activeRow.value = first.row
    activeCol.value = first.col
    activeDir.value = first.direction
  }
  persist()
}

async function submitToLeaderboard() {
  if (!auth.user.value || !solved.value || scoreSubmitted.value || submitting.value) return
  submitError.value = ''
  submitting.value = true
  try {
    const ms = timer.elapsedMs.value
    await submitScore({
      score: Math.max(1, Math.ceil(ms / 1000)),
      timeMs: ms,
      userName: auth.userName.value || auth.userEmail.value || 'Player',
      userId: auth.user.value.uid,
      userEmail: auth.userEmail.value || undefined,
      detail: active.value?.title || 'mini'
    })
    scoreSubmitted.value = entries.value.some(e => e.userId === auth.user.value?.uid)
    if (!scoreSubmitted.value) await refetch()
    scoreSubmitted.value = entries.value.some(e => e.userId === auth.user.value?.uid)
    persist()
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Could not submit time.'
  } finally {
    submitting.value = false
  }
}

watch(puzzles, (list) => {
  if (!list.length) return
  restore()
  if (!activeId.value || !list.some(p => p.id === activeId.value)) {
    activeId.value = list[0].id
  }
}, { immediate: true })

watch([entries, () => auth.user.value?.uid], ([list, uid]) => {
  if (uid && list.some(e => e.userId === uid)) scoreSubmitted.value = true
})

onMounted(() => {
  timer.read()
  if (solved.value && timer.startedAt.value && !timer.finishedAt.value) timer.stop()
  else if (Object.keys(guesses).length && !solved.value) timer.ensureStarted()
  focusCapture()
})

useHead({ title: 'Mini Crossword · Bhaktiras' })
</script>
