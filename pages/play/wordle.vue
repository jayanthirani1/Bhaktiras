<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-0 md:pt-12 px-4">
    <div class="max-w-lg mx-auto">
      <!-- Pinned so Back stays reachable while scrolling -->
      <div class="sticky top-0 z-40 -mx-4 mb-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-4 py-2 backdrop-blur md:top-16">
        <NuxtLink
          to="/play"
          class="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <IconArrowLeft class="w-4 h-4" />
          Back
        </NuxtLink>
      </div>

      <PageHeader
        title="Wordle"
        subtitle="Guess the devotional word in six tries."
      />

      <ClientOnly>
        <template #fallback>
          <p class="mt-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading Wordle…</p>
        </template>

      <div class="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-[hsl(var(--primary))]">
        <span class="rounded-full bg-[hsl(var(--muted))] px-3 py-1 tabular-nums">⏱ {{ timer.display.value }}</span>
      </div>

      <div
        v-if="isComplete"
        class="mb-6 rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--card))] p-5 text-center"
      >
        <p class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Today’s Wordle complete</p>
        <p v-if="isWin" class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          You got it in {{ guesses.length }}/6 · {{ timer.display.value }}
        </p>
        <p v-else class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          The word was <span class="font-semibold uppercase text-[hsl(var(--primary))]">{{ solution }}</span>.
        </p>
        <p class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{{ nextPuzzleIn }}</p>
        <div class="mt-4 flex flex-col items-center gap-2">
          <button
            v-if="isWin && isLoggedIn && !scoreSubmitted"
            type="button"
            class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            :disabled="submittingScore"
            @click="submitToLeaderboard"
          >
            {{ submittingScore ? 'Submitting...' : 'Submit to leaderboard' }}
          </button>
          <NuxtLink
            v-else-if="isWin && !isLoggedIn && !scoreSubmitted"
            to="/login?redirect=/play/wordle"
            class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Sign in to submit score
          </NuxtLink>
          <p v-else-if="scoreSubmitted" class="text-sm text-emerald-700">Score submitted to the leaderboard.</p>
          <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
          <button
            type="button"
            class="rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]"
            @click="shareResult"
          >
            {{ shareCopied ? 'Copied!' : 'Share result' }}
          </button>
        </div>
      </div>

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
            :class="[
              cellBg(cell.status),
              { 'tile-pop': popTile === cellIndex && rowIndex === guesses.length && !!cell.letter }
            ]"
            :style="{ animation: (flipRow === rowIndex || (shouldDance && rowIndex === guesses.length - 1 && solution === guesses[guesses.length - 1])) ? 'flip 0.5s ease-in-out' : '' }"
          >
            {{ cell.letter }}
          </div>
        </div>
      </div>

      <!-- Keyboard -->
      <div v-if="!isComplete" class="flex flex-col gap-1.5 touch-manipulation">
        <div class="flex justify-center gap-1">
          <button
            v-for="k in KEYBOARD_TOP"
            :key="k"
            type="button"
            class="h-11 sm:h-12 rounded-md font-semibold text-sm uppercase min-w-[1.75rem] px-2 sm:min-w-[2rem] transition-transform duration-75 active:scale-90 disabled:opacity-50"
            :class="[keyBg(k), { 'key-press': pressedKey === k }]"
            :disabled="isComplete"
            @pointerdown="onKeyPointer($event, k)"
            @click="onKeyClick(k)"
          >
            {{ k }}
          </button>
        </div>
        <div class="flex justify-center gap-1">
          <button
            v-for="k in KEYBOARD_MID"
            :key="k"
            type="button"
            class="h-11 sm:h-12 rounded-md font-semibold text-sm uppercase min-w-[1.75rem] px-2 sm:min-w-[2rem] transition-transform duration-75 active:scale-90 disabled:opacity-50"
            :class="[keyBg(k), { 'key-press': pressedKey === k }]"
            :disabled="isComplete"
            @pointerdown="onKeyPointer($event, k)"
            @click="onKeyClick(k)"
          >
            {{ k }}
          </button>
        </div>
        <div class="flex justify-center gap-1">
          <button
            type="button"
            class="h-11 sm:h-14 px-5 sm:px-7 rounded-md font-bold text-sm sm:text-base bg-[hsl(var(--primary))] text-[hsl(var(--accent))] hover:opacity-90 disabled:opacity-50 transition-transform duration-75 active:scale-90"
            :class="{ 'key-press': pressedKey === 'ENTER' }"
            :disabled="isComplete"
            @pointerdown="onKeyPointer($event, 'ENTER')"
            @click="onKeyClick('ENTER')"
          >
            ENTER
          </button>
          <button
            v-for="k in KEYBOARD_BOT"
            :key="k"
            type="button"
            class="h-11 sm:h-12 rounded-md font-semibold text-sm uppercase min-w-[1.75rem] px-2 sm:min-w-[2rem] transition-transform duration-75 active:scale-90 disabled:opacity-50"
            :class="[keyBg(k), { 'key-press': pressedKey === k }]"
            :disabled="isComplete"
            @pointerdown="onKeyPointer($event, k)"
            @click="onKeyClick(k)"
          >
            {{ k }}
          </button>
          <button
            type="button"
            class="h-11 sm:h-14 px-5 sm:px-7 rounded-md font-bold text-base bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))] disabled:opacity-50 transition-transform duration-75 active:scale-90"
            :class="{ 'key-press': pressedKey === 'BACK' }"
            :disabled="isComplete"
            @pointerdown="onKeyPointer($event, 'BACK')"
            @click="onKeyClick('BACK')"
          >
            ⌫
          </button>
        </div>
      </div>

      <GameLeaderboard
        :entries="leaderboardEntries"
        :loading="leaderboardLoading"
        :date-id="leaderboardDateId"
        :current-user-id="auth.user.value?.uid"
        :format-score="(e) => formatWordleScore(e)"
      >
        <template v-if="!isLoggedIn">
          <NuxtLink to="/login?redirect=/play/wordle" class="text-[hsl(var(--primary))] underline">Sign in</NuxtLink>
          to submit yours.
        </template>
        <template v-else-if="isWin && !scoreSubmitted">
          You’re signed in — submit your score above.
        </template>
        <template v-else-if="scoreSubmitted">
          Your score is on the board.
        </template>
      </GameLeaderboard>

      <!-- Result modal -->
      <Teleport to="body">
        <div
          v-if="showResultModal"
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
            class="bg-[hsl(var(--card))] rounded-2xl p-8 shadow-xl border border-[hsl(var(--golden-200))] max-w-md w-full text-center outline-none"
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

            <div class="mb-6 p-4 bg-[hsl(var(--background))] rounded-xl text-left">
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
                    <div class="flex-1 h-5 bg-[hsl(var(--muted))] rounded overflow-hidden">
                      <div
                        class="h-full bg-[hsl(var(--primary))] rounded transition-all duration-300"
                        :style="{ width: guessDistributionWidth(n) + '%' }"
                      />
                    </div>
                    <span class="w-6 text-right text-[hsl(var(--muted-foreground))]">{{ wordleStats.stats.guessDistribution?.[n] ?? 0 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="isWin && !scoreSubmitted" class="mb-4">
              <button
                v-if="isLoggedIn"
                type="button"
                class="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
                :disabled="submittingScore"
                @click="submitToLeaderboard"
              >
                {{ submittingScore ? 'Submitting...' : 'Submit to Leaderboard' }}
              </button>
              <NuxtLink
                v-else
                to="/login?redirect=/play/wordle"
                class="block w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 text-center"
              >
                Sign in to submit score
              </NuxtLink>
              <p v-if="submitError" class="mt-2 text-sm text-red-600">
                {{ submitError }}
              </p>
            </div>

            <div class="flex flex-col gap-2">
              <button
                type="button"
                class="w-full py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white font-semibold hover:opacity-90"
                @click="closeModal"
              >
                Continue
              </button>
              <button
                type="button"
                class="w-full py-2.5 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-semibold hover:bg-[hsl(var(--border))]"
                @click="shareResult"
              >
                {{ shareCopied ? 'Copied!' : 'Share' }}
              </button>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                {{ nextPuzzleIn }}
              </p>
            </div>
          </div>
        </div>
      </Teleport>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft } from '@tabler/icons-vue'
import { getWordForDate, wordleDateId } from '~/utils/wordleDaily'
import { getFeedback } from '~/utils/wordle'
import { isValidWord } from '~/data/wordleGuessList'
import { formatElapsed } from '~/composables/useGameTimer'
import type { LetterStatus } from '~/types/wordle'

const WORD_LEN = 5
const ROWS = 6
const KEYBOARD_TOP = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
const KEYBOARD_MID = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
const KEYBOARD_BOT = ['Z', 'X', 'C', 'V', 'B', 'N', 'M']

const DAILY_STORAGE_KEY = 'wordle-daily'

const remoteExtraWords = ref<string[]>([])

function getTodayId(): string {
  return wordleDateId()
}

function loadDailyState(): { solution: string; guesses: string[]; isComplete: boolean; scoreSubmitted: boolean } {
  if (import.meta.server) {
    return { solution: getWordForDate(new Date()), guesses: [], isComplete: false, scoreSubmitted: false }
  }
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY)
    if (!raw) return { solution: getWordForDate(new Date()), guesses: [], isComplete: false, scoreSubmitted: false }
    const { date, solution, guesses, isComplete, scoreSubmitted } = JSON.parse(raw)
    const today = getTodayId()
    if (date !== today) return { solution: getWordForDate(new Date()), guesses: [], isComplete: false, scoreSubmitted: false }
    return {
      solution,
      guesses: guesses ?? [],
      isComplete: isComplete ?? false,
      scoreSubmitted: scoreSubmitted ?? false
    }
  } catch {
    return { solution: getWordForDate(new Date()), guesses: [], isComplete: false, scoreSubmitted: false }
  }
}

