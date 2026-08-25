<template>
  <div class="space-y-4">
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Game releases</h1>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          Decide which games are out. Launch with a few, then let the rest unlock themselves on the
          dates you set here — no deploy, and nothing to remember on the day.
        </p>
      </div>
      <p class="rounded-full bg-[hsl(var(--muted))] px-4 py-1.5 text-sm font-semibold text-[hsl(var(--primary))]">
        {{ liveCount }} playable now
      </p>
    </div>

    <div class="admin-panel divide-y divide-[hsl(var(--border))] p-0">
      <div v-for="entry in entries" :key="entry.slug" class="px-5 py-4">
        <div class="flex flex-wrap items-center gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-semibold text-[hsl(var(--primary))]">{{ entry.title }}</p>
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                :class="stateChip(entry).class"
              >
                {{ stateChip(entry).label }}
              </span>
            </div>
            <p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{{ entry.href }}</p>
          </div>

          <div class="w-full sm:w-44">
            <label class="admin-label" :for="`status-${entry.slug}`">Status</label>
            <select :id="`status-${entry.slug}`" v-model="entry.status" class="admin-input">
              <option v-for="option in GAME_RELEASE_STATUSES" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div v-if="entry.status === 'scheduled'" class="w-full sm:w-64">
            <label class="admin-label" :for="`release-${entry.slug}`">Unlocks (your local time)</label>
            <input
              :id="`release-${entry.slug}`"
              type="datetime-local"
              class="admin-input"
              :value="toLocalInput(entry.releaseAt)"
              @input="setReleaseAt(entry, ($event.target as HTMLInputElement).value)"
            >
          </div>
        </div>

        <div class="mt-2 flex flex-wrap items-center gap-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">{{ hintFor(entry) }}</p>
          <button
            v-if="entry.status !== 'live'"
            type="button"
            class="admin-btn-secondary"
            @click="releaseNow(entry)"
          >
            Release now
          </button>
        </div>
      </div>
    </div>

    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      A scheduled game is listed on the Games page as a locked “Coming soon” row with its date, and
      unlocks itself on the minute. A hidden game is not listed at all. To take the whole Games area
      down instead, use
      <NuxtLink to="/admin/content/sections" class="font-semibold text-[hsl(var(--golden-900))] underline">Sections</NuxtLink>.
    </p>

    <button type="button" class="admin-btn" :disabled="saving" @click="saveReleases">
      {{ saving ? 'Saving…' : 'Save game releases' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { GameReleaseContent } from '~/types'
import {
  formatReleaseAt,
  GAME_RELEASE_STATUSES,
  gameReleasesFromSource,
  isGameReleased,
  parseReleaseAt
} from '~/data/gameReleases'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { item, saving, error, load, save } = useAdminSiteContent()
const entries = ref<GameReleaseContent[]>(gameReleasesFromSource(undefined))
const now = ref(Date.now())

const liveCount = computed(() => entries.value.filter(entry => isGameReleased(entry, now.value)).length)

function fill() {
  entries.value = item.value.gameReleases.map(entry => ({ ...entry, paths: [...entry.paths] }))
  now.value = Date.now()
}

/** ISO instant to the `YYYY-MM-DDTHH:mm` a datetime-local input expects, in the admin's own timezone. */
function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function setReleaseAt(entry: GameReleaseContent, value: string) {
  entry.releaseAt = value ? parseReleaseAt(value) : null
}

function releaseNow(entry: GameReleaseContent) {
  entry.status = 'live'
  entry.releaseAt = null
  now.value = Date.now()
}

function stateChip(entry: GameReleaseContent) {
  if (isGameReleased(entry, now.value)) return { label: 'Playable', class: 'bg-emerald-100 text-emerald-700' }
  if (entry.status === 'scheduled') return { label: 'Coming soon', class: 'bg-amber-100 text-amber-800' }
  return { label: 'Hidden', class: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]' }
}

function hintFor(entry: GameReleaseContent) {
  if (entry.status === 'live') return 'Playable now.'
  if (entry.status === 'hidden') return 'Not listed, and its page sends devotees back to Games.'
  if (!entry.releaseAt) return 'Set a date — a scheduled game with no date stays locked.'
  return isGameReleased(entry, now.value)
    ? `Released ${formatReleaseAt(entry.releaseAt)} — already playable.`
    : `Unlocks ${formatReleaseAt(entry.releaseAt)}.`
}

async function saveReleases() {
  // A scheduled game with no date would never open, which is never what was meant.
  const undated = entries.value.find(entry => entry.status === 'scheduled' && !entry.releaseAt)
  if (undated) {
    error.value = `${undated.title} is scheduled but has no release date. Set one, or mark it hidden.`
    return
  }
  await save({ gameReleases: entries.value })
  fill()
}

onMounted(async () => {
  await load()
  fill()
})

useHead({ title: 'Game releases · Admin' })
</script>
