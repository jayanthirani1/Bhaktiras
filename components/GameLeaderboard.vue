<template>
  <div class="mt-12">
    <h3 class="text-lg font-bold text-[hsl(var(--foreground))] mb-1">Today’s leaderboard</h3>
    <p class="text-sm text-[hsl(var(--muted-foreground))] mb-3">
      Resets every day ({{ dateLabel }}). Anyone can view.
      <slot />
    </p>
    <div v-if="loading" class="text-sm text-[hsl(var(--muted-foreground))]">Loading...</div>
    <ul
      v-else
      class="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--golden-200))] overflow-hidden divide-y divide-[hsl(var(--border))]"
    >
      <li
        v-for="(entry, idx) in entries.slice(0, 10)"
        :key="entry.id"
        class="flex items-center justify-between px-4 py-2 text-sm"
      >
        <span class="font-medium text-[hsl(var(--foreground))]">{{ idx + 1 }}. {{ entry.userName }}</span>
        <span class="text-[hsl(var(--muted-foreground))]">{{ displayScore(entry) }}</span>
      </li>
      <li
        v-if="entries.length === 0"
        class="px-4 py-6 text-center text-[hsl(var(--muted-foreground))] text-sm"
      >
        No scores yet today. Play and sign in to appear here!
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { formatUkDateLabel, ukDateId } from '~/utils/gameDay'

type LeaderboardRow = {
  id: string
  userName: string
  score?: number
  guesses?: number
  detail?: string
}

const props = defineProps<{
  entries: LeaderboardRow[]
  loading?: boolean
  dateId?: string
  formatScore?: (entry: LeaderboardRow) => string
}>()

const dateLabel = computed(() => formatUkDateLabel(props.dateId || ukDateId()))

function displayScore(entry: LeaderboardRow) {
  if (props.formatScore) return props.formatScore(entry)
  if (entry.guesses != null) return `${entry.guesses}/6`
  return String(entry.score ?? '')
}
</script>
