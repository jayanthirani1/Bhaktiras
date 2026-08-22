<template>
  <div class="admin-panel space-y-5">
    <div>
      <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Shared game word bank</h2>
      <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
        {{ allEntries.length.toLocaleString() }} Swaminarayan, satsang and Hindu vocabulary entries.
        Built-in words come from the generated bank; edits and custom words are saved to Firebase.
      </p>
    </div>

    <form class="space-y-4 rounded-xl border border-[hsl(var(--border))] p-4" @submit.prevent="saveWord">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">
            {{ formHeading }}
          </h3>
          <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Spaces and accents are removed automatically for game input.
          </p>
        </div>
        <button v-if="editingId" type="button" class="admin-btn-secondary" @click="resetForm">Cancel</button>
      </div>
      <p
        v-if="replacing"
        class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
      >
        Correcting the built-in word <span class="font-mono font-semibold">{{ replacing }}</span>.
        The generated word bank is left alone — this saves an override the games use instead,
        and Reset puts the original back.
      </p>
      <div class="grid gap-3 sm:grid-cols-3">
        <div>
          <label class="admin-label">Word or phrase</label>
          <input v-model="form.display" required maxlength="40" class="admin-input" placeholder="e.g. Mahotsav">
        </div>
        <div class="sm:col-span-2">
          <label class="admin-label">Crossword clue</label>
          <input v-model="form.clue" required maxlength="160" class="admin-input" placeholder="A grand spiritual celebration">
        </div>
        <div>
          <label class="admin-label">Category</label>
          <input v-model="form.category" required maxlength="40" class="admin-input" placeholder="satsang">
        </div>
        <div class="sm:col-span-2">
          <label class="admin-label">Game compatibility</label>
          <div class="flex min-h-10 flex-wrap items-center gap-2 rounded-lg bg-[hsl(var(--muted))] px-3 py-2 text-xs">
            <span class="font-mono font-semibold">{{ previewAnswer || '—' }}</span>
            <span v-for="target in previewGames" :key="target" class="rounded-full bg-white px-2 py-0.5 font-semibold">
              {{ gameLabel(target) }}
            </span>
            <span v-if="previewAnswer && !previewGames.length" class="text-amber-700">Reference only — incompatible length or letters</span>
          </div>
        </div>
      </div>
      <p v-if="formError || error" class="text-sm text-red-600">{{ formError || error }}</p>
      <button type="submit" class="admin-btn" :disabled="saving">
        {{ saving ? 'Saving…' : submitLabel }}
      </button>
    </form>

    <div class="grid gap-3 sm:grid-cols-5">
      <div v-for="stat in stats" :key="stat.label" class="rounded-xl bg-[hsl(var(--muted))] p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">{{ stat.label }}</p>
        <p class="mt-1 font-display text-2xl font-semibold text-[hsl(var(--primary))]">{{ stat.value.toLocaleString() }}</p>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <input
        v-model="search"
        type="search"
        class="admin-input"
        placeholder="Search words, clues or categories…"
      >
      <select v-model="game" class="admin-input">
        <option value="">All games</option>
        <option value="wordle">Wordle</option>
        <option value="crossword">Crossword</option>
      </select>
      <select v-model="category" class="admin-input">
        <option value="">All categories</option>
        <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
      </select>
    </div>

    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      {{ filtered.length.toLocaleString() }} matching entries
      <span v-if="filtered.length > DISPLAY_LIMIT">· showing first {{ DISPLAY_LIMIT }}</span>
    </p>

    <div class="overflow-x-auto">
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
          <tr v-for="entry in visibleEntries" :key="entry.id" class="border-b border-[hsl(var(--border))]/70">
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
              <div class="flex flex-wrap gap-2">
                <button type="button" class="text-xs font-semibold text-[hsl(var(--primary))]" @click="editWord(entry)">Edit</button>
                <button
                  v-if="originalOf(entry)"
                  type="button"
                  class="text-xs font-semibold text-amber-700"
                  @click="resetToBuiltIn(entry)"
                >
                  Reset
                </button>
                <button
                  v-else-if="isStored(entry)"
                  type="button"
                  class="text-xs font-semibold text-red-600"
                  @click="deleteWord(entry)"
                >
                  Delete
                </button>
              </div>
              <span class="mt-0.5 block text-xs text-[hsl(var(--muted-foreground))]">{{ sourceLabel(entry) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameWordTarget } from '~/types'
import type { GameWordEntry } from '~/types'
import {
  gameTargetsForAnswer,
  gameWordsFor,
  mergeGameWords,
  normalizeGameWord,
  replacedBuiltIn,
  SATSANG_WORD_BANK
} from '~/utils/gameWordBank'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const DISPLAY_LIMIT = 200
const search = ref('')
const game = ref<'' | GameWordTarget>('')
const category = ref('')
const editingId = ref('')
/** Answer of the built-in word being superseded, empty for a plain custom word. */
const replacing = ref('')
const formError = ref('')
const form = reactive({ display: '', clue: '', category: 'satsang' })
const { items, loading, saving, error, fetchAll, create, updateItem, remove } = useAdminGameWords()

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
const previewAnswer = computed(() => normalizeGameWord(form.display))
const previewGames = computed(() => gameTargetsForAnswer(previewAnswer.value))

const filtered = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return allEntries.value.filter((entry) => {
    if (game.value && !entry.games.includes(game.value)) return false
    if (category.value && entry.category !== category.value) return false
    if (!query) return true
    return `${entry.answer} ${entry.display} ${entry.clue} ${entry.category}`.toLocaleLowerCase().includes(query)
  })
})

