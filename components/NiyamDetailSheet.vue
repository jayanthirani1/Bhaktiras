<template>
  <NiyamSheet
    :open="open"
    :title="challenge?.title || ''"
    :subtitle="challenge?.detail"
    @close="emit('close')"
  >
    <template v-if="challenge">
      <NiyamBeadRing v-if="showRing" :total="stats.approvedTotal" :target="challenge.target">
        <p class="font-display text-3xl leading-none text-[hsl(var(--primary))]">
          {{ formatCount(stats.approvedTotal) }}
        </p>
        <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          of {{ formatTarget(challenge.target) }}
        </p>
      </NiyamBeadRing>

      <div v-else class="text-center">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
          Together so far
        </p>
        <p class="mt-1 font-display text-4xl text-[hsl(var(--primary))]">
          {{ formatCount(stats.approvedTotal) }}
        </p>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          of {{ formatTarget(challenge.target) }} — {{ formatCount(challenge.target) }}
          {{ unitLabel(challenge, challenge.target) }}
        </p>
      </div>

      <NiyamProgress
        class="mt-5"
        :challenge="challenge"
        :approved="stats.approvedTotal"
        :pending="stats.pendingTotal"
        :height="12"
      />

      <!-- The milestone ladder: a tenth of the target at a time, because ten
           lakh is too far away to pull anybody along. -->
      <div class="mt-2 flex items-start justify-between gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
        <span>0</span>
        <span class="text-center font-semibold text-[hsl(var(--golden-900))]">
          <template v-if="milestone.reached">Goal reached — Jay Swaminarayan</template>
          <template v-else>
            Next {{ formatTarget(milestone.value) }} · {{ formatCount(milestone.remaining) }} to go
          </template>
        </span>
        <span>{{ formatTarget(challenge.target) }}</span>
      </div>
      <p class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
        {{ percentLabel(stats.approvedTotal, challenge.target) }} of the way, counting only entries that have been confirmed.
      </p>

      <dl class="mt-5 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-2 py-3">
          <dt class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">
            Taking part
          </dt>
          <dd class="mt-1 font-display text-lg text-[hsl(var(--primary))]">
            {{ formatCount(stats.participants) }}
          </dd>
        </div>
        <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-2 py-3">
          <dt class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">
            {{ range.hasEnded ? 'Finished' : 'Days left' }}
          </dt>
          <dd class="mt-1 font-display text-lg text-[hsl(var(--primary))]">
            {{ range.hasEnded ? '—' : formatCount(range.daysLeft) }}
          </dd>
        </div>
        <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-2 py-3">
          <dt class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">
            Yours
          </dt>
          <dd class="mt-1 font-display text-lg text-[hsl(var(--primary))]">
            {{ isLoggedIn ? formatCount(myApproved) : '—' }}
            <span
              v-if="isLoggedIn && myPending > 0"
              class="block text-xs font-normal text-[hsl(var(--muted-foreground))]"
            >
              + {{ formatCount(myPending) }} pending
            </span>
          </dd>
        </div>
      </dl>

      <p v-if="myPending > 0" class="mt-3 flex items-start gap-2 text-sm text-[hsl(var(--foreground))]">
        <IconClockPause class="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--golden-900))]" aria-hidden="true" />
        <span>
          {{ formatCount(myPending) }} {{ unitLabel(challenge, myPending) }} of yours
          {{ myPending === 1 ? 'is' : 'are' }} waiting for an admin, so
          {{ myPending === 1 ? 'it is' : 'they are' }} not in the total above yet.
        </span>
      </p>

      <NiyamResourceLink :challenge="challenge" class="mt-5" />

      <NiyamLeaderboard
        v-if="published"
        :challenge="challenge"
        :leaders="leaders"
        :loading="leadersLoading"
        :current-user-id="currentUserId"
        :my-approved="myApproved"
        :my-name="myName"
      />

      <NiyamMyEntries
        v-if="published"
        :challenge="challenge"
        :submissions="mySubmissions"
        :is-logged-in="isLoggedIn"
        :withdrawing-id="withdrawingId"
        @withdraw="emit('withdraw', $event)"
      />

      <p v-if="withdrawError" class="mt-3 flex items-start gap-2 text-sm text-red-700">
        <IconAlertTriangle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{{ withdrawError }}</span>
      </p>

      <div class="mt-5 space-y-3 border-t border-[hsl(var(--border))] pt-4 text-sm text-[hsl(var(--muted-foreground))]">
        <p v-if="challenge.hint">
          <span class="font-semibold text-[hsl(var(--foreground))]">What counts as one:</span>
          {{ challenge.hint }}
        </p>
        <p>
          <span class="font-semibold text-[hsl(var(--foreground))]">How entries are counted:</span>
          <template v-if="isCheckin">
            Check-ins count straight away — one for the morning sabha and one for the evening
            (from 2pm UK). No admin review. The top five contributors appear on the leaderboard above.
          </template>
          <template v-else>
            up to {{ formatCount(challenge.autoApproveMax) }}
            {{ unitLabel(challenge, challenge.autoApproveMax) }} in one entry joins the total straight away.
            {{ reviewReason(challenge) }}
            The top five contributors appear on the leaderboard above.
          </template>
        </p>
        <p v-if="!published" class="flex items-start gap-2 text-[hsl(var(--foreground))]">
          <IconLock class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{{ copy('notPublishedNote') }}</span>
        </p>
      </div>
    </template>

    <template #footer>
      <div v-if="challenge" class="flex items-center gap-2">
        <button
          type="button"
          class="flex-1 rounded-xl border border-[hsl(var(--golden-200))] bg-white px-4 py-3 text-sm font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--golden-50))]"
          @click="emit('close')"
        >
          Close
        </button>
        <NuxtLink
          v-if="needsSignIn"
          to="/login?redirect=/niyams"
          class="flex flex-1 items-center justify-center rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--primary))]/90"
          @click="emit('close')"
        >
          Sign in to add
        </NuxtLink>
        <button
          v-else-if="canLog"
          type="button"
          class="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-white hover:bg-[hsl(var(--primary))]/90"
          @click="emit('log')"
        >
          {{ isCheckin ? "I'm here" : `Add ${challenge.unit}` }}
        </button>
      </div>
    </template>
  </NiyamSheet>
