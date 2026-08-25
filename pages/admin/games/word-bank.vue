<template>
  <div class="admin-panel space-y-5">
    <div>
      <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Shared game word bank</h2>
      <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
        {{ allEntries.length.toLocaleString() }} Swaminarayan, satsang and Hindu vocabulary entries.
        Clues must follow
        <a class="font-semibold underline" href="https://www.swaminarayan.faith/learning-resources/scriptures" target="_blank" rel="noopener noreferrer">swaminarayan.faith scriptures</a>
        (Bhuj Vachnamrut, Shikshapatri, Satsangi Jeevan). Built-in words come from the generated bank; edits and custom words are saved to Firebase.
      </p>
    </div>

    <div class="rounded-xl border border-[hsl(var(--border))] p-4">
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Add custom word</h3>
        <button type="button" class="admin-btn-secondary min-h-11 sm:min-h-0" @click="toggleAdd">
          {{ addOpen ? 'Close' : 'Add word' }}
        </button>
      </div>
      <AdminWordBankEditor
        v-if="addOpen"
        key="add"
        class="mt-4"
        :entry="blankEntry"
        replacing=""
        :categories="categories"
        :saving="saving"
        :error="addError || error"
        :can-reset="false"
        :can-delete="false"
        @save="saveNew"
        @cancel="closeAdd"
      />
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div v-for="stat in stats" :key="stat.label" class="rounded-xl bg-[hsl(var(--muted))] p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{{ stat.label }}</p>
        <p class="mt-1 font-display text-2xl font-semibold text-[hsl(var(--primary))]">{{ stat.value.toLocaleString() }}</p>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <input
        v-model="search"
        type="search"
        class="admin-input min-h-11 sm:min-h-0"
        placeholder="Search words, clues or categories…"
      >
      <select v-model="game" class="admin-input min-h-11 sm:min-h-0">
        <option value="">All games</option>
        <option value="wordle">Wordle</option>
        <option value="crossword">Crossword</option>
      </select>
      <select v-model="category" class="admin-input min-h-11 sm:min-h-0">
        <option value="">All categories</option>
        <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
      </select>
    </div>

    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      {{ filtered.length.toLocaleString() }} matching entries
      <span v-if="filtered.length > DISPLAY_LIMIT">· showing first {{ DISPLAY_LIMIT }}</span>
    </p>

    <!-- Phones edit in the card itself: the table needs 46rem and the old flow
         sent you to a form at the top of a 200-row list to change one letter.
         Only one of the two lists is rendered, so the open row has a single
         editor and its autofocus is not stolen by a hidden twin. -->
    <ul v-if="!isWide" class="space-y-2">
      <li
        v-for="entry in visibleEntries"
        :key="entry.id"
        class="rounded-xl border border-[hsl(var(--border))] bg-white p-3"
        :class="openId === entry.id ? 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/10' : ''"
      >
        <AdminWordBankEditor
          v-if="openId === entry.id"
          :key="`edit-${entry.id}`"
          :entry="entry"
          :replacing="replacing"
          :categories="categories"
          :saving="saving"
          :error="rowError || error"
          :can-reset="!!originalOf(entry)"
          :can-delete="isStored(entry)"
          @save="payload => saveEdit(entry, payload)"
          @cancel="closeEdit"
          @reset="resetToBuiltIn(entry)"
          @delete="deleteWord(entry)"
        />
        <template v-else>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-mono font-semibold text-[hsl(var(--primary))]">{{ entry.answer }}</p>
              <p v-if="entry.display.toUpperCase() !== entry.answer" class="text-sm text-[hsl(var(--muted-foreground))]">
                {{ entry.display }}
              </p>
              <p v-if="originalOf(entry)" class="mt-0.5 text-xs text-amber-700">
                was {{ originalOf(entry)!.display }}
              </p>
            </div>
            <button type="button" class="admin-btn-secondary min-h-11 shrink-0" @click="openEdit(entry)">Edit</button>
          </div>
          <p class="mt-2 text-sm">{{ entry.clue }}</p>
          <p class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            {{ entry.category }} · {{ entry.games.map(gameLabel).join(', ') || 'Reference only' }} · {{ sourceLabel(entry) }}
          </p>
        </template>
      </li>
    </ul>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[46rem] text-left text-sm">
        <thead>
          <tr class="border-b border-[hsl(var(--border))] text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            <th class="py-2 pr-3 font-semibold">Answer</th>
            <th class="py-2 pr-3 font-semibold">Clue</th>
            <th class="py-2 pr-3 font-semibold">Category</th>
            <th class="py-2 pr-3 font-semibold">Games</th>
            <th class="py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="entry in visibleEntries" :key="entry.id">
            <tr v-if="openId === entry.id">
              <td colspan="5" class="py-2">
                <AdminWordBankEditor
                  :key="`edit-wide-${entry.id}`"
                  :entry="entry"
                  :replacing="replacing"
                  :categories="categories"
                  :saving="saving"
                  :error="rowError || error"
                  :can-reset="!!originalOf(entry)"
                  :can-delete="isStored(entry)"
                  @save="payload => saveEdit(entry, payload)"
                  @cancel="closeEdit"
                  @reset="resetToBuiltIn(entry)"
                  @delete="deleteWord(entry)"
                />
              </td>
            </tr>
            <tr v-else class="border-b border-[hsl(var(--border))]/70">
              <td class="py-2 pr-3 align-top">
                <p class="font-mono font-semibold text-[hsl(var(--primary))]">{{ entry.answer }}</p>
                <p v-if="entry.display.toUpperCase() !== entry.answer" class="text-xs text-[hsl(var(--muted-foreground))]">{{ entry.display }}</p>
                <p v-if="originalOf(entry)" class="mt-0.5 text-xs text-amber-700">
                  was {{ originalOf(entry)!.display }}
                </p>
              </td>
              <td class="py-2 pr-3 align-top">{{ entry.clue }}</td>
              <td class="py-2 pr-3 align-top text-xs">{{ entry.category }}</td>
              <td class="py-2 pr-3 align-top text-xs">{{ entry.games.map(gameLabel).join(', ') || 'Reference only' }}</td>
              <td class="py-2 align-top">
                <button type="button" class="text-xs font-semibold text-[hsl(var(--primary))]" @click="openEdit(entry)">Edit</button>
                <span class="mt-0.5 block text-xs text-[hsl(var(--muted-foreground))]">{{ sourceLabel(entry) }}</span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameWordEntry, GameWordTarget } from '~/types'
