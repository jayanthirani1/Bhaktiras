<template>
  <div
    v-if="intro"
    class="card-surface space-y-4 p-5 text-sm leading-relaxed text-[hsl(var(--muted-foreground))] sm:p-6"
  >
    <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
      How to play
    </p>
    <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">
      {{ title }}
    </h2>
    <div>
      <slot />
    </div>
    <button
      type="button"
      class="w-full rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-white sm:w-auto"
      @click="$emit('start')"
    >
      Start game
    </button>
  </div>
  <details
    v-else
    class="card-surface p-4 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]"
  >
    <summary class="cursor-pointer font-semibold text-[hsl(var(--primary))]">How to play</summary>
    <div class="mt-3">
      <slot />
    </div>
  </details>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  intro?: boolean
  title?: string
}>(), {
  intro: false,
  title: 'Read this once, then the clock starts.'
})

defineEmits<{
  start: []
}>()
</script>
