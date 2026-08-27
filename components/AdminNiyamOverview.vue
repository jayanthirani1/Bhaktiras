<template>
  <section aria-labelledby="niyam-overview-heading" class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 id="niyam-overview-heading" class="font-display text-xl font-semibold text-[hsl(var(--primary))]">
        All niyams
      </h2>
      <div class="flex items-center gap-2">
        <p v-if="loading" class="text-xs text-[hsl(var(--muted-foreground))]">Refreshing…</p>
        <button type="button" class="admin-btn-secondary min-h-[44px]" :disabled="loading" @click="$emit('refresh')">
          Refresh
        </button>
      </div>
    </div>

    <!-- The one thing an admin opens this page to find out. -->
    <div
      v-if="awaitingTotal > 0"
      class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <p class="text-sm font-semibold text-amber-800">
        {{ awaitingTotal }} {{ awaitingTotal === 1 ? 'entry is' : 'entries are' }} waiting for you
        across {{ waitingNiyams }} {{ waitingNiyams === 1 ? 'niyam' : 'niyams' }}.
      </p>
      <button type="button" class="admin-btn min-h-[44px]" @click="$emit('review', '')">
        Go to the queue
      </button>
    </div>
    <p
      v-else-if="!loading"
      class="rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]"
    >
      Nothing is waiting for review. Every entry devotees have made is counted or answered.
    </p>

    <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="row in rows" :key="row.challenge.id" class="admin-panel flex flex-col gap-3">
        <div class="flex items-start justify-between gap-2">
          <button
            type="button"
            class="flex min-h-[44px] items-start gap-2 text-left"
            @click="$emit('select', row.challenge.id)"
          >
            <AdminNiyamIcon
              :name="row.challenge.icon"
              class="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--golden-900))]"
            />
            <span class="font-semibold text-[hsl(var(--primary))] hover:underline">
              {{ row.challenge.title }}
            </span>
          </button>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            :class="statusChipClass(row.status)"
          >
            {{ row.statusLabel }}
          </span>
        </div>

        <div>
          <p class="flex items-baseline gap-1.5">
            <span
              class="font-display text-2xl leading-none text-[hsl(var(--primary))]"
              :title="`${formatCount(row.approvedTotal)} ${row.challenge.unit}`"
            >{{ formatBigCount(row.approvedTotal) }}</span>
            <span class="text-sm text-[hsl(var(--muted-foreground))]">
              of {{ formatBigCount(row.challenge.target) }} {{ row.challenge.unit }}
            </span>
          </p>
          <div
            class="mt-2 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]"
            role="progressbar"
            :aria-valuenow="row.percent"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${row.challenge.title} progress`"
          >
            <div class="h-full bg-[hsl(var(--golden-500))]" :style="{ width: `${row.percent}%` }" />
          </div>
          <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {{ row.percent }}% · {{ formatCount(row.participants) }}
            {{ row.participants === 1 ? 'devotee' : 'devotees' }} taking part
          </p>
        </div>

        <!-- Unpublished defaults cannot take an entry at all: the rules need the
             niyamChallenges document to exist before a submission is allowed. -->
        <div v-if="!row.published" class="mt-auto space-y-2">
          <p class="text-xs text-[hsl(var(--muted-foreground))]">
            Devotees can see this niyam but cannot add to it until it is published.
          </p>
          <button
            type="button"
            class="admin-btn min-h-[44px] w-full"
            :disabled="publishing"
            @click="$emit('publish', row.challenge.id)"
          >
            {{ publishingId === row.challenge.id ? 'Publishing…' : 'Publish' }}
          </button>
        </div>

        <button
          v-else-if="row.awaiting > 0"
          type="button"
          class="mt-auto flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm font-semibold text-amber-800 hover:bg-amber-100"
          @click="$emit('review', row.challenge.id)"
        >
          <span>
            {{ row.awaiting }}{{ row.awaitingCapped ? '+' : '' }}
            {{ row.awaiting === 1 && !row.awaitingCapped ? 'entry' : 'entries' }} waiting for you
          </span>
          <span aria-hidden="true">→</span>
        </button>

        <p v-else class="mt-auto text-xs text-[hsl(var(--muted-foreground))]">
          Nothing held for review.
        </p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { NiyamOverviewRow, NiyamOverviewStatus } from '~/composables/useAdminNiyamChallenges'
import { formatBigCount } from '~/composables/useAdminNiyamChallenges'
import { formatCount } from '~/utils/niyamChallenge'

const props = defineProps<{
  rows: NiyamOverviewRow[]
  awaitingTotal: number
  loading?: boolean
  publishing?: boolean
  publishingId?: string | null
}>()

defineEmits<{
  select: [challengeId: string]
  review: [challengeId: string]
  publish: [challengeId: string]
  refresh: []
}>()

const waitingNiyams = computed(() => props.rows.filter(r => r.awaiting > 0).length)

function statusChipClass(status: NiyamOverviewStatus) {
  if (status === 'open') return 'bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'
  if (status === 'unpublished') return 'bg-amber-50 text-amber-800'
  return 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
}
</script>
