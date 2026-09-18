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
        class="flex items-center justify-between gap-3 px-4 py-2 text-sm"
        :class="row.mine ? 'bg-[hsl(var(--golden-50))]' : ''"
      >
        <span class="flex min-w-0 items-start gap-1.5">
          <span class="shrink-0 tabular-nums font-medium text-[hsl(var(--foreground))]">{{ row.rank }}.</span>
          <span class="min-w-0">
            <span class="flex min-w-0 items-center gap-1.5 font-medium text-[hsl(var(--foreground))]">
              <NuxtLink
                v-if="row.profilePath"
                :to="row.profilePath"
                class="truncate hover:underline"
              >
                {{ row.entry.userName }}
              </NuxtLink>
              <span v-else class="truncate">{{ row.entry.userName }}</span>
              <IconCrown
                v-for="(label, index) in row.crownLabels"
                :key="`${row.entry.id}-crown-${index}`"
                class="crown-sparkle h-3.5 w-3.5 shrink-0 text-amber-600"
                :aria-label="label"
              />
              <span v-if="row.mine" class="shrink-0 text-xs font-semibold text-[hsl(var(--golden-900))]">you</span>
            </span>
            <p
              v-if="row.crownLabels.length"
              class="mt-0.5 truncate text-[11px] leading-tight text-amber-700/90"
            >
              {{ row.crownLabels.join(' · ') }}
            </p>
          </span>
        </span>
        <span class="shrink-0 self-center text-[hsl(var(--muted-foreground))]">{{ displayScore(row.entry) }}</span>
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
import { IconCrown } from '@tabler/icons-vue'
import {
  CROWN_DEFINITIONS,
  crownTitle,
  useAchievements
} from '~/composables/useAchievements'
import { devoteeProfilePath } from '~/composables/usePublicProfile'
import { formatUkDateLabel, ukDateId } from '~/utils/gameDay'
import { leaderboardRulesText } from '~/utils/gameLeaderboardRules'
import type { GameLeaderboardId } from '~/types'

const LEADERBOARD_TOP = 10

/** Crown ids that still use a retired game key for matching holders. */
const CROWN_GAME_ALIASES: Partial<Record<GameLeaderboardId, string>> = {
  'mini-crossword': 'crossword'
}

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

const achievements = useAchievements()

onMounted(() => {
  if (props.game) void achievements.fetchAll()
})

const dateLabel = computed(() => formatUkDateLabel(props.dateId || ukDateId()))

const rulesText = computed(() => {
  if (props.rules != null) return props.rules
  if (props.game) return leaderboardRulesText(props.game)
  return ''
})

/** Crown titles held by each user for this game (order follows CROWN_DEFINITIONS). */
const crownsByUserId = computed(() => {
  const map = new Map<string, string[]>()
  if (!props.game) return map
  const crownGame = CROWN_GAME_ALIASES[props.game] || props.game
  const defs = CROWN_DEFINITIONS.filter(def => def.game === crownGame)
  for (const def of defs) {
    const crown = achievements.crowns.value.find(item => item.id === def.id)
    const uid = crown?.holderUserId
    if (!uid) continue
    const labels = map.get(uid) || []
    labels.push(shortCrownLabel(def.id, def.title))
    map.set(uid, labels)
  }
  return map
})

/** Drop the repeated game name so the line stays short under the player. */
function shortCrownLabel(id: string, title: string) {
  const trimmed = title
    .replace(/\s+Ras Rani$/i, '')
    .replace(/\s+Wordle$/i, '')
    .replace(/\s+Crossword$/i, '')
    .replace(/\s+Connections$/i, '')
    .replace(/\s+Bracket City$/i, '')
    .replace(/\s+1% Club$/i, '')
    .replace(/\s+Surya Chandra$/i, '')
    .trim()
  return trimmed || crownTitle(id)
}

function crownsFor(userId?: string) {
  if (!userId) return [] as string[]
  return crownsByUserId.value.get(userId) || []
}

const visibleRows = computed(() => {
  const list = props.entries || []
  const top = list.slice(0, LEADERBOARD_TOP).map((entry, idx) => ({
    entry,
    rank: idx + 1,
    mine: !!props.currentUserId && entry.userId === props.currentUserId,
    crownLabels: crownsFor(entry.userId),
    profilePath: devoteeProfilePath(entry.userId)
  }))
  if (!props.currentUserId) return top
  if (top.some(r => r.mine)) return top
  const idx = list.findIndex(e => e.userId === props.currentUserId)
  if (idx < 0) return top
  const entry = list[idx]
  return [...top, {
    entry,
    rank: idx + 1,
    mine: true,
    crownLabels: crownsFor(entry.userId),
    profilePath: devoteeProfilePath(entry.userId)
  }]
})

function displayScore(entry: LeaderboardRow) {
  if (props.formatScore) return props.formatScore(entry)
  if (entry.guesses != null) return `${entry.guesses}/6`
  return String(entry.score ?? '')
}
</script>
