<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-0 md:pt-12 px-4">
    <div class="mx-auto max-w-lg">
      <!-- Pinned so Back and the clock stay visible while scrolling -->
      <div class="sticky top-0 z-40 -mx-4 mb-4 flex items-center justify-between gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-4 py-2 backdrop-blur md:top-16">
        <NuxtLink
          to="/play"
          class="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          ‹ Back
        </NuxtLink>
        <div class="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--primary))]">
          <span class="rounded-full bg-[hsl(var(--muted))] px-3 py-1 tabular-nums">⏱ {{ timerDisplay }}</span>
          <span v-if="cleared" class="rounded-full bg-[hsl(var(--golden-50))] px-3 py-1">
            Cleared {{ cleared }}
          </span>
        </div>
      </div>
      <PageHeader
        title="1% Club"
        :subtitle="headerSubtitle"
      />

      <GamePlayedElsewhere
        v-if="playedElsewhere"
        title="1% Club run"
        :summary="elsewhereSummary"
      />

      <div v-else-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading questions…
      </div>

      <div v-else-if="!ladder.length" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Questions will appear here once they are added in admin.
      </div>

      <div v-else-if="!started" class="card-surface space-y-4 p-6 text-center">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--accent))]">
          {{ pack.sectionLabel }}
        </p>
        <p class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ pack.title }}</p>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          Answer each Vachnamrut question before the clock beats you to the bottom. A new prakaran ladder arrives each day. The timer keeps running even if you leave.
        </p>
        <button type="button" class="btn-primary" @click="startRun">Start today’s climb</button>
        <p v-if="finished" class="text-sm text-emerald-700">
          You’ve already finished today’s run — {{ cleared }}/{{ ladder.length }} cleared in {{ timerDisplay }}.
        </p>
      </div>

      <div v-else-if="finished" class="card-surface space-y-4 p-6 text-center">
        <p class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">
          {{ reachedOnePercent ? 'You’re in the 1% Club!' : 'Run complete' }}
        </p>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          Cleared {{ cleared }}/{{ ladder.length }} · {{ timerDisplay }}
          <span v-if="failPercent != null"> · fell at {{ failPercent }}%</span>
        </p>
        <button
          v-if="isLoggedIn && !scoreSubmitted"
          type="button"
          class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          :disabled="submitting"
          @click="submitToLeaderboard"
        >
          {{ submitting ? 'Submitting…' : 'Submit to leaderboard' }}
        </button>
        <NuxtLink
          v-else-if="!isLoggedIn && !scoreSubmitted"
          to="/login?redirect=/play/one-percent"
          class="inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Sign in to submit score
        </NuxtLink>
        <p v-else-if="scoreSubmitted" class="text-sm text-emerald-700">Score on the leaderboard.</p>
        <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
      </div>

      <div v-else-if="current" class="card-surface space-y-5 p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--accent))]">
            {{ current.percent }}% · Vachnamrut
          </p>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">
            {{ index + 1 }} / {{ ladder.length }}
          </p>
        </div>
        <h2 class="font-display text-xl font-semibold text-[hsl(var(--foreground))]">{{ current.question }}</h2>
        <p v-if="current.source" class="text-xs text-[hsl(var(--muted-foreground))]">{{ current.source }}</p>
        <div class="grid gap-2">
          <button
            v-for="opt in current.options"
            :key="opt"
            type="button"
            class="rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition-colors"
            :class="optionClass(opt)"
            :disabled="!!feedback"
            @click="answer(opt)"
          >
            {{ opt }}
          </button>
        </div>
        <p v-if="feedback" class="text-sm font-medium" :class="feedbackOk ? 'text-emerald-700' : 'text-red-600'">
          {{ feedback }}
        </p>
      </div>

      <GameLeaderboard
        :entries="entries"
        :loading="boardLoading"
        :date-id="dateId"
        :current-user-id="auth.user.value?.uid"
        :format-score="formatBoardScore"
      >
        <template v-if="!isLoggedIn">
          <NuxtLink to="/login?redirect=/play/one-percent" class="text-[hsl(var(--primary))] underline">Sign in</NuxtLink>
          to submit yours.
        </template>
      </GameLeaderboard>
      <GameCrowns :ids="['one-percent-highest', 'one-percent-fastest']" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ukDateId, formatUkDateLabel } from '~/utils/gameDay'
import { formatElapsed } from '~/composables/useGameTimer'

const RUN_KEY = `one-percent-run:${ukDateId()}`

const { questions, pack, loading } = useOnePercentQuestions()
const auth = useAuth()
const achievements = useAchievements()
const isLoggedIn = computed(() => !!auth.user.value)
const {
  entries,
  loading: boardLoading,
  dateId,
  submitScore,
  refetch
} = useGameLeaderboard('one-percent', { sort: 'desc' })

const timer = useGameTimer(`one-percent-timer:${ukDateId()}`)
const timerDisplay = computed(() => timer.display.value)
const {
  playedElsewhere,
  result: elsewhereResult,
  markDone,
  backfill
} = useDailyGameCompletion('one-percent')

const elsewhereSummary = computed(() => {
  const r = elsewhereResult.value
  if (!r) return ''
  return [r.detail, r.timeMs != null ? formatElapsed(r.timeMs) : ''].filter(Boolean).join(' · ')
})