import {
  gameTargetsForAnswer,
  gameWordsFor,
  mergeGameWords,
  normalizeGameWord,
  replacedBuiltIn
} from '~/utils/gameWordBank'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const DISPLAY_LIMIT = 200
const search = ref('')
const game = ref<'' | GameWordTarget>('')
const category = ref('')

/** Id of the row whose editor is open; only one is ever open at a time. */
const openId = ref('')
/** Document id being updated, empty when the edit will create a new override. */
const editingId = ref('')
/** Answer of the built-in word being superseded, empty for a plain custom word. */
const replacing = ref('')
const rowError = ref('')

const addOpen = ref(false)
const addError = ref('')

/** Tailwind's `sm`. Starts false so the phone layout is the server default. */
const isWide = ref(false)
let media: MediaQueryList | null = null
function onMediaChange(event: MediaQueryList | MediaQueryListEvent) {
  isWide.value = event.matches
}

const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminGameWords()

const blankEntry = computed<GameWordEntry>(() => ({
  id: 'new', answer: '', display: '', clue: '', category: 'satsang', source: 'Custom', games: []
}))

const customEntries = computed<GameWordEntry[]>(() => items.value.map((entry) => {
  const replaces = normalizeGameWord(entry.replaces || '')
  return {
    ...entry,
    answer: normalizeGameWord(entry.answer || entry.display),
    display: String(entry.display || entry.answer || '').trim(),
    clue: String(entry.clue || '').trim(),
    category: String(entry.category || 'custom').trim() || 'custom',
    source: replaces ? 'Edited' : 'Custom',
    games: gameTargetsForAnswer(entry.answer || entry.display),
    ...(replaces ? { replaces } : {})
  }
}))
const allEntries = computed(() => mergeGameWords(customEntries.value))
const categories = computed(() => [...new Set(allEntries.value.map(entry => entry.category))].sort())
const stats = computed(() => [
  { label: 'Total entries', value: allEntries.value.length },
  { label: 'Custom words', value: customEntries.value.filter(e => !replacedBuiltIn(e)).length },
  { label: 'Edited words', value: customEntries.value.filter(e => replacedBuiltIn(e)).length },
  { label: 'Wordle words', value: gameWordsFor('wordle', allEntries.value).length },
  { label: 'Crossword words', value: gameWordsFor('crossword', allEntries.value).length },
])

const filtered = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return allEntries.value.filter((entry) => {
    if (game.value && !entry.games.includes(game.value)) return false
    if (category.value && entry.category !== category.value) return false
    if (!query) return true
    return `${entry.answer} ${entry.display} ${entry.clue} ${entry.category}`.toLocaleLowerCase().includes(query)
  })
})

