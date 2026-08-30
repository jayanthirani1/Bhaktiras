<template>
  <div class="mt-12">
    <h3 class="text-lg font-bold text-[hsl(var(--primary))] mb-1">
      {{ allTime ? 'All-time top 10' : 'Today’s top 10' }}
    </h3>
    <p class="text-sm text-[hsl(var(--muted-foreground))] mb-1">
      <template v-if="allTime">Best scores ever. Anyone can view.</template>
      <template v-else>Resets every day ({{ dateLabel }}). Anyone can view.</template>
    </p>
    <p v-if="rulesText" class="text-sm text-[hsl(var(--muted-foreground))] mb-3">
      {{ rulesText }}
      <slot />
    </p>
    <p v-else-if="$slots.default" class="text-sm text-[hsl(var(--muted-foreground))] mb-3">
      <slot />
    </p>
    <div v-if="loading" class="text-sm text-[hsl(var(--muted-foreground))]">Loading...</div>
    <ul
      v-else
      class="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--golden-200))] overflow-hidden divide-y divide-[hsl(var(--border))]"
    >
      <li
        v-for="row in visibleRows"
        :key="row.entry.id"
        class="flex items-center justify-between px-4 py-2 text-sm"
        :class="row.mine ? 'bg-[hsl(var(--golden-50))]' : ''"
      >
        <span class="font-medium text-[hsl(var(--foreground))]">
          {{ row.rank }}. {{ row.entry.userName }}
          <span v-if="row.mine" class="ml-1 text-xs font-semibold text-[hsl(var(--golden-900))]">you</span>
        </span>
        <span class="text-[hsl(var(--muted-foreground))]">{{ displayScore(row.entry) }}</span>
      </li>
      <li
        v-if="entries.length === 0"
        class="px-4 py-6 text-center text-[hsl(var(--muted-foreground))] text-sm"
      >
        {{ allTime ? 'No scores yet. Play and sign in to appear here!' : 'No scores yet today. Play and sign in to appear here!' }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { formatUkDateLabel, ukDateId } from '~/utils/gameDay'
import { leaderboardRulesText } from '~/utils/gameLeaderboardRules'
import type { GameLeaderboardId } from '~/types'

const LEADERBOARD_TOP = 10

type LeaderboardRow = {
  id: string
  userId?: string
  userName: string
  score?: number
  guesses?: number
  timeMs?: number
  detail?: string
}

const props = defineProps<{
  entries: LeaderboardRow[]
  loading?: boolean
  dateId?: string
  allTime?: boolean
  currentUserId?: string
  formatScore?: (entry: LeaderboardRow) => string
  game?: GameLeaderboardId
  /** Override the default ranking blurb for this game. */
  rules?: string
}>()

const dateLabel = computed(() => formatUkDateLabel(props.dateId || ukDateId()))

const rulesText = computed(() => {
  if (props.rules != null) return props.rules
  if (props.game) return leaderboardRulesText(props.game)
  return ''
})

const visibleRows = computed(() => {
  const list = props.entries || []
  const top = list.slice(0, LEADERBOARD_TOP).map((entry, idx) => ({
    entry,
    rank: idx + 1,
    mine: !!props.currentUserId && entry.userId === props.currentUserId
  }))
  if (!props.currentUserId) return top
  if (top.some(r => r.mine)) return top
  const idx = list.findIndex(e => e.userId === props.currentUserId)
  if (idx < 0) return top
  return [...top, { entry: list[idx], rank: idx + 1, mine: true }]
})

function displayScore(entry: LeaderboardRow) {
  if (props.formatScore) return props.formatScore(entry)
  if (entry.guesses != null) return `${entry.guesses}/6`
  return String(entry.score ?? '')
}
</script>