function saveDailyState(solution: string, guesses: string[], isComplete: boolean, scoreSubmitted = false) {
  if (import.meta.server) return
  try {
    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify({
      date: getTodayId(),
      solution,
      guesses,
      isComplete,
      scoreSubmitted
    }))
  } catch (_) {}
}

const solution = ref('BHAKT')
const guesses = ref<string[]>([])
const currentGuess = ref('')
const isComplete = ref(false)
const showResultModal = ref(false)
const shakeRow = ref<number | null>(null)
const flipRow = ref<number | null>(null)
const shouldDance = ref(false)
const pressedKey = ref<string | null>(null)
const popTile = ref<number | null>(null)
let pressTimer: ReturnType<typeof setTimeout> | null = null
let popTimer: ReturnType<typeof setTimeout> | null = null
/** When true, the next click is a leftover from a touch pointerdown we already handled. */
let ignoreClickFromTouch = false
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
const {
  entries: leaderboardEntries,
  loading: leaderboardLoading,
  dateId: leaderboardDateId,
  submitScore,
  refetch: refetchLeaderboard
} = useWordleLeaderboard()
const isLoggedIn = computed(() => !!auth.user.value)
const timer = useGameTimer(`wordle-timer:${getTodayId()}`)

function formatWordleScore(e: { guesses?: number; score?: number; timeMs?: number }) {
  const g = e.guesses ?? e.score
  const t = e.timeMs != null ? ` · ${formatElapsed(e.timeMs)}` : ''
  return `${g}/6${t}`
}

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
  if (status === 'absent') return 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
  return 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--foreground))]'
}

