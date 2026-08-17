<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminEditorLayout
      :count-label="`${sorted.length} event${sorted.length === 1 ? '' : 's'}`"
      create-label="Add event"
      empty-label="No events yet."
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
          <div class="flex gap-3">
            <img v-if="item.posterUrl" :src="item.posterUrl" :alt="item.title" class="h-14 w-20 shrink-0 rounded-lg object-cover">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--accent))]">{{ formatDate(item.date) }}</p>
              <p class="font-semibold text-[hsl(var(--primary))]">{{ item.title }}</p>
              <p class="mt-1 line-clamp-2 text-sm text-[hsl(var(--muted-foreground))]">{{ item.description }}</p>
            </div>
          </div>
        </button>
      </template>
      <template #form>
        <form v-if="showForm" class="space-y-4" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ isEditing ? 'Edit event' : 'New event' }}</h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">Delete</button>
          </div>
          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" required class="admin-input">
          </div>
          <div>
            <label class="admin-label">Date</label>
            <input v-model="form.date" type="date" required class="admin-input">
          </div>
          <div>
            <label class="admin-label">Description</label>
            <textarea v-model="form.description" required rows="5" class="admin-input" />
          </div>
          <div>
            <label class="admin-label">Poster</label>
            <AdminImageUpload v-model="form.posterUrl" folder="events" />
          </div>
          <div>
            <label class="admin-label">Flickr album ID <span class="font-normal">(optional)</span></label>
            <input v-model="form.flickrAlbumId" maxlength="40" class="admin-input" placeholder="721577…">
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">The photoset ID from the Flickr album URL.</p>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select an event to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminEvents()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ title: '', date: '', description: '', posterUrl: '', flickrAlbumId: '' })

const sorted = computed(() =>
  [...items.value].sort((a, b) => String(b.date).localeCompare(String(a.date)))
)

onMounted(async () => {
  await fetchAll()
  if (!items.value.length) openNew()
})

function formatDate(d: string) {
  if (!d) return ''
  const date = new Date(`${d}T00:00:00`)
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { title: '', date: '', description: '', posterUrl: '', flickrAlbumId: '' })
  showForm.value = true
}

function openEdit(item: Event) {
  const id = String(item.id || '').trim()
  if (!id) {
    error.value = 'This event is missing a document id. Delete it in Firebase and add it again.'
    return
  }
  isEditing.value = true
  editingId.value = id
  Object.assign(form, {
    title: item.title || '',
    date: String(item.date || '').slice(0, 10),
    description: item.description || '',
    posterUrl: item.posterUrl || '',
    flickrAlbumId: item.flickrAlbumId || ''
  })
  showForm.value = true
}

async function save() {
  if (saving.value) return
  const payload = {
    title: form.title.trim(),
    date: form.date,
    description: form.description.trim(),
    posterUrl: form.posterUrl || null,
    flickrAlbumId: form.flickrAlbumId.trim() || null
  }
  try {
    if (isEditing.value) {
      if (!editingId.value) {
        error.value = 'Cannot update this event — it has no document id.'
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
  if (!confirm('Delete this event?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

useHead({ title: 'Events · Admin' })
</script>
