<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <PageHeader
        title="Our Niyams"
        subtitle="Sadhana we are keeping together, between now and the Patotsav in August 2027."
      />

      <p v-if="challengeError" class="mb-4 text-center text-sm text-red-700">{{ challengeError }}</p>

      <NiyamPulse :stats="pulseStats" class="mb-4" />

      <section aria-labelledby="sangat-board">
        <h2
          id="sangat-board"
          class="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]"
        >
          The sangat's count
        </h2>

        <p v-if="challengesLoading" class="card-surface px-5 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Loading the niyams…
        </p>

        <div v-else-if="!challenges.length" class="card-surface px-5 py-6 text-center">
          <p class="font-display text-lg text-[hsl(var(--primary))]">No niyam running right now</p>
          <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            When the mandir opens one it will appear here, and everyone's count will add up towards it.
          </p>
        </div>

        <ul v-else class="card-surface overflow-hidden">
          <NiyamBoardRow
            v-for="challenge in challenges"
            :key="challenge.id"
            :challenge="challenge"
            :stats="statsFor(challenge.id)"
            @detail="openDetail(challenge)"
            @log="openLog(challenge)"
          />
        </ul>

        <p class="mt-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
          Tap a niyam to see how it is going. Nobody's individual count is ever shown — only the
          sangat's shared total.
        </p>
      </section>

      <section class="mt-10" aria-labelledby="personal-niyams">
        <h2
          id="personal-niyams"
          class="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]"
        >
          Just for you
        </h2>
        <p class="mx-auto mb-4 mt-2 max-w-md text-center text-sm text-[hsl(var(--muted-foreground))]">
          Above is the sangat's shared count. Below is your own record — your streak and your
          entries, kept private to you.
        </p>

        <MandirVisitCard />

        <NiyamYourSadhana
          class="mt-6"
          :rows="sadhanaRows"
          :submissions="mySubmissions"
          :is-logged-in="isLoggedIn"
          @withdraw="withdraw"
        />
      </section>
    </div>

    <NiyamLogSheet
      :open="sheet === 'log'"
      :challenge="activeChallenge"
      :stats="activeStats"
      :my-submissions="activeSubmissions"
      :is-logged-in="isLoggedIn"
      :submitting="submitting"
      :at-mandir="isAtMandir"
      @close="closeSheet"
      @submit="onSubmit"
      @withdraw="withdraw"
    />

    <NiyamDetailSheet
      :open="sheet === 'detail'"
      :challenge="activeChallenge"
      :stats="activeStats"
      :my-approved="activeChallenge ? myApprovedTotal(activeChallenge.id) : 0"
      :my-pending="activeChallenge ? myPendingTotal(activeChallenge.id) : 0"
      @close="closeSheet"
      @log="switchToLog"
    />
  </div>
</template>

<script setup lang="ts">
import type { NiyamChallenge, NiyamChallengeStats, NiyamSubmission, NiyamSubmissionStatus } from '~/types'
import { ukDateId } from '~/utils/gameDay'

const {
  challenges,
  publishedChallenges,
  loading: challengesLoading,
  submitting,
  error: challengeError,
  isLoggedIn,
  statsFor,
  submissionsFor,
  myApprovedTotal,
  myPendingTotal,
  mySubmissions,
  submit,
  withdraw
} = useNiyamChallenges()

/**
 * Only for the "You're at the mandir" reassurance in the check-in sheet.
 * `MandirVisitCard` owns the streak and every write; nothing here records a
 * visit, and the shared sabha count and the private streak stay separate.
 */
const { isAtMandir } = useMandirVisit()

const sheet = ref<'none' | 'log' | 'detail'>('none')
const activeId = ref('')

const activeChallenge = computed<NiyamChallenge | null>(
  () => challenges.value.find(c => c.id === activeId.value) ?? null
)

const EMPTY_STATS: NiyamChallengeStats = {
  challengeId: '',
  approvedTotal: 0,
  pendingTotal: 0,
  approvedCount: 0,
  pendingCount: 0,
  participants: 0
}

const activeStats = computed(() => (activeId.value ? statsFor(activeId.value) : EMPTY_STATS))
const activeSubmissions = computed(() => (activeId.value ? submissionsFor(activeId.value) : []))

/** The pulse strip only has something to say once the totals trigger has run. */
const pulseStats = computed(() => publishedChallenges.value.map(c => statsFor(c.id)))

const sadhanaRows = computed(() =>
  challenges.value.map(challenge => ({
    challenge,
    approved: myApprovedTotal(challenge.id),
    pending: myPendingTotal(challenge.id)
  }))
)

function openLog(challenge: NiyamChallenge) {
  activeId.value = challenge.id
  sheet.value = 'log'
}

function openDetail(challenge: NiyamChallenge) {
  activeId.value = challenge.id
  sheet.value = 'detail'
}

function closeSheet() {
  sheet.value = 'none'
}

/** Let the detail sheet close — and hand focus back — before the log sheet claims it. */
async function switchToLog() {
  sheet.value = 'none'
  await nextTick()
  sheet.value = 'log'
}

async function onSubmit(payload: {
  amount: number
  note: string
  done: (result: { status: NiyamSubmissionStatus; submission: NiyamSubmission | null }) => void
  fail: (message: string) => void
}) {
  const challenge = activeChallenge.value
  if (!challenge) return
  try {
    const status = await submit(challenge, payload.amount, payload.note)
    // `submit` refreshes the entry list, and it is sorted newest first, so the
    // newest entry matching what was just sent is the one Undo has to remove.
    const today = ukDateId()
    const created = submissionsFor(challenge.id)
      .find(s => s.amount === payload.amount && s.dayKey === today) ?? null
    payload.done({ status, submission: created })
  } catch (e) {
    payload.fail((e as Error).message)
  }
}

useHead({ title: 'Niyams · Bhaktiras' })
</script>
