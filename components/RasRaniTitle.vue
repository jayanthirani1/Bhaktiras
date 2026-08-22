<template>
  <span class="inline-flex items-end justify-center gap-[0.18em] font-display font-bold leading-none">
    <span class="sr-only">Ras </span>
    <RasWordmark class="h-[1.12em] w-auto shrink-0" />
    <span class="pb-[0.26em]">Rani</span>
    <span v-if="honey" class="pb-[0.22em] text-[0.72em] leading-none" aria-hidden="true">🍯</span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  honey?: boolean
}>(), {
  honey: false
})
</script>
