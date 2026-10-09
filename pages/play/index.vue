<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-3xl mx-auto">
      <PageHeader
        title="Games"
        subtitle="Daily puzzles to test your satsang knowledge."
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
        <div
          v-if="restartNotice"
          class="border-t border-orange-200/70 bg-white/70 px-5 py-3"
          role="status"
        >
          <p class="text-sm leading-snug text-[hsl(var(--primary))]">
            Your {{ restartNotice.previousStreak }}-day streak ended after a missed day. It has restarted from day 1 — keep going!
          </p>
          <button
            type="button"
            class="mt-2 text-xs font-semibold text-orange-800 underline underline-offset-2 hover:text-orange-950"
            @click="dismissRestartNotice"
          >
            Got it
          </button>
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

      <ul class="mt-10 divide-y divide-[hsl(var(--golden-200))] overflow-hidden rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--card))] shadow-[0_18px_40px_-32px_rgba(61,0,102,0.55)]">
        <li v-for="game in games" :key="game.slug">
          <NuxtLink
            v-if="isLocked(game.slug)"
            :to="isLoggedIn ? '/niyams' : '/login?redirect=/play'"
            class="flex items-center gap-3 bg-slate-50 px-3 py-4 transition-colors hover:bg-slate-100 sm:gap-4 sm:px-5"
          >
            <div class="relative shrink-0">
              <div class="grid h-14 w-14 place-items-center rounded-2xl bg-slate-200 text-slate-500 shadow-sm ring-1 ring-slate-300 sm:h-16 sm:w-16">
                <component :is="game.icon" class="h-7 w-7 sm:h-8 sm:w-8" stroke-width="1.9" />
              </div>
              <span class="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white text-slate-600 shadow ring-1 ring-slate-300">
                <IconLock class="h-3.5 w-3.5" stroke-width="2.5" />
              </span>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 class="font-display text-base font-bold text-slate-500 sm:text-lg">{{ game.title }}</h3>
                <span class="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Locked
                </span>
              </div>
              <p class="mt-0.5 text-sm leading-snug text-slate-600">
                Log your Daily Darshan on {{ LANKA_LEAP_UNLOCK_DAYS }} different days from {{ LANKA_LEAP_UNLOCK_FROM_LABEL }} to unlock.
              </p>
              <div v-if="isLoggedIn" class="mt-2 flex items-center gap-2">
                <div class="h-1.5 max-w-40 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div class="h-full rounded-full bg-amber-500" :style="{ width: `${lankaUnlockPercent}%` }" />
                </div>
                <span class="text-xs font-semibold tabular-nums text-slate-600">{{ lankaDaysShown }} of {{ LANKA_LEAP_UNLOCK_DAYS }} days</span>
              </div>
              <p v-else class="mt-1 text-xs font-semibold text-slate-600">Sign in so your darshan days count.</p>
            </div>

            <span class="shrink-0 rounded-full bg-slate-600 px-4 py-2 text-sm font-bold text-white shadow-sm sm:px-5">
              {{ isLoggedIn ? 'Log darshan' : 'Sign in' }}
            </span>
          </NuxtLink>
          <NuxtLink
            v-else
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
  IconLock,
  IconSun,
  IconWind
} from '@tabler/icons-vue'
import NectarIcon from '~/components/NectarIcon.vue'
import { LANKA_LEAP_UNLOCK_DAYS, LANKA_LEAP_UNLOCK_FROM_LABEL } from '~/composables/useLankaLeapUnlock'

import type { PlayGameSlug } from '~/utils/playCompletion'

const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const { record: streak, recording: streakLoading, restartNotice, dismissRestartNotice } = usePlayStreak()

const allGames: Array<{
  slug: PlayGameSlug
  title: string
  description: string
  icon: Component
  href: string
  /** Icon tile colours, mirrored by the call-to-action pill. */
  tile: string
  button: string
  /** Prototype: listed only on the test site and in local dev. */
  testOnly?: boolean
}> = [
  { slug: 'wordle', title: 'Wordle', description: 'Guess the word in six tries — the timer pauses if you leave.', icon: IconTypography, href: '/play/wordle', tile: 'bg-emerald-100 text-emerald-700', button: 'bg-emerald-700 text-white' },
  { slug: 'mini-crossword', title: 'Crossword', description: 'A quick Telegraph-style grid. Beat the clock.', icon: IconGrid3x3, href: '/play/crossword', tile: 'bg-sky-100 text-sky-700', button: 'bg-sky-700 text-white' },
  { slug: 'one-percent', title: '1% Club', description: 'Daily Vachnamrut climb from 90% to 1%. One wrong answer ends your run.', icon: IconChartBar, href: '/play/one-percent', tile: 'bg-orange-100 text-orange-700', button: 'bg-orange-800 text-white' },
  { slug: 'connections', title: 'Connections', description: 'Find four groups of four satsang-related words.', icon: IconCirclesRelation, href: '/play/connections', tile: 'bg-fuchsia-100 text-fuchsia-700', button: 'bg-fuchsia-600 text-white' },
  { slug: 'surya-chandra', title: 'Surya Chandra', description: 'Suns and moons on a 6×6 grid. Three of each per row and column, never three in a line.', icon: IconSun, href: '/play/surya-chandra', tile: 'bg-amber-100 text-amber-800', button: 'bg-amber-600 text-white' },
  { slug: 'ras-rani', title: 'Ras Rani 🍯', description: 'One nectar drop per row, column and colour. Easy 7×7, Medium 8–9×9 and Difficult 10–11×11 rotate daily.', icon: NectarIcon, href: '/play/ras-rani', tile: 'bg-amber-100 text-amber-700', button: 'bg-amber-700 text-white' },
  { slug: 'lanka-leap', title: 'Lanka Leap', description: 'Leap across the ocean with Hanumanji. Get past Surasa and Simhika and reach Lanka.', icon: IconWind, href: '/play/lanka-leap', tile: 'bg-sky-100 text-sky-700', button: 'bg-sky-700 text-white', testOnly: true },
]
const games = allGames.filter(game => !game.testOnly || showPrototypeGames())

const { done, results } = usePlayCompletion(games.map(g => g.slug))

const lankaUnlock = games.some(g => g.slug === 'lanka-leap') ? useLankaLeapUnlock() : null
const lankaDaysShown = computed(() => Math.min(lankaUnlock?.daysDone.value ?? 0, LANKA_LEAP_UNLOCK_DAYS))
const lankaUnlockPercent = computed(() => (lankaDaysShown.value / LANKA_LEAP_UNLOCK_DAYS) * 100)

/** Stays locked while the check is loading, so the Play button never flashes up first. */
function isLocked(slug: PlayGameSlug) {
  return slug === 'lanka-leap' && !!lankaUnlock && !lankaUnlock.unlocked.value
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

usePageSeo('Games', 'Daily satsang games — Wordle, Crossword, Connections, 1% Club, Surya Chandra and Ras Rani.')
</script>
