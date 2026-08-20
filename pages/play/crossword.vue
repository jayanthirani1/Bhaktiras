<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-[calc(16.5rem+env(safe-area-inset-bottom))] pt-0 md:pb-24 md:pt-12 px-3 sm:px-4">
    <div class="mx-auto max-w-3xl">
      <!-- Top bar: pinned so Back and Check stay reachable while scrolling -->
      <div class="sticky top-0 z-40 -mx-3 mb-3 flex items-center justify-between gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4 md:top-16 md:mb-6">
        <NuxtLink
          to="/play"
          class="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          ‹ Back
        </NuxtLink>
        <div class="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--primary))]">
          <span class="rounded-full bg-[hsl(var(--muted))] px-3 py-1 tabular-nums">⏱ {{ timerDisplay }}</span>
          <span v-if="solved" class="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Solved</span>
        </div>
        <button
          v-if="!playedElsewhere"
          type="button"
          class="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[hsl(var(--primary))]/20 disabled:opacity-40"
          :disabled="!layout || solved"
          @click="checkAnswers"
        >
          ✓ Check
        </button>
      </div>

      <div class="mb-4 hidden md:block">
        <PageHeader
          title="Crossword"
          subtitle="A quick grid — race the clock. Your timer keeps ticking if you leave."
        />
      </div>
      <h1 class="mb-3 text-center font-display text-xl font-semibold text-[hsl(var(--primary))] md:hidden">
        {{ active?.title || 'Crossword' }}
      </h1>

      <GamePlayedElsewhere
        v-if="playedElsewhere"
        title="Crossword"
        :summary="elsewhereSummary"
      />

      <div v-else-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading crossword…</div>
      <div v-else-if="!active || !layout" class="card-surface p-8 text-center text-[hsl(var(--muted-foreground))]">
        Today’s crossword will appear here once it is added.
      </div>
      <div v-else class="space-y-4 md:space-y-6">
        <div v-if="puzzles.length > 1" class="flex flex-wrap justify-center gap-2">
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

        <!-- Grid -->
        <div class="rounded-2xl border border-[hsl(var(--border))] bg-white p-3 sm:p-5">
          <div class="flex justify-center overflow-x-auto">
            <div
              class="xw-grid grid gap-px rounded-lg bg-[hsl(var(--primary))] p-px"
              :style="{
                gridTemplateColumns: `repeat(${layout.cols}, var(--xw-cell))`,
                '--xw-cols': layout.cols,
                '--xw-rows': layout.rows
              }"
            >
              <button
                v-for="cell in flatCells"
                :key="cell.id"
                type="button"
                class="relative aspect-square select-none font-bold uppercase"
                :class="cellClass(cell)"
                :disabled="!cell.open || solved"
                @click="onCellClick(cell.row, cell.col)"
              >
                <span
                  v-if="cell.number"
                  class="xw-num absolute left-0.5 top-0.5 font-bold leading-none text-[hsl(var(--primary))]"
                >{{ cell.number }}</span>
                <span>{{ guesses[cell.id] || '' }}</span>
              </button>
            </div>
          </div>

          <!-- Clue navigator (mobile-first, also useful on desktop) -->
          <div v-if="!solved" class="mt-4">
            <CrosswordClueBar
              :number="activeWord?.number"
              :direction="activeWord?.direction || activeDir"
              :clue="activeWord?.clue"
              @prev="stepClue(-1)"
              @next="stepClue(1)"
              @toggle-direction="toggleDirection"
            />
          </div>

          <div v-if="checked && !solved" class="mt-3 text-center text-sm text-[hsl(var(--muted-foreground))]">
            {{ correctCount }} / {{ layout.words.length }} words correct
          </div>

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
              to="/login?redirect=/play/crossword"
              class="inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Sign in to submit time
            </NuxtLink>
            <p v-else-if="scoreSubmitted" class="text-sm text-emerald-700">Time on the leaderboard.</p>
            <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
          </div>

          <div class="mt-4 hidden flex-wrap gap-2 md:flex">
            <button type="button" class="btn-primary text-sm" :disabled="solved" @click="checkAnswers">Check</button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200 disabled:opacity-40"
              :disabled="solved || !canRevealLetter"
              @click="askHint('letter')"
            >
              <IconEye class="h-4 w-4" aria-hidden="true" />
              Hint: letter (+5s)
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200 disabled:opacity-40"
              :disabled="solved || !canRevealWord"
              @click="askHint('word')"
            >
              <IconHelp class="h-4 w-4" aria-hidden="true" />
              Hint: word (+20s)
            </button>
            <button
              type="button"
              class="rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]"
              :disabled="solved"
              @click="clearGuesses"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Desktop clue lists -->
        <div class="hidden gap-6 md:grid md:grid-cols-2">
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
                </button>
              </li>
            </ol>
          </section>
        </div>
      </div>

      <div class="mt-10">
        <GameCrowns :ids="['crossword-fastest']" />
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

    <!-- Fixed custom keyboard (mobile / tablet play chrome) -->
    <div
      v-if="layout && !solved && !playedElsewhere"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
    >
      <div class="mx-auto max-w-lg">
        <div class="mb-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 rounded-xl bg-amber-100 py-2 text-xs font-bold text-amber-900 active:scale-[0.99] disabled:opacity-40"
            :disabled="!canRevealLetter"
            @click="askHint('letter')"
          >
            <IconEye class="h-3.5 w-3.5" aria-hidden="true" />
            Letter +5s
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 rounded-xl bg-amber-100 py-2 text-xs font-bold text-amber-900 active:scale-[0.99] disabled:opacity-40"
            :disabled="!canRevealWord"
            @click="askHint('word')"
          >
            <IconHelp class="h-3.5 w-3.5" aria-hidden="true" />
            Word +20s
          </button>
        </div>
        <button
          type="button"
          class="mb-2 w-full rounded-xl bg-[hsl(var(--primary))] py-2.5 text-sm font-bold text-white shadow-lg shadow-[hsl(var(--primary))]/20 active:scale-[0.99] disabled:opacity-40"
          :disabled="solved"
          @click="checkAnswers"
        >
          ✓ Check answers
        </button>
        <GameLetterKeyboard
          @letter="typeLetter"
          @delete="backspace"
        />
      </div>
    </div>

    <GameHintConfirm
      :open="!!pendingHint"
      :kind="pendingHint"
      @confirm="confirmHint"
      @cancel="pendingHint = null"
    />
  </div>
