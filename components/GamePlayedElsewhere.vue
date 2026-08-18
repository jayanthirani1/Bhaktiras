<template>
  <div class="card-surface space-y-3 p-6 text-center">
    <p class="font-display text-xl font-semibold text-emerald-700">
      You already played today’s {{ title }}
    </p>
    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      This result synced from another device{{ summary ? ` — ${summary}` : '' }}.
    </p>
    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      Come back tomorrow for a new challenge.
    </p>
    <NuxtLink
      to="/play"
      class="inline-block rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
    >
      Back to Games
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; summary?: string }>()
</script>
