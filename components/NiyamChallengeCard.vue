<template>
  <article class="card-surface overflow-hidden">
    <div class="border-b border-[hsl(var(--border))] bg-[hsl(var(--golden-50))] px-5 py-4 sm:px-6">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0">
          <h2 class="font-display text-xl text-[hsl(var(--primary))]">{{ challenge.title }}</h2>
          <p v-if="challenge.detail" class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {{ challenge.detail }}
          </p>
        </div>
        <span
          class="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
          :class="windowChipClass"
        >
          {{ windowLabel }}
        </span>
      </div>
    </div>

    <div class="px-5 py-5 sm:px-6">
      <!-- Community total: the whole point of the challenge. -->
      <div class="text-center">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
          Together so far
        </p>
        <p class="mt-1 font-display text-4xl text-[hsl(var(--primary))] sm:text-5xl">
          {{ formatCount(stats.approvedTotal) }}
        </p>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          of {{ formatCount(challenge.target) }} {{ unitLabel(challenge, challenge.target) }}
        </p>
      </div>

      <div class="mt-4">
        <div class="flex h-2.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
          <div
            class="h-full bg-[hsl(var(--primary))] transition-all duration-700"
            :style="{ width: `${approvedPercent}%` }"
          />
          <!-- Held entries are shown, but visibly outside the counted total. -->
          <div
            v-if="pendingPercent > 0"
            class="h-full bg-[hsl(var(--primary))]/25 transition-all duration-700"
            :style="{ width: `${pendingPercent}%` }"
          />
        </div>
        <div class="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-[hsl(var(--muted-foreground))]">
          <span>{{ approvedPercent }}% complete</span>
          <span v-if="remaining > 0">{{ formatCount(remaining) }} to go</span>
          <span v-else class="font-semibold text-[hsl(var(--primary))]">Goal reached — Jay Swaminarayan!</span>
        </div>
      </div>

      <dl class="mt-5 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-2 py-3">
          <dt class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">Devotees</dt>
          <dd class="mt-1 font-display text-lg text-[hsl(var(--primary))]">{{ formatCount(stats.participants) }}</dd>
        </div>
        <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-2 py-3">
          <dt class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">Yours</dt>
          <dd class="mt-1 font-display text-lg text-[hsl(var(--primary))]">{{ formatCount(myApproved) }}</dd>
        </div>
        <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-2 py-3">
          <dt class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">
            {{ range.hasEnded ? 'Finished' : 'Days left' }}
          </dt>
          <dd class="mt-1 font-display text-lg text-[hsl(var(--primary))]">
            {{ range.hasEnded ? '—' : formatCount(range.daysLeft) }}
          </dd>
        </div>
      </dl>

      <!-- Add to the goal -->
      <div v-if="open" class="mt-5 border-t border-[hsl(var(--border))] pt-5">
        <template v-if="isLoggedIn">
          <form class="space-y-3" @submit.prevent="onSubmit">
            <div class="flex flex-wrap items-end gap-3">
              <div class="min-w-[8rem] flex-1">
                <label :for="`amount-${challenge.id}`" class="admin-label">
                  How many {{ challenge.unit }} have you done?
                </label>
                <input
                  :id="`amount-${challenge.id}`"
                  v-model="amount"
                  type="number"
                  inputmode="numeric"
                  min="1"
                  :max="challenge.maxPerSubmission"
                  step="1"
                  class="admin-input"
                  :placeholder="String(suggestedAmount)"
                >
              </div>
              <button type="submit" class="admin-btn h-[42px] px-5" :disabled="submitting">
                {{ submitting ? 'Adding…' : `Add my ${challenge.unit}` }}
              </button>
            </div>
            <div>
              <label :for="`note-${challenge.id}`" class="admin-label">Note (optional)</label>
              <input
                :id="`note-${challenge.id}`"
                v-model="note"
                type="text"
                :maxlength="SUBMISSION_NOTE_MAX"
                class="admin-input"
                placeholder="e.g. over the weekend at home"
              >
            </div>
            <p class="text-xs text-[hsl(var(--muted-foreground))]">
              <template v-if="challenge.autoApproveMax > 0">
                Up to {{ formatCount(challenge.autoApproveMax) }}
                {{ unitLabel(challenge, challenge.autoApproveMax) }} in one entry counts straight away.
                Anything larger waits for an admin to confirm it.
              </template>
              <template v-else>
                Every entry on this challenge is confirmed by an admin before it joins the total.
              </template>
            </p>
          </form>

          <p v-if="localError" class="mt-3 text-sm text-red-600">{{ localError }}</p>
          <p
            v-else-if="feedback"
            class="mt-3 rounded-lg px-3 py-2 text-sm"
            :class="feedbackHeld
              ? 'bg-amber-50 text-amber-800'
              : 'bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'"
          >
            {{ feedback }}
          </p>

          <div v-if="myPending > 0" class="mt-3 text-sm text-amber-700">
            {{ formatCount(myPending) }} {{ unitLabel(challenge, myPending) }} of yours
            {{ myPending === 1 ? 'is' : 'are' }} waiting for an admin, so
            {{ myPending === 1 ? 'it is' : 'they are' }} not in the total yet.
          </div>
        </template>

        <p v-else class="text-sm text-[hsl(var(--muted-foreground))]">
          <NuxtLink to="/login?redirect=/niyams" class="font-semibold text-[hsl(var(--golden-900))] hover:underline">
            Sign in
          </NuxtLink>
          to add your {{ challenge.unit }} to this challenge.
        </p>
      </div>

      <!-- Your entries -->
      <div v-if="mySubmissions.length" class="mt-5 border-t border-[hsl(var(--border))] pt-4">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-[hsl(var(--primary))]"
          @click="showEntries = !showEntries"
        >
          <span>Your entries ({{ mySubmissions.length }})</span>
          <span class="text-xs text-[hsl(var(--muted-foreground))]">{{ showEntries ? 'Hide' : 'Show' }}</span>
        </button>
        <ul v-if="showEntries" class="mt-3 space-y-2">
          <li
            v-for="entry in mySubmissions"
            :key="entry.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-sm"
          >
            <span class="font-semibold text-[hsl(var(--foreground))]">
              {{ formatCount(entry.amount) }} {{ unitLabel(challenge, entry.amount) }}
            </span>
            <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="statusChipClass(entry.status)">
              {{ statusChipLabel(entry.status) }}
            </span>
            <span v-if="entry.dayKey" class="text-xs text-[hsl(var(--muted-foreground))]">
              {{ formatUkDateLabel(entry.dayKey) }}
            </span>
            <span v-if="entry.note" class="w-full text-xs text-[hsl(var(--muted-foreground))]">{{ entry.note }}</span>
            <span
              v-if="entryReason(entry)"
              class="w-full text-xs"
              :class="entry.status === 'rejected' ? 'text-red-700' : 'text-amber-700'"
            >
              {{ entryReason(entry) }}
            </span>
            <button
              type="button"
              class="ml-auto text-xs font-semibold text-red-600 hover:underline"
              @click="$emit('withdraw', entry)"
            >
              Remove
            </button>
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { NiyamChallenge, NiyamChallengeStats, NiyamSubmission, NiyamSubmissionStatus } from '~/types'
import {
  challengeWindow,
  formatCount,
  isChallengeOpen,
  percentOf,
  reviewReason,
  SUBMISSION_NOTE_MAX,
  unitLabel
} from '~/utils/niyamChallenge'

