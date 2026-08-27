<template>
  <section class="card-surface overflow-hidden">
    <h2>
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        :aria-expanded="expanded"
        :aria-controls="panelId"
        @click="expanded = !expanded"
      >
        <span>
          <span class="block font-display text-lg font-semibold text-[hsl(var(--primary))]">Your sadhana</span>
          <span class="mt-0.5 block text-xs text-[hsl(var(--muted-foreground))]">
            Private to you — never shown to anyone else
          </span>
        </span>
        <IconChevronDown
          class="h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform"
          :class="expanded && 'rotate-180'"
          aria-hidden="true"
        />
      </button>
    </h2>

    <div v-show="expanded" :id="panelId" class="border-t border-[hsl(var(--border))] px-5 py-5">
      <p v-if="!isLoggedIn" class="text-sm text-[hsl(var(--muted-foreground))]">
        <NuxtLink to="/login?redirect=/niyams" class="font-semibold text-[hsl(var(--golden-900))] hover:underline">
          Sign in
        </NuxtLink>
        to keep your own count. Your entries are visible only to you and the mandir's admins.
      </p>

      <template v-else>
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
          What you have added
        </p>
        <ul class="mt-3 space-y-2">
          <li
            v-for="row in rows"
            :key="row.challenge.id"
            class="flex items-center justify-between gap-3 rounded-xl bg-[hsl(var(--muted))]/50 px-3 py-2.5"
          >
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold text-[hsl(var(--foreground))]">
                {{ row.challenge.title }}
              </span>
              <span v-if="row.pending > 0" class="mt-0.5 block text-xs text-[hsl(var(--muted-foreground))]">
                {{ formatCount(row.pending) }} {{ unitLabel(row.challenge, row.pending) }} awaiting review
              </span>
            </span>
            <span class="shrink-0 text-right">
              <span class="block font-display text-lg leading-none text-[hsl(var(--primary))]">
                {{ formatCount(row.approved) }}
              </span>
              <span class="mt-0.5 block text-[11px] text-[hsl(var(--muted-foreground))]">
                {{ unitLabel(row.challenge, row.approved) }} counted
              </span>
            </span>
          </li>
        </ul>

        <p class="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
          Your entries
        </p>
        <p v-if="!submissions.length" class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Nothing yet. Whatever you add appears here, and you can remove any of it.
        </p>
        <ul v-else class="mt-3 space-y-2">
          <li
            v-for="entry in submissions"
            :key="entry.id"
            class="rounded-xl border border-[hsl(var(--border))] px-3 py-2.5"
          >
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="text-sm font-semibold text-[hsl(var(--foreground))]">
                {{ formatCount(entry.amount) }} {{ entryUnit(entry) }}
              </span>
              <span class="text-xs text-[hsl(var(--muted-foreground))]">{{ titleFor(entry.challengeId) }}</span>
              <span v-if="entry.dayKey" class="text-xs text-[hsl(var(--muted-foreground))]">
                {{ formatUkDateLabel(entry.dayKey) }}
              </span>
              <button
                type="button"
                class="ml-auto flex h-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                @click="emit('withdraw', entry)"
              >
                <IconTrash class="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            </div>
            <p class="mt-1 flex items-center gap-1.5 text-xs" :class="statusTextClass(entry.status)">
              <IconCheck v-if="entry.status === 'approved'" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <IconClockPause v-else-if="entry.status === 'pending'" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <IconX v-else class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{{ statusLabel(entry.status) }}</span>
            </p>
            <p v-if="entry.note" class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{{ entry.note }}</p>
            <p v-if="entryReason(entry)" class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {{ entryReason(entry) }}
            </p>
          </li>
        </ul>
      </template>

      <p class="mt-5 border-t border-[hsl(var(--border))] pt-4 text-sm text-[hsl(var(--muted-foreground))]">
        Small entries join the sangat's total straight away. A large one is held for an admin to
        confirm first, so nobody's single number can move the shared total on its own. Nothing here
        is compared with anyone else — there is no ranking and no leaderboard.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IconCheck, IconChevronDown, IconClockPause, IconTrash, IconX } from '@tabler/icons-vue'
import type { NiyamChallenge, NiyamSubmission, NiyamSubmissionStatus } from '~/types'
import { formatUkDateLabel } from '~/utils/gameDay'
import { formatCount, reviewReason, unitLabel } from '~/utils/niyamChallenge'

const props = defineProps<{
  rows: { challenge: NiyamChallenge; approved: number; pending: number }[]
  submissions: NiyamSubmission[]
  isLoggedIn: boolean
}>()

const emit = defineEmits<{ withdraw: [submission: NiyamSubmission] }>()

const expanded = ref(false)
const panelId = useId()

function challengeFor(id: string): NiyamChallenge | undefined {
  return props.rows.find(r => r.challenge.id === id)?.challenge
}

function titleFor(id: string): string {
  return challengeFor(id)?.title || id
}

function entryUnit(entry: NiyamSubmission): string {
  const challenge = challengeFor(entry.challengeId)
  return challenge ? unitLabel(challenge, entry.amount) : 'entries'
}

function statusLabel(status: NiyamSubmissionStatus): string {
  if (status === 'approved') return 'Counted in the total'
  if (status === 'rejected') return 'Not counted'
  return 'Awaiting review'
}

/** Status carries an icon and a sentence, never colour on its own. */
function statusTextClass(status: NiyamSubmissionStatus): string {
  if (status === 'approved') return 'text-[hsl(var(--golden-900))]'
  if (status === 'rejected') return 'text-red-700'
  return 'text-[hsl(var(--muted-foreground))]'
}

function entryReason(entry: NiyamSubmission): string {
  if (entry.reviewNote) return entry.reviewNote
  const challenge = challengeFor(entry.challengeId)
  if (entry.status === 'pending' && challenge) return reviewReason(challenge)
  return ''
}
</script>
