<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-3 pb-24 pt-0 md:px-4 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <div class="sticky top-0 z-40 -mx-3 mb-4 flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-3 py-2 backdrop-blur md:top-16 md:-mx-4 md:px-4">
        <NuxtLink to="/play" class="rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
          ‹ Back
        </NuxtLink>
        <span class="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-sm font-semibold tabular-nums text-[hsl(var(--primary))]">
          ⏱ {{ timer.display.value }}
        </span>
      </div>

      <PageHeader title="Connections" subtitle="Find four groups of four satsang-related words." />

      <GamePlayedElsewhere
        v-if="playedElsewhere"
        title="Connections"
        :summary="elsewhereSummary"
      />
      <div v-else-if="loading || !howto.ready.value" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading today’s puzzle…
      </div>
      <GameHowTo
        v-else-if="howto.showIntro.value"
        intro
        title="Find four groups of four words."
        @start="beginAfterHowTo"
      >
        <ol class="list-decimal space-y-2 pl-5">
          <li>Select <span class="font-semibold text-[hsl(var(--foreground))]">four words</span> that share a satsang theme, then tap Submit.</li>
          <li>You can make <span class="font-semibold text-[hsl(var(--foreground))]">four mistakes</span>. A fifth wrong group ends the puzzle.</li>
          <li>Solved groups lock in and leave the board. Shuffle if you need a fresh look.</li>
        </ol>
      </GameHowTo>
      <div v-else class="space-y-4">
        <div class="space-y-2">
          <div
            v-for="group in solvedGroups"
            :key="group.difficulty"
            class="rounded-xl px-3 py-4 text-center"
            :class="groupClass(group.difficulty)"
          >
            <p class="font-bold uppercase tracking-wide">{{ group.title }}</p>
            <p class="mt-1 text-sm font-medium">{{ group.words.join(', ') }}</p>
          </div>
        </div>

        <div v-if="!finished" class="grid grid-cols-4 gap-1.5 sm:gap-2">
          <button
            v-for="word in remainingWords"
            :key="word"
            type="button"
            class="flex aspect-[1.25/1] min-w-0 items-center justify-center rounded-lg px-1 py-0.5 text-center text-[10px] font-bold uppercase leading-tight transition-all sm:aspect-[1.55/1] sm:px-2 sm:text-sm"
            :class="selected.includes(word)
              ? 'scale-[0.96] bg-[hsl(var(--primary))] text-white'
              : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]'"
            @click="toggleWord(word)"
          >
            <span class="w-full min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]">{{ word }}</span>
          </button>
        </div>

        <div v-if="!finished" class="text-center">
          <p class="text-sm font-medium text-[hsl(var(--muted-foreground))]">Mistakes remaining</p>
          <div class="mt-2 flex justify-center gap-2" aria-label="Mistakes remaining">
            <span v-for="i in 4" :key="i" class="h-3 w-3 rounded-full" :class="i <= mistakesRemaining ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--border))]'" />
          </div>
          <p v-if="feedback" class="mt-3 text-sm font-semibold" :class="feedbackOk ? 'text-emerald-700' : 'text-amber-700'">{{ feedback }}</p>
        </div>

        <div v-if="!finished" class="flex flex-wrap justify-center gap-2">
          <button type="button" class="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold" @click="shuffleWords">Shuffle</button>
          <button type="button" class="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold" :disabled="!selected.length" @click="selected = []">Deselect all</button>
          <button
            type="button"
            class="rounded-full bg-[hsl(var(--primary))] px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            :disabled="selected.length !== 4 || checking"
            @click="submitSelection"
          >
            Submit
          </button>
        </div>

        <div v-else class="card-surface space-y-3 p-6 text-center">
          <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">
            {{ won ? 'Perfect connections!' : 'Better luck tomorrow' }}
          </h2>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">
            {{ solvedGroups.length }}/4 groups · {{ mistakes }} mistake{{ mistakes === 1 ? '' : 's' }} · {{ timer.display.value }}
          </p>
          <button
            v-if="isLoggedIn && !scoreSubmitted"
            type="button"
            class="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            :disabled="submitting"
            @click="submitToLeaderboard"
          >
            {{ submitting ? 'Submitting…' : 'Submit to leaderboard' }}
          </button>
          <NuxtLink v-else-if="!isLoggedIn && !scoreSubmitted" to="/login?redirect=/play/connections" class="text-sm font-semibold text-[hsl(var(--primary))] underline">
            Sign in to submit your result
          </NuxtLink>
          <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
        </div>

        <GameHowTo>
          <ol class="list-decimal space-y-2 pl-5">
            <li>Select <span class="font-semibold text-[hsl(var(--foreground))]">four words</span> that share a satsang theme, then tap Submit.</li>
            <li>You can make <span class="font-semibold text-[hsl(var(--foreground))]">four mistakes</span>. A fifth wrong group ends the puzzle.</li>
            <li>Solved groups lock in and leave the board. Shuffle if you need a fresh look.</li>
          </ol>
        </GameHowTo>

        <GameLeaderboard
          :entries="entries"
          :loading="boardLoading"
          :date-id="dateId"
          :current-user-id="auth.user.value?.uid"
          game="connections"
          :format-score="formatBoardScore"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConnectionsGroup } from '~/types'
