<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-0 md:pt-12 px-4">
    <div class="max-w-md mx-auto">
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
        title="Spelling Bee"
        subtitle="Make words from today’s hive using the general English dictionary. Every word must use the center letter. 4+ letters."
      />

      <div v-if="puzzlesLoading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading today’s hive…
      </div>
      <template v-else>
      <div class="flex justify-center mb-6">
        <div class="flex flex-wrap justify-center gap-2 max-w-[280px]">
          <button
            v-for="letter in outerLetters"
            :key="letter"
            type="button"
            class="w-12 h-12 rounded-full bg-amber-100 text-amber-800 font-bold text-lg hover:bg-amber-200 transition-colors"
            @click="addLetter(letter)"
          >
            {{ letter }}
          </button>
          <button
            type="button"
            class="w-14 h-14 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--accent))] font-bold text-xl hover:opacity-90 transition-opacity"
            @click="addLetter(middleLetter)"
          >
            {{ middleLetter }}
          </button>
        </div>
      </div>

      <div class="mb-4">
        <p class="text-sm text-[hsl(var(--muted-foreground))] mb-2">
          Words: {{ foundWords.length }}
          <span v-if="totalScore > 0" class="text-[hsl(var(--muted-foreground))]/80">· {{ totalScore }} pts this hive</span>
        </p>
        <input
          v-model="currentWord"
          type="text"
          placeholder="Type or tap letters..."
          class="w-full px-4 py-3 rounded-xl border-2 border-[hsl(var(--golden-200))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
          @keydown.enter.prevent="submitWord"
        >
        <p v-if="message" class="mt-2 text-sm" :class="messageOk ? 'text-emerald-600' : 'text-red-600'">
          {{ message }}
        </p>
      </div>

      <div class="flex gap-2 mb-6">
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--accent))] font-semibold hover:opacity-90"
          :disabled="checkingWord"
          @click="submitWord"
        >
          {{ checkingWord ? 'Checking…' : 'Enter' }}
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-semibold hover:bg-[hsl(var(--border))]"
          @click="clearWord"
        >
          Clear
        </button>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-2">Found words ({{ foundWords.length }})</h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="w in foundWords"
            :key="w"
            class="px-3 py-1 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--golden-200))] text-sm font-medium"
          >
            {{ w }}
          </span>
          <span v-if="foundWords.length === 0" class="text-sm text-[hsl(var(--muted-foreground))]">No words yet.</span>
        </div>
      </div>

      <div v-if="foundWords.length > 0" class="mt-6 space-y-2">
        <button
          v-if="isLoggedIn && canSubmitBest"
          type="button"
          class="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          :disabled="submittingScore"
          @click="submitToLeaderboard"
        >
          {{ submittingScore ? 'Submitting...' : myBest > 0 ? 'Submit new best' : 'Submit to leaderboard' }}
        </button>
        <NuxtLink
          v-else-if="!isLoggedIn"
          to="/login?redirect=/play/spelling-bee"
          class="block w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Sign in to submit score
        </NuxtLink>
        <p v-else-if="myBest > 0 && foundWords.length <= myBest" class="text-sm text-emerald-700">
          Today’s best ({{ myBest }} words) is on the board.
        </p>
        <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
      </div>

      <GameLeaderboard
        :entries="leaderboardEntries"
        :loading="leaderboardLoading"
        :format-score="(e) => `${e.score} word${e.score === 1 ? '' : 's'}`"
      >
        <template v-if="!isLoggedIn">
          <NuxtLink to="/login?redirect=/play/spelling-bee" class="text-[hsl(var(--primary))] underline">Sign in</NuxtLink>
          to submit your best.
        </template>
        <template v-else-if="myBest > 0">
          Today’s best: {{ myBest }} words.
        </template>
      </GameLeaderboard>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft } from '@tabler/icons-vue'
import {
  getHiveLetters,
  getMiddleLetter,
  isValidSpellingBeeWord,
  matchesSpellingBeeLetters,
  spellingBeePoints,
  SPELLING_BEE_PUZZLES
} from '~/data/spellingBeePuzzles'
import { ukDateId } from '~/utils/gameDay'

const { puzzles, loading: puzzlesLoading } = useSpellingBeePuzzles()
const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const {
  entries: leaderboardEntries,
  loading: leaderboardLoading,
  submitScore
} = useGameLeaderboard('spelling-bee', { sort: 'desc' })
const submittingScore = ref(false)
const submitError = ref('')
const puzzle = ref(SPELLING_BEE_PUZZLES[0])
const dateId = ukDateId()
const currentWord = ref('')
const foundWords = ref<string[]>([])
const totalScore = ref(0)
const message = ref('')
const messageOk = ref(false)
const checkingWord = ref(false)
const englishDictionary = shallowRef<ReadonlySet<string> | null>(null)
let dictionaryPromise: Promise<ReadonlySet<string>> | null = null
const myBest = computed(() => {
  const uid = auth.user.value?.uid
  if (!uid) return 0
  return leaderboardEntries.value.find(e => e.userId === uid)?.score || 0
})
const canSubmitBest = computed(() => foundWords.value.length > myBest.value)