function keyBg(letter: string) {
  const s = keyStatusMap.value.get(letter)
  if (s === 'correct') return 'bg-emerald-500 text-white'
  if (s === 'present') return 'bg-amber-400 text-white'
  if (s === 'absent') return 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
  return 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]'
}

function statusLabel(status: LetterStatus): string {
  if (status === 'correct') return 'correct'
  if (status === 'present') return 'present'
  if (status === 'absent') return 'absent'
  return 'empty'
}

function isAllowedGuess(word: string) {
  const w = word.toUpperCase().trim()
  if (w.length !== WORD_LEN || !/^[A-Z]+$/.test(w)) return false
  if (w === solution.value) return true
  return isValidWord(w, [...remoteExtraWords.value, solution.value])
}

function haptic(pattern: number | number[] = 10) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    }
  } catch {}
}

function pressKeyVisual(key: string) {
  pressedKey.value = key.toUpperCase()
  if (pressTimer) clearTimeout(pressTimer)
  pressTimer = setTimeout(() => { pressedKey.value = null }, 140)
}

function runKey(key: string) {
  const k = key.toUpperCase()
  if (k === 'ENTER') {
    pressKeyVisual('ENTER')
    haptic([12, 20, 12])
    submitGuess()
    return
  }
  if (k === 'BACK' || k === 'BACKSPACE') {
    pressKeyVisual('BACK')
    haptic(14)
    removeLetter()
    return
  }
  pressKeyVisual(k)
  haptic(10)
  addLetter(k)
}