import { ukDateId } from '~/utils/gameDay'
import { formatElapsed } from '~/composables/useGameTimer'

const STORAGE_KEY = `connections:${ukDateId()}`
const { puzzle, loading } = useConnectionsPuzzle()
const timer = useGameTimer(`connections-timer:${ukDateId()}`)
const howto = useHowToPlay('connections', ['connections:', 'connections-timer:'])
const auth = useAuth()
const achievements = useAchievements()
const isLoggedIn = computed(() => !!auth.user.value)
const { playedElsewhere, result: elsewhereResult, markDone } = useDailyGameCompletion('connections')
const { entries, loading: boardLoading, dateId, submitScore } = useGameLeaderboard('connections', { sort: 'asc' })

const remainingWords = ref<string[]>([])
const selected = ref<string[]>([])
const solvedDifficulties = ref<number[]>([])
const mistakes = ref(0)
const finished = ref(false)
const won = ref(false)
const checking = ref(false)
const feedback = ref('')
const feedbackOk = ref(false)
const scoreSubmitted = ref(false)
const submitting = ref(false)
const submitError = ref('')

const allGroups = computed(() => [...puzzle.value.groups].sort((a, b) => a.difficulty - b.difficulty))
const solvedGroups = computed(() =>
  allGroups.value.filter(group => solvedDifficulties.value.includes(group.difficulty))
)
const mistakesRemaining = computed(() => Math.max(0, 4 - mistakes.value))
const elsewhereSummary = computed(() => {
  const result = elsewhereResult.value
  return [result?.detail, result?.timeMs != null ? formatElapsed(result.timeMs) : ''].filter(Boolean).join(' · ')
})

function seededWords() {
  const words = puzzle.value.groups.flatMap(group => group.words)
  let seed = [...`${ukDateId()}:${puzzle.value.id}`].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
  const out = [...words]
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      puzzleId: puzzle.value.id,
      remainingWords: remainingWords.value,
      solvedDifficulties: solvedDifficulties.value,
      mistakes: mistakes.value,
      finished: finished.value,
      won: won.value,
      scoreSubmitted: scoreSubmitted.value
    }))
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (data.puzzleId !== puzzle.value.id) return false
    remainingWords.value = Array.isArray(data.remainingWords) ? data.remainingWords : seededWords()
    solvedDifficulties.value = Array.isArray(data.solvedDifficulties) ? data.solvedDifficulties : []
    mistakes.value = Number(data.mistakes) || 0
    finished.value = !!data.finished
    won.value = !!data.won
    scoreSubmitted.value = !!data.scoreSubmitted
    return true
  } catch {
    return false
  }
}

function toggleWord(word: string) {
  if (finished.value || checking.value) return
  timer.ensureStarted()
  const index = selected.value.indexOf(word)
  if (index >= 0) selected.value.splice(index, 1)
  else if (selected.value.length < 4) selected.value.push(word)
}

function shuffleWords() {
  timer.ensureStarted()
  remainingWords.value = [...remainingWords.value].sort(() => Math.random() - 0.5)
  saveState()
}

function groupClass(difficulty: number) {
  return [
    'bg-amber-300 text-amber-950',
    'bg-emerald-400 text-emerald-950',
    'bg-sky-400 text-sky-950',
    'bg-violet-400 text-violet-950'
  ][difficulty] || 'bg-[hsl(var(--muted))]'
}