/** The open row stays rendered even once a filter would exclude it mid-edit. */
const visibleEntries = computed(() => {
  const rows = filtered.value.slice(0, DISPLAY_LIMIT)
  if (!openId.value || rows.some(entry => entry.id === openId.value)) return rows
  const open = allEntries.value.find(entry => entry.id === openId.value)
  return open ? [open, ...rows] : rows
})

function gameLabel(target: GameWordTarget) {
  return target[0].toUpperCase() + target.slice(1)
}

/** The built-in word this row supersedes, when the row is an admin edit. */
function originalOf(entry: GameWordEntry) {
  return replacedBuiltIn(entry)
}

/** True when the row is a Firebase document rather than a generated word. */
function isStored(entry: GameWordEntry) {
  return entry.source === 'Custom' || entry.source === 'Edited'
}

function sourceLabel(entry: GameWordEntry) {
  if (!isStored(entry)) return 'Built in'
  // An edit whose built-in word has since left the generated bank is just a
  // custom word now, and is deleted rather than reset.
  return originalOf(entry) ? 'Edited' : 'Custom'
}

/**
 * Editing a built-in word does not touch the generated bank. It opens the row
 * as a new override that supersedes that word, so the change is a Firebase
 * document the mandir can undo with Reset.
 */
function openEdit(entry: GameWordEntry) {
  const builtIn = !isStored(entry)
  openId.value = entry.id
  editingId.value = builtIn ? '' : entry.id
  replacing.value = builtIn ? entry.answer : normalizeGameWord(entry.replaces || '')
  rowError.value = ''
  error.value = ''
  addOpen.value = false
}

function closeEdit() {
  openId.value = ''
  editingId.value = ''
  replacing.value = ''
  rowError.value = ''
}

function toggleAdd() {
  addOpen.value = !addOpen.value
  addError.value = ''
  if (addOpen.value) closeEdit()
}

function closeAdd() {
  addOpen.value = false
  addError.value = ''
}

interface WordDraft { display: string, clue: string, category: string }

/** Empty when the draft can be saved, otherwise the reason it cannot. */
function problemWith(draft: WordDraft, ignoreDocId: string, replacedAnswer: string): string {
  const answer = normalizeGameWord(draft.display)
  if (answer.length < 3 || answer.length > 24) {
    return 'The game answer must contain between 3 and 24 letters.'
  }
  // The built-in being superseded is still listed until the override saves,
  // so it must not count against itself as a duplicate.
  const duplicate = allEntries.value.find(entry =>
    entry.answer === answer
    && entry.id !== ignoreDocId
    && entry.answer !== replacedAnswer
  )
  return duplicate ? `${answer} is already in the word bank.` : ''
}

function payloadFor(draft: WordDraft, answer: string, replacedAnswer: string) {
  return {
    answer,
    display: draft.display,
    clue: draft.clue,
    category: draft.category.toLowerCase() || 'custom',
    source: replacedAnswer ? 'Edited' : 'Custom',
    games: gameTargetsForAnswer(answer),
    replaces: replacedAnswer
  }
}

async function saveEdit(entry: GameWordEntry, draft: WordDraft) {
  rowError.value = problemWith(draft, editingId.value, replacing.value)
  if (rowError.value) return
  const answer = normalizeGameWord(draft.display)
  try {
    if (editingId.value) await updateItem(editingId.value, payloadFor(draft, answer, replacing.value))
    else await create(payloadFor(draft, answer, replacing.value))
    closeEdit()
  } catch {
    // Shared admin composable exposes the Firebase error above.
  }
}

async function saveNew(draft: WordDraft) {
  addError.value = problemWith(draft, '', '')
  if (addError.value) return
  try {
    await create(payloadFor(draft, normalizeGameWord(draft.display), ''))
    closeAdd()
  } catch {
    // Shared admin composable exposes the Firebase error above.
  }
}

/** Drops an override so the generated built-in word applies again. */
async function resetToBuiltIn(entry: GameWordEntry) {
  const original = originalOf(entry)
  if (!original) return
  if (!confirm(`Restore ${original.display} to the built-in spelling?`)) return
  try {
    await remove(entry.id)
    closeEdit()
  } catch {
    // Shared admin composable exposes the Firebase error above.
  }
}

async function deleteWord(entry: GameWordEntry) {
  if (!confirm(`Delete ${entry.display} from the custom word bank?`)) return
  try {
    await remove(entry.id)
    closeEdit()
  } catch {
    // Shared admin composable exposes the Firebase error above.
  }
}

onMounted(() => {
  media = window.matchMedia('(min-width: 640px)')
  onMediaChange(media)
  media.addEventListener('change', onMediaChange)
  void fetchAll()
})

onUnmounted(() => media?.removeEventListener('change', onMediaChange))

useHead({ title: 'Game Word Bank · Admin' })
</script>
