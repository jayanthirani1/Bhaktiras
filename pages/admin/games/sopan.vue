<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <div class="mb-4 flex flex-wrap gap-2">
      <button v-if="!loading && !sorted.length" type="button" class="admin-btn-secondary" :disabled="importing || saving" @click="importDefaults">
        {{ importing ? 'Importing…' : 'Import starter ladders' }}
      </button>
      <NuxtLink to="/play/sopan" class="admin-btn-secondary inline-flex">Open today’s ladder</NuxtLink>
    </div>

    <AdminEditorLayout
      :count-label="`${sorted.length} ladder${sorted.length === 1 ? '' : 's'}`"
      create-label="Add ladder"
      empty-label="No Sopan ladders yet. The game uses the built-in starter set until you add some."
      :loading="loading"
      :empty="!sorted.length"
      @create="openNew"
    >
      <template #list>
        <button
          v-for="item in sorted"
          :key="item.id"
          type="button"
          class="admin-row"
          :class="isEditing && editingId === item.id ? 'admin-row-active' : ''"
          @click="openEdit(item)"
        >
          <p class="text-xs font-semibold text-[hsl(var(--golden-900))]">
            {{ item.dateId || 'Rotating ladder' }}<span v-if="item.published === false"> · Draft</span>
          </p>
          <p class="font-semibold text-[hsl(var(--primary))]">{{ item.title || `${item.top} → ${item.bottom}` }}</p>
          <p class="mt-1 font-mono text-sm tracking-wide text-[hsl(var(--muted-foreground))]">
            {{ [item.top, ...(item.rungs || []).map(rung => rung.word), item.bottom].join(' · ') }}
          </p>
        </button>
      </template>

      <template #form>
        <form v-if="showForm" class="space-y-5" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ isEditing ? 'Edit ladder' : 'New ladder' }}</h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">Delete</button>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="admin-label">Title <span class="font-normal">(admin only)</span></label>
              <input v-model="form.title" maxlength="60" class="admin-input" placeholder="Aarti">
            </div>
            <div>
              <label class="admin-label">Scheduled date <span class="font-normal">(optional)</span></label>
              <input v-model="form.dateId" type="date" class="admin-input">
            </div>
          </div>
          <p class="-mt-3 text-xs text-[hsl(var(--muted-foreground))]">Leave the date empty to include this ladder in the daily rotation.</p>

          <fieldset class="rounded-xl border border-[hsl(var(--border))] p-4">
            <legend class="px-2 text-sm font-bold text-[hsl(var(--primary))]">Ladder, top to bottom</legend>
            <p class="mb-3 text-xs text-[hsl(var(--muted-foreground))]">
              Four-letter words. Each word must change exactly one letter from the one above it.
              The clues are satsang content: anything they say about the shastras must hold for the Bhuj texts.
            </p>

            <div class="space-y-2">
              <div class="grid grid-cols-[5.5rem_1fr] items-start gap-2">
                <div>
                  <label class="admin-label">Top</label>
                  <input :value="form.top" required class="admin-input font-mono uppercase tracking-widest" maxlength="4" @input="form.top = clean($event)">
                </div>
                <p class="pt-7 text-xs text-[hsl(var(--muted-foreground))]">Locked until the middle is in order. Shares the clue below with the bottom word.</p>
              </div>

              <div v-for="(rung, index) in form.rungs" :key="index" class="grid grid-cols-[5.5rem_1fr] items-start gap-2">
                <div>
                  <label class="admin-label">Rung {{ index + 1 }}</label>
                  <input :value="rung.word" required class="admin-input font-mono uppercase tracking-widest" maxlength="4" @input="rung.word = clean($event)">
                </div>
                <div>
                  <label class="admin-label">Clue</label>
                  <input v-model="rung.clue" required maxlength="120" class="admin-input" placeholder="What the player solves for">
                </div>
              </div>

              <div class="grid grid-cols-[5.5rem_1fr] items-start gap-2">
                <div>
                  <label class="admin-label">Bottom</label>
                  <input :value="form.bottom" required class="admin-input font-mono uppercase tracking-widest" maxlength="4" @input="form.bottom = clean($event)">
                </div>
                <div>
                  <label class="admin-label">Top & bottom clue</label>
                  <input v-model="form.endsClue" required maxlength="160" class="admin-input" placeholder="At aarti, one is lit and the other is rung">
                </div>
              </div>
            </div>
          </fieldset>

          <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-4">
            <p class="admin-label">Ladder check</p>
            <ol class="mt-2 space-y-1">
              <li v-for="(word, index) in ladderPreview" :key="index" class="flex items-center gap-3">
                <span class="w-5 text-right text-xs text-[hsl(var(--muted-foreground))]">{{ index + 1 }}</span>
                <span class="flex gap-1 font-mono text-base font-bold">
                  <span
                    v-for="n in 4"
                    :key="n"
                    class="flex h-7 w-7 items-center justify-center rounded border"
                    :class="previewLetterClass(index, n - 1)"
                  >{{ word[n - 1] || '' }}</span>
                </span>
                <span v-if="index > 0" class="text-xs font-semibold" :class="stepOk(index) ? 'text-emerald-700' : 'text-red-600'">
                  {{ stepOk(index) ? 'one letter ✓' : 'not one step' }}
                </span>
              </li>
            </ol>
            <ul v-if="problems.length" class="mt-3 list-disc space-y-0.5 pl-5 text-sm text-red-700">
              <li v-for="problem in problems" :key="problem">{{ problem }}</li>
            </ul>
            <p v-else class="mt-3 text-sm font-semibold text-emerald-700">Ladder is playable.</p>
          </div>

          <label class="flex items-center gap-2 text-sm font-semibold">
            <input v-model="form.published" type="checkbox" class="h-4 w-4 rounded">
            Published
          </label>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving || problems.length > 0">{{ saving ? 'Saving…' : 'Save ladder' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a ladder to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { SopanPuzzle, SopanRung } from '~/types'
