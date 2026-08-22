<template>
  <section class="admin-panel">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Reset today’s games</h2>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Replay a puzzle while testing. This clears <em>your own</em> play of that game for
          {{ formatUkDateLabel(dateId) }} — progress on this device, the synced “done today” marker,
          and your row on today’s leaderboard. Nobody else’s play is touched.
        </p>
      </div>
      <span v-if="!isLoggedIn" class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        Signed out — local only
      </span>
    </div>

    <ul class="mt-4 divide-y divide-[hsl(var(--border))]">
      <li v-for="game in games" :key="game.slug" class="flex items-center justify-between gap-3 py-2.5">
        <div class="min-w-0">
          <p class="font-semibold text-[hsl(var(--foreground))]">{{ game.title }}</p>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">
            <span v-if="busy === game.slug">Resetting…</span>
            <span v-else-if="cleared[game.slug]" class="font-semibold text-emerald-700">Reset — open the game to play it again</span>
            <span v-else-if="done[game.slug]">{{ resultLine(game.slug) }}</span>
            <span v-else>Not played yet today</span>
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <NuxtLink :to="game.href" class="admin-btn-secondary">Open</NuxtLink>
          <button
            type="button"
            class="admin-btn-danger"
            :disabled="!!busy || (!done[game.slug] && !cleared[game.slug])"
            @click="reset(game.slug)"
          >
            Reset
          </button>
        </div>
      </li>
    </ul>

    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
import { deleteDoc, doc, type Firestore } from 'firebase/firestore'
import type { PlayGameSlug } from '~/utils/playCompletion'
import { formatUkDateLabel, ukDateId } from '~/utils/gameDay'
import { formatElapsed } from '~/composables/useGameTimer'

const games: Array<{ slug: PlayGameSlug; title: string; href: string }> = [
  { slug: 'wordle', title: 'Wordle', href: '/play/wordle' },
  { slug: 'mini-crossword', title: 'Crossword', href: '/play/crossword' },
  { slug: 'one-percent', title: '1% Club', href: '/play/one-percent' },
  { slug: 'connections', title: 'Connections', href: '/play/connections' },
  { slug: 'bracket-city', title: 'Bracket City', href: '/play/bracket-city' },
  { slug: 'bhakti-marg', title: 'Surya Chandra', href: '/play/surya-chandra' },
  { slug: 'ras-rani', title: 'Ras Rani', href: '/play/ras-rani' }
]

function legacyScoreIds(slug: PlayGameSlug, dateId: string, uid: string): string[] {
  if (slug !== 'bhakti-marg') return []
  return [`surya-chandra_${dateId}_${uid}`, `surya-chandra_${uid}`]
}

const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const dateId = ukDateId()
const { done, results, refresh } = usePlayCompletion(games.map(game => game.slug))
const { clearGame } = usePlayCompletionStore()

const busy = ref<PlayGameSlug | null>(null)
const cleared = reactive({} as Record<PlayGameSlug, boolean>)
const error = ref('')

function resultLine(slug: PlayGameSlug) {
  const entry = results.value[slug]
  const parts = [entry?.detail, entry?.timeMs != null ? formatElapsed(entry.timeMs) : ''].filter(Boolean)
  return parts.length ? `Played — ${parts.join(' · ')}` : 'Played today'
}

/**
 * Removes the admin's own row from today's board so a replay can resubmit.
 * Score ids are deterministic, so this deletes by id rather than querying —
 * a three-field query would need a composite index, and this project cannot
 * create indexes from CI.
 */
async function clearOwnScore(slug: PlayGameSlug) {
  const uid = auth.user.value?.uid
  const db = useNuxtApp().$firebaseDb as Firestore | null
  if (!uid || !db) return
  await Promise.all(
    [`${slug}_${dateId}_${uid}`, `${slug}_${uid}`, ...legacyScoreIds(slug, dateId, uid)].map(async (id) => {
      try {
        await deleteDoc(doc(db, 'gameScores', id))
      } catch {
        // Never submitted, or the rules refused — the local reset still stands.
      }
    }))
}

async function reset(slug: PlayGameSlug) {
  if (busy.value) return
  busy.value = slug
  error.value = ''
  try {
    await clearGame(slug, dateId)
    await clearOwnScore(slug)
    cleared[slug] = true
    refresh()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = null
  }
}
</script>
