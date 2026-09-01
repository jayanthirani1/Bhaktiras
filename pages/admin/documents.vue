<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminEditorLayout
      :count-label="`${sorted.length} document${sorted.length === 1 ? '' : 's'}`"
      create-label="New document"
      empty-label="No documents yet. Add one to link from a niyam."
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
          <p class="font-semibold text-[hsl(var(--primary))]">{{ item.title || 'Untitled' }}</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            <span v-if="hasEnglish(item)">English</span>
            <span v-if="hasEnglish(item) && hasGujarati(item)"> · </span>
            <span v-if="hasGujarati(item)">Gujarati</span>
            <span v-if="!hasEnglish(item) && !hasGujarati(item)">No body text yet</span>
            <span v-if="!item.active" class="ml-1 text-amber-700">· hidden</span>
          </p>
        </button>
      </template>
      <template #form>
        <form v-if="showForm" class="space-y-4" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
              {{ isEditing ? 'Edit document' : 'New document' }}
            </h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">
              Delete
            </button>
          </div>

          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" required class="admin-input" :maxlength="NIYAM_DOCUMENT_TITLE_MAX">
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Shown on the link card unless the niyam has its own link text.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
              <input v-model="form.active" type="checkbox" class="rounded border-[hsl(var(--border))]">
              Visible on the site
            </label>
            <div>
              <label class="admin-label">Sort order</label>
              <input v-model.number="form.order" type="number" min="0" step="1" class="admin-input">
            </div>
          </div>

          <div>
            <label class="admin-label">English text</label>
            <textarea
              v-model="form.bodyEnglish"
              rows="14"
              class="admin-input font-mono text-sm leading-relaxed"
              :maxlength="NIYAM_DOCUMENT_BODY_MAX"
              placeholder="## Janmangal Stotra&#10;&#10;Paste or write the English text here. Simple markdown works."
            />
          </div>

          <div>
            <label class="admin-label">Gujarati text</label>
            <textarea
              v-model="form.bodyGujarati"
              rows="14"
              class="admin-input font-mono text-sm leading-relaxed"
              :maxlength="NIYAM_DOCUMENT_BODY_MAX"
              placeholder="ગુજરાતી શ્લોક અહીં લખો…"
            />
          </div>

          <p class="text-xs text-[hsl(var(--muted-foreground))]">
            At least one language is required. Devotees can switch between English and Gujarati on the reading page.
          </p>

          <div class="flex flex-wrap gap-2">
            <button type="submit" class="admin-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
            <NuxtLink
              v-if="isEditing && editingId"
              :to="`/documents/${editingId}`"
              target="_blank"
              class="admin-btn-secondary"
            >
              Preview
            </NuxtLink>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">
          Select a document to edit, or create a new one. Then link it from a niyam under “Document”.
        </p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { NiyamDocument } from '~/types'
import { NIYAM_DOCUMENT_BODY_MAX, NIYAM_DOCUMENT_TITLE_MAX } from '~/utils/niyamDocument'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminNiyamDocuments()

const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  title: '',
  bodyEnglish: '',
  bodyGujarati: '',
  active: true,
  order: 0
})

const sorted = computed(() =>
  [...items.value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))
)

function hasEnglish(item: NiyamDocument) {
  return !!(item.bodyEnglish || '').trim()
}

function hasGujarati(item: NiyamDocument) {
  return !!(item.bodyGujarati || '').trim()
}

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, {
    title: '',
    bodyEnglish: '',
    bodyGujarati: '',
    active: true,
    order: sorted.value.length
  })
  showForm.value = true
}

function openEdit(item: NiyamDocument) {
  isEditing.value = true
  editingId.value = item.id
  Object.assign(form, {
    title: item.title,
    bodyEnglish: item.bodyEnglish || '',
    bodyGujarati: item.bodyGujarati || '',
    active: item.active !== false,
    order: item.order ?? 0
  })
  showForm.value = true
}

async function save() {
  const title = form.title.trim()
  const bodyEnglish = form.bodyEnglish.trim()
  const bodyGujarati = form.bodyGujarati.trim()
  if (!title) {
    error.value = 'Title is required.'
    return
  }
  if (!bodyEnglish && !bodyGujarati) {
    error.value = 'Add text in English, Gujarati, or both.'
    return
  }
  const payload = {
    title: title.slice(0, NIYAM_DOCUMENT_TITLE_MAX),
    bodyEnglish: bodyEnglish.slice(0, NIYAM_DOCUMENT_BODY_MAX),
    bodyGujarati: bodyGujarati.slice(0, NIYAM_DOCUMENT_BODY_MAX),
    active: !!form.active,
    order: Math.max(0, Math.floor(Number(form.order) || 0))
  }
  try {
    if (isEditing.value && editingId.value) {
      await updateItem(editingId.value, payload)
    } else {
      const id = await create(payload)
      editingId.value = id
      isEditing.value = true
    }
  } catch {
    // error surfaced by composable
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this document? Niyams linked to it will need a new link.')) return
  await remove(id)
  showForm.value = false
  editingId.value = null
}

onMounted(() => {
  void fetchAll()
})

useHead({ title: 'Documents · Admin · Bhaktiras' })
</script>
