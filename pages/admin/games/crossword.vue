<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminDailyCrosswordCard
      :puzzle="todayPuzzle"
      :date-label="todayDateLabel"
      :overridden="!!todayOverride"
      @edit="openToday"
    />
    <div v-if="!loading && !items.length" class="mb-4">
      <button type="button" class="admin-btn-secondary" :disabled="importing || saving" @click="importDefault">
        {{ importing ? 'Importing…' : 'Import default crossword' }}
      </button>
    </div>
    <AdminEditorLayout
      :count-label="`${items.length} crossword${items.length === 1 ? '' : 's'}`"
      create-label="Add crossword"
      empty-label="No crosswords yet."
      :loading="loading"
      :empty="!items.length"
      @create="openNew"
    >
      <template #list>
        <button
          v-for="p in items"
          :key="p.id"
          type="button"
          class="admin-row"
          :class="isEditing && editingId === p.id ? 'admin-row-active' : ''"
          @click="openEdit(p)"
        >
          <p class="font-semibold text-[hsl(var(--primary))]">{{ p.title }}</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ (p.clues || []).length }} clues</p>
        </button>
      </template>
      <template #form>
        <form v-if="showForm" class="space-y-4" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
              {{ editingToday ? 'Today’s crossword override' : isEditing ? 'Edit crossword' : 'New crossword' }}
            </h2>
            <button v-if="isEditing && editingId && (!editingToday || todayOverride)" type="button" class="admin-btn-danger" @click="onDelete(editingId)">
              {{ editingToday ? 'Remove override' : 'Delete' }}
            </button>
          </div>
          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" required class="admin-input">
          </div>
          <div class="space-y-2">
            <div v-for="(c, i) in form.clues" :key="i" class="grid gap-2 rounded-lg border border-[hsl(var(--border))] p-3 sm:grid-cols-12">
              <input v-model.number="c.number" type="number" min="1" class="admin-input sm:col-span-1" placeholder="#">
              <select v-model="c.direction" class="admin-input sm:col-span-2">
                <option value="across">Across</option>
                <option value="down">Down</option>
              </select>
              <input v-model="c.clue" class="admin-input sm:col-span-4" placeholder="Clue" required>
              <input v-model="c.answer" class="admin-input uppercase sm:col-span-3" placeholder="ANSWER" required>
              <input v-model.number="c.row" type="number" min="0" class="admin-input sm:col-span-1" placeholder="R">
              <input v-model.number="c.col" type="number" min="0" class="admin-input sm:col-span-1" placeholder="C">
            </div>
          </div>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Optional R/C = fixed start row/col for a compact grid.</p>
          <button type="button" class="text-sm font-semibold text-[hsl(var(--primary))]" @click="addClue">+ Add clue</button>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a crossword to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { CrosswordClue, CrosswordPuzzle } from '~/types'
import { DEFAULT_MINI_CROSSWORD } from '~/data/miniCrossword'
import { createWordBankMiniCrossword } from '~/utils/gameWordBank'
import { formatUkDateLabel, ukDateId } from '~/utils/gameDay'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, setItem, updateItem, remove } = useAdminMiniCrossword()
const todayId = ukDateId()
const todayOverrideId = `daily-${todayId}`
const todayDateLabel = formatUkDateLabel(todayId)
const generatedToday = ref<CrosswordPuzzle>(createWordBankMiniCrossword(todayId))
const todayOverride = computed(() => items.value.find(p => p.id === todayOverrideId))
const todayPuzzle = computed(() => todayOverride.value || generatedToday.value)
const showForm = ref(false)
const isEditing = ref(false)
const editingToday = ref(false)
const editingId = ref<string | null>(null)
const importing = ref(false)
const form = reactive({ title: '', clues: [] as CrosswordClue[] })

onMounted(async () => {
  const [entries] = await Promise.all([
    fetchMergedGameWords().catch(() => null),
    fetchAll()
  ])
  if (entries) generatedToday.value = createWordBankMiniCrossword(todayId, entries)
  if (!items.value.length) openNew()
})

function addClue() {
  form.clues.push({ number: form.clues.length + 1, direction: 'across', clue: '', answer: '', row: undefined, col: undefined })
}

function openNew() {
  isEditing.value = false
  editingToday.value = false
  editingId.value = null
  form.title = ''
  form.clues = [{ number: 1, direction: 'across', clue: '', answer: '' }]
  showForm.value = true
}

function openEdit(p: CrosswordPuzzle) {
  const id = String(p.id || '').trim()
  if (!id) {
    error.value = 'This puzzle is missing a document id.'
    return
  }
  isEditing.value = true
  editingToday.value = id === todayOverrideId
  editingId.value = id
  form.title = p.title
  form.clues = (p.clues || []).map(c => ({
    number: c.number,
    direction: c.direction,
    clue: c.clue,
    answer: c.answer,
    row: c.row,
    col: c.col
  }))
  if (!form.clues.length) addClue()
  showForm.value = true
}

function openToday() {
  const puzzle = todayPuzzle.value
  isEditing.value = true
  editingToday.value = true
  editingId.value = todayOverrideId
  form.title = puzzle.title
  form.clues = puzzle.clues.map(clue => ({ ...clue }))
  showForm.value = true
}

async function save() {
  if (saving.value) return
  const clues = form.clues
    .map(c => ({
      number: Number(c.number) || 1,
      direction: c.direction === 'down' ? 'down' as const : 'across' as const,
      clue: c.clue.trim(),
      answer: c.answer.trim().toUpperCase(),
      ...(c.row != null && c.row !== ('' as unknown) && Number.isFinite(Number(c.row)) ? { row: Number(c.row) } : {}),
      ...(c.col != null && c.col !== ('' as unknown) && Number.isFinite(Number(c.col)) ? { col: Number(c.col) } : {})
    }))
    .filter(c => c.clue && c.answer)
  if (!clues.length) {
    error.value = 'Add at least one clue.'
    return
  }
  const payload = { title: form.title.trim(), clues, published: true }
  try {
    if (editingToday.value) {
      await setItem(todayOverrideId, payload)
      editingId.value = todayOverrideId
    } else if (isEditing.value) {
      if (!editingId.value) {
        error.value = 'Cannot update this puzzle — it has no document id.'
        return
      }
      await updateItem(editingId.value, payload)
    } else {
      const id = await create(payload)
      isEditing.value = true
      editingId.value = id || null
    }
    showForm.value = true
  } catch {
    /* error already set */
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this crossword?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingToday.value = false
  editingId.value = null
}

async function importDefault() {
  if (importing.value || saving.value || items.value.length) return
  importing.value = true
  error.value = ''
  try {
    await create({
      title: DEFAULT_MINI_CROSSWORD.title,
      clues: DEFAULT_MINI_CROSSWORD.clues,
      published: true
    })
  } catch {
    /* error already set */
  } finally {
    importing.value = false
  }
}

useHead({ title: 'Crossword · Admin' })
</script>
