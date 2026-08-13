<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminEditorLayout
      :count-label="`${items.length} puzzle${items.length === 1 ? '' : 's'}`"
      create-label="Add puzzle"
      empty-label="No custom puzzles yet. Built-in hives still work."
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
          <p class="font-mono text-base font-semibold uppercase text-[hsl(var(--primary))]">
            {{ p.availableLetters }}
          </p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Centre {{ p.middleLetter }} · {{ (p.answers || []).length }} answers
          </p>
        </button>
      </template>
      <template #form>
        <form v-if="showForm" class="space-y-4" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ isEditing ? 'Edit puzzle' : 'New puzzle' }}</h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">Delete</button>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="admin-label">Centre letter</label>
              <input v-model="form.middleLetter" maxlength="1" required class="admin-input uppercase" placeholder="A">
            </div>
            <div>
              <label class="admin-label">All 7 letters (include centre)</label>
              <input v-model="form.availableLetters" maxlength="7" required class="admin-input uppercase" placeholder="AEKLMRT">
            </div>
          </div>
          <div>
            <label class="admin-label">Answers (comma or new line)</label>
            <textarea v-model="form.answersText" rows="10" class="admin-input font-mono text-sm" placeholder="altar, area, karma…" />
          </div>
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
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminSpellingBee()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ middleLetter: '', availableLetters: '', answersText: '' })

onMounted(async () => {
  await fetchAll()
  if (!items.value.length) openNew()
})

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { middleLetter: '', availableLetters: '', answersText: '' })
  showForm.value = true
}

function openEdit(p: { id: string; middleLetter: string; availableLetters: string; answers?: string[] }) {
  const id = String(p.id || '').trim()
  if (!id) {
    error.value = 'This puzzle is missing a document id.'
    return
  }
  isEditing.value = true
  editingId.value = id
  Object.assign(form, {
    middleLetter: p.middleLetter,
    availableLetters: p.availableLetters,
    answersText: (p.answers || []).join('\n')
  })
  showForm.value = true
}

async function save() {
  if (saving.value) return
  const middleLetter = form.middleLetter.trim().toUpperCase().slice(0, 1)
  const availableLetters = [...new Set(form.availableLetters.trim().toUpperCase().replace(/[^A-Z]/g, '').split(''))].join('')
  if (!middleLetter || availableLetters.length !== 7) {
    error.value = 'Use exactly 7 unique letters, including the centre letter.'
    return
  }
  if (!availableLetters.includes(middleLetter)) {
    error.value = 'Centre letter must be one of the 7 letters.'
    return
  }
  const answers = form.answersText
    .split(/[\n,]+/)
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length >= 4)
  const payload = { middleLetter, availableLetters, answers }
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
  if (!confirm('Delete this spelling bee puzzle?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

useHead({ title: 'Spelling Bee · Admin' })
</script>
