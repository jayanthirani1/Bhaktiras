<template>
  <div class="min-h-screen bg-stone-50 pb-32 pt-8 md:pt-12 px-4">
    <div class="max-w-lg mx-auto">
      <NuxtLink
        to="/play"
        class="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-sm font-medium mb-6"
      >
        <IconArrowLeft class="w-4 h-4" />
        Back to games
      </NuxtLink>

      <PageHeader
        title="Wordle"
        subtitle="Guess the devotional word in six tries."
      />

      <!-- Invalid word message -->
      <div
        v-if="invalidWordMessage"
        role="alert"
        aria-live="polite"
        class="mb-3 py-2 px-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center"
      >
        {{ invalidWordMessage }}
      </div>

      <!-- Grid -->
      <div class="flex flex-col gap-2 mb-8" role="grid" aria-label="Wordle guesses">
        <div
          v-for="(row, rowIndex) in rows"
          :key="rowIndex"
          class="grid grid-cols-5 gap-1.5 sm:gap-2 justify-center"
          :class="{ shake: shakeRow === rowIndex }"
          role="row"
        >
          <div
            v-for="(cell, cellIndex) in row"
            :key="cellIndex"
            role="gridcell"
            :aria-label="cell.letter ? `${cell.letter}, ${statusLabel(cell.status)}` : 'empty'"
            class="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-lg font-bold text-lg sm:text-xl uppercase transition-colors"
            :class="cellBg(cell.status)"
            :style="{ animation: (flipRow === rowIndex || (shouldDance && rowIndex === guesses.length - 1 && solution === guesses[guesses.length - 1])) ? 'flip 0.5s ease-in-out' : '' }"
          >
            {{ cell.letter }}
          </div>
        </div>
      </div>

      <!-- Keyboard -->
      <div class="flex flex-col gap-1.5">
        <div class="flex justify-center gap-1">
          <button
            v-for="k in KEYBOARD_TOP"
            :key="k"
            type="button"
            class="h-11 sm:h-12 rounded-md font-semibold text-sm uppercase min-w-[1.75rem] px-2 sm:min-w-[2rem] transition-colors disabled:opacity-50"
            :class="keyBg(k)"
            :disabled="isComplete"
            @click="addLetter(k)"
          >
            {{ k }}
          </button>
        </div>
        <div class="flex justify-center gap-1">
          <button
            v-for="k in KEYBOARD_MID"
            :key="k"
            type="button"
            class="h-11 sm:h-12 rounded-md font-semibold text-sm uppercase min-w-[1.75rem] px-2 sm:min-w-[2rem] transition-colors disabled:opacity-50"
            :class="keyBg(k)"
            :disabled="isComplete"
            @click="addLetter(k)"
          >
            {{ k }}
          </button>
        </div>
        <div class="flex justify-center gap-1">
          <button
            type="button"
            class="h-11 sm:h-14 px-5 sm:px-7 rounded-md font-bold text-sm sm:text-base bg-[hsl(var(--primary))] text-white hover:opacity-90 disabled:opacity-50 transition-all"
            :disabled="isComplete"
            @click="submitGuess"
          >
            ENTER
          </button>
          <button
            v-for="k in KEYBOARD_BOT"
            :key="k"
            type="button"
            class="h-11 sm:h-12 rounded-md font-semibold text-sm uppercase min-w-[1.75rem] px-2 sm:min-w-[2rem] transition-colors disabled:opacity-50"
            :class="keyBg(k)"
            :disabled="isComplete"
            @click="addLetter(k)"
          >
            {{ k }}
          </button>
          <button
            type="button"
            class="h-11 sm:h-14 px-5 sm:px-7 rounded-md font-bold text-base bg-stone-300 text-[hsl(var(--foreground))] hover:bg-stone-400 disabled:opacity-50 transition-all"
            :disabled="isComplete"
            @click="removeLetter"
          >
            ⌫
          </button>
        </div>
      </div>

      <!-- Leaderboard -->
      <div class="mt-12">
        <h3 class="text-lg font-bold text-[hsl(var(--foreground))] mb-3">Leaderboard</h3>
        <p v-if="!isLoggedIn" class="text-sm text-[hsl(var(--muted-foreground))] mb-2">
          <NuxtLink to="/login" class="text-[hsl(var(--primary))] underline">Sign in</NuxtLink> to submit your score.
        </p>
        <div v-if="leaderboard.loading" class="text-sm text-[hsl(var(--muted-foreground))]">Loading...</div>
        <ul v-else class="bg-white rounded-xl border border-[hsl(var(--golden-200))] overflow-hidden divide-y divide-[hsl(var(--border))]">
          <li
            v-for="(entry, idx) in leaderboard.entries.slice(0, 10)"
            :key="entry.id"
            class="flex items-center justify-between px-4 py-2 text-sm"
          >
            <span class="font-medium text-[hsl(var(--foreground))]">{{ idx + 1 }}. {{ entry.userName }}</span>
            <span class="text-[hsl(var(--muted-foreground))]">{{ entry.guesses }}/6</span>
          </li>
          <li v-if="leaderboard.entries.length === 0" class="px-4 py-6 text-center text-[hsl(var(--muted-foreground))] text-sm">
            No scores yet. Play and sign in to appear here!
          </li>
        </ul>
      </div>

      <!-- Result modal -->
      <Teleport to="body">
        <div
          v-if="isComplete"
          ref="modalBackdropRef"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wordle-result-title"
          aria-describedby="wordle-result-desc"
          @click.self="closeModal"
        >
          <div
            ref="modalContentRef"
            tabindex="-1"
            class="bg-white rounded-2xl p-8 shadow-xl border border-[hsl(var(--golden-200))] max-w-md w-full text-center outline-none"
            @keydown.esc="closeModal"
          >
            <div v-if="isWin" class="text-4xl mb-4" aria-hidden="true">🎉</div>
            <div v-else class="text-4xl mb-4" aria-hidden="true">🙏</div>
            <h2 id="wordle-result-title" class="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">
              {{ isWin ? 'Well done!' : 'Next time' }}
            </h2>
            <p id="wordle-result-desc" class="sr-only" aria-live="polite">
              {{ isWin ? `You got it in ${guesses.length} ${guesses.length === 1 ? 'try' : 'tries'}.` : `The word was ${solution}.` }}
            </p>
            <p v-if="isWin" class="text-[hsl(var(--muted-foreground))] mb-6">
              You got it in {{ guesses.length }} {{ guesses.length === 1 ? 'try' : 'tries' }}.
            </p>
            <template v-else>
              <p class="text-[hsl(var(--muted-foreground))] mb-2">The word was</p>
              <p class="font-bold text-lg text-[hsl(var(--primary))] mb-6">{{ solution }}</p>
            </template>

            <div class="mb-6 p-4 bg-stone-50 rounded-xl text-left">
              <h3 class="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-3">STATISTICS</h3>
              <div class="grid grid-cols-4 gap-3">
                <div>
                  <div class="text-2xl font-bold text-[hsl(var(--foreground))]">{{ wordleStats.stats.gamesPlayed }}</div>
                  <div class="text-xs text-[hsl(var(--muted-foreground))]">Played</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-[hsl(var(--foreground))]">{{ wordleStats.winRate }}%</div>
                  <div class="text-xs text-[hsl(var(--muted-foreground))]">Win Rate</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-[hsl(var(--foreground))]">{{ wordleStats.stats.currentStreak }}</div>
                  <div class="text-xs text-[hsl(var(--muted-foreground))]">Streak</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-[hsl(var(--foreground))]">{{ wordleStats.stats.maxStreak }}</div>
                  <div class="text-xs text-[hsl(var(--muted-foreground))]">Max</div>
                </div>
              </div>
              <!-- Guess distribution -->
              <div class="mt-3">
                <p class="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">Guess distribution</p>
                <div class="space-y-1">
                  <div
                    v-for="n in 6"
                    :key="n"
                    class="flex items-center gap-2 text-xs"
                  >
                    <span class="w-4 font-medium text-[hsl(var(--foreground))]">{{ n }}</span>
                    <div class="flex-1 h-5 bg-stone-200 rounded overflow-hidden">
                      <div
                        class="h-full bg-[hsl(var(--primary))] rounded transition-all duration-300"
                        :style="{ width: guessDistributionWidth(n) + '%' }"
                      />
                    </div>
                    <span class="w-6 text-right text-[hsl(var(--muted-foreground))]">{{ wordleStats.stats.guessDistribution[n] ?? 0 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="isWin && isLoggedIn && !scoreSubmitted" class="mb-4">
              <button
                type="button"
                class="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
                :disabled="submittingScore"
                @click="submitToLeaderboard"
              >
                {{ submittingScore ? 'Submitting...' : 'Submit to Leaderboard' }}
              </button>
              <p v-if="submitError" class="mt-2 text-sm text-red-600">
                {{ submitError }}
              </p>
            </div>

            <div class="flex flex-col gap-2">
              <button
                v-if="isComplete"
                type="button"
                class="w-full py-2.5 rounded-xl bg-stone-200 text-[hsl(var(--foreground))] font-semibold hover:bg-stone-300"
                @click="shareResult"
              >
                {{ shareCopied ? 'Copied!' : 'Share' }}
              </button>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                {{ nextPuzzleIn }}
              </p>
              <NuxtLink
                to="/play"
                class="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-200 text-[hsl(var(--foreground))] font-semibold hover:bg-stone-300"
                @click="closeModal"
              >
                <IconArrowLeft class="w-4 h-4" />
                Back to games
              </NuxtLink>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft } from '@tabler/icons-vue'
import { getWordForDate, WORD_LEN } from '~/utils/wordleDaily'
import { getFeedback } from '~/utils/wordle'
import type { LetterStatus } from '~/types/wordle'

const ROWS = 6
const KEYBOARD_TOP = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
const KEYBOARD_MID = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
const KEYBOARD_BOT = ['Z', 'X', 'C', 'V', 'B', 'N', 'M']

const DAILY_STORAGE_KEY = 'wordle-daily'

const wordleWordsModule = ref<typeof import('~/utils/wordleWords') | null>(null)

function getTodayUTC(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function loadDailyState(): { solution: string; guesses: string[]; isComplete: boolean } {
  if (import.meta.server) {
    return { solution: getWordForDate(new Date()), guesses: [], isComplete: false }
  }
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY)
    if (!raw) return { solution: getWordForDate(new Date()), guesses: [], isComplete: false }
    const { date, solution, guesses, isComplete } = JSON.parse(raw)
    const today = getTodayUTC()
    if (date !== today) return { solution: getWordForDate(new Date()), guesses: [], isComplete: false }
    return { solution, guesses: guesses ?? [], isComplete: isComplete ?? false }
  } catch {
    return { solution: getWordForDate(new Date()), guesses: [], isComplete: false }
  }
}

