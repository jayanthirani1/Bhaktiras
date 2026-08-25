<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-3xl mx-auto">
      <PageHeader
        title="Games"
        subtitle="Wordle and Crossword are live. More games unlock on the 29th of each month."
      />

      <section
        v-if="isLoggedIn"
        class="mx-auto mt-8 max-w-xl overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-[0_12px_35px_-20px_rgba(234,88,12,0.45)]"
      >
        <div class="flex items-center gap-4 p-5">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-50 to-orange-100 ring-1 ring-orange-200">
            <FlameIcon class="h-9 w-9" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Your streak</p>
            <p class="mt-1 font-display text-3xl font-bold text-[hsl(var(--primary))]">
              {{ streak?.currentStreak ?? (streakLoading ? '…' : 1) }}
              <span class="font-sans text-sm font-semibold text-[hsl(var(--muted-foreground))]">
                day{{ streak?.currentStreak === 1 ? '' : 's' }}
              </span>
            </p>
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Play a game every day to keep it alive.</p>
          </div>
        </div>
        <NuxtLink
          to="/play/streaks"
          class="flex items-center justify-between border-t border-orange-200/70 bg-white/55 px-5 py-3 text-sm font-semibold text-[hsl(var(--primary))] hover:bg-white/80"
        >
          View streak leaderboard
          <IconArrowRight class="h-4 w-4" />
        </NuxtLink>
        <NuxtLink
          to="/play/achievements"
          class="flex items-center justify-between border-t border-orange-200/70 bg-white/55 px-5 py-3 text-sm font-semibold text-[hsl(var(--primary))] hover:bg-white/80"
        >
          View achievements
          <IconArrowRight class="h-4 w-4" />
        </NuxtLink>
      </section>
      <p v-else class="mt-7 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <NuxtLink to="/login?redirect=/play" class="font-semibold text-[hsl(var(--golden-900))] underline">Sign in</NuxtLink>
        to start a daily Games streak.
      </p>

      <ul class="mt-10 divide-y divide-[hsl(var(--golden-200))] overflow-hidden rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--card))] shadow-[0_18px_40px_-32px_rgba(59,32,97,0.55)]">
        <li v-for="game in games" :key="game.slug">
          <NuxtLink
            v-if="isLive(game.slug)"
            :to="game.href"
            class="flex items-center gap-3 px-3 py-4 transition-colors hover:bg-[hsl(var(--golden-50))] active:bg-[hsl(var(--golden-100))] sm:gap-4 sm:px-5"
            :class="done[game.slug] ? 'bg-emerald-50/60 hover:bg-emerald-50' : ''"
          >
            <div
              class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-sm ring-1 ring-[hsl(var(--golden-200))] sm:h-16 sm:w-16"
              :class="game.tile"
            >
              <component :is="game.icon" class="h-7 w-7 sm:h-8 sm:w-8" stroke-width="1.9" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 class="font-display text-base font-bold text-[hsl(var(--primary))] sm:text-lg">
                  <RasRaniTitle v-if="game.slug === 'ras-rani'" honey />
                  <template v-else>{{ game.title }}</template>
                </h3>
                <span
                  v-if="done[game.slug]"
                  class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"
                >
                  <IconCheck class="h-3 w-3" stroke-width="3" />
                  Done today
                </span>
              </div>
              <p class="mt-0.5 line-clamp-2 text-sm leading-snug text-[hsl(var(--muted-foreground))]">
                {{ game.description }}
              </p>
              <p
                v-if="done[game.slug]"
                class="mt-1.5 text-xs font-semibold text-emerald-700"
              >
                {{ resultLine(game.slug) }}
              </p>
            </div>

            <span
              class="shrink-0 rounded-full px-4 py-2 text-sm font-bold shadow-sm sm:px-5"
              :class="done[game.slug] ? 'bg-emerald-700 text-white' : game.button"
            >
              {{ done[game.slug] ? 'Results' : 'Play' }}
            </span>
          </NuxtLink>

          <div
            v-else
            class="flex cursor-default items-center gap-3 bg-zinc-100/80 px-3 py-4 grayscale sm:gap-4 sm:px-5"
            aria-disabled="true"
          >
            <div
              class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-zinc-200 text-zinc-500 shadow-sm sm:h-16 sm:w-16"
            >
              <component :is="game.icon" class="h-7 w-7 sm:h-8 sm:w-8" stroke-width="1.9" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-display text-base font-bold text-zinc-600 sm:text-lg">
                <RasRaniTitle v-if="game.slug === 'ras-rani'" honey />
                <template v-else>{{ game.title }}</template>
              </h3>
              <p class="mt-0.5 line-clamp-2 text-sm leading-snug text-zinc-500">
                {{ game.description }}
              </p>
              <p class="mt-1.5 text-xs font-semibold text-zinc-500">
                Opens {{ unlockLabel(game.slug) }}
              </p>
            </div>
            <span class="shrink-0 rounded-full bg-zinc-300 px-3 py-2 text-center text-xs font-bold tabular-nums text-zinc-700 sm:px-4 sm:text-sm">
              {{ countdownLabel(game.slug) }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  IconGrid3x3,
  IconTypography,
  IconChartBar,
  IconArrowRight,
  IconCheck,
  IconCirclesRelation,
  IconBrackets,
  IconSun
} from '@tabler/icons-vue'
import NectarIcon from '~/components/NectarIcon.vue'

