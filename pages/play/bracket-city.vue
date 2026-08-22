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

      <PageHeader title="Bracket City" subtitle="Solve the innermost clue first — each answer unlocks the one around it." />

      <GamePlayedElsewhere
        v-if="playedElsewhere"
        title="Bracket City"
        :summary="elsewhereSummary"
      />
      <div v-else-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading today’s puzzle…
      </div>
      <div v-else class="space-y-4">
        <div class="card-surface p-4 text-lg leading-loose text-[hsl(var(--foreground))] sm:p-6 sm:text-xl">
          <template v-for="(part, index) in parts" :key="index">
            <template v-if="typeof part === 'string'">{{ part }}</template>
            <BracketClue
              v-else
              :node="part"
              :solved-ids="solvedIds"
              :peeked-ids="peekedIds"
              :selected-id="selectedId"
              @select="selectClue"
            />
          </template>
        </div>

        <p class="text-center text-sm text-[hsl(var(--muted-foreground))]">
          {{ solvedIds.length }}/{{ nodes.length }} clues solved
          <span v-if="wrongGuesses"> · {{ wrongGuesses }} wrong guess{{ wrongGuesses === 1 ? '' : 'es' }}</span>
          <span v-if="peekedIds.length"> · {{ peekedIds.length }} peek{{ peekedIds.length === 1 ? '' : 's' }}</span>
        </p>

        <div v-if="!finished" class="card-surface space-y-3 p-4">
          <p v-if="selectedNode" class="text-sm text-[hsl(var(--muted-foreground))]">
            Answering: <span class="font-semibold text-[hsl(var(--foreground))]">{{ selectedClueText }}</span>
          </p>
          <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">
            Tap a highlighted clue to answer it.
          </p>

          <div class="flex gap-2">
            <input
              ref="guessInput"
              v-model="guess"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              enterkeyhint="done"
              maxlength="40"
              placeholder="Type your answer"
              class="min-w-0 flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-base font-semibold text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]"
              :class="shake ? 'animate-pulse border-red-500' : ''"
              :disabled="!selectedNode"
              @keydown.enter.prevent="submitGuess"
            >
            <button
              type="button"
              class="rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              :disabled="!selectedNode || !guess.trim()"
              @click="submitGuess"
            >
              Enter
            </button>
          </div>

          <p v-if="feedback" class="text-sm font-semibold" :class="feedbackOk ? 'text-emerald-700' : 'text-amber-700'">
            {{ feedback }}
          </p>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold disabled:opacity-40"
              :disabled="!selectedNode"
              @click="askHint('letter')"
            >
              Hint: letter (+5s)
            </button>
            <button
              type="button"
              class="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-semibold disabled:opacity-40"
              :disabled="!selectedNode"
              @click="askHint('word')"
            >
              Reveal answer (+20s)
            </button>
          </div>
        </div>

        <div v-else class="card-surface space-y-3 p-6 text-center">
          <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">
            {{ peekedIds.length ? 'Bracket City cleared' : 'Perfect run!' }}
          </h2>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">
            {{ resultSummary }}
          </p>
          <p v-if="puzzle.credit" class="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--golden-900))]">
            {{ puzzle.credit }}
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              class="rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white"
              @click="shareResult"
            >
              {{ shareCopied ? 'Copied!' : 'Share result' }}
            </button>
            <button
              v-if="isLoggedIn && !scoreSubmitted"
              type="button"
              class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              :disabled="submitting"
              @click="submitToLeaderboard"
            >
              {{ submitting ? 'Submitting…' : 'Submit to leaderboard' }}
            </button>
            <NuxtLink v-else-if="!isLoggedIn" to="/login?redirect=/play/bracket-city" class="self-center text-sm font-semibold text-[hsl(var(--primary))] underline">
              Sign in to submit your result
            </NuxtLink>
          </div>
          <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
        </div>

        <GameLeaderboard
          :entries="entries"
          :loading="boardLoading"
          :date-id="dateId"
          :current-user-id="auth.user.value?.uid"
          :format-score="formatBoardScore"
        />
      </div>

      <GameHintConfirm
        :open="!!pendingHint"
        :kind="pendingHint"
        @confirm="confirmHint"
        @cancel="pendingHint = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  answerMatches,
  clueText,
  flattenNodes,
  isActive,
  parseBracketSource,
  type BracketNode,
  type BracketPart
} from '~/utils/bracketCity'
import { ukDateId } from '~/utils/gameDay'
import { formatElapsed } from '~/composables/useGameTimer'