function saveDailyState(solution: string, guesses: string[], isComplete: boolean) {
  if (import.meta.server) return
  try {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify({
      date: getTodayUTC(),
      solution,
      guesses,
      isComplete,
    }))
  } catch (_) {}
}

const solution = ref(getWordForDate(new Date()))
const guesses = ref<string[]>([])
const currentGuess = ref('')
const isComplete = ref(false)
const shakeRow = ref<number | null>(null)
const flipRow = ref<number | null>(null)
const shouldDance = ref(false)
const hasRecordedResult = ref(false)
const scoreSubmitted = ref(false)
const submittingScore = ref(false)
const submitError = ref('')
const invalidWordMessage = ref('')
const shareCopied = ref(false)
const modalBackdropRef = ref<HTMLElement | null>(null)
const modalContentRef = ref<HTMLElement | null>(null)

const wordleStats = useWordleStats()
const auth = useAuth()
const leaderboard = useWordleLeaderboard()
const isLoggedIn = computed(() => !!auth.user.value)

const isWin = computed(() => guesses.value.length > 0 && guesses.value[guesses.value.length - 1] === solution.value)
const isLose = computed(() => !isWin.value && guesses.value.length >= ROWS)

const rows = computed(() => {
  const out: { letter: string; status: LetterStatus }[][] = []
  for (let row = 0; row < ROWS; row++) {
    const guess = guesses.value[row]
    const isCurrent = !guess && row === guesses.value.length
    const word = isCurrent ? currentGuess.value : guess ?? ''
    const feedback = guess ? getFeedback(guess, solution.value) : []
    const cells = []
    for (let i = 0; i < WORD_LEN; i++) {
      const status = isCurrent ? 'empty' : (feedback[i] ?? 'empty')
      cells.push({ letter: word[i] ?? '', status: status as LetterStatus })
    }
    out.push(cells)
  }
  return out
})

