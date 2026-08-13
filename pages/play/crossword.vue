<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="mx-auto max-w-2xl">
      <NuxtLink
        to="/play"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        ← Back to games
      </NuxtLink>
      <PageHeader title="Crossword" subtitle="Solve devotional-themed clues." />

      <div v-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading puzzles…</div>
      <div v-else-if="!puzzles.length" class="card-surface p-8 text-center text-[hsl(var(--muted-foreground))]">
        Crossword puzzles will appear here once they are added.
      </div>
      <div v-else class="space-y-6">
        <div v-if="puzzles.length > 1" class="flex flex-wrap gap-2">
          <button
            v-for="p in puzzles"
            :key="p.id"
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-semibold"
            :class="active?.id === p.id ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'"
            @click="select(p.id)"
          >
            {{ p.title }}
          </button>
        </div>

        <div v-if="active" class="card-surface p-6">
          <h3 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ active.title }}</h3>
          <div class="mt-6 space-y-4">
            <div v-for="clue in active.clues" :key="`${clue.direction}-${clue.number}`">
              <label class="mb-1 block text-sm font-medium">
                {{ clue.number }} {{ clue.direction }} — {{ clue.clue }}
              </label>
              <input
                v-model="answers[keyFor(clue)]"
                class="w-full rounded-xl border border-[hsl(var(--golden-200))] px-3 py-2 uppercase tracking-widest"
                :class="checked && isCorrect(clue) ? 'border-emerald-500 bg-emerald-50' : checked ? 'border-red-300 bg-red-50' : ''"
                :placeholder="'•'.repeat(clue.answer.length)"
              >
            </div>
          </div>
          <button type="button" class="btn-primary mt-6 text-sm" @click="checked = true">Check answers</button>
          <p v-if="checked" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            {{ correctCount }} / {{ active.clues.length }} correct
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CrosswordClue } from '~/types'

const { puzzles, loading } = useCrosswordPuzzles()
const activeId = ref('')
const answers = reactive<Record<string, string>>({})
const checked = ref(false)

const active = computed(() => puzzles.value.find(p => p.id === activeId.value) || puzzles.value[0] || null)

function keyFor(c: CrosswordClue) {
  return `${c.direction}-${c.number}`
}

function isCorrect(c: CrosswordClue) {
  return (answers[keyFor(c)] || '').replace(/\s/g, '').toUpperCase() === c.answer.toUpperCase()
}

const correctCount = computed(() => active.value?.clues.filter(isCorrect).length || 0)

function select(id: string) {
  activeId.value = id
  checked.value = false
  Object.keys(answers).forEach(k => { delete answers[k] })
}

watch(puzzles, (list) => {
  if (list.length && !activeId.value) activeId.value = list[0].id
}, { immediate: true })
</script>
