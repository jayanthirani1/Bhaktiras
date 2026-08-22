<template>
  <figure class="m-0">
    <figcaption class="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
      {{ caption }}
    </figcaption>
    <!-- One measure across comparable items, so one hue. A categorical palette
         here would imply the categories differ in kind, and bury the comparison. -->
    <ul class="mt-2 space-y-2">
      <li v-for="row in rows" :key="row.label" class="grid grid-cols-[minmax(4.5rem,auto)_1fr_auto] items-center gap-3">
        <span class="truncate text-sm text-[hsl(var(--foreground))]">{{ row.label }}</span>
        <span class="h-2.5 w-full rounded-full bg-[hsl(var(--primary)/0.10)]">
          <span
            class="block h-full rounded-r-[4px] bg-[hsl(var(--primary))]"
            :style="{ width: widthOf(row.value) }"
          />
        </span>
        <span class="text-sm font-semibold tabular-nums text-[hsl(var(--foreground))]">{{ row.value }}</span>
      </li>
    </ul>
  </figure>
</template>

<script setup lang="ts">
const props = defineProps<{
  caption: string
  rows: Array<{ label: string; value: number }>
}>()

const max = computed(() => Math.max(1, ...props.rows.map(row => row.value)))

/** Scaled to the largest bar, with a visible stub so a value of 1 still reads. */
function widthOf(value: number) {
  if (!value) return '0%'
  return `${Math.max(4, (value / max.value) * 100)}%`
}
</script>
