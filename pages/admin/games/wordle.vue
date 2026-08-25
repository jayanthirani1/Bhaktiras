<template>
  <div class="space-y-4">
    <div class="admin-panel space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Daily schedule</h2>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            The planned word is what everyone plays that UK day. Leave a day blank to use the built-in rotation shown here.
          </p>
        </div>
        <div class="flex gap-2">
          <button type="button" :class="range === 'week' ? 'admin-btn' : 'admin-btn-secondary'" @click="setRange('week')">Week</button>
          <button type="button" :class="range === 'month' ? 'admin-btn' : 'admin-btn-secondary'" @click="setRange('month')">Month</button>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3">
        <button type="button" class="admin-btn-secondary" @click="shift(-1)">‹ Prev</button>
        <p class="text-center text-sm font-semibold text-[hsl(var(--primary))]">{{ rangeLabel }}</p>
        <button type="button" class="admin-btn-secondary" @click="shift(1)">Next ›</button>
      </div>

      <p v-if="dailyMsg" class="text-sm" :class="dailyOk ? 'text-emerald-600' : 'text-red-600'">{{ dailyMsg }}</p>
      <p v-if="duplicateWarning" class="text-sm text-amber-700">{{ duplicateWarning }}</p>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr class="border-b border-[hsl(var(--border))] text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              <th class="py-2 pr-3 font-semibold">Date</th>
              <th class="py-2 pr-3 font-semibold">Planned word</th>
              <th class="py-2 pr-3 font-semibold">If left blank</th>
              <th class="py-2 pr-3 font-semibold">Players get</th>
              <th class="py-2 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in days" :key="day.id" class="border-b border-[hsl(var(--border))]/70">
              <td class="py-2 pr-3 align-middle">
                <p class="font-semibold text-[hsl(var(--primary))]">
                  {{ day.weekday }}
                  <span v-if="day.isToday" class="ml-1 rounded-full bg-[hsl(var(--golden-50))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--golden-900))]">Today</span>
                </p>
                <p class="text-xs text-[hsl(var(--muted-foreground))]">{{ day.label }}</p>
              </td>
              <td class="py-2 pr-3 align-middle">
                <input
                  v-model="day.word"
                  maxlength="5"
                  class="admin-input w-32 uppercase"
                  :placeholder="day.fallback"
                  @keydown.enter.prevent="saveDay(day)"
                >
              </td>
              <td class="py-2 pr-3 align-middle font-mono text-xs uppercase text-[hsl(var(--muted-foreground))]">
                {{ day.fallback }}
              </td>
              <td class="py-2 pr-3 align-middle font-mono text-xs font-semibold uppercase text-[hsl(var(--primary))]">
                {{ (day.savedWord || day.fallback) }}
              </td>
              <td class="py-2 align-middle">
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="admin-btn" :disabled="savingDaily" @click="saveDay(day)">Save</button>
                  <button v-if="day.savedWord" type="button" class="admin-btn-danger" :disabled="savingDaily" @click="clearDay(day)">Clear</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="admin-btn" :disabled="savingDaily" @click="saveAll">
          {{ savingDaily ? 'Saving…' : `Save ${range}’s words` }}
        </button>
        <button type="button" class="admin-btn-secondary" @click="goToday">Jump to today</button>
      </div>
    </div>

    <div class="admin-panel space-y-4">
      <div>
        <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Solution list</h2>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Extra 5-letter words allowed as guesses (and as planned answers). They do not change the blank-day rotation. {{ sortedWords.length }} extra word{{ sortedWords.length === 1 ? '' : 's' }}.
        </p>
      </div>
      <form class="flex flex-wrap items-end gap-2" @submit.prevent="addWord">
        <div>
          <label class="admin-label">5-letter word</label>
          <input v-model="newWord" maxlength="5" required class="admin-input w-32 uppercase" placeholder="AARTI">
        </div>
        <button type="submit" class="admin-btn" :disabled="saving">Add</button>
      </form>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <ul class="flex flex-wrap gap-2">
        <li v-for="w in sortedWords" :key="w.id" class="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-semibold uppercase">
          {{ w.word }}
          <button type="button" class="text-red-500 hover:text-red-700" @click="remove(w.id)">×</button>
        </li>
      </ul>
      <p v-if="!loading && !sortedWords.length" class="text-sm text-[hsl(var(--muted-foreground))]">No extra words yet. Built-in list still works.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { deleteDoc, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore'
import { addWordleDays, getWordForDateId, mondayOfWordleWeek, wordleDateId } from '~/utils/wordleDaily'

definePageMeta({ layout: 'admin', middleware: 'admin' })

type DayRow = {
  id: string
  weekday: string
  label: string
  isToday: boolean
  fallback: string
  word: string
  savedWord: string
}

const { items, loading, saving, error, fetchAll, create, remove } = useAdminWordleWords()
const newWord = ref('')
const range = ref<'week' | 'month'>('week')
const cursorId = ref(wordleDateId())
const days = ref<DayRow[]>([])
const savingDaily = ref(false)
const dailyMsg = ref('')
const dailyOk = ref(false)

const sortedWords = computed(() =>
  [...items.value].sort((a, b) => String(a.word).localeCompare(String(b.word)))
)

const rangeLabel = computed(() => {
  if (!days.value.length) return ''
  if (range.value === 'week') {
    return `${days.value[0].label} – ${days.value[days.value.length - 1].label}`
  }
  const dt = new Date(`${cursorId.value}T12:00:00Z`)
  return dt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
})

const duplicateWarning = computed(() => {
  const used = new Map<string, string[]>()
  for (const day of days.value) {
    const word = day.word.trim().toUpperCase()
    if (word.length !== 5) continue
    const list = used.get(word) || []
    list.push(day.weekday)
    used.set(word, list)
  }
  const dups = [...used.entries()].filter(([, dates]) => dates.length > 1)
  if (!dups.length) return ''
  return dups.map(([word, dates]) => `${word} is planned on ${dates.join(', ')}`).join('. ')
})

function getDb() {
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

function formatDay(id: string) {
  const dt = new Date(`${id}T12:00:00Z`)
  return {
    weekday: dt.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
    label: dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  }
}

function buildIds(): string[] {
  if (range.value === 'week') {
    const start = mondayOfWordleWeek(cursorId.value)
    return Array.from({ length: 7 }, (_, i) => addWordleDays(start, i))
  }
  const [y, m] = cursorId.value.split('-').map(Number)
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from({ length: last }, (_, i) => addWordleDays(start, i))
}

function rebuildDays() {
  const todayId = wordleDateId()
  days.value = buildIds().map((id) => {
    const meta = formatDay(id)
    return {
      id,
      weekday: meta.weekday,
      label: meta.label,
      isToday: id === todayId,
      fallback: getWordForDateId(id),
      word: '',
      savedWord: ''
    }
  })
}

async function loadSaved() {
  const db = getDb()
  if (!db) return
  await Promise.all(days.value.map(async (day) => {
    const snap = await getDoc(doc(db, 'wordleDaily', day.id))
    if (snap.exists()) {
      const word = String(snap.data().word || '').toUpperCase()
      day.word = word
      day.savedWord = word
    } else {
      day.word = ''
      day.savedWord = ''
    }
  }))
}

async function refreshSchedule() {
  rebuildDays()
  await loadSaved()
}

function validWord(raw: string) {
  const word = raw.trim().toUpperCase()
  return word.length === 5 && /^[A-Z]+$/.test(word) ? word : null
}

async function saveDay(day: DayRow) {
  const word = validWord(day.word)
  if (!word) {
    dailyMsg.value = `${day.label}: use exactly 5 letters A–Z.`
    dailyOk.value = false
    return
  }
  const db = getDb()
  if (!db) return
  savingDaily.value = true
  dailyMsg.value = ''
  try {
    await setDoc(doc(db, 'wordleDaily', day.id), { word, date: day.id })
    day.word = word
    day.savedWord = word
    dailyMsg.value = `${day.weekday} ${day.label} → ${word}`
    dailyOk.value = true
  } catch (e) {
    dailyMsg.value = (e as Error).message
    dailyOk.value = false
  } finally {
    savingDaily.value = false
  }
}

async function clearDay(day: DayRow) {
  const db = getDb()
  if (!db) return
  savingDaily.value = true
  try {
    await deleteDoc(doc(db, 'wordleDaily', day.id))
    day.word = ''
    day.savedWord = ''
    dailyMsg.value = `${day.weekday} cleared — rotation ${day.fallback} will be used.`
    dailyOk.value = true
  } catch (e) {
    dailyMsg.value = (e as Error).message
    dailyOk.value = false
  } finally {
    savingDaily.value = false
  }
}

async function saveAll() {
  const planned = days.value
    .map(day => ({ day, word: validWord(day.word) }))
    .filter((row): row is { day: DayRow; word: string } => !!row.word)
  if (!planned.length) {
    dailyMsg.value = 'Enter at least one 5-letter word to save.'
    dailyOk.value = false
    return
  }
  const db = getDb()
  if (!db) return
  savingDaily.value = true
  dailyMsg.value = ''
  try {
    await Promise.all(planned.map(({ day, word }) =>
      setDoc(doc(db, 'wordleDaily', day.id), { word, date: day.id })
    ))
    for (const { day, word } of planned) {
      day.word = word
      day.savedWord = word
    }
    dailyMsg.value = `Saved ${planned.length} planned word${planned.length === 1 ? '' : 's'}.`
    dailyOk.value = true
  } catch (e) {
    dailyMsg.value = (e as Error).message
    dailyOk.value = false
  } finally {
    savingDaily.value = false
  }
}

function setRange(next: 'week' | 'month') {
  range.value = next
  cursorId.value = wordleDateId()
}

function shift(step: number) {
  if (range.value === 'week') {
    cursorId.value = addWordleDays(mondayOfWordleWeek(cursorId.value), step * 7)
    return
  }
  const [y, m] = cursorId.value.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1 + step, 1))
  cursorId.value = dt.toISOString().slice(0, 10)
}

function goToday() {
  cursorId.value = wordleDateId()
}

async function addWord() {
  const word = newWord.value.trim().toUpperCase()
  if (word.length !== 5 || !/^[A-Z]+$/.test(word)) {
    error.value = 'Use exactly 5 letters A–Z.'
    return
  }
  if (items.value.some(w => w.word === word)) {
    error.value = 'That word is already in the list.'
    return
  }
  await create({ word })
  newWord.value = ''
}

watch([range, cursorId], () => { refreshSchedule() })

onMounted(async () => {
  await fetchAll()
  await refreshSchedule()
})

useHead({ title: 'Wordle · Admin' })
</script>