const started = ref(false)
const finished = ref(false)
const index = ref(0)
const cleared = ref(0)
const failPercent = ref<number | null>(null)
const feedback = ref('')
const feedbackOk = ref(false)
const selected = ref('')
const scoreSubmitted = ref(false)
const submitting = ref(false)
const submitError = ref('')

const ladder = computed(() =>
  [...questions.value].sort((a, b) => (b.percent - a.percent) || (a.order ?? 0) - (b.order ?? 0))
)
const current = computed(() => ladder.value[index.value] || null)
const reachedOnePercent = computed(() => cleared.value >= ladder.value.length && ladder.value.some(q => q.percent === 1))
const headerSubtitle = computed(() => {
  const section = pack.value?.sectionLabel || 'the Vachnamrut'
  return `Vachnamrut-based. Today’s climb is ${section}. One wrong answer ends your run.`
})

function optionClass(opt: string) {
  if (!feedback.value) {
    return 'border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--primary))]/40'
  }
  if (opt === current.value?.correctAnswer) return 'border-emerald-500 bg-emerald-50 text-emerald-800'
  if (opt === selected.value) return 'border-red-400 bg-red-50 text-red-700'
  return 'border-[hsl(var(--border))] bg-white opacity-60'
}

function saveRun() {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify({
      started: started.value,
      finished: finished.value,
      index: index.value,
      cleared: cleared.value,
      failPercent: failPercent.value,
      scoreSubmitted: scoreSubmitted.value
    }))
  } catch {}
}

function loadRun() {
  try {
    const raw = localStorage.getItem(RUN_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    started.value = !!data.started
    finished.value = !!data.finished
    index.value = Number(data.index) || 0
    cleared.value = Number(data.cleared) || 0
    failPercent.value = data.failPercent ?? null
    scoreSubmitted.value = !!data.scoreSubmitted
  } catch {}
}

function startRun() {
  if (finished.value || playedElsewhere.value) return
  started.value = true
  timer.ensureStarted()
  saveRun()
}

function finishRun() {
  finished.value = true
  timer.stop()
  saveRun()
  void markDone({
    score: cleared.value,
    timeMs: timer.elapsedMs.value,
    detail: `${cleared.value}/${ladder.value.length} cleared`
  })
}

function answer(opt: string) {
  if (!current.value || feedback.value || finished.value || playedElsewhere.value) return
  selected.value = opt
  const ok = opt.trim() === current.value.correctAnswer.trim()
  feedbackOk.value = ok
  if (ok) {
    cleared.value += 1
    feedback.value = 'Correct — next rung!'
    saveRun()
    setTimeout(() => {
      feedback.value = ''
      selected.value = ''
      if (index.value + 1 >= ladder.value.length) finishRun()
      else {
        index.value += 1
        saveRun()
      }
    }, 700)
  } else {
    failPercent.value = current.value.percent
    feedback.value = `Not quite — the answer was “${current.value.correctAnswer}”.`
    saveRun()
    setTimeout(finishRun, 1100)
  }
}

function formatBoardScore(e: { score?: number; timeMs?: number }) {
  const t = e.timeMs != null ? ` · ${formatElapsed(e.timeMs)}` : ''
  return `${e.score ?? 0} cleared${t}`
}

async function submitToLeaderboard() {
  if (!auth.user.value || !finished.value || scoreSubmitted.value || submitting.value) return
  submitError.value = ''
  submitting.value = true
  try {
    await submitScore({
      score: cleared.value,
      timeMs: timer.elapsedMs.value,
      userName: auth.userName.value || auth.userEmail.value || 'Player',
      userId: auth.user.value.uid,
      userEmail: auth.userEmail.value || undefined,
      detail: failPercent.value != null ? `fell@${failPercent.value}%` : '1% club'
    })
    try {
      await achievements.processResult('one-percent', {
        score: cleared.value,
        timeMs: timer.elapsedMs.value,
        clearedAll: reachedOnePercent.value,
        userName: auth.userName.value || auth.userEmail.value || 'Player'
      })
    } catch {}
    scoreSubmitted.value = entries.value.some(e => e.userId === auth.user.value?.uid)
    if (!scoreSubmitted.value) await refetch()
    scoreSubmitted.value = entries.value.some(e => e.userId === auth.user.value?.uid)
    saveRun()
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Could not submit score.'
  } finally {
    submitting.value = false
  }
}

watch([entries, () => auth.user.value?.uid], ([list, uid]) => {
  if (uid && list.some(e => e.userId === uid)) scoreSubmitted.value = true
})

watch([finished, () => auth.user.value?.uid], ([done, uid]) => {
  if (done && uid && !scoreSubmitted.value && !submitting.value) {
    void submitToLeaderboard()
  }
}, { immediate: true })

backfill(() => ({
  score: cleared.value,
  timeMs: timer.elapsedMs.value,
  detail: `${cleared.value}/${ladder.value.length} cleared`
}))

function syncPlayTimer() {
  if (loading.value || playedElsewhere.value) return
  if (finished.value) {
    timer.read()
    if (timer.startedAt.value && !timer.finishedAt.value) timer.stop()
    return
  }
  if (started.value) timer.loadOrStart()
}

onMounted(() => {
  loadRun()
  syncPlayTimer()
})

watch([loading, playedElsewhere], () => { syncPlayTimer() })

useHead({ title: '1% Club · Vachnamrut · Bhaktiras' })
</script>
