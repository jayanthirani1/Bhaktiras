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
      empty-label="No Ras Rani puzzles yet."
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
          <p class="text-xs font-semibold text-[hsl(var(--accent))]">{{ item.dateId || 'Rotating puzzle' }}</p>
          <p class="font-semibold text-[hsl(var(--primary))]">{{ item.title }}</p>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {{ item.gridSize }}×{{ item.gridSize }} grid · {{ item.regions.length }} regions
          </p>
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
            <input v-model="form.title" required maxlength="80" class="admin-input" placeholder="Nectar Collection">
          </div>

          <div>
            <label class="admin-label">Scheduled date <span class="font-normal">(optional)</span></label>
            <input v-model="form.dateId" type="date" class="admin-input">
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Leave empty to include this puzzle in the daily rotation.</p>
          </div>

          <div>
            <label class="admin-label">Grid Size</label>
            <select v-model.number="form.gridSize" class="admin-input">
              <option :value="4">4×4</option>
              <option :value="5">5×5</option>
              <option :value="6">6×6</option>
              <option :value="7">7×7</option>
              <option :value="8">8×8</option>
            </select>
          </div>

          <div>
            <label class="admin-label">Regions (JSON array)</label>
            <textarea
              v-model="regionsText"
              rows="6"
              class="admin-input font-mono text-sm"
              :placeholder='`[
  {"id": "madhurya", "name": "Madhurya", "color": "bg-rose-100 text-rose-700 border-rose-300", "meaning": "Sweetness"},
  {"id": "shant", "name": "Shant", "color": "bg-sky-100 text-sky-700 border-sky-300", "meaning": "Peace"}
]`'
            />
          </div>

          <div>
            <label class="admin-label">Region Grid (one row per line, region IDs separated by spaces)</label>
            <textarea
              v-model="regionGridText"
              rows="6"
              class="admin-input font-mono text-sm"
              placeholder="madhurya madhurya shant shant
madhurya madhurya shant shant
dasya dasya sakhya sakhya
dasya dasya sakhya sakhya"
            />
          </div>

          <div>
            <label class="admin-label">Solution (JSON array of [row, col] pairs)</label>
            <textarea
              v-model="solutionText"
              rows="3"
              class="admin-input font-mono text-sm"
              placeholder="[[0,2],[1,0],[2,3],[3,1]]"
            />
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              One nectar position per row, column, and region. No adjacent placements.
            </p>
          </div>

          <div class="rounded-xl border border-[hsl(var(--border))] p-4">
            <p class="text-xs font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Preview</p>
            <div v-if="previewRegionGrid.length && parsedRegions" class="mt-3">
              <div
                class="grid gap-1"
                :style="{ gridTemplateColumns: `repeat(${form.gridSize}, 1fr)`, maxWidth: '240px' }"
              >
                <div
                  v-for="(cell, idx) in flattenedPreviewGrid"
                  :key="idx"
                  class="flex aspect-square items-center justify-center rounded border text-xs font-bold"
                  :class="getRegionColorClass(cell.regionId)"
                >
                  {{ isSolutionCell(cell.row, cell.col) ? '🍯' : '' }}
                </div>
              </div>
            </div>
            <p v-if="validationError" class="mt-2 text-sm text-red-600">{{ validationError }}</p>
          </div>

          <label class="flex items-center gap-2 text-sm font-semibold">
            <input v-model="form.published" type="checkbox" class="h-4 w-4 rounded">
            Published
          </label>

          <div class="flex gap-2">
            <button type="submit" class="admin-btn" :disabled="saving || !!validationError">{{ saving ? 'Saving…' : 'Save puzzle' }}</button>
            <button type="button" class="admin-btn-secondary" @click="showForm = false">Cancel</button>
          </div>
        </form>
        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">Select a puzzle to edit, or add a new one.</p>
      </template>
    </AdminEditorLayout>
  </div>
</template>

<script setup lang="ts">
import type { RasRaniPuzzle, RasRaniRegion } from '~/types'
import { RAS_RANI_PUZZLES } from '~/data/rasRaniPuzzles'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminRasRani()
const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const importing = ref(false)

const form = reactive({
  title: '',
  dateId: '',
  gridSize: 5,
  published: true
})

const regionsText = ref('[]')
const regionGridText = ref('')
const solutionText = ref('[]')

const sorted = computed(() =>
  [...items.value].sort((a, b) =>
    String(b.dateId || '').localeCompare(String(a.dateId || '')) || a.title.localeCompare(b.title))
)

const parsedRegions = computed<RasRaniRegion[] | null>(() => {
  try {
    return JSON.parse(regionsText.value || '[]')
  } catch {
    return null
  }
})

const previewRegionGrid = computed(() => {
  const lines = regionGridText.value.trim().split('\n').filter(l => l.trim())
  return lines.map(line => line.trim().split(/\s+/))
})

const flattenedPreviewGrid = computed(() => {
  const cells: Array<{ row: number; col: number; regionId: string }> = []
  for (let row = 0; row < previewRegionGrid.value.length; row++) {
    for (let col = 0; col < (previewRegionGrid.value[row]?.length || 0); col++) {
      cells.push({ row, col, regionId: previewRegionGrid.value[row][col] })
    }
  }
  return cells
})

const parsedSolution = computed<Array<[number, number]> | null>(() => {
  try {
    return JSON.parse(solutionText.value || '[]')
  } catch {
    return null
  }
})

function getRegionColorClass(regionId: string): string {
  const region = parsedRegions.value?.find(r => r.id === regionId)
  return region?.color || 'bg-gray-100 text-gray-700 border-gray-300'
}

function isSolutionCell(row: number, col: number): boolean {
  return parsedSolution.value?.some(([r, c]) => r === row && c === col) ?? false
}

const validationError = computed(() => {
  if (!form.title.trim()) return 'Title is required'
  if (parsedRegions.value === null) return 'Invalid regions JSON'
  if ((parsedRegions.value?.length || 0) === 0) return 'Add at least one region'
  if (previewRegionGrid.value.length !== form.gridSize) return `Region grid must have ${form.gridSize} rows`
  if (previewRegionGrid.value.some(row => row.length !== form.gridSize)) return `Each row must have ${form.gridSize} columns`
  if (parsedSolution.value === null) return 'Invalid solution JSON'
  if ((parsedSolution.value?.length || 0) !== form.gridSize) return `Solution must have exactly ${form.gridSize} positions`
  return ''
})

function openNew() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, { title: '', dateId: '', gridSize: 5, published: true })
  regionsText.value = '[]'
  regionGridText.value = ''
  solutionText.value = '[]'
  showForm.value = true
}

function openEdit(item: RasRaniPuzzle) {
  isEditing.value = true
  editingId.value = item.id
  Object.assign(form, {
    title: item.title,
    dateId: item.dateId || '',
    gridSize: item.gridSize,
    published: item.published !== false
  })
  regionsText.value = JSON.stringify(item.regions, null, 2)
  regionGridText.value = item.regionGrid.map(row => row.join(' ')).join('\n')
  solutionText.value = JSON.stringify(item.solution)
  showForm.value = true
}

async function save() {
  if (validationError.value) {
    error.value = validationError.value
    return
  }
  const payload = {
    title: form.title.trim(),
    dateId: form.dateId || null,
    gridSize: form.gridSize,
    regions: parsedRegions.value,
    regionGrid: previewRegionGrid.value,
    solution: parsedSolution.value,
    published: form.published
  }
  if (isEditing.value && editingId.value) await updateItem(editingId.value, payload)
  else {
    editingId.value = await create(payload)
    isEditing.value = true
  }
}

async function onDelete(id: string) {
  if (!confirm('Delete this Ras Rani puzzle?')) return
  await remove(id)
  showForm.value = false
  isEditing.value = false
  editingId.value = null
}

async function importDefaults() {
  importing.value = true
  try {
    for (const puzzle of RAS_RANI_PUZZLES) {
      await create({
        title: puzzle.title,
        dateId: puzzle.dateId || null,
        gridSize: puzzle.gridSize,
        regions: puzzle.regions,
        regionGrid: puzzle.regionGrid,
        solution: puzzle.solution,
        published: puzzle.published
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

useHead({ title: 'Ras Rani · Admin' })
</script>
