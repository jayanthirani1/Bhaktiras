<template>
  <div class="admin-panel">
    <p class="admin-label mb-0">{{ label }}</p>
    <!-- Proportional figures on purpose: tabular-nums gives every digit the width
         of a zero, which reads loose at this size. Columns of numbers use it; a
         standalone value does not. -->
    <p class="mt-1.5 text-2xl font-semibold leading-none text-[hsl(var(--foreground))]">{{ display }}</p>
    <p v-if="hint" class="mt-1.5 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  value: number | string
  hint?: string
}>()

/** 1,284 rather than 1284; 12.9K once the digits stop being scannable. */
const display = computed(() => {
  if (typeof props.value !== 'number') return props.value
  if (props.value < 10_000) return props.value.toLocaleString('en-GB')
  return `${(props.value / 1000).toFixed(1)}K`
})
</script>
