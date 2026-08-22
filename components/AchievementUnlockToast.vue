<template>
  <Teleport to="body">
    <div
      v-if="celebration"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-unlock-title"
      @click="dismissCelebration"
    >
      <div
        class="achievement-unlock-card w-full max-w-sm rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-[0_24px_80px_-24px_rgba(56,32,97,0.55)]"
        @click.stop
      >
        <p
          id="achievement-unlock-title"
          class="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]"
        >
          {{ heading }}
        </p>
        <div class="mt-4 flex justify-center gap-2">
          <AchievementMedal
            v-for="item in celebration.achievements"
            :key="item.id"
            class="achievement-medal-pop"
            :medal="item.medal"
            size="lg"
          />
          <span
            v-for="crown in celebration.crowns"
            :key="crown.id"
            class="achievement-medal-pop inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 text-amber-900 shadow-sm"
          >
            <IconCrown class="h-8 w-8" />
          </span>
        </div>
        <ul class="mt-5 space-y-2 text-left">
          <li
            v-for="item in celebration.achievements"
            :key="item.id"
            class="rounded-2xl bg-amber-50 px-3 py-2"
          >
            <p class="text-sm font-semibold text-[hsl(var(--primary))]">{{ item.title }}</p>
            <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ item.description }}</p>
          </li>
          <li
            v-for="crown in celebration.crowns"
            :key="crown.id"
            class="rounded-2xl bg-amber-50 px-3 py-2"
          >
            <p class="text-sm font-semibold text-[hsl(var(--primary))]">{{ crown.title }}</p>
            <p class="text-xs text-[hsl(var(--muted-foreground))]">You claimed this all-time crown.</p>
          </li>
        </ul>
        <button type="button" class="btn-primary mt-5 w-full" @click="dismissCelebration">
          Lovely
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { IconCrown } from '@tabler/icons-vue'

const { celebration, dismissCelebration } = useAchievements()

const heading = computed(() => {
  const hasAchievements = !!celebration.value?.achievements.length
  const hasCrowns = !!celebration.value?.crowns.length
  if (hasAchievements && hasCrowns) return 'New honours'
  if (hasCrowns) return 'Crown claimed'
  return 'Achievement unlocked'
})
</script>
