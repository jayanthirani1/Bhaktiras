<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-3xl mx-auto">
      <PageHeader
        title="Play"
        subtitle="Choose a game — Wordle, Mini Crossword, 1% Club, and more."
      />

      <section
        v-if="isLoggedIn"
        class="mx-auto mt-8 max-w-xl overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-[0_12px_35px_-20px_rgba(234,88,12,0.45)]"
      >
        <div class="flex items-center gap-4 p-5">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200">
            <IconFlame class="h-8 w-8" />
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
      </section>
      <p v-else class="mt-7 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <NuxtLink to="/login?redirect=/play" class="font-semibold text-[hsl(var(--accent))] underline">Sign in</NuxtLink>
        to start a daily Play streak.
      </p>

      <div class="grid gap-6 sm:grid-cols-1 md:grid-cols-2 mt-10">
        <NuxtLink
          v-for="game in games"
          :key="game.slug"
          :to="game.href"
          class="block rounded-2xl border-2 bg-gradient-to-br p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.99]"
          :class="game.color"
        >
          <div
            class="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
            :class="game.iconBg"
          >
            <component :is="game.icon" class="w-7 h-7" />
          </div>
          <h3 class="text-xl font-bold text-[hsl(var(--foreground))] mb-2 font-display">
            {{ game.title }}
          </h3>
          <p class="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed mb-4">
            {{ game.description }}
          </p>
          <span class="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--foreground))]">
            Play
            <IconArrowRight class="w-4 h-4" />
          </span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconGrid3x3,
  IconBrain,
  IconTypography,
  IconHexagon,
  IconChartBar,
  IconLayoutGrid,
  IconFlame,
  IconArrowRight
} from '@tabler/icons-vue'

const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const { record: streak, recording: streakLoading } = usePlayStreak()

const card = 'from-[hsl(var(--primary))]/40 to-[hsl(var(--accent))]/10 border-[hsl(var(--golden-200))] hover:border-[hsl(var(--accent))]'
const icon = 'bg-[hsl(var(--primary))] text-[hsl(var(--accent))]'

const games = [
  { slug: 'wordle', title: 'Wordle', description: 'Guess the word in six tries — timer keeps going if you leave.', icon: IconTypography, href: '/play/wordle', color: card, iconBg: icon },
  { slug: 'mini-crossword', title: 'Mini Crossword', description: 'A quick Telegraph-style mini. Beat the clock.', icon: IconLayoutGrid, href: '/play/mini-crossword', color: card, iconBg: icon },
  { slug: 'one-percent', title: '1% Club', description: 'Climb from 90% to 1%. One wrong answer ends your run.', icon: IconChartBar, href: '/play/one-percent', color: card, iconBg: icon },
  { slug: 'crossword', title: 'Crossword', description: 'Solve the full devotional crossword grid.', icon: IconGrid3x3, href: '/play/crossword', color: card, iconBg: icon },
  { slug: 'quiz', title: 'Devotional Quiz', description: "Test your knowledge about our temple's history and traditions.", icon: IconBrain, href: '/play/quiz', color: card, iconBg: icon },
  { slug: 'spelling-bee', title: 'Spelling Bee', description: 'Make words from the hive. Every word must use the center letter.', icon: IconHexagon, href: '/play/spelling-bee', color: card, iconBg: icon }
]
</script>
