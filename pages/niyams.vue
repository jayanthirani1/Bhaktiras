<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <PageHeader :title="copy('pageTitle')" :subtitle="copy('pageSubtitle')" />

      <p v-if="challengeError" class="mb-4 text-center text-sm text-red-700">{{ challengeError }}</p>

      <NiyamPulse :stats="pulseStats" class="mb-4" />

      <section aria-label="Niyams">
        <p v-if="challengesLoading" class="card-surface px-5 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {{ copy('loadingLabel') }}
        </p>

        <div v-else-if="!challenges.length" class="card-surface px-5 py-6 text-center">
          <p class="font-display text-lg text-[hsl(var(--primary))]">{{ copy('emptyTitle') }}</p>
          <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{{ copy('emptyBody') }}</p>
        </div>

        <ul v-else class="card-surface overflow-hidden">
          <NiyamBoardRow
            v-for="challenge in challenges"
            :key="challenge.id"
            :challenge="challenge"
            :stats="statsFor(challenge.id)"
            :is-logged-in="isLoggedIn"
            :my-approved="myApprovedByChallenge[challenge.id] ?? 0"
            :my-pending="myPendingByChallenge[challenge.id] ?? 0"
            :log-disabled="challenge.id === MANDIR_CHALLENGE_ID && mandirDailyFull"
            :log-disabled-label="'Done for today'"
            @detail="openDetail(challenge)"
            @log="openLog(challenge)"
            @sign-in="goSignIn"
          />
        </ul>

        <p class="mt-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
          {{ copy('boardHint') }}
        </p>
      </section>
    </div>

    <NiyamLogSheet
      :open="sheet === 'log'"
      :challenge="activeChallenge"
      :stats="activeStats"
      :my-submissions="activeSubmissions"
      :my-personal="activeChallenge ? myPersonalTotal(activeChallenge.id) : 0"
      :my-pending="activeChallenge ? myPendingTotal(activeChallenge.id) : 0"
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
      :is-logged-in="isLoggedIn"
      :my-personal="activeChallenge ? myPersonalTotal(activeChallenge.id) : 0"
      :my-approved="activeChallenge ? (myApprovedByChallenge[activeChallenge.id] ?? 0) : 0"
      :my-pending="activeChallenge ? (myPendingByChallenge[activeChallenge.id] ?? 0) : 0"
      :leaders="activeId ? leadersFor(activeId) : []"
      :leaders-loading="activeId ? leadersLoading(activeId) : false"
      :current-user-id="auth.user.value?.uid"
      :my-submissions="activeSubmissions"
      :withdrawing-id="withdrawingId"
      :withdraw-error="withdrawError"
      @close="closeSheet"
      @log="switchToLog"
      @withdraw="withdraw"
    />
  </div>
</template>

<script setup lang="ts">
import type { MandirCheckinSlot, NiyamChallenge, NiyamChallengeStats, NiyamSubmission, NiyamSubmissionStatus } from '~/types'
import { inputModeFor, isChallengeOpen, isPublished, mandirCheckinCooldown, mandirDailyCheckinComplete, validateMandirCheckinSubmission, type MandirCheckinCooldown } from '~/utils/niyamChallenge'

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
  myPersonalTotal,
  myApprovedByChallenge,
  myPendingByChallenge,
  leadersFor,
  leadersLoading,
  fetchTopContributors,
  submit,
  withdraw,
  withdrawingId,
  withdrawError
} = useNiyamChallenges()

const copy = useNiyamCopy()

const auth = useAuth()

const {
  isAtMandir,
  checking: checkingLocation,
  error: locationError,
  alwaysAllowLocation,
  isGeolocationSupported,
  permissionState,
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

const mandirDailyFull = computed(() =>
  mandirDailyCheckinComplete(submissionsFor(MANDIR_CHALLENGE_ID))
)

function mandirCheckinBlocked(): MandirCheckinCooldown {
  const challenge = mandirChallenge.value
  return mandirCheckinCooldown(
    submissionsFor(MANDIR_CHALLENGE_ID),
    challenge?.maxPerSubmission ?? 2
  )
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

function goSignIn() {
  navigateTo('/login?redirect=/niyams')
}

function openLog(challenge: NiyamChallenge) {
  if (!isLoggedIn.value) {
    goSignIn()
    return
  }
  activeId.value = challenge.id
  sheet.value = 'log'
}

function openDetail(challenge: NiyamChallenge) {
  activeId.value = challenge.id
  sheet.value = 'detail'
  void fetchTopContributors(challenge.id)
}

// Keep the detail leaderboard in step with live community and contributor rollups.
watch(
  () => {
    if (sheet.value !== 'detail' || !activeId.value) return null
    const id = activeId.value
    const s = statsFor(id)
    return [
      s.approvedTotal,
      s.pendingTotal,
      myApprovedByChallenge.value[id] ?? 0,
      myPendingByChallenge.value[id] ?? 0
    ].join(':')
  },
  () => {
    if (sheet.value === 'detail' && activeId.value) {
      void fetchTopContributors(activeId.value)
    }
  }
)

function closeSheet() {
  sheet.value = 'none'
}

async function switchToLog() {
  if (!isLoggedIn.value) {
    goSignIn()
    return
  }
  sheet.value = 'none'
  await nextTick()
  sheet.value = 'log'
}

async function onSubmit(payload: {
  amount: number
  note: string
  checkinSlot?: MandirCheckinSlot | null
  done: (result: { status: NiyamSubmissionStatus; submission: NiyamSubmission | null }) => void
  fail: (message: string) => void
}) {
  const challenge = activeChallenge.value
  if (!challenge) return
  if (!isLoggedIn.value) {
    payload.fail('Sign in to add to this challenge')
    return
  }

  if (inputModeFor(challenge) === 'checkin') {
    const verdict = validateMandirCheckinSubmission(
      submissionsFor(challenge.id),
      { amount: payload.amount, checkinSlot: payload.checkinSlot ?? null }
    )
    if (!verdict.ok) {
      payload.fail(verdict.error || 'This check-in could not be recorded.')
      return
    }
  }

  try {
    const { status, submission } = await submit(
      challenge,
      payload.amount,
      payload.note,
      payload.checkinSlot ?? null
    )
    payload.done({ status, submission })
  } catch (e) {
    payload.fail((e as Error).message)
  }
}

useHead({ title: 'Niyams · Bhaktiras' })
</script>
