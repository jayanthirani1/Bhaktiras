<template>
  <section class="mb-5 rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] p-4 sm:p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">Today · {{ dateLabel }}</p>
        <h2 class="mt-1 font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ puzzle.title }}</h2>
        <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          {{ overridden ? 'Admin override is live.' : 'Generated from today’s word bank.' }}
        </p>
      </div>
      <button type="button" class="admin-btn" @click="$emit('edit')">
        {{ overridden ? 'Edit today’s override' : 'Override today' }}
      </button>
    </div>

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <div
        v-for="clue in puzzle.clues"
        :key="`${clue.direction}-${clue.number}-${clue.answer}`"
        class="rounded-xl border border-[hsl(var(--border))] bg-white p-3"
      >
        <p class="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          {{ clue.number }} {{ clue.direction }}
        </p>
        <p class="mt-1 text-sm text-[hsl(var(--foreground))]">{{ clue.clue }}</p>
        <p class="mt-1 font-mono text-sm font-bold tracking-wider text-[hsl(var(--primary))]">{{ clue.answer }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CrosswordPuzzle } from '~/types'

defineProps<{
  puzzle: CrosswordPuzzle
  dateLabel: string
  overridden?: boolean
}>()

defineEmits<{ edit: [] }>()
</script>
