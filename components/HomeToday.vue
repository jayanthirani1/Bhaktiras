<template>
  <section
    v-if="showNiyams || showGames"
    aria-labelledby="home-today-heading"
    class="mx-auto max-w-2xl px-4"
  >
    <div class="mb-3 flex items-baseline justify-between gap-3">
      <h2 id="home-today-heading" class="text-lg">Today</h2>
      <ClientOnly>
        <p v-if="streakDays" class="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))]">
          <FlameIcon class="h-4 w-4" />
          {{ streakDays }}-day streak
        </p>
      </ClientOnly>
    </div>

    <div class="grid gap-3" :class="showNiyams && showGames ? 'sm:grid-cols-2' : ''">
      <NuxtLink v-if="showNiyams" to="/niyams" class="card-surface flex items-center gap-4 p-4">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[hsl(var(--golden-500))] text-[hsl(var(--primary))]">
          <component :is="SITE_ICON_COMPONENTS.niyams" class="h-6 w-6" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-semibold text-[hsl(var(--primary))]">Log a niyam</span>
          <span class="mt-0.5 block text-sm text-[hsl(var(--muted-foreground))]">Add today’s malas, darshan or pranaams.</span>
        </span>
        <IconChevronRight class="h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
      </NuxtLink>

      <NuxtLink v-if="showGames" to="/play" class="card-surface flex items-center gap-4 p-4">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[hsl(var(--golden-500))] text-[hsl(var(--primary))]">
          <component :is="SITE_ICON_COMPONENTS.games" class="h-6 w-6" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-semibold text-[hsl(var(--primary))]">Today’s games</span>
          <span class="mt-0.5 block text-sm tabular-nums text-[hsl(var(--muted-foreground))]">
            <template v-if="doneCount === DAILY_PLAY_GAMES.length">All {{ DAILY_PLAY_GAMES.length }} played — see you tomorrow</template>
            <template v-else-if="doneCount">{{ doneCount }} of {{ DAILY_PLAY_GAMES.length }} played</template>
            <template v-else>{{ DAILY_PLAY_GAMES.length }} new puzzles waiting</template>
          </span>
          <span class="mt-2 grid max-w-[10rem] gap-1" :style="{ gridTemplateColumns: `repeat(${DAILY_PLAY_GAMES.length}, minmax(0, 1fr))` }" aria-hidden="true">
            <span
              v-for="slug in DAILY_PLAY_GAMES"
              :key="slug"
              class="h-1 rounded-full"
              :class="done[slug] ? 'bg-[hsl(var(--golden-500))]' : 'bg-[hsl(var(--muted))]'"
            />
          </span>
        </span>
        <IconChevronRight class="h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IconChevronRight } from '@tabler/icons-vue'
import { SITE_ICON_COMPONENTS } from '~/data/siteContent'
import { ukDateId } from '~/utils/gameDay'
import { DAILY_PLAY_GAMES } from '~/utils/playCompletion'

/**
 * The two things people come back for each day, on the first screen of the
 * homepage. Before this, both sat behind tiles further down the page — Games
 * was the last of seven.
 */
const { isSectionVisible } = useSiteContent()
const showNiyams = computed(() => isSectionVisible('niyams'))
const showGames = computed(() => isSectionVisible('games'))

const { done } = usePlayCompletion(DAILY_PLAY_GAMES)
const doneCount = computed(() => DAILY_PLAY_GAMES.filter(slug => done.value[slug]).length)

/**
 * The streak is only written when someone opens Games, so a record from an
 * earlier day may already be broken. Showing it only once today's visit has
 * been counted keeps the number honest.
 */
const { record } = usePlayStreak()
const streakDays = computed(() =>
  record.value?.lastVisitDate === ukDateId() && record.value.currentStreak >= 2
    ? record.value.currentStreak
    : 0)
</script>