const keyStatusMap = computed(() => {
  const m = new Map<string, LetterStatus>()
  guesses.value.forEach((g) => {
    const feedback = getFeedback(g, solution.value)
    for (let i = 0; i < g.length; i++) {
      const c = g[i]
      const s = feedback[i]
      if (s === 'correct') m.set(c, 'correct')
      else if (s === 'present' && m.get(c) !== 'correct') m.set(c, 'present')
      else if (s === 'absent' && !m.has(c)) m.set(c, 'absent')
    }
  })
  return m
})

function cellBg(status: LetterStatus) {
  if (status === 'correct') return 'bg-emerald-500 border-emerald-600 text-white'
  if (status === 'present') return 'bg-amber-400 border-amber-500 text-white'
  if (status === 'absent') return 'bg-stone-300 border-stone-400 text-stone-600'
  return 'bg-white border-stone-200 text-[hsl(var(--foreground))]'
}

function keyBg(letter: string) {
  const s = keyStatusMap.value.get(letter)
  if (s === 'correct') return 'bg-emerald-500 text-white'
  if (s === 'present') return 'bg-amber-400 text-white'
  if (s === 'absent') return 'bg-stone-300 text-stone-600'
  return 'bg-stone-200 text-[hsl(var(--foreground))] hover:bg-stone-300'
}