const visibleEntries = computed(() => filtered.value.slice(0, DISPLAY_LIMIT))

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

const formHeading = computed(() => {
  if (replacing.value) return 'Correct built-in word'
  return editingId.value ? 'Edit custom word' : 'Add custom word'
})

const submitLabel = computed(() => {
  if (replacing.value) return editingId.value ? 'Update correction' : 'Save correction'
  return editingId.value ? 'Update word' : 'Add to word bank'
})

function resetForm() {
  editingId.value = ''
  replacing.value = ''
  formError.value = ''
  Object.assign(form, { display: '', clue: '', category: 'satsang' })
}

/**
 * Editing a built-in word does not touch the generated bank. It opens the form
 * as a new override that supersedes that word, so the change is a Firebase
 * document the mandir can undo with Reset.
 */
function editWord(entry: GameWordEntry) {
  const builtIn = entry.source !== 'Custom' && entry.source !== 'Edited'
  editingId.value = builtIn ? '' : entry.id
  replacing.value = builtIn ? entry.answer : normalizeGameWord(entry.replaces || '')
  formError.value = ''
  Object.assign(form, { display: entry.display, clue: entry.clue, category: entry.category })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** Drops an override so the generated built-in word applies again. */
async function resetToBuiltIn(entry: GameWordEntry) {
  const original = replacedBuiltIn(entry)
  if (!original) return
  if (!confirm(`Restore ${original.display} to the built-in spelling?`)) return
  try {
    await remove(entry.id)
    if (editingId.value === entry.id) resetForm()
  } catch {
    // Shared admin composable exposes the Firebase error above.
  }
}

async function saveWord() {
  formError.value = ''
  const answer = previewAnswer.value
  if (answer.length < 3 || answer.length > 24) {
    formError.value = 'The game answer must contain between 3 and 24 letters.'
    return
  }
  // The built-in being superseded is still listed until the override saves,
  // so it must not count against itself as a duplicate.
  const duplicate = allEntries.value.find(entry =>
    entry.answer === answer
    && entry.id !== editingId.value
    && entry.answer !== replacing.value
  )
  if (duplicate) {
    formError.value = `${answer} is already in the word bank.`
    return
  }
  const payload = {
    answer,
    display: form.display.trim(),
    clue: form.clue.trim(),
    category: form.category.trim().toLowerCase() || 'custom',
    source: replacing.value ? 'Edited' : 'Custom',
    games: gameTargetsForAnswer(answer),
    replaces: replacing.value || ''
  }
  try {
    if (editingId.value) await updateItem(editingId.value, payload)
    else await create(payload)
    resetForm()
  } catch {
    // Shared admin composable exposes the Firebase error above.
  }
}

async function deleteWord(entry: GameWordEntry) {
  if (!confirm(`Delete ${entry.display} from the custom word bank?`)) return
  try {
    await remove(entry.id)
    if (editingId.value === entry.id) resetForm()
  } catch {
    // Shared admin composable exposes the Firebase error above.
  }
}

onMounted(fetchAll)

useHead({ title: 'Game Word Bank · Admin' })
</script>
