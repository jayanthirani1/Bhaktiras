<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <PageHeader
        title="Our Niyams"
        subtitle="Sadhana we are keeping together, between now and the Patotsav in August 2027."
      />

      <p v-if="challengeError" class="mb-4 text-center text-sm text-red-700">{{ challengeError }}</p>

      <NiyamPulse :stats="pulseStats" class="mb-4" />

      <section aria-label="Niyams">
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
          shared total.
        </p>
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
      :checking-location="checkingLocation"
      :location-error="locationError"
      :auto-check-in-enabled="alwaysAllowLocation"
      :geolocation-supported="isGeolocationSupported"
      :location-permission="permissionState"
      @close="closeSheet"
      @submit="onSubmit"
      @withdraw="withdraw"
      @enable-auto-check-in="enableLocationTracking"
      @disable-auto-check-in="disableLocationTracking"
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
import { inputModeFor, isChallengeOpen, isPublished, mandirCheckinBlockedMessage, mandirCheckinCooldown, type MandirCheckinCooldown } from '~/utils/niyamChallenge'

const MANDIR_CHALLENGE_ID = 'mandir-darshan'

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
  submit,
  withdraw
} = useNiyamChallenges()

const {
  isAtMandir,
  checking: checkingLocation,
  error: locationError,
  alwaysAllowLocation,
  isGeolocationSupported,
  permissionState,
  confirmAtMandir,
  enableLocationTracking,
  disableLocationTracking
} = useMandirVisit()

const sheet = ref<'none' | 'log' | 'detail'>('none')
const activeId = ref('')
const autoCheckInBusy = ref(false)

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

const pulseStats = computed(() => publishedChallenges.value.map(c => statsFor(c.id)))

const mandirChallenge = computed(() => challenges.value.find(c => c.id === MANDIR_CHALLENGE_ID) ?? null)

function mandirCheckinBlocked(): MandirCheckinCooldown {
  return mandirCheckinCooldown(submissionsFor(MANDIR_CHALLENGE_ID))
}

async function tryAutoCheckIn() {
  if (
    autoCheckInBusy.value
    || !alwaysAllowLocation.value
    || !isAtMandir.value
    || !isLoggedIn.value
    || mandirCheckinBlocked().blocked
  ) {
    return
  }

  const challenge = mandirChallenge.value
  if (!challenge || !isPublished(challenge) || !isChallengeOpen(challenge)) return

  autoCheckInBusy.value = true
  try {
    await submit(challenge, 1)
  } catch {
    // A failed write should not block a later manual check-in.
  } finally {
    autoCheckInBusy.value = false
  }
}

watch([isAtMandir, alwaysAllowLocation, isLoggedIn, mandirChallenge], () => {
  void tryAutoCheckIn()
})

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

  if (inputModeFor(challenge) === 'checkin') {
    const cooldown = mandirCheckinCooldown(submissionsFor(challenge.id))
    if (cooldown.blocked) {
      payload.fail(mandirCheckinBlockedMessage(cooldown.remainingMs))
      return
    }
    locationError.value = null
    const atMandir = await confirmAtMandir()
    if (!atMandir) {
      payload.fail(
        locationError.value || 'You\'re not at the Mandir. Try again when you arrive.'
      )
      return
    }
  }

  try {
    const status = await submit(challenge, payload.amount, payload.note)
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
