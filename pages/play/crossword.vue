<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="mx-auto max-w-5xl">
      <NuxtLink
        to="/play"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        ← Back to games
      </NuxtLink>
      <PageHeader title="Crossword" subtitle="Fill the grid from the across and down clues." />

      <div v-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading puzzles…</div>
      <div v-else-if="!puzzles.length" class="card-surface p-8 text-center text-[hsl(var(--muted-foreground))]">
        Crossword puzzles will appear here once they are added.
      </div>
      <div v-else class="space-y-6">
        <div v-if="puzzles.length > 1" class="flex flex-wrap gap-2">
          <button
            v-for="p in puzzles"
            :key="p.id"
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-semibold"
            :class="active?.id === p.id ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'"
            @click="select(p.id)"
          >
            {{ p.title }}
          </button>
        </div>

        <div v-if="active && layout" class="space-y-6">
          <div class="card-surface overflow-x-auto p-4 sm:p-6">
            <h3 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ active.title }}</h3>
            <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Tap a square, then type. Click a clue or the same square to switch across/down.
            </p>

            <div class="mt-5 flex justify-center overflow-x-auto pb-2">
              <div
                class="grid gap-px rounded-lg bg-[hsl(var(--primary))] p-px"
                :style="{ gridTemplateColumns: `repeat(${layout.cols}, minmax(1.7rem, 2.1rem))` }"
              >
                <button
                  v-for="cell in flatCells"
                  :key="cell.id"
                  type="button"
                  class="relative aspect-square select-none"
                  :class="cellClass(cell)"
                  :disabled="!cell.open"
                  @click="onCellClick(cell.row, cell.col)"
                >
                  <span
                    v-if="cell.number"
                    class="absolute left-0.5 top-0 text-[0.55rem] font-bold leading-none text-[hsl(var(--primary))]"
                  >{{ cell.number }}</span>
                  <span class="font-bold uppercase tracking-wide">{{ guesses[cell.id] || '' }}</span>
                </button>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <button type="button" class="btn-primary text-sm" @click="checkAnswers">Check answers</button>
              <button
                type="button"
                class="rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-sm font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]"
                @click="clearGuesses"
              >
                Clear
              </button>
            </div>
            <p v-if="checked" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              {{ correctCount }} / {{ layout.words.length }} correct
            </p>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <section class="card-surface p-5">
              <h4 class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">Across</h4>
              <ol class="space-y-2">
                <li v-for="word in acrossWords" :key="word.key">
                  <button
                    type="button"
                    class="w-full rounded-lg px-2 py-1.5 text-left text-sm"
                    :class="activeWord?.key === word.key ? 'bg-[hsl(var(--golden-100))] text-[hsl(var(--primary))]' : 'hover:bg-[hsl(var(--muted))]'"
                    @click="selectWord(word.key)"
                  >
                    <span class="font-semibold">{{ word.number }}.</span>
                    {{ word.clue }}
                    <span class="text-[hsl(var(--muted-foreground))]"> ({{ word.answer.length }})</span>
                  </button>
                </li>
              </ol>
            </section>
            <section class="card-surface p-5">
              <h4 class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--accent))]">Down</h4>
              <ol class="space-y-2">
                <li v-for="word in downWords" :key="word.key">
                  <button
                    type="button"
                    class="w-full rounded-lg px-2 py-1.5 text-left text-sm"
                    :class="activeWord?.key === word.key ? 'bg-[hsl(var(--golden-100))] text-[hsl(var(--primary))]' : 'hover:bg-[hsl(var(--muted))]'"
                    @click="selectWord(word.key)"
                  >
                    <span class="font-semibold">{{ word.number }}.</span>
                    {{ word.clue }}
                    <span class="text-[hsl(var(--muted-foreground))]"> ({{ word.answer.length }})</span>
                  </button>
                </li>
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cellKey, layoutCrossword, type LaidWord } from '~/utils/crosswordLayout'

const { puzzles, loading } = useCrosswordPuzzles()
const activeId = ref('')
const guesses = reactive<Record<string, string>>({})
const checked = ref(false)
const activeRow = ref(0)
const activeCol = ref(0)
const activeDir = ref<'across' | 'down'>('across')

const active = computed(() => puzzles.value.find(p => p.id === activeId.value) || puzzles.value[0] || null)
const layout = computed(() => active.value ? layoutCrossword(active.value.clues) : null)
const acrossWords = computed(() => layout.value?.words.filter(w => w.direction === 'across') || [])
const downWords = computed(() => layout.value?.words.filter(w => w.direction === 'down') || [])

const flatCells = computed(() => {
  const l = layout.value
  if (!l) return []
  const out = []
  for (let r = 0; r < l.rows; r++) {
    for (let c = 0; c < l.cols; c++) {
      out.push({
        id: cellKey(r, c),
        row: r,
        col: c,
        open: !!l.letters[r][c],
        number: l.numbers[r][c]
      })
    }
  }
  return out
})

