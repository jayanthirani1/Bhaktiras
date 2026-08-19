<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <p class="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
      The live game is Vachanamrut-based (Bhuj edition) and picks a new prakaran ladder each UK day.
      Import the default packs below, or add a dated override with today’s date id.
    </p>
    <div class="mb-4">
      <button type="button" class="admin-btn-secondary" :disabled="importing || saving" @click="importDefaults">
        {{ importing ? 'Importing…' : 'Import Vachanamrut ladders' }}
      </button>
    </div>
    <AdminEditorLayout
      :count-label="`${sorted.length} question${sorted.length === 1 ? '' : 's'}`"
      create-label="Add question"
      empty-label="No 1% Club questions in Firestore yet. The site still uses the built-in daily Vachanamrut ladders."
      :loading="loading"
      :empty="!sorted.length"
      @create="openNew"
    >
      <template #list>
        <div class="space-y-5">
          <section v-for="group in grouped" :key="group.section" class="space-y-2">
            <h2 class="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">
              {{ group.label }}
              <span class="font-normal tracking-normal text-[hsl(var(--muted-foreground))]">
                · {{ group.items.length }}
              </span>
            </h2>
            <button
              v-for="q in group.items"
              :key="q.id"
              type="button"
              class="admin-row"
              :class="isEditing && editingId === q.id ? 'admin-row-active' : ''"
              @click="openEdit(q)"
            >
              <p class="text-xs font-semibold text-[hsl(var(--accent))]">{{ q.percent }}% · {{ q.source || q.packId || 'Vachanamrut' }}</p>
              <p class="font-semibold text-[hsl(var(--primary))]">{{ q.question }}</p>
              <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Answer: {{ q.correctAnswer }}</p>
            </button>
          </section>
        </div>
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
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="admin-label">Prakaran / section</label>
              <input v-model="form.section" class="admin-input" placeholder="gadhada-i">
            </div>
            <div>
              <label class="admin-label">Source</label>
              <input v-model="form.source" class="admin-input" placeholder="Gadhada I – 1">
            </div>
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
import { DEFAULT_ONE_PERCENT, VACHANAMRUT_ONE_PERCENT_PACKS } from '~/data/onePercentClub'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, setItem, updateItem, remove } = useAdminOnePercent()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const importing = ref(false)
const form = reactive({
  percent: 90,
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  order: 0,
  section: '',
  source: '',
  packId: ''
})

const sorted = computed(() =>
  [...items.value].sort((a, b) => {
    const section = String(a.section || '').localeCompare(String(b.section || ''))
    if (section) return section
    return (b.percent - a.percent) || (a.order ?? 0) - (b.order ?? 0)
  })
)

const grouped = computed(() => {
  const labels = new Map(VACHANAMRUT_ONE_PERCENT_PACKS.map(p => [p.section, p.sectionLabel]))
  const bySection = new Map<string, OnePercentQuestion[]>()
  for (const q of sorted.value) {
    const key = String(q.section || '').trim() || 'other'
    const list = bySection.get(key)
    if (list) list.push(q)
    else bySection.set(key, [q])
  }
  return [...bySection.entries()].map(([section, sectionItems]) => ({
    section,
    label: labels.get(section) || (section === 'other' ? 'Other' : section),
    items: sectionItems
  }))
})

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
    order: items.value.length + 1,
    section: '',
    source: '',
    packId: ''
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
    order: q.order ?? 0,
    section: q.section || '',
    source: q.source || '',
    packId: q.packId || ''
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
    order: Number(form.order) || 0,
    section: form.section.trim() || null,
    source: form.source.trim() || null,
    packId: form.packId.trim() || null
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
  if (importing.value || saving.value) return
  importing.value = true
  error.value = ''
  try {
    for (const q of DEFAULT_ONE_PERCENT) {
      await setItem(q.id, {
        percent: q.percent,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        order: q.order ?? 0,
        section: q.section || null,
        source: q.source || null,
        packId: q.packId || null
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
