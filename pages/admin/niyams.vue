<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <div v-if="!loading && !sorted.length" class="mb-4">
      <button type="button" class="admin-btn-secondary" :disabled="importing || saving" @click="importDefaults">
        {{ importing ? 'Importing…' : 'Import default niyams' }}
      </button>
    </div>
    <AdminEditorLayout
      :count-label="`${sorted.length} niyam${sorted.length === 1 ? '' : 's'}`"
      create-label="Add niyam"
      empty-label="No niyams yet. Add some, or import the default utsav list."
      :loading="loading"
      :empty="!sorted.length"
      @create="openNew"
    >
      <template #list>
        <button
          v-for="n in sorted"
          :key="n.id"
          type="button"
          class="admin-row"
          :class="isEditing && editingId === n.id ? 'admin-row-active' : ''"
          @click="openEdit(n)"
        >
          <p class="text-xs font-semibold text-[hsl(var(--golden-900))]">#{{ n.order ?? 0 }}</p>
          <p class="font-semibold text-[hsl(var(--primary))]">{{ n.title }}</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ n.detail }}</p>
        </button>
      </template>
      <template #form>
        <form v-if="showForm" class="space-y-4" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ isEditing ? 'Edit niyam' : 'New niyam' }}</h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">Delete</button>
          </div>
          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" required class="admin-input" placeholder="Nitya puja">
          </div>
          <div>
            <label class="admin-label">Detail</label>
            <textarea v-model="form.detail" required rows="3" class="admin-input" placeholder="Complete daily puja…" />
          </div>
          <div>
            <label class="admin-label">Order</label>
            <input v-model.number="form.order" type="number" min="0" class="admin-input max-w-[8rem]">
          </div>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a niyam to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { Niyam } from '~/types'
import { USTAV_NIYAMS } from '~/data/niyams'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminNiyams()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ title: '', detail: '', order: 0 })
const importing = ref(false)

const sorted = computed(() =>
  [...items.value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))
)

onMounted(async () => {
  await fetchAll()
  if (!items.value.length) openNew()
})

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { title: '', detail: '', order: items.value.length + 1 })
  showForm.value = true
}

function openEdit(n: Niyam) {
  const id = String(n.id || '').trim()
  if (!id) {
    error.value = 'This niyam is missing a document id.'
    return
  }
  isEditing.value = true
  editingId.value = id
  Object.assign(form, {
    title: n.title,
    detail: n.detail,
    order: n.order ?? 0
  })
  showForm.value = true
}

async function save() {
  if (saving.value) return
  const payload = {
    title: form.title.trim(),
    detail: form.detail.trim(),
    order: Number(form.order) || 0
  }
  if (!payload.title || !payload.detail) {
    error.value = 'Title and detail are required.'
    return
  }
  try {
    if (isEditing.value) {
      if (!editingId.value) {
        error.value = 'Cannot update this niyam — it has no document id.'
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
  if (!confirm('Delete this niyam?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

async function importDefaults() {
  if (importing.value || saving.value || items.value.length) return
  importing.value = true
  error.value = ''
  try {
    for (const n of USTAV_NIYAMS) {
      await create({ title: n.title, detail: n.detail, order: n.order ?? 0 })
    }
  } catch {
    /* error already set */
  } finally {
    importing.value = false
  }
}

useHead({ title: 'Niyams · Admin' })
</script>