function statusLabel(status: LetterStatus): string {
  if (status === 'correct') return 'correct'
  if (status === 'present') return 'present'
  if (status === 'absent') return 'absent'
  return 'empty'
}

function submitGuess() {
  invalidWordMessage.value = ''
  const trimmed = currentGuess.value.toUpperCase().trim()
  const currentRow = guesses.value.length
  if (trimmed.length !== WORD_LEN) {
    shakeRow.value = currentRow
    setTimeout(() => { shakeRow.value = null }, 500)
    invalidWordMessage.value = 'Enter 5 letters.'
    setTimeout(() => { invalidWordMessage.value = '' }, 2500)
    return
  }
  const isValid = wordleWordsModule.value?.isValidWord(trimmed) ?? false
  if (!isValid) {
    shakeRow.value = currentRow
    setTimeout(() => { shakeRow.value = null }, 500)
    invalidWordMessage.value = 'Not in word list.'
    setTimeout(() => { invalidWordMessage.value = '' }, 2500)
    return
  }
  guesses.value = [...guesses.value, trimmed]
  currentGuess.value = ''
  flipRow.value = currentRow
  setTimeout(() => { flipRow.value = null }, 600)
  if (trimmed === solution.value) {
    isComplete.value = true
    setTimeout(() => { shouldDance.value = true }, 600)
  } else if (guesses.value.length >= ROWS) {
    isComplete.value = true
  }
}

