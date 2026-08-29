<template>
  <section class="admin-panel border-red-200">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="font-display text-lg font-semibold text-red-800">Launch reset</h2>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Wipe every player’s game scores, streaks, completions, achievements and crowns,
          plus every niyam submission and shared total — so the app launches with a clean slate.
          Puzzle content, published niyam challenges, timeline and events are not touched.
        </p>
      </div>
    </div>

    <ul class="mt-4 list-disc space-y-1 pl-5 text-sm text-[hsl(var(--muted-foreground))]">
      <li>Game leaderboards (<code class="text-xs">gameScores</code>, legacy Wordle scores)</li>
      <li>Play streaks and “done today” markers</li>
      <li>Achievements and all-time crowns</li>
      <li>Niyam submissions and challenge totals</li>
      <li>Legacy mandir visit records</li>
    </ul>

    <div class="mt-5 space-y-3">
      <div>
        <label for="launch-reset-confirm" class="admin-label">
          Type <span class="font-mono text-red-800">{{ PHRASE }}</span> to enable the wipe
        </label>
        <input
          id="launch-reset-confirm"
          v-model="typed"
          type="text"
          autocomplete="off"
          class="admin-input font-mono"
          :placeholder="PHRASE"
          :disabled="busy"
        >
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="admin-btn-danger"
          :disabled="!canWipe || busy"
          @click="confirmOpen = true"
        >
          {{ busy ? 'Wiping…' : 'Wipe player data' }}
        </button>
        <p v-if="!canWipe" class="text-xs text-[hsl(var(--muted-foreground))]">
          Confirmation phrase required.
        </p>
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <div v-if="result" class="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
        <p class="font-semibold">Wipe complete</p>
        <ul class="mt-1 space-y-0.5 font-mono text-xs">
          <li v-for="(count, name) in result.removed" :key="name">
            {{ name }}: {{ count }}
          </li>
        </ul>
        <p class="mt-2 text-xs">
          Deploy Cloud Functions before using this on production. Players’ devices clear local
          game progress automatically on the next visit (word-bank version bump).
        </p>
      </div>
    </div>

    <AdminConfirmDialog
      :open="confirmOpen"
      title="Wipe all player game and niyam data?"
      body="This cannot be undone. Leaderboards, streaks, achievements and niyam counts will be empty for every account."
      confirm-label="Wipe everything"
      danger
      @confirm="runWipe"
      @cancel="confirmOpen = false"
    />
  </section>
</template>

<script setup lang="ts">
import { getApp } from 'firebase/app'
import { getFunctions, httpsCallable } from 'firebase/functions'

const PHRASE = 'RESET FOR LAUNCH'

const typed = ref('')
const busy = ref(false)
const error = ref('')
const confirmOpen = ref(false)
const result = ref<{ removed: Record<string, number> } | null>(null)

const canWipe = computed(() => typed.value.trim() === PHRASE)

async function runWipe() {
  confirmOpen.value = false
  if (!canWipe.value || busy.value) return
  busy.value = true
  error.value = ''
  result.value = null
  try {
    const call = httpsCallable<{ confirm: string }, { ok: boolean; removed: Record<string, number> }>(
      getFunctions(getApp(), 'europe-west2'),
      'wipeLaunchPlayerData'
    )
    const response = await call({ confirm: PHRASE })
    result.value = { removed: response.data.removed || {} }
    typed.value = ''
  } catch (e) {
    error.value = (e as { message?: string })?.message || 'Wipe failed.'
  } finally {
    busy.value = false
  }
}
</script>
