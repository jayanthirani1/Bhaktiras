<template>
  <div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
    <p class="font-semibold">Missed day: {{ label }}</p>
    <p class="mt-0.5 text-xs text-amber-900/80">
      Play it for fun. Missed days do not count for the leaderboard, crowns or streaks.
    </p>
    <NuxtLink :to="path" class="mt-2 inline-block text-xs font-semibold text-sky-700 underline">
      Back to today’s puzzle
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; path: string }>()
</script>
