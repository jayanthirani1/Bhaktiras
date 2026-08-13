<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <NuxtLink
      v-for="card in cards"
      :key="card.to"
      :to="card.to"
      class="admin-panel group flex flex-col justify-between hover:border-[hsl(var(--primary))]/30"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">{{ card.title }}</h2>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ card.desc }}</p>
        </div>
        <span
          v-if="counts[card.key] != null"
          class="shrink-0 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-semibold text-[hsl(var(--primary))]"
        >
          {{ counts[card.key] }}
        </span>
      </div>
      <p class="mt-4 text-sm font-semibold text-[hsl(var(--accent))] group-hover:underline">Edit →</p>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, type Firestore } from 'firebase/firestore'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const cards = [
  { key: 'timeline', title: 'Timeline', desc: 'Journey years, stories, photos and videos.', to: '/admin/timeline' },
  { key: 'events', title: 'Events', desc: 'Title, date, description and poster.', to: '/admin/events' },
  { key: 'niyams', title: 'Niyams', desc: 'Utsav niyams for the personal tracker.', to: '/admin/niyams' },
  { key: 'legal', title: 'Privacy & Policy', desc: 'Footer legal pages anyone can read.', to: '/admin/legal' },
  { key: 'wordle', title: 'Wordle', desc: 'Solution words and today’s override.', to: '/admin/games/wordle' },
  { key: 'quiz', title: 'Quiz', desc: 'Devotional questions and answers.', to: '/admin/games/quiz' },
  { key: 'crossword', title: 'Crossword', desc: 'Puzzle titles and clues.', to: '/admin/games/crossword' },
  { key: 'spelling', title: 'Spelling Bee', desc: 'Hive letters and accepted words.', to: '/admin/games/spelling-bee' },
  { key: 'onePercent', title: '1% Club', desc: 'Ladder questions from 90% to 1%.', to: '/admin/games/one-percent' },
  { key: 'mini', title: 'Mini Crossword', desc: 'Quick timed crossword puzzles.', to: '/admin/games/mini-crossword' }
]

const counts = reactive<Record<string, number | null>>({
  timeline: null,
  events: null,
  niyams: null,
  legal: null,
  wordle: null,
  quiz: null,
  crossword: null,
  spelling: null,
  onePercent: null,
  mini: null
})

const collectionNames: Record<string, string> = {
  timeline: 'timeline',
  events: 'events',
  niyams: 'niyams',
  legal: 'sitePages',
  wordle: 'wordleWords',
  quiz: 'quizQuestions',
  crossword: 'crosswordPuzzles',
  spelling: 'spellingBeePuzzles',
  onePercent: 'onePercentQuestions',
  mini: 'miniCrosswordPuzzles'
}

onMounted(async () => {
  const db = useNuxtApp().$firebaseDb as Firestore | null
  if (!db) return
  await Promise.all(Object.entries(collectionNames).map(async ([key, name]) => {
    try {
      counts[key] = (await getDocs(collection(db, name))).size
    } catch {
      counts[key] = null
    }
  }))
})

useHead({ title: 'Admin · Bhaktiras' })
</script>
