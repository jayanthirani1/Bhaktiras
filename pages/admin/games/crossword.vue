<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminEditorLayout
      :count-label="`${items.length} puzzle${items.length === 1 ? '' : 's'}`"
      create-label="Add puzzle"
      empty-label="No crossword puzzles yet."
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
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ isEditing ? 'Edit puzzle' : 'New puzzle' }}</h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">Delete</button>
          </div>
          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" required class="admin-input">
          </div>
          <div class="space-y-2">
            <div v-for="(c, i) in form.clues" :key="i" class="grid gap-2 rounded-lg border border-[hsl(var(--border))] p-3 sm:grid-cols-12">
              <input v-model.number="c.number" type="number" min="1" class="admin-input sm:col-span-2" placeholder="#">
              <select v-model="c.direction" class="admin-input sm:col-span-2">
                <option value="across">Across</option>
                <option value="down">Down</option>
              </select>
              <input v-model="c.clue" class="admin-input sm:col-span-5" placeholder="Clue" required>
              <input v-model="c.answer" class="admin-input uppercase sm:col-span-3" placeholder="ANSWER" required>
            </div>
          </div>
          <button type="button" class="text-sm font-semibold text-[hsl(var(--primary))]" @click="addClue">+ Add clue</button>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a puzzle to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { CrosswordClue, CrosswordPuzzle } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminCrossword()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ title: '', clues: [] as CrosswordClue[] })

onMounted(async () => {
  await fetchAll()
  if (!items.value.length) openNew()
})

function addClue() {
  form.clues.push({ number: form.clues.length + 1, direction: 'across', clue: '', answer: '' })
}

function openNew() {
  isEditing.value = false
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
  editingId.value = id
  form.title = p.title
  form.clues = (p.clues || []).map(c => ({ ...c }))
  if (!form.clues.length) addClue()
  showForm.value = true
}

async function save() {
  if (saving.value) return
  const clues = form.clues
    .map(c => ({
      number: Number(c.number) || 1,
      direction: c.direction === 'down' ? 'down' : 'across',
      clue: c.clue.trim(),
      answer: c.answer.trim().toUpperCase()
    }))
    .filter(c => c.clue && c.answer)
  if (!clues.length) {
    error.value = 'Add at least one clue.'
    return
  }
  const payload = { title: form.title.trim(), clues, published: true }
  try {
    if (isEditing.value) {
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
  editingId.value = null
}

useHead({ title: 'Crossword · Admin' })
</script>
