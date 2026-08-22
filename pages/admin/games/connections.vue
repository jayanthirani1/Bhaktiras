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
      empty-label="No Connections puzzles yet."
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
          <p class="text-xs font-semibold text-[hsl(var(--golden-900))]">{{ item.dateId || 'Rotating puzzle' }}</p>
          <p class="font-semibold text-[hsl(var(--primary))]">{{ item.title }}</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ item.groups.map(group => group.title).join(' · ') }}</p>
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
            <input v-model="form.title" required maxlength="80" class="admin-input" placeholder="Satsang Connections">
          </div>
          <div>
            <label class="admin-label">Scheduled date <span class="font-normal">(optional)</span></label>
            <input v-model="form.dateId" type="date" class="admin-input">
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Leave empty to include this puzzle in the daily rotation.</p>
          </div>

          <fieldset
            v-for="(group, groupIndex) in form.groups"
            :key="groupIndex"
            class="rounded-xl border border-[hsl(var(--border))] p-4"
          >
            <legend class="px-2 text-sm font-bold" :class="difficultyText[groupIndex]">
              Group {{ groupIndex + 1 }} · {{ difficultyNames[groupIndex] }}
            </legend>
            <label class="admin-label">Connection</label>
            <input v-model="group.title" required maxlength="80" class="admin-input" placeholder="What connects these four?">
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <div v-for="(_, wordIndex) in group.words" :key="wordIndex">
                <label class="admin-label">Word {{ wordIndex + 1 }}</label>
                <input v-model="group.words[wordIndex]" required maxlength="30" class="admin-input">
              </div>
            </div>
          </fieldset>

          <label class="flex items-center gap-2 text-sm font-semibold">
            <input v-model="form.published" type="checkbox" class="h-4 w-4 rounded">
            Published
          </label>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save puzzle' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a puzzle to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { ConnectionsGroup, ConnectionsPuzzle } from '~/types'
import { DEFAULT_CONNECTIONS_PUZZLES } from '~/data/connectionsPuzzles'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminConnections()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const importing = ref(false)
const difficultyNames = ['Easy', 'Medium', 'Hard', 'Tricky']
const difficultyText = ['text-amber-700', 'text-emerald-700', 'text-sky-700', 'text-violet-700']

function emptyGroups(): ConnectionsGroup[] {
  return Array.from({ length: 4 }, (_, difficulty) => ({
    title: '',
    words: ['', '', '', ''],
    difficulty: difficulty as ConnectionsGroup['difficulty']
  }))
}

const form = reactive({
  title: '',
  dateId: '',
  published: true,
  groups: emptyGroups()
})

const sorted = computed(() =>
  [...items.value].sort((a, b) => String(b.dateId || '').localeCompare(String(a.dateId || '')) || a.title.localeCompare(b.title))
)

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { title: '', dateId: '', published: true, groups: emptyGroups() })
  showForm.value = true
}

function openEdit(item: ConnectionsPuzzle) {
  isEditing.value = true
  editingId.value = item.id
  const groups = emptyGroups().map((fallback, index) => ({
    title: item.groups[index]?.title || fallback.title,
    words: [...(item.groups[index]?.words || fallback.words)].slice(0, 4),
    difficulty: index as ConnectionsGroup['difficulty']
  }))
  Object.assign(form, {
    title: item.title,
    dateId: item.dateId || '',
    published: item.published !== false,
    groups
  })
  showForm.value = true
}

async function save() {
  const groups = form.groups.map((group, index) => ({
    title: group.title.trim(),
    words: group.words.map(word => word.trim()),
    difficulty: index as ConnectionsGroup['difficulty']
  }))
  const words = groups.flatMap(group => group.words)
  if (groups.some(group => !group.title || group.words.some(word => !word))) {
    error.value = 'Every group needs a connection and four words.'
    return
  }
  if (new Set(words.map(word => word.toLocaleLowerCase())).size !== 16) {
    error.value = 'All 16 words must be unique.'
    return
  }

  const payload = {
    title: form.title.trim(),
    dateId: form.dateId || null,
    groups,
    published: form.published
  }
  if (isEditing.value && editingId.value) await updateItem(editingId.value, payload)
  else {
    editingId.value = await create(payload)
    isEditing.value = true
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this Connections puzzle?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

async function importDefaults() {
  importing.value = true
  try {
    for (const puzzle of DEFAULT_CONNECTIONS_PUZZLES) {
      await create({
        title: puzzle.title,
        dateId: null,
        groups: puzzle.groups,
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

useHead({ title: 'Connections · Admin' })
</script>
