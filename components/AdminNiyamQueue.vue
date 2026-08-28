<template>
  <section aria-labelledby="niyam-queue-heading" class="admin-panel space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 id="niyam-queue-heading" class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
        Waiting for you ({{ rows.length }})
      </h2>
      <p class="text-xs text-[hsl(var(--muted-foreground))]">
        Every niyam in one pass. Approving folds the entry into that niyam's total.
      </p>
    </div>

    <div v-if="rows.length" class="flex flex-wrap gap-1.5">
      <button
        type="button"
        class="min-h-[36px] rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
        :class="!filterId
          ? 'bg-[hsl(var(--primary))] text-white'
          : 'border border-[hsl(var(--border))] bg-white text-[hsl(var(--muted-foreground))]'"
        @click="$emit('filter', '')"
      >
        All ({{ rows.length }})
      </button>
      <button
        v-for="group in groups"
        :key="group.id"
        type="button"
        class="min-h-[36px] rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
        :class="filterId === group.id
          ? 'bg-[hsl(var(--primary))] text-white'
          : 'border border-[hsl(var(--border))] bg-white text-[hsl(var(--muted-foreground))]'"
        @click="$emit('filter', group.id)"
      >
        {{ group.title }} ({{ group.count }})
      </button>
    </div>

    <p v-if="loading" class="text-sm text-[hsl(var(--muted-foreground))]">Loading held entries…</p>
    <p v-else-if="!rows.length" class="text-sm text-[hsl(var(--muted-foreground))]">
      Nothing is held back. Entries above a niyam's auto-approve figure land here.
    </p>
    <p v-else-if="!visible.length" class="text-sm text-[hsl(var(--muted-foreground))]">
      Nothing held on that niyam. Choose “All” to see the rest.
    </p>

    <ul v-if="visible.length" class="space-y-3">
      <li
        v-for="entry in visible"
        :key="entry.id"
        class="rounded-xl border border-amber-200 bg-amber-50/60 p-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--primary))]">
            <NiyamIcon :name="iconFor(challengeFor(entry))" class="h-3.5 w-3.5" />
            {{ challengeFor(entry)?.title || entry.challengeId }}
          </span>
          <span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            Awaiting review
          </span>
          <span class="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
            {{ entry.dayKey ? formatUkDateLabel(entry.dayKey) : 'no day recorded' }}
          </span>
        </div>

        <p class="mt-2 font-semibold text-[hsl(var(--foreground))]">
          {{ entry.userName }}
          <span class="text-[hsl(var(--primary))]">
            · {{ formatCount(entry.amount) }} {{ amountUnit(entry) }}
          </span>
        </p>
        <p v-if="entry.note" class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">“{{ entry.note }}”</p>

        <!-- The judgement context: what this person has done on this niyam already. -->
        <p class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
          {{ summary(entry) }}
        </p>
        <button
          v-if="!contextFor(entry).complete"
          type="button"
          class="mt-1 min-h-[36px] text-xs font-semibold text-[hsl(var(--primary))] hover:underline disabled:opacity-40"
          :disabled="historyLoading === entry.userChallengeKey"
          @click="$emit('load-history', entry.userChallengeKey)"
        >
          {{ historyLoading === entry.userChallengeKey ? 'Loading history…' : 'Load this devotee’s history' }}
        </button>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="admin-btn min-h-[44px] px-4"
            :disabled="!!reviewingId"
            @click="$emit('approve', entry)"
          >
            {{ reviewingId === entry.id ? 'Saving…' : 'Approve' }}
          </button>
          <button
            type="button"
            class="admin-btn-secondary min-h-[44px] px-4"
            :disabled="!!reviewingId"
            @click="$emit('reject', entry)"
          >
            Reject
          </button>
        </div>
      </li>
    </ul>

    <p v-if="capped" class="text-xs text-[hsl(var(--muted-foreground))]">
      Some niyams have more held entries than fit on one page. Clear these and refresh to see the rest.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { NiyamSubmission } from '~/types'
import type { NiyamChallenge } from '~/types'
import type { NiyamReviewContext } from '~/composables/useAdminNiyamChallenges'
import { formatCount, iconFor, unitLabel } from '~/utils/niyamChallenge'

const props = defineProps<{
  rows: NiyamSubmission[]
  challenges: NiyamChallenge[]
  contextFor: (entry: NiyamSubmission) => NiyamReviewContext
  reviewingId: string | null
  historyLoading: string | null
  filterId?: string
  loading?: boolean
  capped?: boolean
}>()

defineEmits<{
  approve: [entry: NiyamSubmission]
  reject: [entry: NiyamSubmission]
  filter: [challengeId: string]
  'load-history': [key: string]
}>()

const byId = computed(() => new Map(props.challenges.map(c => [c.id, c])))

const visible = computed(() =>
  props.filterId ? props.rows.filter(r => r.challengeId === props.filterId) : props.rows
)

const groups = computed(() =>
  [...new Set(props.rows.map(r => r.challengeId))].map(id => ({
    id,
    title: byId.value.get(id)?.title || id,
    count: props.rows.filter(r => r.challengeId === id).length
  }))
)

function challengeFor(entry: NiyamSubmission): NiyamChallenge | undefined {
  return byId.value.get(entry.challengeId)
}

function amountUnit(entry: NiyamSubmission): string {
  const challenge = challengeFor(entry)
  return challenge ? unitLabel(challenge, entry.amount) : 'entries'
}

/** One line an admin can judge a held entry against. */
function summary(entry: NiyamSubmission): string {
  const context = props.contextFor(entry)
  const unit = amountUnit(entry)
  if (!context.complete) {
    return `${context.pendingCount} ${context.pendingCount === 1 ? 'entry' : 'entries'} of theirs held on this niyam · history not loaded`
  }
  const parts = [
    `${formatCount(context.approvedTotal)} ${unit} counted so far`,
    `${context.entryCount} ${context.entryCount === 1 ? 'entry' : 'entries'} in total`
  ]
  if (context.sameDayCount > 1) {
    parts.push(`${context.sameDayCount} entries on this day (${formatCount(context.sameDayTotal)} ${unit})`)
  }
  if (context.pendingCount > 1) parts.push(`${context.pendingCount} awaiting review`)
  return parts.join(' · ')
}
</script>