const activeWord = computed(() => {
  const l = layout.value
  if (!l) return null
  return l.words.find(w =>
    w.direction === activeDir.value
    && w.cells.some(cell => cell.row === activeRow.value && cell.col === activeCol.value)
  ) || l.words.find(w => w.cells.some(cell => cell.row === activeRow.value && cell.col === activeCol.value)) || null
})

const activeWordKeys = computed(() => new Set((activeWord.value?.cells || []).map(c => cellKey(c.row, c.col))))

function cellClass(cell: { id: string; open: boolean; row: number; col: number }) {
  if (!cell.open) return 'bg-[hsl(var(--primary))] cursor-default'
  const isActive = cell.row === activeRow.value && cell.col === activeCol.value
  const inWord = activeWordKeys.value.has(cell.id)
  const ok = checked.value && isCellCorrect(cell.row, cell.col)
  const bad = checked.value && !!guesses[cell.id] && !isCellCorrect(cell.row, cell.col)
  return [
    'flex items-center justify-center bg-white text-sm sm:text-base text-[hsl(var(--foreground))]',
    isActive ? 'ring-2 ring-inset ring-[hsl(var(--accent))] bg-[hsl(var(--golden-100))]' : '',
    !isActive && inWord ? 'bg-[hsl(var(--golden-50))]' : '',
    ok ? 'text-emerald-700' : '',
    bad ? 'text-red-600' : ''
  ].filter(Boolean).join(' ')
}

function isCellCorrect(row: number, col: number) {
  const solution = layout.value?.letters[row]?.[col]
  if (!solution) return false
  return (guesses[cellKey(row, col)] || '') === solution
}

function wordsAt(row: number, col: number) {
  return (layout.value?.words || []).filter(w => w.cells.some(c => c.row === row && c.col === col))
}

function onCellClick(row: number, col: number) {
  if (!layout.value?.letters[row][col]) return
  const here = wordsAt(row, col)
  if (activeRow.value === row && activeCol.value === col && here.length > 1) {
    activeDir.value = activeDir.value === 'across' ? 'down' : 'across'
  } else if (!here.some(w => w.direction === activeDir.value)) {
    activeDir.value = here[0]?.direction || 'across'
  }
  activeRow.value = row
  activeCol.value = col
  checked.value = false
}

function selectWord(key: string) {
  const word = layout.value?.words.find(w => w.key === key)
  if (!word) return
  activeDir.value = word.direction
  const empty = word.cells.find(c => !guesses[cellKey(c.row, c.col)])
  const target = empty || word.cells[0]
  activeRow.value = target.row
  activeCol.value = target.col
  checked.value = false
}

function moveInWord(delta: number) {
  const word = activeWord.value
  if (!word) return
  const idx = word.cells.findIndex(c => c.row === activeRow.value && c.col === activeCol.value)
  const next = word.cells[idx + delta]
  if (!next) return
  activeRow.value = next.row
  activeCol.value = next.col
}

function typeLetter(letter: string) {
  if (!layout.value?.letters[activeRow.value]?.[activeCol.value]) return
  guesses[cellKey(activeRow.value, activeCol.value)] = letter
  checked.value = false
  moveInWord(1)
}

function backspace() {
  const id = cellKey(activeRow.value, activeCol.value)
  if (guesses[id]) {
    delete guesses[id]
    checked.value = false
    return
  }
  moveInWord(-1)
  delete guesses[cellKey(activeRow.value, activeCol.value)]
  checked.value = false
}

function isWordCorrect(word: LaidWord) {
  return word.cells.every((c, i) => (guesses[cellKey(c.row, c.col)] || '') === word.answer[i])
}

const correctCount = computed(() => layout.value?.words.filter(isWordCorrect).length || 0)

function checkAnswers() {
  checked.value = true
}

function clearGuesses() {
  Object.keys(guesses).forEach(k => { delete guesses[k] })
  checked.value = false
}

function select(id: string) {
  activeId.value = id
  clearGuesses()
  activeRow.value = 0
  activeCol.value = 0
  activeDir.value = 'across'
  const l = layoutCrossword(puzzles.value.find(p => p.id === id)?.clues || [])
  const first = l?.words[0]
  if (first) {
    activeRow.value = first.row
    activeCol.value = first.col
    activeDir.value = first.direction
  }
}

watch(puzzles, (list) => {
  if (list.length && !activeId.value) select(list[0].id)
}, { immediate: true })

watch(layout, (l) => {
  if (!l) return
  const first = l.words[0]
  if (!first) return
  if (!l.letters[activeRow.value]?.[activeCol.value]) {
    activeRow.value = first.row
    activeCol.value = first.col
    activeDir.value = first.direction
  }
})

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (!layout.value) return
    if (e.key === 'Backspace') {
      e.preventDefault()
      backspace()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      activeDir.value = 'across'
      moveInWord(e.key === 'ArrowRight' ? 1 : -1)
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      activeDir.value = 'down'
      moveInWord(e.key === 'ArrowDown' ? 1 : -1)
    } else if (/^[A-Za-z]$/.test(e.key)) {
      e.preventDefault()
      typeLetter(e.key.toUpperCase())
    }
  }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})
</script>
