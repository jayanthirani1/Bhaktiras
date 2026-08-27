<template>
  <div class="relative mx-auto aspect-square w-[13.5rem]">
    <svg viewBox="0 0 200 200" class="h-full w-full" aria-hidden="true" focusable="false">
      <circle
        v-for="bead in beads"
        :key="bead.i"
        :cx="bead.x"
        :cy="bead.y"
        :r="bead.filled ? 3.8 : 3"
        :class="bead.filled ? 'fill-[hsl(var(--golden-500))]' : 'fill-[hsl(var(--muted))]'"
      />
      <!-- Sumeru, the bead you never cross. -->
      <circle cx="100" cy="14" r="6.5" class="fill-[hsl(var(--primary))]" />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ total: number; target: number }>()

const BEADS = 108
const RADIUS = 86

/** One bead per 1/108th of the goal — the mala the sangat is turning together. */
const filledCount = computed(() => {
  if (props.total <= 0 || props.target <= 0) return 0
  return Math.min(BEADS, Math.max(1, Math.floor((props.total / props.target) * BEADS)))
})

const beads = computed(() =>
  Array.from({ length: BEADS }, (_, i) => {
    const angle = (-90 + ((i + 0.5) * 360) / BEADS) * (Math.PI / 180)
    return {
      i,
      x: 100 + RADIUS * Math.cos(angle),
      y: 100 + RADIUS * Math.sin(angle),
      filled: i < filledCount.value
    }
  })
)
</script>