function addLetter(letter: string) {
  if (isComplete.value) return
  if (currentGuess.value.length < WORD_LEN) {
    currentGuess.value += letter.toUpperCase()
  }
}

function removeLetter() {
  if (isComplete.value) return
  currentGuess.value = currentGuess.value.slice(0, -1)
}

function reset() {
  // Only allow reset for a new day (handled by loadDailyState). Same-day replay is not allowed.
  const state = loadDailyState()
  solution.value = state.solution
  guesses.value = [...state.guesses]
  currentGuess.value = ''
  isComplete.value = state.isComplete
  shakeRow.value = null
  flipRow.value = null
  shouldDance.value = false
  hasRecordedResult.value = false
  scoreSubmitted.value = false
}

watch([isComplete, isWin, isLose, guesses], () => {
  if (isComplete.value && !hasRecordedResult.value) {
    if (isWin.value) wordleStats.recordWin(guesses.value.length)
    else if (isLose.value) wordleStats.recordLoss()
    hasRecordedResult.value = true
  }
}, { deep: true })

watch([solution, guesses, isComplete], () => {
  saveDailyState(solution.value, guesses.value, isComplete.value)
}, { deep: true })

async function submitToLeaderboard() {
  if (!auth.user.value || !isWin.value) return
  submitError.value = ''
  submittingScore.value = true
  try {
    await leaderboard.submitScore(
      guesses.value.length,
      solution.value,
      auth.userName.value || auth.userEmail.value || 'Anonymous',
      auth.user.value.uid,
      auth.userEmail.value || undefined
    )
    scoreSubmitted.value = true
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Could not submit score. Please try again after signing in.'
  } finally {
    submittingScore.value = false
  }
}

const nextPuzzleIn = computed(() => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  const ms = tomorrow.getTime() - now.getTime()
  const hours = Math.floor(ms / 3600000)
  const mins = Math.floor((ms % 3600000) / 60000)
  if (hours > 0) return `Next puzzle in ${hours}h ${mins}m (midnight UTC).`
  return `Next puzzle in ${mins}m (midnight UTC).`
})

function guessDistributionWidth(n: number): number {
  const dist = wordleStats.stats.guessDistribution
  const max = Math.max(1, ...Object.values(dist))
  const val = dist[n] ?? 0
  return max > 0 ? (val / max) * 100 : 0
}

function shareResult() {
  const statusEmoji: Record<LetterStatus, string> = {
    correct: '🟩',
    present: '🟨',
    absent: '⬜',
    empty: '⬜'
  }
  const lines = rows.value
    .filter((_, i) => i < guesses.value.length)
    .map((row) => row.map((c) => statusEmoji[c.status]).join(''))
  const text = [
    `Bhaktiras Wordle ${guesses.value.length}/${ROWS}`,
    '',
    ...lines
  ].join('\n')
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      shareCopied.value = true
      setTimeout(() => { shareCopied.value = false }, 2000)
    })
  }
}

function closeModal() {
  navigateTo('/play')
}

onMounted(() => {
  import('~/utils/wordleWords').then((m) => { wordleWordsModule.value = m })
  const state = loadDailyState()
  solution.value = state.solution
  guesses.value = state.guesses
  isComplete.value = state.isComplete

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return
    if (isComplete.value) return
    if (e.key === 'Enter') {
      e.preventDefault()
      submitGuess()
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      removeLetter()
    } else if (/^[A-Za-z]$/.test(e.key)) {
      e.preventDefault()
      addLetter(e.key)
    }
  }
  window.addEventListener('keydown', onKeyDown)
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
})

watch(isComplete, (complete) => {
  if (complete) {
    nextTick(() => {
      nextTick(() => modalContentRef.value?.focus())
    })
  }
})
</script>
