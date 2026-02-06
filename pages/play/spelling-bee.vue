<template>
  <div class="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-md mx-auto">
      <NuxtLink
        to="/play"
        class="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-sm font-medium mb-6"
      >
        <IconArrowLeft class="w-4 h-4" />
        Back to games
      </NuxtLink>

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
            class="w-14 h-14 rounded-full bg-[hsl(var(--primary))] text-white font-bold text-xl hover:opacity-90 transition-opacity"
            @click="addLetter(middleLetter)"
          >
            {{ middleLetter }}
          </button>
        </div>
      </div>

      <div class="mb-4">
        <p class="text-sm text-[hsl(var(--muted-foreground))] mb-2">Score: {{ totalScore }}</p>
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
          class="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white font-semibold hover:opacity-90"
          @click="submitWord"
        >
          Enter
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-stone-200 text-[hsl(var(--foreground))] font-semibold hover:bg-stone-300"
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
            class="px-3 py-1 rounded-lg bg-white border border-[hsl(var(--golden-200))] text-sm font-medium"
          >
            {{ w }}
          </span>
          <span v-if="foundWords.length === 0" class="text-sm text-[hsl(var(--muted-foreground))]">No words yet.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft } from '@tabler/icons-vue'
import { getRandomPuzzle, getHiveLetters, getMiddleLetter, isValidSpellingBeeWord, spellingBeePoints } from '~/data/spellingBeePuzzles'

const puzzle = ref(getRandomPuzzle())
const currentWord = ref('')
const foundWords = ref<string[]>([])
const totalScore = ref(0)
const message = ref('')
const messageOk = ref(false)

const middleLetter = computed(() => getMiddleLetter(puzzle.value))
const outerLetters = computed(() => getHiveLetters(puzzle.value).filter((l) => l !== middleLetter.value))

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
    if (w.length < 4) message.value = 'Too short (min 4 letters)'
    else if (!upper.includes(middleLetter.value)) message.value = 'Must use center letter'
    else message.value = 'Not in word list'
    messageOk.value = false
  }
  setTimeout(() => { message.value = '' }, 2000)
}
</script>