const STORAGE_KEY = `bracket-city:${ukDateId()}`
const { puzzle, loading } = useBracketCityPuzzle()
const timer = useGameTimer(`bracket-city-timer:${ukDateId()}`)
const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const { playedElsewhere, result: elsewhereResult, markDone } = useDailyGameCompletion('bracket-city')
const { entries, loading: boardLoading, dateId, submitScore } = useGameLeaderboard('bracket-city', { sort: 'asc' })

const solvedIds = ref<string[]>([])
const peekedIds = ref<string[]>([])
/** Clues that took a wrong guess or a letter hint — the 🟨 squares when sharing. */
const struggledIds = ref<string[]>([])
const hintLetters = ref<Record<string, number>>({})
const wrongGuesses = ref(0)
const selectedId = ref<string | null>(null)
const guess = ref('')
const feedback = ref('')
const feedbackOk = ref(false)
const shake = ref(false)
const shareCopied = ref(false)
const pendingHint = ref<'letter' | 'word' | null>(null)
const scoreSubmitted = ref(false)
const submitting = ref(false)
const submitError = ref('')
const guessInput = ref<HTMLInputElement | null>(null)

const parts = computed<BracketPart[]>(() => {
  try {
    return parseBracketSource(puzzle.value.source)
  } catch {
    // useBracketCityPuzzle only hands over sources it could parse; this keeps
    // the page blank rather than throwing if one ever slips through.
    return []
  }
})
const nodes = computed(() => flattenNodes(parts.value))
const solvedSet = computed(() => new Set(solvedIds.value))
const activeNodes = computed(() => nodes.value.filter(node => isActive(node, solvedSet.value)))
const selectedNode = computed(() => activeNodes.value.find(node => node.id === selectedId.value) || null)
const selectedClueText = computed(() => (selectedNode.value ? clueText(selectedNode.value, solvedSet.value) : ''))
const finished = computed(() => nodes.value.length > 0 && solvedIds.value.length >= nodes.value.length)

const resultSummary = computed(() => [
  `${nodes.value.length} clues`,
  timer.display.value,
  `${peekedIds.value.length} peek${peekedIds.value.length === 1 ? '' : 's'}`,
  `${wrongGuesses.value} wrong guess${wrongGuesses.value === 1 ? '' : 'es'}`
].join(' · '))

const elsewhereSummary = computed(() => {
  const result = elsewhereResult.value
  return [result?.detail, result?.timeMs != null ? formatElapsed(result.timeMs) : ''].filter(Boolean).join(' · ')
})

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      puzzleId: puzzle.value.id,
      solvedIds: solvedIds.value,
      peekedIds: peekedIds.value,
      struggledIds: struggledIds.value,
      hintLetters: hintLetters.value,
      wrongGuesses: wrongGuesses.value,
      finished: finished.value,
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
    solvedIds.value = Array.isArray(data.solvedIds) ? data.solvedIds : []
    peekedIds.value = Array.isArray(data.peekedIds) ? data.peekedIds : []
    struggledIds.value = Array.isArray(data.struggledIds) ? data.struggledIds : []
    hintLetters.value = data.hintLetters && typeof data.hintLetters === 'object' ? data.hintLetters : {}
    wrongGuesses.value = Number(data.wrongGuesses) || 0
    scoreSubmitted.value = !!data.scoreSubmitted
    return true
  } catch {
    return false
  }
}

function selectClue(id: string) {
  selectedId.value = id
  guess.value = hintPrefix(id)
  feedback.value = ''
  timer.ensureStarted()
  nextTick(() => guessInput.value?.focus())
}

/** The letters already bought for a clue, so hints survive a reload. */
function hintPrefix(id: string) {
  const node = nodes.value.find(item => item.id === id)
  const count = hintLetters.value[id] ?? 0
  return node && count > 0 ? node.answer.slice(0, count) : ''
}

function selectNextActive(preferAfter?: BracketNode) {
  const remaining = activeNodes.value
  if (!remaining.length) {
    selectedId.value = null
    return
  }
  // Prefer a clue that the just-solved one was nested inside.
  const parent = preferAfter
    ? remaining.find(node => preferAfter.id.startsWith(`${node.id}.`))
    : undefined
  selectClue((parent || remaining[0]).id)
}

function solve(node: BracketNode, viaPeek: boolean) {
  if (!solvedIds.value.includes(node.id)) solvedIds.value.push(node.id)
  if (viaPeek && !peekedIds.value.includes(node.id)) peekedIds.value.push(node.id)
  guess.value = ''
  saveState()
  selectNextActive(node)
}

