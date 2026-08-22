<template>
  <form
    class="space-y-3 rounded-xl border border-[hsl(var(--primary))]/30 bg-[hsl(var(--golden-50))] p-3"
    @submit.prevent="submit"
  >
    <p v-if="replacing" class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
      Correcting the built-in word <span class="font-mono font-semibold">{{ replacing }}</span>.
      The generated word bank is left alone — this saves an override the games use instead.
    </p>

    <div class="grid gap-3 sm:grid-cols-3">
      <div>
        <label class="admin-label" :for="`${uid}-display`">Word or phrase</label>
        <input
          :id="`${uid}-display`"
          ref="firstField"
          v-model="local.display"
          required
          maxlength="40"
          autocomplete="off"
          autocapitalize="words"
          autocorrect="off"
          spellcheck="false"
          class="admin-input min-h-11 sm:min-h-0"
        >
      </div>
      <div class="sm:col-span-2">
        <label class="admin-label" :for="`${uid}-clue`">Crossword clue</label>
        <textarea
          :id="`${uid}-clue`"
          v-model="local.clue"
          required
          maxlength="160"
          rows="2"
          class="admin-input resize-y"
        />
      </div>
      <div>
        <label class="admin-label" :for="`${uid}-category`">Category</label>
        <input
          :id="`${uid}-category`"
          v-model="local.category"
          required
          maxlength="40"
          :list="`${uid}-categories`"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          class="admin-input min-h-11 sm:min-h-0"
        >
        <datalist :id="`${uid}-categories`">
          <option v-for="item in categories" :key="item" :value="item" />
        </datalist>
      </div>
      <div class="sm:col-span-2">
        <label class="admin-label">Game compatibility</label>
        <div class="flex min-h-11 flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs">
          <span class="font-mono font-semibold">{{ previewAnswer || '—' }}</span>
          <span
            v-for="target in previewGames"
            :key="target"
            class="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 font-semibold"
          >
            {{ gameLabel(target) }}
          </span>
          <span v-if="previewAnswer && !previewGames.length" class="text-amber-700">
            Reference only — incompatible length or letters
          </span>
        </div>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div class="flex flex-wrap gap-2">
      <button type="submit" class="admin-btn min-h-11 sm:min-h-0" :disabled="saving">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
      <button type="button" class="admin-btn-secondary min-h-11 sm:min-h-0" @click="$emit('cancel')">
        Cancel
      </button>
      <button
        v-if="canReset"
        type="button"
        class="admin-btn-secondary min-h-11 text-amber-700 sm:min-h-0"
        :disabled="saving"
        @click="$emit('reset')"
      >
        Reset to built-in
      </button>
      <button
        v-else-if="canDelete"
        type="button"
        class="admin-btn-danger min-h-11 sm:min-h-0"
        :disabled="saving"
        @click="$emit('delete')"
      >
        Delete
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { GameWordEntry, GameWordTarget } from '~/types'
import { gameTargetsForAnswer, normalizeGameWord } from '~/utils/gameWordBank'

/**
 * The editor shown in place of a word bank row, so a correction can be made
 * without leaving the list. Owns its draft; the page decides what to persist.
 */
const props = defineProps<{
  entry: GameWordEntry
  /** Answer of the built-in word being superseded, empty for a plain custom word. */
  replacing: string
  categories: string[]
  saving: boolean
  error: string
  canReset: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  save: [{ display: string, clue: string, category: string }]
  cancel: []
  reset: []
  delete: []
}>()

const uid = useId()
const firstField = ref<HTMLInputElement | null>(null)
const local = reactive({
  display: props.entry.display,
  clue: props.entry.clue,
  category: props.entry.category
})

const previewAnswer = computed(() => normalizeGameWord(local.display))
const previewGames = computed(() => gameTargetsForAnswer(previewAnswer.value))

function gameLabel(target: GameWordTarget) {
  return target[0].toUpperCase() + target.slice(1)
}

function submit() {
  emit('save', {
    display: local.display.trim(),
    clue: local.clue.trim(),
    category: local.category.trim()
  })
}

// The row is replaced by this editor, so focus has to be placed deliberately
// or a phone keyboard never opens and the list just appears to shift.
onMounted(() => firstField.value?.focus())
</script>
