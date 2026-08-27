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
            {{ formatCount(myApproved) }}
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

      <p v-if="invitation" class="mt-4 rounded-xl bg-[hsl(var(--golden-50))] px-3 py-3 text-sm text-[hsl(var(--foreground))]">
        {{ invitation }}
      </p>

      <div class="mt-5 space-y-3 border-t border-[hsl(var(--border))] pt-4 text-sm text-[hsl(var(--muted-foreground))]">
        <p v-if="challenge.hint">
          <span class="font-semibold text-[hsl(var(--foreground))]">What counts as one:</span>
          {{ challenge.hint }}
        </p>
        <p>
          <span class="font-semibold text-[hsl(var(--foreground))]">How entries are counted:</span>
          up to {{ formatCount(challenge.autoApproveMax) }}
          {{ unitLabel(challenge, challenge.autoApproveMax) }} in one entry joins the total straight away.
          {{ reviewReason(challenge) }}
          Your own count stays private — only the sangat's shared total is shown.
        </p>
        <p v-if="!published" class="flex items-start gap-2 text-[hsl(var(--foreground))]">
          <IconLock class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>The mandir has not opened this niyam for entries yet.</span>
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
        <button
          v-if="canLog"
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
import { IconClockPause, IconLock } from '@tabler/icons-vue'
import type { NiyamChallenge, NiyamChallengeStats } from '~/types'
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
  myApproved: number
  myPending: number
}>()

const emit = defineEmits<{ close: []; log: [] }>()

const published = computed(() => !!props.challenge && isPublished(props.challenge))
const isCheckin = computed(() => !!props.challenge && inputModeFor(props.challenge) === 'checkin')
const canLog = computed(() => !!props.challenge && published.value && isChallengeOpen(props.challenge))
const showRing = computed(() => !!props.challenge && iconFor(props.challenge) === 'mala')
const EMPTY_WINDOW = { startMs: 0, endMs: 0, hasStarted: true, hasEnded: false, daysLeft: 0, totalDays: 0 }
const range = computed(() => (props.challenge ? challengeWindow(props.challenge) : EMPTY_WINDOW))
const milestone = computed(() =>
  milestoneFor(props.stats.approvedTotal, props.challenge?.target || 0)
)

/**
 * An invitation, never a quota: "if each of us offers 9 a day" reads as a way
 * in, where "you are 9 a day behind" reads as a debt.
 */
const invitation = computed(() => {
  const challenge = props.challenge
  if (!challenge || !published.value) return ''
  const days = range.value?.daysLeft || 0
  const people = props.stats.participants
  const remaining = Math.max(0, challenge.target - props.stats.approvedTotal)
  if (!days || people < 1 || remaining <= 0) return ''
  const share = Math.max(1, Math.ceil(remaining / days / people))
  return `If each of us offers ${formatCount(share)} ${unitLabel(challenge, share)} a day, the sangat reaches ${formatTarget(challenge.target)} before the utsav.`
})
</script>