</template>

<script setup lang="ts">
import { IconEye, IconHelp } from '@tabler/icons-vue'
import { cellKey, layoutCrossword, type LaidWord } from '~/utils/crosswordLayout'
import { ukDateId } from '~/utils/gameDay'
import { formatElapsed } from '~/composables/useGameTimer'

const STATE_KEY = `mini-crossword:${ukDateId()}`

const { puzzles, loading } = useMiniCrosswordPuzzles()
const auth = useAuth()
const achievements = useAchievements()
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
const {
  playedElsewhere,
  result: elsewhereResult,
  markDone,
  backfill
} = useDailyGameCompletion('mini-crossword')

const elsewhereSummary = computed(() =>
  elsewhereResult.value?.timeMs != null ? `solved in ${formatElapsed(elsewhereResult.value.timeMs)}` : ''
)

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
const pendingHint = ref<'letter' | 'word' | null>(null)

const active = computed(() => puzzles.value.find(p => p.id === activeId.value) || puzzles.value[0] || null)
const layout = computed(() => active.value ? layoutCrossword(active.value.clues) : null)
const acrossWords = computed(() => layout.value?.words.filter(w => w.direction === 'across') || [])
const downWords = computed(() => layout.value?.words.filter(w => w.direction === 'down') || [])
const orderedWords = computed(() => {
  const list = layout.value?.words || []
  return [...list].sort((a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1))
})

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
const canRevealLetter = computed(() => {
  const l = layout.value
  return !!l && flatCells.value.some(cell =>
    cell.open && guesses[cell.id] !== l.letters[cell.row][cell.col]
  )
})
const canRevealWord = computed(() => !!activeWord.value && !isWordCorrect(activeWord.value))

function cellClass(cell: { id: string; open: boolean; row: number; col: number }) {
  if (!cell.open) return 'bg-[hsl(var(--primary))] cursor-default'
  const isActive = cell.row === activeRow.value && cell.col === activeCol.value
  const inWord = activeWordKeys.value.has(cell.id)
  const ok = (checked.value || solved.value) && isCellCorrect(cell.row, cell.col)
  const bad = checked.value && !solved.value && !!guesses[cell.id] && !isCellCorrect(cell.row, cell.col)
  return [
    'flex items-center justify-center text-[hsl(var(--foreground))]',
    isActive ? 'xw-cell-active' : inWord ? 'xw-cell-word' : 'bg-white',
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

function puzzleSignature(puzzle: typeof active.value): string {
  if (!puzzle) return ''
  return `${puzzle.id}:${puzzle.clues.map(clue => `${clue.direction}:${clue.answer}`).join('|')}`
}

function wordsAt(row: number, col: number) {
  return (layout.value?.words || []).filter(w => w.cells.some(c => c.row === row && c.col === col))
}

function persist() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      puzzleId: activeId.value,
      puzzleSignature: puzzleSignature(active.value),
      guesses: { ...guesses },
      solved: solved.value,
      scoreSubmitted: scoreSubmitted.value,
      activeRow: activeRow.value,
      activeCol: activeCol.value,
      activeDir: activeDir.value
    }))
  } catch {}
}