import { DEFAULT_SOPAN_PUZZLES } from '~/data/sopanPuzzles'
import {
  changedLetterIndex,
  normalizeSopanWord,
  oneLetterApart,
  SOPAN_RUNG_COUNT,
  validateSopanPuzzle
} from '~/utils/sopan'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, setItem, updateItem, remove } = useAdminSopan()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const importing = ref(false)

function emptyRungs(): SopanRung[] {
  return Array.from({ length: SOPAN_RUNG_COUNT }, () => ({ word: '', clue: '' }))
}

const form = reactive({
  title: '',
  dateId: '',
  top: '',
  bottom: '',
  endsClue: '',
  rungs: emptyRungs(),
  published: true
})

const sorted = computed(() =>
  [...items.value].sort((a, b) =>
    String(b.dateId || '').localeCompare(String(a.dateId || ''))
    || String(a.title || a.top || '').localeCompare(String(b.title || b.top || ''))
  )
)

const ladderPreview = computed(() => [form.top, ...form.rungs.map(rung => rung.word), form.bottom])
const problems = computed(() => validateSopanPuzzle({
  top: form.top,
  bottom: form.bottom,
  endsClue: form.endsClue,
  rungs: form.rungs
}))

function clean(event: Event) {
  const input = event.target as HTMLInputElement
  const value = normalizeSopanWord(input.value)
  input.value = value
  return value
}

function stepOk(index: number) {
  return oneLetterApart(ladderPreview.value[index - 1], ladderPreview.value[index])
}

function previewLetterClass(index: number, letter: number) {
  const word = ladderPreview.value[index]
  if (!word[letter]) return 'border-[hsl(var(--border))] bg-white'
  if (index > 0 && stepOk(index) && changedLetterIndex(ladderPreview.value[index - 1], word) === letter) {
    return 'border-amber-500 bg-amber-300 text-amber-950'
  }
  return 'border-[hsl(var(--border))] bg-white text-[hsl(var(--primary))]'
}

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { title: '', dateId: '', top: '', bottom: '', endsClue: '', rungs: emptyRungs(), published: true })
  showForm.value = true
}

function openEdit(item: SopanPuzzle) {
  isEditing.value = true
  editingId.value = item.id
  Object.assign(form, {
    title: item.title || '',
    dateId: item.dateId || '',
    top: normalizeSopanWord(item.top || ''),
    bottom: normalizeSopanWord(item.bottom || ''),
    endsClue: item.endsClue || '',
    rungs: emptyRungs().map((fallback, index) => ({
      word: normalizeSopanWord(item.rungs?.[index]?.word || fallback.word),
      clue: item.rungs?.[index]?.clue || fallback.clue
    })),
    published: item.published !== false
  })
  showForm.value = true
}

function payloadFromForm() {
  return {
    title: form.title.trim(),
    dateId: form.dateId || null,
    top: form.top,
    bottom: form.bottom,
    endsClue: form.endsClue.trim(),
    rungs: form.rungs.map(rung => ({ word: rung.word, clue: rung.clue.trim() })),
    published: form.published
  }
}

async function save() {
  if (problems.value.length) {
    error.value = problems.value[0]
    return
  }
  const payload = payloadFromForm()
  if (isEditing.value && editingId.value) await updateItem(editingId.value, payload)
  else {
    editingId.value = await create(payload)
    isEditing.value = true
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this Sopan ladder?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

async function importDefaults() {
  importing.value = true
  try {
    for (const puzzle of DEFAULT_SOPAN_PUZZLES) {
      await setItem(puzzle.id, {
        title: puzzle.title || '',
        dateId: null,
        top: puzzle.top,
        bottom: puzzle.bottom,
        endsClue: puzzle.endsClue,
        rungs: puzzle.rungs,
        published: true
      })
    }
  } finally {
    importing.value = false
  }
}

onMounted(async () => {
  await fetchAll()
  if (!items.value.length) openNew()
})

useHead({ title: 'Sopan · Admin' })
</script>
