<template>
  <div class="flex items-stretch gap-2 rounded-2xl border border-[hsl(var(--border))] bg-white px-2 py-2 shadow-sm">
    <button
      type="button"
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] text-lg font-semibold text-[hsl(var(--primary))] disabled:opacity-40"
      aria-label="Previous clue"
      :disabled="disabled"
      @click="$emit('prev')"
    >
      ‹
    </button>
    <button
      type="button"
      class="min-w-0 flex-1 rounded-xl px-2 py-1 text-left"
      :disabled="disabled"
      @click="$emit('toggle-direction')"
    >
      <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">
        {{ number }} {{ directionLabel }}
      </p>
      <p class="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-[hsl(var(--foreground))]">
        {{ clue || 'Select a square' }}
      </p>
    </button>
    <button
      type="button"
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border))] text-lg font-semibold text-[hsl(var(--primary))] disabled:opacity-40"
      aria-label="Next clue"
      :disabled="disabled"
      @click="$emit('next')"
    >
      ›
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  number?: number | null
  direction?: 'across' | 'down' | null
  clue?: string
  disabled?: boolean
}>()

defineEmits<{
  prev: []
  next: []
  'toggle-direction': []
}>()

const directionLabel = computed(() => {
  if (props.direction === 'down') return 'Down'
  if (props.direction === 'across') return 'Across'
  return ''
})
</script>
