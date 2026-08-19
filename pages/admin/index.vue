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
  { key: 'bugs', title: 'Bug reports', desc: 'Review, resolve and close reports from the footer.', to: '/admin/bugs' },
  { key: 'notifications', title: 'Push notifications', desc: 'Send updates to opted-in devices.', to: '/admin/notifications' },
  { key: 'content', title: 'Content settings', desc: 'Jump to homepage tiles, nav links and community questions.', to: '/admin/content' },
  { key: 'timeline', title: 'Timeline', desc: 'Journey years, stories, photos and videos.', to: '/admin/timeline' },
  { key: 'events', title: 'Events', desc: 'Title, date, description and poster.', to: '/admin/events' },
  { key: 'yajman', title: 'Yajman opportunities', desc: 'Add and publish Utsav Yajman opportunities.', to: '/admin/yajman' },
  { key: 'niyams', title: 'Niyams', desc: 'Utsav niyams for the personal tracker.', to: '/admin/niyams' },
  { key: 'legal', title: 'Privacy & Policy', desc: 'Footer legal pages anyone can read.', to: '/admin/legal' },
  { key: 'wordle', title: 'Wordle', desc: 'Solution words and today’s override.', to: '/admin/games/wordle' },
  { key: 'crossword', title: 'Crossword', desc: 'Quick timed crossword puzzles.', to: '/admin/games/crossword' },
  { key: 'onePercent', title: '1% Club', desc: 'Daily Vachanamrut ladders from the Bhuj edition.', to: '/admin/games/one-percent' },
  { key: 'connections', title: 'Connections', desc: 'Four groups of four satsang words.', to: '/admin/games/connections' }
]

const counts = reactive<Record<string, number | null>>({
  bugs: null,
  notifications: null,
  content: null,
  timeline: null,
  events: null,
  yajman: null,
  niyams: null,
  legal: null,
  wordle: null,
  crossword: null,
  onePercent: null,
  connections: null
})

const collectionNames: Record<string, string> = {
  bugs: 'bugReports',
  notifications: 'pushMessages',
  content: 'siteContent',
  timeline: 'timeline',
  events: 'events',
  yajman: 'yajmanOpportunities',
  niyams: 'niyams',
  legal: 'sitePages',
  wordle: 'wordleWords',
  crossword: 'miniCrosswordPuzzles',
  onePercent: 'onePercentQuestions',
  connections: 'connectionsPuzzles'
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