/** Touch/pen: act immediately and suppress the follow-up click (often lost after re-render). */
function onKeyPointer(e: PointerEvent, key: string) {
  if (e.pointerType === 'mouse') return
  e.preventDefault()
  ignoreClickFromTouch = true
  runKey(key)
  setTimeout(() => { ignoreClickFromTouch = false }, 400)
}

/** Mouse / keyboard activation of the button. */
function onKeyClick(key: string) {
  if (ignoreClickFromTouch) return
  runKey(key)
}

function submitGuess() {
  invalidWordMessage.value = ''
  const trimmed = currentGuess.value.toUpperCase().trim()
  const currentRow = guesses.value.length
  if (trimmed.length !== WORD_LEN) {
    haptic([30, 50, 30])
    shakeRow.value = currentRow
    setTimeout(() => { shakeRow.value = null }, 500)
    invalidWordMessage.value = 'Enter 5 letters.'
    setTimeout(() => { invalidWordMessage.value = '' }, 2500)
    return
  }
  if (!isAllowedGuess(trimmed)) {
    haptic([30, 50, 30])
    shakeRow.value = currentRow
    setTimeout(() => { shakeRow.value = null }, 500)
    invalidWordMessage.value = 'Not in word list.'
    setTimeout(() => { invalidWordMessage.value = '' }, 2500)
    return
  }
  guesses.value = [...guesses.value, trimmed]
  currentGuess.value = ''
  popTile.value = null
  flipRow.value = currentRow
  setTimeout(() => { flipRow.value = null }, 600)
  if (trimmed === solution.value) {
    isComplete.value = true
    timer.stop()
    showResultModal.value = true
    setTimeout(() => { shouldDance.value = true }, 600)
  } else if (guesses.value.length >= ROWS) {
    isComplete.value = true
    timer.stop()
    showResultModal.value = true
  }
}

function addLetter(letter: string) {
  if (isComplete.value) return
  if (currentGuess.value.length >= WORD_LEN) {
    haptic(20)
    return
  }
  timer.ensureStarted()
  currentGuess.value += letter.toUpperCase()
  popTile.value = currentGuess.value.length - 1
  if (popTimer) clearTimeout(popTimer)
  popTimer = setTimeout(() => { popTile.value = null }, 140)
}

function removeLetter() {
  if (isComplete.value) return
  currentGuess.value = currentGuess.value.slice(0, -1)
  popTile.value = null
}

