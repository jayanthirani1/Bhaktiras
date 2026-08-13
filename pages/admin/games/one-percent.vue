<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <div v-if="!loading && !sorted.length" class="mb-4">
      <button type="button" class="admin-btn-secondary" :disabled="importing || saving" @click="importDefaults">
        {{ importing ? 'Importing…' : 'Import default ladder' }}
      </button>
    </div>
    <AdminEditorLayout
      :count-label="`${sorted.length} question${sorted.length === 1 ? '' : 's'}`"
      create-label="Add question"
      empty-label="No 1% Club questions yet. Import the default ladder or add your own."
      :loading="loading"
      :empty="!sorted.length"
      @create="openNew"
    >
      <template #list>
        <button
          v-for="q in sorted"
          :key="q.id"
          type="button"
          class="admin-row"
          :class="isEditing && editingId === q.id ? 'admin-row-active' : ''"
          @click="openEdit(q)"
        >
          <p class="text-xs font-semibold text-[hsl(var(--accent))]">{{ q.percent }}%</p>
          <p class="font-semibold text-[hsl(var(--primary))]">{{ q.question }}</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Answer: {{ q.correctAnswer }}</p>
        </button>
      </template>
      <template #form>
        <form v-if="showForm" class="space-y-4" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
              {{ isEditing ? 'Edit question' : 'New question' }}
            </h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">Delete</button>
          </div>
          <div>
            <label class="admin-label">Percent (90 → 1)</label>
            <input v-model.number="form.percent" type="number" min="1" max="99" required class="admin-input max-w-[8rem]">
          </div>
          <div>
            <label class="admin-label">Question</label>
            <textarea v-model="form.question" required rows="3" class="admin-input" />
          </div>
          <div v-for="(_, i) in form.options" :key="i">
            <label class="admin-label">Option {{ i + 1 }}</label>
            <input v-model="form.options[i]" required class="admin-input">
          </div>
          <div>
            <label class="admin-label">Correct answer (must match an option exactly)</label>
            <input v-model="form.correctAnswer" required class="admin-input">
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
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a question to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { OnePercentQuestion } from '~/types'
import { DEFAULT_ONE_PERCENT } from '~/data/onePercentClub'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminOnePercent()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const importing = ref(false)
const form = reactive({ percent: 90, question: '', options: ['', '', '', ''], correctAnswer: '', order: 0 })

const sorted = computed(() =>
  [...items.value].sort((a, b) => (b.percent - a.percent) || (a.order ?? 0) - (b.order ?? 0))
)

onMounted(async () => {
  await fetchAll()
  if (!items.value.length) openNew()
})

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, {
    percent: 90,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    order: items.value.length + 1
  })
  showForm.value = true
}

function openEdit(q: OnePercentQuestion) {
  const id = String(q.id || '').trim()
  if (!id) {
    error.value = 'This question is missing a document id.'
    return
  }
  isEditing.value = true
  editingId.value = id
  const options = [...(q.options || [])]
  while (options.length < 4) options.push('')
  Object.assign(form, {
    percent: q.percent,
    question: q.question,
    options: options.slice(0, 4),
    correctAnswer: q.correctAnswer,
    order: q.order ?? 0
  })
  showForm.value = true
}

async function save() {
  if (saving.value) return
  const options = form.options.map(o => o.trim()).filter(Boolean)
  if (options.length < 2) {
    error.value = 'Add at least two options.'
    return
  }
  if (!options.includes(form.correctAnswer.trim())) {
    error.value = 'Correct answer must match one of the options exactly.'
    return
  }
  const payload = {
    percent: Number(form.percent) || 90,
    question: form.question.trim(),
    options,
    correctAnswer: form.correctAnswer.trim(),
    order: Number(form.order) || 0
  }
  try {
    if (isEditing.value) {
      if (!editingId.value) return
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
  if (!confirm('Delete this question?')) return
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
    for (const q of DEFAULT_ONE_PERCENT) {
      await create({
        percent: q.percent,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        order: q.order ?? 0
      })
    }
  } catch {
    /* error already set */
  } finally {
    importing.value = false
  }
}

useHead({ title: '1% Club · Admin' })
</script>
