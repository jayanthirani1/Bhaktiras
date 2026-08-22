<template>
  <div>
    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>

    <div class="mb-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-4 text-sm text-[hsl(var(--muted-foreground))]">
      <p class="font-semibold text-[hsl(var(--foreground))]">How the daily puzzle works</p>
      <p class="mt-1">
        Every day is generated from the Game Word Bank automatically — you only need a puzzle here to
        override a particular date, or to add a hand-written puzzle to the rotation.
      </p>
      <p class="mt-2">
        Write clues in <code class="rounded bg-[hsl(var(--background))] px-1">[square brackets]</code>,
        put the answer after <code class="rounded bg-[hsl(var(--background))] px-1">::</code>, and nest
        brackets inside each other. Separate alternate spellings with
        <code class="rounded bg-[hsl(var(--background))] px-1">|</code>.
      </p>
    </div>

    <AdminEditorLayout
      :count-label="`${sorted.length} puzzle${sorted.length === 1 ? '' : 's'}`"
      create-label="Add puzzle"
      empty-label="No hand-written puzzles — every day is generated."
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
          <p class="mt-1 line-clamp-2 text-sm text-[hsl(var(--muted-foreground))]">{{ plainText(item.source) }}</p>
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
            <input v-model="form.title" required maxlength="80" class="admin-input" placeholder="Mandir Morning">
          </div>

          <div>
            <label class="admin-label">Scheduled date <span class="font-normal">(optional)</span></label>
            <input v-model="form.dateId" type="date" class="admin-input">
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              Set a date to replace that day’s generated puzzle. Leave empty to join the fallback rotation.
            </p>
          </div>

          <div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <label class="admin-label">Puzzle source</label>
              <button type="button" class="admin-btn-secondary" @click="generateSource">
                Generate from word bank
              </button>
            </div>
            <textarea
              v-model="form.source"
              required
              rows="6"
              class="admin-input font-mono text-sm"
              placeholder="Every morning we do [the lamp ceremony sung before the [image of Bhagvan in a mandir::murti]::aarti|arti]."
            />
          </div>

          <div class="rounded-xl border p-4" :class="parseError ? 'border-red-300 bg-red-50' : 'border-[hsl(var(--border))]'">
            <p class="text-xs font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Preview</p>
            <p v-if="parseError" class="mt-2 text-sm font-semibold text-red-600">{{ parseError }}</p>
            <template v-else>
              <p class="mt-2 text-[hsl(var(--foreground))]">{{ preview.board }}</p>
              <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Solved: {{ preview.solved }}</p>
              <ol class="mt-3 space-y-1 text-sm">
                <li v-for="clue in preview.clues" :key="clue.id" class="flex flex-wrap gap-2">
                  <span class="text-[hsl(var(--muted-foreground))]">{{ '· '.repeat(clue.depth) }}{{ clue.clue }}</span>
                  <span class="font-semibold text-[hsl(var(--primary))]">→ {{ clue.answer }}</span>
                </li>
              </ol>
            </template>
          </div>

          <label class="flex items-center gap-2 text-sm font-semibold">
            <input v-model="form.published" type="checkbox" class="h-4 w-4 rounded">
            Published
          </label>

          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving || !!parseError">{{ saving ? 'Saving…' : 'Save puzzle' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a puzzle to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { BracketCityPuzzle } from '~/types'
import { flattenNodes, parseBracketSource, clueText, sentenceText } from '~/utils/bracketCity'
import { buildDailyBracketCitySource } from '~/utils/bracketCityGenerator'
import { ukDateId } from '~/utils/gameDay'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, setItem, updateItem, remove } = useAdminBracketCity()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  title: '',
  dateId: '',
  published: true,
  source: ''
})

const sorted = computed(() =>
  [...items.value].sort((a, b) =>
    String(b.dateId || '').localeCompare(String(a.dateId || '')) || a.title.localeCompare(b.title))
)

const parsed = computed(() => {
  try {
    return { parts: parseBracketSource(form.source), error: '' }
  } catch (e) {
    return { parts: [], error: (e as Error).message }
  }
})

const parseError = computed(() => (form.source.trim() ? parsed.value.error : 'Add a puzzle source.'))

const preview = computed(() => {
  const nodes = flattenNodes(parsed.value.parts)
  return {
    board: sentenceText(parsed.value.parts),
    solved: sentenceText(parsed.value.parts, new Set(nodes.map(node => node.id))),
    clues: nodes.map(node => ({
      id: node.id,
      depth: node.depth,
      clue: clueText(node),
      answer: [node.answer, ...node.alts].join(' / ')
    }))
  }
})

function plainText(source: string) {
  try {
    return sentenceText(parseBracketSource(source))
  } catch {
    return source
  }
}

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { title: '', dateId: '', published: true, source: '' })
  showForm.value = true
}

function openEdit(item: BracketCityPuzzle) {
  isEditing.value = true
  editingId.value = item.id
  Object.assign(form, {
    title: item.title,
    dateId: item.dateId || '',
    published: item.published !== false,
    source: item.source || ''
  })
  showForm.value = true
}

function generateSource() {
  const source = buildDailyBracketCitySource(form.dateId || ukDateId())
  if (!source) {
    error.value = 'The word bank could not build a puzzle for that date. Add more words, or write one by hand.'
    return
  }
  error.value = ''
  form.source = source
  if (!form.title.trim()) form.title = 'Bracket City'
}

async function save() {
  if (parseError.value) {
    error.value = parseError.value
    return
  }
  const payload = {
    title: form.title.trim(),
    dateId: form.dateId || null,
    source: form.source.trim(),
    published: form.published
  }

  if (isEditing.value && editingId.value) {
    await updateItem(editingId.value, payload)
    return
  }
  // A dated puzzle takes a predictable id so re-saving the same day replaces it
  // rather than leaving two puzzles competing for that date.
  if (form.dateId) {
    const id = `daily-${form.dateId}`
    await setItem(id, payload)
    editingId.value = id
  } else {
    editingId.value = await create(payload)
  }
  isEditing.value = true
}

async function onDelete(id: string) {
  if (!confirm('Delete this Bracket City puzzle?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

onMounted(async () => {
  await fetchAll()
})

useHead({ title: 'Bracket City · Admin' })
</script>