function finish(didWin: boolean) {
  const groupsFound = solvedDifficulties.value.length
  finished.value = true
  won.value = didWin
  timer.stop()
  if (!didWin) {
    solvedDifficulties.value = allGroups.value.map(group => group.difficulty)
    remainingWords.value = []
  }
  saveState()
  void markDone({
    score: mistakes.value,
    timeMs: timer.elapsedMs.value,
    detail: didWin ? `${mistakes.value} mistake${mistakes.value === 1 ? '' : 's'}` : `${groupsFound}/4 groups`
  })
}

function submitSelection() {
  if (selected.value.length !== 4 || checking.value) return
  checking.value = true
  const chosen = new Set(selected.value.map(word => word.toLocaleLowerCase()))
  const match = allGroups.value.find(group =>
    !solvedDifficulties.value.includes(group.difficulty)
    && group.words.every(word => chosen.has(word.toLocaleLowerCase()))
  )

  if (match) {
    feedbackOk.value = true
    feedback.value = 'Connection found!'
    solvedDifficulties.value.push(match.difficulty)
    remainingWords.value = remainingWords.value.filter(word => !chosen.has(word.toLocaleLowerCase()))
    selected.value = []
    saveState()
    setTimeout(() => {
      feedback.value = ''
      checking.value = false
      if (solvedDifficulties.value.length === 4) finish(true)
    }, 550)
    return
  }

  const oneAway = allGroups.value.some(group => {
    if (solvedDifficulties.value.includes(group.difficulty)) return false
    return group.words.filter(word => chosen.has(word.toLocaleLowerCase())).length === 3
  })
  mistakes.value += 1
  feedbackOk.value = false
  feedback.value = oneAway ? 'One away…' : 'Not quite'
  selected.value = []
  saveState()
  setTimeout(() => {
    feedback.value = ''
    checking.value = false
    if (mistakes.value >= 4) finish(false)
  }, 700)
}

function formatBoardScore(entry: { score?: number; timeMs?: number }) {
  const time = entry.timeMs != null ? ` · ${formatElapsed(entry.timeMs)}` : ''
  return `${entry.score ?? 0} mistake${entry.score === 1 ? '' : 's'}${time}`
}

async function submitToLeaderboard() {
  if (!auth.user.value || scoreSubmitted.value || submitting.value || !finished.value) return
  submitting.value = true
  submitError.value = ''
  try {
    await submitScore({
      score: mistakes.value,
      timeMs: timer.elapsedMs.value,
      detail: won.value ? 'Solved' : `${solvedGroups.value.length}/4 groups`,
      userId: auth.user.value.uid,
      userName: auth.user.value.displayName || auth.user.value.email?.split('@')[0] || 'Player',
      userEmail: auth.user.value.email || undefined
    })
    try {
      await achievements.processResult('connections', {
        won: won.value,
        mistakes: mistakes.value,
        timeMs: timer.elapsedMs.value,
        userName: auth.user.value.displayName || auth.user.value.email?.split('@')[0] || 'Player'
      })
    } catch {}
    scoreSubmitted.value = true
    saveState()
  } catch (error) {
    submitError.value = (error as Error).message
  } finally {
    submitting.value = false
  }
}

watch([finished, () => auth.user.value?.uid], ([done, uid]) => {
  if (done && uid && !scoreSubmitted.value && !submitting.value) {
    void submitToLeaderboard()
  }
}, { immediate: true })

function beginAfterHowTo() {
  howto.markSeen()
  syncPlayTimer()
}

function syncPlayTimer() {
  if (!howto.ready.value || howto.showIntro.value) return
  if (loading.value || playedElsewhere.value) return
  if (finished.value) {
    timer.read()
    if (timer.startedAt.value && !timer.finishedAt.value) timer.stop()
    return
  }
  timer.loadOrStart()
}

watch(loading, value => {
  if (value) return
  if (!loadState()) remainingWords.value = seededWords()
  syncPlayTimer()
}, { immediate: true })

watch([playedElsewhere, () => howto.ready.value, () => howto.showIntro.value], () => { syncPlayTimer() })

useHead({ title: 'Connections · Bhaktiras' })
</script>