import type { PlayGameSlug } from '~/utils/playCompletion'
import {
  formatUnlockCountdown,
  formatUnlockLabel,
  gameUnlockDateId,
  isGameLive,
  londonMidnightMs
} from '~/utils/gameRelease'

const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const { record: streak, recording: streakLoading } = usePlayStreak()

const games: Array<{
  slug: PlayGameSlug
  title: string
  description: string
  icon: Component
  href: string
  /** Icon tile colours, mirrored by the call-to-action pill. */
  tile: string
  button: string
}> = [
  { slug: 'wordle', title: 'Wordle', description: 'Guess the word in six tries — the timer pauses if you leave.', icon: IconTypography, href: '/play/wordle', tile: 'bg-emerald-100 text-emerald-700', button: 'bg-emerald-700 text-white' },
  { slug: 'mini-crossword', title: 'Crossword', description: 'A quick Telegraph-style grid. Beat the clock.', icon: IconGrid3x3, href: '/play/crossword', tile: 'bg-sky-100 text-sky-700', button: 'bg-sky-700 text-white' },
  { slug: 'one-percent', title: '1% Club', description: 'Daily Vachnamrut climb from 90% to 1%. One wrong answer ends your run.', icon: IconChartBar, href: '/play/one-percent', tile: 'bg-orange-100 text-orange-700', button: 'bg-orange-800 text-white' },
  { slug: 'connections', title: 'Connections', description: 'Find four groups of four satsang-related words.', icon: IconCirclesRelation, href: '/play/connections', tile: 'bg-fuchsia-100 text-fuchsia-700', button: 'bg-fuchsia-600 text-white' },
  { slug: 'bracket-city', title: 'Bracket City', description: 'Clues nested inside clues. Solve the innermost one first.', icon: IconBrackets, href: '/play/bracket-city', tile: 'bg-indigo-100 text-indigo-700', button: 'bg-indigo-600 text-white' },
  { slug: 'bhakti-marg', title: 'Surya Chandra', description: 'Suns and moons on a 6×6 grid. Three of each per row and column, never three in a line.', icon: IconSun, href: '/play/surya-chandra', tile: 'bg-amber-100 text-amber-800', button: 'bg-amber-600 text-white' },
  { slug: 'ras-rani', title: 'Ras Rani 🍯', description: 'One nectar drop per row, column and colour. Tap once for a grey nectar mark, twice for a drop.', icon: NectarIcon, href: '/play/ras-rani', tile: 'bg-amber-100 text-amber-700', button: 'bg-amber-700 text-white' },
]

const { done, results } = usePlayCompletion(games.map(g => g.slug))

const nowMs = ref(Date.now())

onMounted(() => {
  const tick = window.setInterval(() => {
    nowMs.value = Date.now()
  }, 15_000)
  onUnmounted(() => window.clearInterval(tick))
})

function isLive(slug: PlayGameSlug) {
  return isGameLive(slug)
}

function unlockLabel(slug: PlayGameSlug) {
  const dateId = gameUnlockDateId(slug)
  return dateId ? formatUnlockLabel(dateId) : ''
}

function countdownLabel(slug: PlayGameSlug) {
  const dateId = gameUnlockDateId(slug)
  if (!dateId) return ''
  return formatUnlockCountdown(londonMidnightMs(dateId) - nowMs.value)
}

function formatTime(ms: number) {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** What the player scored today, falling back to a nudge to return tomorrow. */
function resultLine(slug: PlayGameSlug) {
  const entry = results.value[slug]
  const parts: string[] = []
  if (entry?.detail) parts.push(entry.detail)
  else if (typeof entry?.score === 'number') parts.push(`Scored ${entry.score}`)
  if (typeof entry?.timeMs === 'number') parts.push(formatTime(entry.timeMs))
  return parts.length ? parts.join(' · ') : 'Come back tomorrow for a new challenge'
}
</script>