function restore() {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    const savedPuzzle = puzzles.value.find(p => p.id === data.puzzleId)
    if (!savedPuzzle || data.puzzleSignature !== puzzleSignature(savedPuzzle)) {
      localStorage.removeItem(STATE_KEY)
      Object.keys(guesses).forEach(k => { delete guesses[k] })
      activeId.value = puzzles.value[0]?.id || ''
      solved.value = false
      scoreSubmitted.value = false
      timer.reset()
      return
    }
    activeId.value = savedPuzzle.id
    if (data.guesses && typeof data.guesses === 'object') {
      Object.keys(guesses).forEach(k => { delete guesses[k] })
      Object.assign(guesses, data.guesses)
    }
    solved.value = !!data.solved
    scoreSubmitted.value = !!data.scoreSubmitted
    if (typeof data.activeRow === 'number') activeRow.value = data.activeRow
    if (typeof data.activeCol === 'number') activeCol.value = data.activeCol
    if (data.activeDir === 'across' || data.activeDir === 'down') activeDir.value = data.activeDir
  } catch {}
}

function focusWordStart(word: LaidWord) {
  const empty = word.cells.find(c => !guesses[cellKey(c.row, c.col)])
  const target = empty || word.cells[0]
  activeDir.value = word.direction
  activeRow.value = target.row
  activeCol.value = target.col
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
  persist()
}

function selectWord(key: string) {
  if (solved.value) return
  const word = layout.value?.words.find(w => w.key === key)
  if (!word) return
  focusWordStart(word)
  checked.value = false
  persist()
}

function toggleDirection() {
  if (solved.value) return
  const here = wordsAt(activeRow.value, activeCol.value)
  if (here.length < 2) return
  activeDir.value = activeDir.value === 'across' ? 'down' : 'across'
  persist()
}

function stepClue(delta: number) {
  const list = orderedWords.value
  if (!list.length || solved.value) return
  const currentKey = activeWord.value?.key
  let idx = list.findIndex(w => w.key === currentKey)
  if (idx < 0) idx = 0
  else idx = (idx + delta + list.length) % list.length
  focusWordStart(list[idx])
  checked.value = false
  persist()
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
  void markDone({ timeMs: timer.elapsedMs.value, detail: 'Solved' })
}

function askHint(kind: 'letter' | 'word') {
  if (solved.value || playedElsewhere.value) return
  if (kind === 'letter' && !canRevealLetter.value) return
  if (kind === 'word' && !canRevealWord.value) return
  pendingHint.value = kind
}

function confirmHint() {
  const kind = pendingHint.value
  pendingHint.value = null
  if (kind === 'letter') revealLetter()
  else if (kind === 'word') revealWord()
}

function revealLetter() {
  const l = layout.value
  if (!l || solved.value || playedElsewhere.value) return
  const word = activeWord.value
  const candidates = word?.cells.length
    ? word.cells
    : flatCells.value.filter(cell => cell.open)
  const target = candidates.find(cell => {
    const id = cellKey(cell.row, cell.col)
    return guesses[id] !== l.letters[cell.row][cell.col]
  })
  if (!target) return
  guesses[cellKey(target.row, target.col)] = l.letters[target.row][target.col] ?? ''
  activeRow.value = target.row
  activeCol.value = target.col
  checked.value = false
  timer.addPenalty(5_000)
  persist()
  maybeComplete()
}

function revealWord() {
  const word = activeWord.value
  if (!word || solved.value || playedElsewhere.value || isWordCorrect(word)) return
  word.cells.forEach((cell, index) => {
    guesses[cellKey(cell.row, cell.col)] = word.answer[index]
  })
  checked.value = false
  timer.addPenalty(20_000)
  persist()
  maybeComplete()
}

function typeLetter(letter: string) {
  if (solved.value || playedElsewhere.value) return
  if (!layout.value?.letters[activeRow.value]?.[activeCol.value]) return
  timer.ensureStarted()
  guesses[cellKey(activeRow.value, activeCol.value)] = letter.toUpperCase()
  checked.value = false
  persist()
  moveInWord(1)
  maybeComplete()
}

