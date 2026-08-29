<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminEditorLayout
      :count-label="`${sorted.length} moment${sorted.length === 1 ? '' : 's'}`"
      create-label="Add moment"
      empty-label="No timeline moments yet. Add one to show it on Our Journey."
      :loading="loading"
      :empty="!sorted.length"
      @create="openNew"
    >
      <template #list>
        <div class="space-y-5">
          <section v-for="group in grouped" :key="group.year" class="space-y-2">
            <h2 class="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golden-900))]">
              {{ group.year }}
              <span class="font-normal tracking-normal text-[hsl(var(--muted-foreground))]">
                · {{ group.items.length }} moment{{ group.items.length === 1 ? '' : 's' }}
              </span>
            </h2>
            <button
              v-for="item in group.items"
              :key="item.id"
              type="button"
              class="admin-row"
              :class="isEditing && editingId === item.id ? 'admin-row-active' : ''"
              @click="openEdit(item)"
            >
              <p v-if="item.date && item.date !== item.year" class="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                {{ item.date }}
              </p>
              <p class="font-semibold text-[hsl(var(--primary))]">{{ item.title }}</p>
              <p class="mt-1 line-clamp-2 text-sm text-[hsl(var(--muted-foreground))]">{{ item.description }}</p>
            </button>
          </section>
        </div>
      </template>
      <template #form>
        <form v-if="showForm" class="space-y-4" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ isEditing ? 'Edit moment' : 'New moment' }}</h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">Delete</button>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="admin-label">Year</label>
              <input v-model="form.year" list="journey-years" required class="admin-input" placeholder="2027">
              <datalist id="journey-years">
                <option v-for="y in years" :key="y" :value="y" />
              </datalist>
            </div>
            <div>
              <label class="admin-label">Date label</label>
              <input v-model="form.date" class="admin-input" placeholder="August, or 14 Aug 2027">
              <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                Month alone is fine — the year above is used for ordering.
              </p>
            </div>
          </div>
          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" required class="admin-input">
          </div>
          <div>
            <label class="admin-label">Description</label>
            <textarea v-model="form.description" required rows="5" class="admin-input" />
          </div>
          <div>
            <label class="admin-label">Image</label>
            <AdminImageUpload v-model="form.imageUrl" folder="timeline" />
          </div>
          <div>
            <label class="admin-label">Video URL (optional)</label>
            <input v-model="form.videoUrl" type="url" class="admin-input" placeholder="https://…">
          </div>
          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a moment to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { TimelineItem } from '~/types'
import { compareTimelineItems, journeyYears } from '~/data/timeline'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminTimeline()
const years = journeyYears()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ year: '', date: '', title: '', description: '', imageUrl: '', videoUrl: '' })

function yearKey(item: TimelineItem) {
  return String(item.year || '').trim() || 'Undated'
}

function yearSortValue(year: string) {
  const n = Number(year)
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

const sorted = computed(() =>
  [...items.value].sort((a, b) => {
    const yearDiff = yearSortValue(yearKey(a)) - yearSortValue(yearKey(b))
    if (yearDiff) return yearDiff
    return compareTimelineItems(a, b)
  })
)

const grouped = computed(() => {
  const byYear = new Map<string, TimelineItem[]>()
  for (const item of sorted.value) {
    const year = yearKey(item)
    const list = byYear.get(year)
    if (list) list.push(item)
    else byYear.set(year, [item])
  }
  return [...byYear.entries()].map(([year, yearItems]) => ({ year, items: yearItems }))
})

onMounted(async () => {
  await fetchAll()
  if (!items.value.length) openNew()
})

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { year: String(years[years.length - 1] || ''), date: '', title: '', description: '', imageUrl: '', videoUrl: '' })
  showForm.value = true
}

function openEdit(item: TimelineItem) {
  const id = String(item.id || '').trim()
  if (!id) {
    error.value = 'This moment is missing a document id.'
    return
  }
  isEditing.value = true
  editingId.value = id
  Object.assign(form, {
    year: item.year || '',
    date: item.date || item.year || '',
    title: item.title || '',
    description: item.description || '',
    imageUrl: item.imageUrl || '',
    videoUrl: item.videoUrl || ''
  })
  showForm.value = true
}

async function save() {
  if (saving.value) return
  const media = []
  if (form.imageUrl) media.push({ type: 'image', url: form.imageUrl })
  if (form.videoUrl) media.push({ type: 'video', url: form.videoUrl })
  const payload = {
    year: form.year.trim(),
    date: form.date.trim() || form.year.trim(),
    title: form.title.trim(),
    description: form.description.trim(),
    imageUrl: form.imageUrl || null,
    videoUrl: form.videoUrl || null,
    media
  }
  try {
    if (isEditing.value) {
      if (!editingId.value) {
        error.value = 'Cannot update this moment — it has no document id.'
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
  if (!confirm('Delete this timeline moment?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

useHead({ title: 'Timeline · Admin' })
</script>
