<template>
  <div class="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-3xl mx-auto">
      <PageHeader
        title="Play"
        subtitle="Choose a game to enjoy—crossword, quiz, wordle, or spelling bee."
      />

      <div class="grid gap-6 sm:grid-cols-1 md:grid-cols-3 mt-10">
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
  IconArrowRight
} from '@tabler/icons-vue'

const games = [
  { slug: 'crossword', title: 'Crossword', description: 'Solve devotional-themed clues and fill the grid.', icon: IconGrid3x3, href: '/play/crossword', color: 'from-amber-500/20 to-amber-600/20 border-amber-200/60 hover:border-amber-400', iconBg: 'bg-amber-100 text-amber-700' },
  { slug: 'quiz', title: 'Devotional Quiz', description: "Test your knowledge about our temple's history and traditions.", icon: IconBrain, href: '/play/quiz', color: 'from-[hsl(var(--primary))]/20 to-amber-600/20 border-[hsl(var(--primary))]/40 hover:border-[hsl(var(--primary))]', iconBg: 'bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]' },
  { slug: 'wordle', title: 'Wordle', description: 'Guess the devotional word in six tries.', icon: IconTypography, href: '/play/wordle', color: 'from-emerald-500/20 to-teal-600/20 border-emerald-200/60 hover:border-emerald-400', iconBg: 'bg-emerald-100 text-emerald-700' },
  { slug: 'spelling-bee', title: 'Spelling Bee', description: 'Make words from the hive. Every word must use the center letter.', icon: IconHexagon, href: '/play/spelling-bee', color: 'from-amber-500/20 to-orange-600/20 border-amber-200/60 hover:border-amber-400', iconBg: 'bg-amber-100 text-amber-700' }
]
</script>