function puzzleIdentity(item: typeof puzzle.value) {
  return `${item.middleLetter.toUpperCase()}:${item.availableLetters.toUpperCase().split('').sort().join('')}`
}

function dateHash(value: string) {
  return [...value].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261)
}

function progressKey() {
  return `spelling-bee-progress:${dateId}:${puzzleIdentity(puzzle.value)}`
}

function loadProgress() {
  foundWords.value = []
  totalScore.value = 0
  if (import.meta.server) return
  try {
    const saved = JSON.parse(localStorage.getItem(progressKey()) || '{}')
    const words = Array.isArray(saved.words)
      ? saved.words
        .map((word: unknown) => String(word).toUpperCase())
        .filter((word: string) => matchesSpellingBeeLetters(word, puzzle.value))
      : []
    foundWords.value = [...new Set<string>(words)].sort()
    totalScore.value = foundWords.value.reduce((sum, word) => sum + spellingBeePoints(word, puzzle.value), 0)
  } catch {
    foundWords.value = []
  }
}

watch([puzzles, puzzlesLoading], ([list, loading]) => {
  if (loading || !list?.length) return
  const ordered = [...list].sort((a, b) => puzzleIdentity(a).localeCompare(puzzleIdentity(b)))
  const exact = ordered.find(item => item.id === `daily-${dateId}`)
  puzzle.value = exact || ordered[dateHash(`spelling-bee:${dateId}`) % ordered.length]
  loadProgress()
}, { immediate: true })

const middleLetter = computed(() => getMiddleLetter(puzzle.value))
const hiveLetters = computed(() => getHiveLetters(puzzle.value))
const outerLetters = computed(() => hiveLetters.value.filter((l) => l !== middleLetter.value))

function addLetter(letter: string) {
  currentWord.value += letter
}

function clearWord() {
  currentWord.value = ''
  message.value = ''
}

async function loadEnglishDictionary() {
  if (englishDictionary.value) return englishDictionary.value
  if (!dictionaryPromise) {
    dictionaryPromise = import('an-array-of-english-words').then((module) => {
      const raw = (module.default || module) as unknown as string[]
      const words = new Set(
        raw
          .filter(word => word.length >= 4 && /^[A-Za-z]+$/.test(word))
          .map(word => word.toUpperCase())
      )
      englishDictionary.value = words
      return words
    })
  }
  return dictionaryPromise
}

async function submitWord() {
  const w = currentWord.value.trim()
  if (!w) return
  const upper = w.toUpperCase()
  if (foundWords.value.includes(upper)) {
    message.value = 'Already found'
    messageOk.value = false
    return
  }
  checkingWord.value = true
  let dictionary: ReadonlySet<string> | undefined
  try {
    dictionary = await loadEnglishDictionary()
  } catch {
    dictionary = undefined
  } finally {
    checkingWord.value = false
  }
  if (isValidSpellingBeeWord(w, puzzle.value, dictionary)) {
    foundWords.value = [...foundWords.value, upper].sort()
    totalScore.value += spellingBeePoints(w, puzzle.value)
    message.value = 'Nice!'
    messageOk.value = true
    currentWord.value = ''
  } else {
    const outside = [...new Set(upper)].filter(letter => !hiveLetters.value.includes(letter))
    if (w.length < 4) message.value = 'Too short (min 4 letters)'
    else if (outside.length) message.value = `Not in this hive: ${outside.join(', ')}`
    else if (!upper.includes(middleLetter.value)) message.value = 'Must use center letter'
    else message.value = 'Not in word list'
    messageOk.value = false
  }
  setTimeout(() => { message.value = '' }, 2000)
}

watch(
  [foundWords, totalScore],
  () => {
    if (import.meta.server || puzzlesLoading.value) return
    localStorage.setItem(progressKey(), JSON.stringify({
      words: foundWords.value,
      score: totalScore.value
    }))
  },
  { deep: true }
)

async function submitToLeaderboard() {
  const wordCount = foundWords.value.length
  if (!auth.user.value || wordCount <= 0 || !canSubmitBest.value || submittingScore.value) return
  submitError.value = ''
  submittingScore.value = true
  try {
    await submitScore({
      score: wordCount,
      userName: auth.userName.value || auth.userEmail.value || 'Player',
      userId: auth.user.value.uid,
      userEmail: auth.userEmail.value || undefined,
      detail: `${totalScore.value} pts this hive`
    })
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Could not submit score.'
  } finally {
    submittingScore.value = false
  }
}

let autoSubmitTimer: ReturnType<typeof setTimeout> | null = null

function queueAutoSubmit() {
  if (autoSubmitTimer) clearTimeout(autoSubmitTimer)
  autoSubmitTimer = setTimeout(() => {
    if (submittingScore.value) {
      queueAutoSubmit()
      return
    }
    if (canSubmitBest.value) void submitToLeaderboard()
  }, 500)
}

watch(
  [() => foundWords.value.length, () => auth.user.value?.uid],
  ([wordCount, uid]) => {
    if (uid && wordCount > 0 && canSubmitBest.value) queueAutoSubmit()
  }
)

onUnmounted(() => {
  if (autoSubmitTimer) clearTimeout(autoSubmitTimer)
})

onMounted(() => { void loadEnglishDictionary() })
</script>
