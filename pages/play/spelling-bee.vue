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
        subtitle="Make words from the hive. Every word must use the center letter. 4+ letters."
      />

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
          @click="submitWord"
        >
          Enter
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
          Your all-time best ({{ myBest }} words) is on the board.
        </p>
        <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
      </div>

      <GameLeaderboard
        :entries="leaderboardEntries"
        :loading="leaderboardLoading"
        all-time
        :format-score="(e) => `${e.score} word${e.score === 1 ? '' : 's'}`"
      >
        <template v-if="!isLoggedIn">
          <NuxtLink to="/login?redirect=/play/spelling-bee" class="text-[hsl(var(--primary))] underline">Sign in</NuxtLink>
          to submit your best.
        </template>
        <template v-else-if="myBest > 0">
          Your best: {{ myBest }} words.
        </template>
      </GameLeaderboard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft } from '@tabler/icons-vue'
import { getHiveLetters, getMiddleLetter, isValidSpellingBeeWord, spellingBeePoints, SPELLING_BEE_PUZZLES } from '~/data/spellingBeePuzzles'

const { puzzles } = useSpellingBeePuzzles()
const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const {
  entries: leaderboardEntries,
  loading: leaderboardLoading,
  submitScore
} = useGameLeaderboard('spelling-bee', { sort: 'desc', allTime: true })
const submittingScore = ref(false)
const submitError = ref('')
const puzzle = ref(SPELLING_BEE_PUZZLES[0])
const currentWord = ref('')
const foundWords = ref<string[]>([])
const totalScore = ref(0)
const message = ref('')
const messageOk = ref(false)
const myBest = computed(() => {
  const uid = auth.user.value?.uid
  if (!uid) return 0
  return leaderboardEntries.value.find(e => e.userId === uid)?.score || 0
})
const canSubmitBest = computed(() => foundWords.value.length > myBest.value)

watch(puzzles, (list) => {
  if (list?.length) puzzle.value = list[Math.floor(Math.random() * list.length)]
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

function submitWord() {
  const w = currentWord.value.trim()
  if (!w) return
  const upper = w.toUpperCase()
  if (foundWords.value.includes(upper)) {
    message.value = 'Already found'
    messageOk.value = false
    return
  }
  if (isValidSpellingBeeWord(w, puzzle.value)) {
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

async function submitToLeaderboard() {
  const wordCount = foundWords.value.length
  if (!auth.user.value || wordCount <= 0) return
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
</script>