function backspace() {
  if (solved.value || playedElsewhere.value) return
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
  if (playedElsewhere.value) return
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
  if (first) focusWordStart(first)
  persist()
}

async function submitToLeaderboard() {
  if (!auth.user.value || !solved.value || scoreSubmitted.value || submitting.value) return
  submitError.value = ''
  submitting.value = true
  try {
    const ms = timer.elapsedMs.value
    const userName = auth.userName.value || auth.userEmail.value || 'Player'
    await submitScore({
      score: Math.max(1, Math.ceil(ms / 1000)),
      timeMs: ms,
      userName,
      userId: auth.user.value.uid,
      userEmail: auth.userEmail.value || undefined,
      detail: active.value?.title || 'crossword'
    })
    try {
      await achievements.processResult('crossword', { timeMs: ms, userName })
    } catch {
      // Leaderboard write already succeeded.
    }
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
  if (!activeWord.value && layout.value?.words[0]) focusWordStart(layout.value.words[0])
}, { immediate: true })

watch([entries, () => auth.user.value?.uid], ([list, uid]) => {
  if (uid && list.some(e => e.userId === uid)) scoreSubmitted.value = true
})

watch([solved, () => auth.user.value?.uid], ([done, uid]) => {
  if (done && uid && !scoreSubmitted.value && !submitting.value) {
    void submitToLeaderboard()
  }
}, { immediate: true })

backfill(() => ({ timeMs: timer.elapsedMs.value, detail: 'Solved' }))

onMounted(() => {
  timer.read()
  if (solved.value && timer.startedAt.value && !timer.finishedAt.value) timer.stop()
  else if (Object.keys(guesses).length && !solved.value) timer.ensureStarted()

  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (!layout.value || solved.value) return
    if (e.key === 'Backspace') {
      e.preventDefault()
      backspace()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      if (e.shiftKey) stepClue(e.key === 'ArrowRight' ? 1 : -1)
      else {
        activeDir.value = 'across'
        moveInWord(e.key === 'ArrowRight' ? 1 : -1)
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      if (e.shiftKey) stepClue(e.key === 'ArrowDown' ? 1 : -1)
      else {
        activeDir.value = 'down'
        moveInWord(e.key === 'ArrowDown' ? 1 : -1)
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      stepClue(e.shiftKey ? -1 : 1)
    } else if (/^[A-Za-z]$/.test(e.key)) {
      e.preventDefault()
      typeLetter(e.key)
    }
  }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})

useHead({ title: 'Crossword · Bhaktiras' })
</script>

<style scoped>
/*
 * Cell size is driven by whichever runs out first: the viewport width or the
 * height left over after the page chrome.
 *
 * It used to be `minmax(2.15rem, 2.6rem)` — a fixed minimum width and no height
 * constraint at all. Wide grids therefore overflowed sideways, and tall ones
 * pushed the clue bar off the bottom of the screen behind the fixed keyboard.
 *
 * --xw-reserve is everything that is not the grid: the sticky top bar, the
 * title, the clue navigator, card padding, and on mobile the 16.5rem fixed
 * keyboard the page already reserves via its bottom padding.
 */
.xw-grid {
  --xw-reserve: 28rem;
  --xw-vh: 100vh;
  /* Floor keeps cells tappable; overflow-x on the wrapper catches the rest. */
  --xw-cell: clamp(
    1.45rem,
    min(
      calc((100vw - 3.25rem) / var(--xw-cols)),
      calc((var(--xw-vh) - var(--xw-reserve)) / var(--xw-rows))
    ),
    2.6rem
  );
  font-size: calc(var(--xw-cell) * 0.48);
}

@supports (height: 100svh) {
  .xw-grid { --xw-vh: 100svh; }
}

/* No fixed keyboard from md up, so the grid gets far more height back. */
@media (min-width: 768px) {
  .xw-grid { --xw-reserve: 17rem; }
}

/* Buttons do not inherit font-size by default. */
.xw-grid button {
  font-size: inherit;
}

.xw-num {
  font-size: calc(var(--xw-cell) * 0.3);
}

.xw-cell-word {
  background: hsl(var(--golden-100));
}
.xw-cell-active {
  background:
    repeating-linear-gradient(
      -45deg,
      hsl(var(--golden-100)),
      hsl(var(--golden-100)) 4px,
      #fff 4px,
      #fff 8px
    );
  box-shadow: inset 0 0 0 2px hsl(var(--accent));
}
</style>
