<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-2xl mx-auto">
      <NuxtLink
        to="/play"
        class="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-sm font-medium mb-6"
      >
        <IconArrowLeft class="w-4 h-4" />
        Back to games
      </NuxtLink>

      <PageHeader
        title="Devotional Quiz"
        subtitle="Test your knowledge about our temple's history and traditions."
      />

      <div class="mt-8">
        <!-- Result -->
        <div
          v-if="isFinished"
          class="bg-[hsl(var(--card))] rounded-3xl p-12 shadow-xl border border-[hsl(var(--primary))]/20 text-center"
        >
          <div class="w-24 h-24 bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🏆
          </div>
          <h2 class="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">Quiz Completed!</h2>
          <p class="text-[hsl(var(--muted-foreground))] mb-6">You scored {{ score }} out of {{ questions.length }}</p>
          <div class="mb-6 space-y-2">
            <button
              v-if="isLoggedIn && !scoreSubmitted"
              type="button"
              class="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50"
              :disabled="submittingScore"
              @click="submitToLeaderboard"
            >
              {{ submittingScore ? 'Submitting...' : 'Submit to leaderboard' }}
            </button>
            <NuxtLink
              v-else-if="!isLoggedIn && !scoreSubmitted"
              to="/login?redirect=/play/quiz"
              class="block w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 text-center"
            >
              Sign in to submit score
            </NuxtLink>
            <p v-else-if="scoreSubmitted" class="text-sm text-emerald-700">Score submitted to today’s leaderboard.</p>
            <p v-if="submitError" class="text-sm text-red-600">{{ submitError }}</p>
          </div>
          <button
            type="button"
            class="inline-flex items-center px-6 py-3 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--accent))] font-semibold hover:opacity-90"
            @click="restartQuiz"
          >
            <IconRefresh class="w-4 h-4 mr-2" />
            Play Again
          </button>
        </div>

        <!-- Question -->
        <div
          v-else
          class="bg-[hsl(var(--card))] rounded-3xl p-8 shadow-xl border border-[hsl(var(--golden-200))]"
        >
          <div class="flex justify-between items-center mb-8">
            <span class="text-sm font-bold text-[hsl(var(--primary))] tracking-wider uppercase">
              Question {{ currentQuestion + 1 }}/{{ questions.length }}
            </span>
            <span class="text-sm font-medium text-[hsl(var(--golden-600))]">Score: {{ score }}</span>
          </div>
          <h3 class="text-xl font-bold text-[hsl(var(--foreground))] mb-6">
            {{ questions[currentQuestion]?.question }}
          </h3>
          <div class="space-y-3">
            <button
              v-for="option in questions[currentQuestion]?.options || []"
              :key="option"
              type="button"
              class="w-full text-left px-4 py-3 rounded-xl border-2 transition-all"
              :class="getOptionClass(option)"
              :disabled="!!selectedOption"
              @click="handleOptionSelect(option)"
            >
              <span class="flex items-center gap-2">
                <IconCheck v-if="selectedOption === option && isCorrect" class="w-5 h-5 text-emerald-500" />
                <IconX v-else-if="selectedOption === option && !isCorrect" class="w-5 h-5 text-red-500" />
                <span>{{ option }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <GameLeaderboard
        :entries="leaderboardEntries"
        :loading="leaderboardLoading"
        :date-id="leaderboardDateId"
        :format-score="(e) => `${e.score}${e.detail ? ` (${e.detail})` : ''}`"
      >
        <template v-if="!isLoggedIn">
          <NuxtLink to="/login?redirect=/play/quiz" class="text-[hsl(var(--primary))] underline">Sign in</NuxtLink>
          to submit yours.
        </template>
        <template v-else-if="scoreSubmitted">
          Your score is on the board.
        </template>
      </GameLeaderboard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconRefresh, IconCheck, IconX } from '@tabler/icons-vue'

const { questions: remoteQuestions } = useQuizQuestions()
const questions = computed(() => remoteQuestions.value)
const auth = useAuth()
const isLoggedIn = computed(() => !!auth.user.value)
const {
  entries: leaderboardEntries,
  loading: leaderboardLoading,
  dateId: leaderboardDateId,
  submitScore
} = useGameLeaderboard('quiz', { sort: 'desc' })
const { submitted: scoreSubmitted, markSubmitted } = useDailySubmitFlag('quiz')
const submittingScore = ref(false)
const submitError = ref('')

const currentQuestion = ref(0)
const selectedOption = ref<string | null>(null)
const isCorrect = ref<boolean | null>(null)
const score = ref(0)
const isFinished = ref(false)

function getOptionClass(option: string) {
  if (!selectedOption.value) return 'border-[hsl(var(--golden-200))] hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--golden-50))]/50'
  if (option === selectedOption.value) {
    return isCorrect.value ? 'border-emerald-500 bg-emerald-50' : 'border-red-400 bg-red-50'
  }
  if (option === questions.value[currentQuestion.value]?.correctAnswer) return 'border-emerald-500 bg-emerald-50'
  return 'border-[hsl(var(--border))] opacity-60'
}

function handleOptionSelect(option: string) {
  if (selectedOption.value) return
  selectedOption.value = option
  const correct = option === questions.value[currentQuestion.value]?.correctAnswer
  isCorrect.value = correct
  if (correct) score.value += 1
  setTimeout(() => {
    if (currentQuestion.value < questions.value.length - 1) {
      currentQuestion.value++
      selectedOption.value = null
      isCorrect.value = null
    } else {
      isFinished.value = true
    }
  }, 1500)
}

function restartQuiz() {
  currentQuestion.value = 0
  selectedOption.value = null
  isCorrect.value = null
  score.value = 0
  isFinished.value = false
}

async function submitToLeaderboard() {
  if (!auth.user.value || !isFinished.value) return
  submitError.value = ''
  submittingScore.value = true
  try {
    await submitScore({
      score: score.value,
      userName: auth.userName.value || auth.userEmail.value || 'Player',
      userId: auth.user.value.uid,
      userEmail: auth.userEmail.value || undefined,
      detail: `${score.value}/${questions.value.length}`
    })
    markSubmitted()
  } catch (e: unknown) {
    submitError.value = e instanceof Error ? e.message : 'Could not submit score.'
  } finally {
    submittingScore.value = false
  }
}
</script>
