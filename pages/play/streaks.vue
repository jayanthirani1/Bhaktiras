<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <NuxtLink
        to="/play"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        ← Back to games
      </NuxtLink>

      <PageHeader
        title="Streaks"
        subtitle="Play any game each day to keep your flame alive."
      />

      <div v-if="longestCrown" class="mb-6 rounded-2xl border border-orange-200 bg-orange-50/80 p-4">
        <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
          <IconCrown class="h-4 w-4" />
          Monthly longest streak crown
        </p>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          <NuxtLink
            v-if="longestCrown.holderUserId"
            :to="`/devotee/${longestCrown.holderUserId}`"
            class="font-semibold text-[hsl(var(--primary))] hover:underline"
          >
            {{ longestCrown.holderName }}
          </NuxtLink>
          <span v-else class="font-semibold text-[hsl(var(--primary))]">{{ longestCrown.holderName }}</span>
          · {{ longestCrown.longestStreak || longestCrown.value }} day{{ (longestCrown.longestStreak || longestCrown.value) === 1 ? '' : 's' }}
          <span v-if="longestCrown.holderUserId === auth.user.value?.uid" class="font-semibold text-amber-700"> · You hold the crown</span>
        </p>
      </div>

      <div v-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading streaks…
      </div>
      <p v-else-if="error" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ error }}</p>
      <div v-else class="overflow-hidden rounded-2xl border border-[hsl(var(--golden-200))] bg-white">
        <div class="grid grid-cols-[3rem_1fr_auto] gap-3 bg-[hsl(var(--golden-50))] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          <span>Rank</span>
          <span>Devotee</span>
          <span>Streak</span>
        </div>
        <ol class="divide-y divide-[hsl(var(--border))]">
          <li
            v-for="(entry, index) in pageEntries"
            :key="entry.id"
            class="grid grid-cols-[3rem_1fr_auto] items-center gap-3 px-4 py-3"
            :class="entry.userId === auth.user.value?.uid ? 'bg-orange-50' : ''"
          >
            <span class="font-display text-lg font-bold text-[hsl(var(--primary))]">
              {{ rankFor(index) }}
            </span>
            <span class="min-w-0">
              <span class="block truncate font-semibold text-[hsl(var(--foreground))]">
                <NuxtLink
                  v-if="entry.userId"
                  :to="`/devotee/${entry.userId}`"
                  class="hover:underline"
                >
                  {{ entry.userName }}
                </NuxtLink>
                <template v-else>{{ entry.userName }}</template>
                <span v-if="entry.userId === auth.user.value?.uid" class="text-xs text-[hsl(var(--golden-900))]"> you</span>
              </span>
              <span class="text-xs text-[hsl(var(--muted-foreground))]">Best: {{ entry.longestStreak }} days</span>
            </span>
            <span class="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 font-bold text-orange-700">
              <FlameIcon class="h-4 w-4" />
              {{ entry.currentStreak }}
            </span>
          </li>
          <li v-if="!entries.length" class="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            No streaks yet. Sign in and play a game to light the first flame!
          </li>
        </ol>

        <div
          v-if="pageCount > 1"
          class="flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--golden-50))]/60 px-4 py-3"
        >
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm font-semibold text-[hsl(var(--primary))] transition-colors hover:bg-white disabled:opacity-40"
            :disabled="page <= 1"
            @click="setPage(page - 1)"
          >
            Previous
          </button>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">
            Page {{ page }} of {{ pageCount }}
          </p>
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm font-semibold text-[hsl(var(--primary))] transition-colors hover:bg-white disabled:opacity-40"
            :disabled="page >= pageCount"
            @click="setPage(page + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <p class="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
        Current streaks reset after a full missed day. Your personal best remains recorded.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconCrown } from '@tabler/icons-vue'
import { STREAK_PAGE_SIZE } from '~/composables/usePlayStreak'

const auth = useAuth()
const { entries, pageEntries, page, pageCount, loading, error, setPage } = usePlayStreakLeaderboard()
const achievements = useAchievements()
const longestCrown = computed(() => achievements.crowns.value.find(crown => crown.id === 'streak-longest') || null)

function rankFor(indexOnPage: number) {
  return (page.value - 1) * STREAK_PAGE_SIZE + indexOnPage + 1
}

useHead({ title: 'Games Streaks · Bhaktiras' })
</script>