function submitGuess() {
  const node = selectedNode.value
  if (!node || !guess.value.trim()) return
  timer.ensureStarted()

  if (answerMatches(guess.value, node)) {
    feedbackOk.value = true
    feedback.value = 'Solved!'
    solve(node, false)
    setTimeout(() => { feedback.value = '' }, 1200)
    return
  }

  wrongGuesses.value += 1
  markStruggled(node.id)
  timer.addPenalty(5_000)
  feedbackOk.value = false
  feedback.value = 'Not quite — +5s'
  shake.value = true
  setTimeout(() => { shake.value = false }, 400)
  saveState()
}

function markStruggled(id: string) {
  if (!struggledIds.value.includes(id)) struggledIds.value.push(id)
}

function askHint(kind: 'letter' | 'word') {
  if (!selectedNode.value) return
  pendingHint.value = kind
}

function confirmHint() {
  const kind = pendingHint.value
  pendingHint.value = null
  const node = selectedNode.value
  if (!kind || !node) return

  if (kind === 'letter') {
    const next = Math.min(node.answer.length, (hintLetters.value[node.id] ?? 0) + 1)
    hintLetters.value = { ...hintLetters.value, [node.id]: next }
    markStruggled(node.id)
    timer.addPenalty(5_000)
    guess.value = node.answer.slice(0, next)
    feedbackOk.value = true
    feedback.value = `Letter revealed — +5s`
    saveState()
    nextTick(() => guessInput.value?.focus())
    return
  }

  timer.addPenalty(20_000)
  solve(node, true)
}

function finish() {
  timer.stop()
  saveState()
  void markDone({
    score: peekedIds.value.length,
    timeMs: timer.elapsedMs.value,
    detail: `${nodes.value.length} clues · ${peekedIds.value.length} peek${peekedIds.value.length === 1 ? '' : 's'}`
  })
}

function shareResult() {
  const squares = nodes.value.map((node) => {
    if (peekedIds.value.includes(node.id)) return '🟦'
    return struggledIds.value.includes(node.id) ? '🟨' : '🟩'
  }).join('')
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/play/bracket-city` : ''
  const text = [
    `Bhaktiras Bracket City · ${nodes.value.length} clues`,
    timer.display.value,
    '',
    squares,
    '',
    shareUrl ? `Play today's puzzle: ${shareUrl}` : ''
  ].join('\n').trimEnd()
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      shareCopied.value = true
      setTimeout(() => { shareCopied.value = false }, 2000)
    })
  }
}

function formatBoardScore(entry: { score?: number; timeMs?: number }) {
  const time = entry.timeMs != null ? ` · ${formatElapsed(entry.timeMs)}` : ''
  return `${entry.score ?? 0} peek${entry.score === 1 ? '' : 's'}${time}`
}

async function submitToLeaderboard() {
  if (!auth.user.value || scoreSubmitted.value || submitting.value || !finished.value) return
  submitting.value = true
  submitError.value = ''
  try {
    await submitScore({
      score: peekedIds.value.length,
      timeMs: timer.elapsedMs.value,
      detail: `${nodes.value.length} clues`,
      userId: auth.user.value.uid,
      userName: auth.user.value.displayName || auth.user.value.email?.split('@')[0] || 'Player',
      userEmail: auth.user.value.email || undefined
    })
    scoreSubmitted.value = true
    saveState()
  } catch (error) {
    submitError.value = (error as Error).message
  } finally {
    submitting.value = false
  }
}

watch(finished, (done, was) => {
  if (done && !was) finish()
})

watch([finished, () => auth.user.value?.uid], ([done, uid]) => {
  if (done && uid && !scoreSubmitted.value && !submitting.value) {
    void submitToLeaderboard()
  }
}, { immediate: true })

function syncPlayTimer() {
  if (loading.value || playedElsewhere.value) return
  if (finished.value) {
    timer.read()
    if (timer.startedAt.value && !timer.finishedAt.value) timer.stop()
    return
  }
  timer.loadOrStart()
}

watch([loading, () => puzzle.value.id], () => {
  if (loading.value) return
  if (!loadState()) {
    solvedIds.value = []
    peekedIds.value = []
    struggledIds.value = []
    hintLetters.value = {}
    wrongGuesses.value = 0
    scoreSubmitted.value = false
  }
  if (!finished.value && !selectedNode.value) selectNextActive()
  syncPlayTimer()
}, { immediate: true })

watch(playedElsewhere, () => { syncPlayTimer() })

useHead({ title: 'Bracket City · Bhaktiras' })
</script>