const props = defineProps<{
  challenge: NiyamChallenge
  stats: NiyamChallengeStats
  myApproved: number
  myPending: number
  mySubmissions: NiyamSubmission[]
  isLoggedIn: boolean
  submitting: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { amount: number; note: string; done: (status: NiyamSubmissionStatus) => void; fail: (message: string) => void }]
  withdraw: [submission: NiyamSubmission]
}>()

const amount = ref<number | string>('')
const note = ref('')
const feedback = ref('')
const feedbackHeld = ref(false)
const localError = ref('')
const showEntries = ref(false)

const range = computed(() => challengeWindow(props.challenge))
const open = computed(() => isChallengeOpen(props.challenge))

const approvedPercent = computed(() => percentOf(props.stats.approvedTotal, props.challenge.target))
/** Held entries take up the bar's remaining room, never the counted portion. */
const pendingPercent = computed(() =>
  Math.min(100 - approvedPercent.value, percentOf(props.stats.pendingTotal, props.challenge.target))
)
const remaining = computed(() => Math.max(0, props.challenge.target - props.stats.approvedTotal))

/** A gentle default in the box: today's fair share of what is left. */
const suggestedAmount = computed(() => {
  const days = Math.max(1, range.value.daysLeft)
  const share = Math.ceil(remaining.value / days / Math.max(1, props.stats.participants || 1))
  return Math.min(props.challenge.autoApproveMax || share, Math.max(1, share))
})

const windowLabel = computed(() => {
  if (!props.challenge.active) return 'Paused'
  if (!range.value.hasStarted) return 'Starting soon'
  if (range.value.hasEnded) return 'Closed'
  return `${formatCount(range.value.daysLeft)} days left`
})

const windowChipClass = computed(() =>
  open.value
    ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
)

/**
 * Why an entry is not counted. An admin's own words win; otherwise fall back to
 * the threshold that held it, so the answer is never just a grey chip.
 */
function entryReason(entry: NiyamSubmission): string {
  if (entry.reviewNote) return entry.reviewNote
  if (entry.status === 'pending') return reviewReason(props.challenge)
  return ''
}

function statusChipLabel(status: NiyamSubmissionStatus) {
  if (status === 'approved') return 'Counted'
  if (status === 'rejected') return 'Not counted'
  return 'Awaiting review'
}

function statusChipClass(status: NiyamSubmissionStatus) {
  if (status === 'approved') return 'bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'
  if (status === 'rejected') return 'bg-red-50 text-red-700'
  return 'bg-amber-50 text-amber-800'
}

function onSubmit() {
  localError.value = ''
  feedback.value = ''
  const value = Math.floor(Number(amount.value) || 0)
  if (value < 1) {
    localError.value = `Enter how many ${props.challenge.unit} you have done.`
    return
  }
  emit('submit', {
    amount: value,
    note: note.value,
    done: (status) => {
      amount.value = ''
      note.value = ''
      feedbackHeld.value = status === 'pending'
      feedback.value = status === 'pending'
        ? `Thank you — ${formatCount(value)} ${unitLabel(props.challenge, value)} recorded. An admin will confirm it before it joins the total.`
        : `Thank you — ${formatCount(value)} ${unitLabel(props.challenge, value)} added to the total.`
    },
    fail: (message) => {
      localError.value = message
    }
  })
}
</script>
