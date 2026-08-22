<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <div v-if="!loading && !sorted.length" class="mb-4">
      <button type="button" class="admin-btn-secondary" :disabled="importing || saving" @click="importDefaults">
        {{ importing ? 'Importing…' : 'Import starter puzzles' }}
      </button>
    </div>

    <AdminEditorLayout
      :count-label="`${sorted.length} puzzle${sorted.length === 1 ? '' : 's'}`"
      create-label="Add puzzle"
      empty-label="No Bhakti Marg puzzles yet."
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
          <p class="text-xs font-semibold text-[hsl(var(--accent))]">{{ item.dateId || 'Rotating puzzle' }}</p>
          <p class="font-semibold text-[hsl(var(--primary))]">{{ item.title }}</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {{ item.gridSize }}×{{ item.gridSize }} grid · {{ item.words.length }} words
          </p>
        </button>
      </template>

      <template #form>
        <form v-if="showForm" class="space-y-5" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ isEditing ? 'Edit puzzle' : 'New puzzle' }}</h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">Delete</button>
          </div>

          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" required maxlength="80" class="admin-input" placeholder="Path of Devotion">
          </div>

          <div>
            <label class="admin-label">Scheduled date <span class="font-normal">(optional)</span></label>
            <input v-model="form.dateId" type="date" class="admin-input">
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Leave empty to include this puzzle in the daily rotation.</p>
          </div>

          <div>
            <label class="admin-label">Grid Size</label>
            <select v-model.number="form.gridSize" class="admin-input">
              <option :value="4">4×4</option>
              <option :value="5">5×5</option>
              <option :value="6">6×6</option>
            </select>
          </div>

          <div>
            <label class="admin-label">Grid (one row per line, spaces between letters)</label>
            <textarea
              v-model="gridText"
              rows="6"
              class="admin-input font-mono text-sm"
              placeholder="S E V A
M A R N
U R T I
P U J A"
            />
          </div>

          <div>
            <label class="admin-label">Words (one per line: WORD - meaning)</label>
            <textarea
              v-model="wordsText"
              rows="6"
              class="admin-input font-mono text-sm"
              placeholder="SEVA - Selfless service
MARN - Remembrance
URTI - Sacred form
PUJA - Worship ritual"
            />
          </div>

          <div>
            <label class="admin-label">Paths (JSON format)</label>
            <textarea
              v-model="pathsText"
              rows="6"
              class="admin-input font-mono text-sm"
              placeholder='[[[0,0],[0,1],[0,2],[0,3]],[[1,0],[1,1],[1,2],[1,3]]]'
            />
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Array of paths, each path is array of [row, col] coordinates.
            </p>
          </div>

          <div class="rounded-xl border border-[hsl(var(--border))] p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Preview</p>
            <div v-if="previewGrid.length" class="mt-3 grid gap-1" :style="{ gridTemplateColumns: `repeat(${form.gridSize}, 1fr)`, maxWidth: '200px' }">
              <div
                v-for="(cell, idx) in previewGrid.flat()"
                :key="idx"
                class="flex aspect-square items-center justify-center rounded border bg-violet-50 text-sm font-bold text-violet-700"
              >
                {{ cell }}
              </div>
            </div>
            <p v-if="validationError" class="mt-2 text-sm text-red-600">{{ validationError }}</p>
          </div>

          <label class="flex items-center gap-2 text-sm font-semibold">
            <input v-model="form.published" type="checkbox" class="h-4 w-4 rounded">
            Published
          </label>

          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving || !!validationError">{{ saving ? 'Saving…' : 'Save puzzle' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a puzzle to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { BhaktiMargPuzzle } from '~/types'
import { BHAKTI_MARG_PUZZLES } from '~/data/bhaktiMargPuzzles'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminBhaktiMarg()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const importing = ref(false)

const form = reactive({
  title: '',
  dateId: '',
  gridSize: 4,
  published: true
})

const gridText = ref('')
const wordsText = ref('')
const pathsText = ref('[]')

const sorted = computed(() =>
  [...items.value].sort((a, b) =>
    String(b.dateId || '').localeCompare(String(a.dateId || '')) || a.title.localeCompare(b.title))
)

const previewGrid = computed(() => {
  const lines = gridText.value.trim().split('\n').filter(l => l.trim())
  return lines.map(line => line.trim().split(/\s+/))
})

const parsedWords = computed(() => {
  return wordsText.value.trim().split('\n').filter(l => l.trim()).map(line => {
    const [word, ...meaningParts] = line.split('-')
    return { word: word?.trim() || '', meaning: meaningParts.join('-').trim() }
  })
})

const parsedPaths = computed(() => {
  try {
    return JSON.parse(pathsText.value || '[]')
  } catch {
    return null
  }
})

const validationError = computed(() => {
  if (!form.title.trim()) return 'Title is required'
  if (previewGrid.value.length !== form.gridSize) return `Grid must have ${form.gridSize} rows`
  if (previewGrid.value.some(row => row.length !== form.gridSize)) return `Each row must have ${form.gridSize} columns`
  if (parsedWords.value.length === 0) return 'Add at least one word'
  if (parsedWords.value.some(w => !w.word || !w.meaning)) return 'Each word needs both word and meaning'
  if (parsedPaths.value === null) return 'Invalid paths JSON'
  return ''
})

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { title: '', dateId: '', gridSize: 4, published: true })
  gridText.value = ''
  wordsText.value = ''
  pathsText.value = '[]'
  showForm.value = true
}

function openEdit(item: BhaktiMargPuzzle) {
  isEditing.value = true
  editingId.value = item.id
  Object.assign(form, {
    title: item.title,
    dateId: item.dateId || '',
    gridSize: item.gridSize,
    published: item.published !== false
  })
  gridText.value = item.grid.map(row => row.join(' ')).join('\n')
  wordsText.value = item.words.map(w => `${w.word} - ${w.meaning}`).join('\n')
  pathsText.value = JSON.stringify(item.paths)
  showForm.value = true
}

async function save() {
  if (validationError.value) {
    error.value = validationError.value
    return
  }
  const payload = {
    title: form.title.trim(),
    dateId: form.dateId || null,
    gridSize: form.gridSize,
    grid: previewGrid.value,
    walls: [],
    words: parsedWords.value,
    paths: parsedPaths.value,
    published: form.published
  }
  if (isEditing.value && editingId.value) await updateItem(editingId.value, payload)
  else {
    editingId.value = await create(payload)
    isEditing.value = true
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this Bhakti Marg puzzle?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

async function importDefaults() {
  importing.value = true
  try {
    for (const puzzle of BHAKTI_MARG_PUZZLES) {
      await create({
        title: puzzle.title,
        dateId: puzzle.dateId || null,
        gridSize: puzzle.gridSize,
        grid: puzzle.grid,
        walls: puzzle.walls,
        words: puzzle.words,
        paths: puzzle.paths,
        published: puzzle.published
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

useHead({ title: 'Bhakti Marg · Admin' })
</script>