</template>

<script setup lang="ts">
import { IconAlertTriangle, IconClockPause, IconLock } from '@tabler/icons-vue'
import type { NiyamChallenge, NiyamChallengeStats, NiyamContributor, NiyamSubmission } from '~/types'
import {
  challengeWindow,
  formatCount,
  formatTarget,
  iconFor,
  inputModeFor,
  isChallengeOpen,
  isPublished,
  milestoneFor,
  percentLabel,
  reviewReason,
  unitLabel
} from '~/utils/niyamChallenge'

const props = defineProps<{
  open: boolean
  challenge: NiyamChallenge | null
  stats: NiyamChallengeStats
  isLoggedIn: boolean
  myPersonal: number
  myApproved: number
  myPending: number
  leaders: NiyamContributor[]
  leadersLoading?: boolean
  currentUserId?: string
  myName?: string
  /** This devotee's own entries on this niyam, newest first. */
  mySubmissions: NiyamSubmission[]
  withdrawingId?: string
  withdrawError?: string
}>()

const emit = defineEmits<{
  close: []
  log: []
  withdraw: [submission: NiyamSubmission]
}>()

const copy = useNiyamCopy()

const published = computed(() => !!props.challenge && isPublished(props.challenge))
const isCheckin = computed(() => !!props.challenge && inputModeFor(props.challenge) === 'checkin')
const challengeOpen = computed(() => !!props.challenge && published.value && isChallengeOpen(props.challenge))
const canLog = computed(() => challengeOpen.value && props.isLoggedIn)
const needsSignIn = computed(() => challengeOpen.value && !props.isLoggedIn)
const showRing = computed(() => !!props.challenge && iconFor(props.challenge) === 'mala')
const EMPTY_WINDOW = { startMs: 0, endMs: 0, hasStarted: true, hasEnded: false, daysLeft: 0, totalDays: 0 }
const range = computed(() => (props.challenge ? challengeWindow(props.challenge) : EMPTY_WINDOW))
const milestone = computed(() =>
  milestoneFor(props.stats.approvedTotal, props.challenge?.target || 0)
)
</script>
