<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <AdminEditorLayout
      :count-label="`${sorted.length} question${sorted.length === 1 ? '' : 's'}`"
      create-label="Add question"
      empty-label="No quiz questions yet. The built-in quiz still shows until you add some."
      :loading="loading"
      :empty="!sorted.length"
      @create="openNew"
    >
      <template #list>
        <button
          v-for="(q, i) in sorted"
          :key="q.id"
          type="button"
          class="admin-row"
          :class="isEditing && editingId === q.id ? 'admin-row-active' : ''"
          @click="openEdit(q)"
        >
          <p class="text-xs font-semibold text-[hsl(var(--accent))]">Q{{ i + 1 }}</p>
          <p class="font-semibold text-[hsl(var(--primary))]">{{ q.question }}</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Answer: {{ q.correctAnswer }}</p>
        </button>
      </template>
      <template #form>
        <form v-if="showForm" class="space-y-4" @submit.prevent="save">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ isEditing ? 'Edit question' : 'New question' }}</h2>
            <button v-if="isEditing && editingId" type="button" class="admin-btn-danger" @click="onDelete(editingId)">Delete</button>
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
import type { QuizQuestion } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminQuiz()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ question: '', options: ['', '', '', ''], correctAnswer: '', order: 0 })

const sorted = computed(() =>
  [...items.value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.question.localeCompare(b.question))
)

onMounted(async () => {
  await fetchAll()
  if (!items.value.length) openNew()
})

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { question: '', options: ['', '', '', ''], correctAnswer: '', order: items.value.length + 1 })
  showForm.value = true
}

function openEdit(q: QuizQuestion) {
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
    question: form.question.trim(),
    options,
    correctAnswer: form.correctAnswer.trim(),
    order: Number(form.order) || 0
  }
  try {
    if (isEditing.value) {
      if (!editingId.value) {
        error.value = 'Cannot update this question — it has no document id.'
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
  if (!confirm('Delete this question?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

useHead({ title: 'Quiz · Admin' })
</script>