function reset() {
  // Only allow reset for a new day (handled by loadDailyState). Same-day replay is not allowed.
  const state = loadDailyState()
  solution.value = state.solution
  guesses.value = [...state.guesses]
  currentGuess.value = ''
  isComplete.value = state.isComplete
  showResultModal.value = false
  shakeRow.value = null
  flipRow.value = null
  shouldDance.value = false
  hasRecordedResult.value = state.isComplete
  scoreSubmitted.value = state.scoreSubmitted
}

watch([isComplete, isWin, isLose, guesses], () => {
  if (isComplete.value && !hasRecordedResult.value) {
    if (isWin.value) wordleStats.recordWin(guesses.value.length)
    else if (isLose.value) wordleStats.recordLoss()
    hasRecordedResult.value = true
  }
}, { deep: true })

watch([solution, guesses, isComplete, scoreSubmitted], () => {
  saveDailyState(solution.value, guesses.value, isComplete.value, scoreSubmitted.value)
}, { deep: true })

watch(
  [leaderboardEntries, leaderboardLoading, () => auth.user.value?.uid],
  ([list, loading, uid]) => {
    if (!uid || loading) return
    const onBoard = Array.isArray(list) && list.some(e => e.userId === uid)
    if (onBoard) scoreSubmitted.value = true
    else if (!submittingScore.value) scoreSubmitted.value = false
  }
)

async function submitToLeaderboard() {
  if (!auth.user.value || !isWin.value || scoreSubmitted.value || submittingScore.value) return
  submitError.value = ''
  submittingScore.value = true
  try {
    await submitScore(
      guesses.value.length,
      solution.value,
      auth.userName.value || auth.userEmail.value || 'Player',
      auth.user.value.uid,
      auth.userEmail.value || undefined,
      timer.elapsedMs.value
    )
    const uid = auth.user.value.uid
    const onBoard = leaderboardEntries.value.some(e => e.userId === uid)
    if (!onBoard) await refetchLeaderboard()
    scoreSubmitted.value = leaderboardEntries.value.some(e => e.userId === uid)
    if (!scoreSubmitted.value) throw new Error('Score saved, but it is not on today’s board yet. Tap submit again.')
    saveDailyState(solution.value, guesses.value, isComplete.value, true)
    showResultModal.value = false
  } catch (e: unknown) {
    scoreSubmitted.value = false
    saveDailyState(solution.value, guesses.value, isComplete.value, false)
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
  const dist = wordleStats.stats.value?.guessDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  const values = Object.values(dist)
  const max = Math.max(1, ...values)
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
    timer.display.value,
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
  showResultModal.value = false
}

onMounted(async () => {
  const state = loadDailyState()
  hasRecordedResult.value = state.isComplete
  scoreSubmitted.value = false
  showResultModal.value = false
  solution.value = state.solution
  guesses.value = state.guesses
  isComplete.value = state.isComplete
  timer.read()
  if (state.isComplete) {
    if (timer.startedAt.value && !timer.finishedAt.value) timer.stop()
  } else if (state.guesses.length || timer.startedAt.value) {
    // Continue wall-clock timer from earlier session
    if (!timer.startedAt.value) timer.ensureStarted()
  }
  try {
    const remote = await fetchWordleRemote(new Date())
    remoteExtraWords.value = [
      ...remote.extraWords.map(w => w.toUpperCase()),
      ...(remote.dailyWord ? [remote.dailyWord.toUpperCase()] : [])
    ]
    if (!state.guesses.length && !state.isComplete) {
      const next = remote.dailyWord || getWordForDate(new Date(), remote.extraWords)
      if (next) solution.value = next
    }
  } catch (_) {}

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return
    if (isComplete.value) return
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (e.key === 'Enter') {
      e.preventDefault()
      runKey('ENTER')
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      runKey('BACK')
    } else if (/^[A-Za-z]$/.test(e.key)) {
      e.preventDefault()
      runKey(e.key)
    }
  }
  window.addEventListener('keydown', onKeyDown)
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
})

watch(showResultModal, (open) => {
  if (open) {
    nextTick(() => {
      nextTick(() => modalContentRef.value?.focus())
    })
  }
})
</script>
