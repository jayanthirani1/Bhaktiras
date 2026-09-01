<template>
  <section class="mt-5 border-t border-[hsl(var(--border))] pt-4">
    <h3 class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golden-900))]">
      {{ copy('myEntriesTitle') }}
    </h3>

    <p v-if="!isLoggedIn" class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
      <NuxtLink to="/login?redirect=/niyams" class="font-semibold text-[hsl(var(--golden-900))] hover:underline">
        Sign in
      </NuxtLink>
      to see and remove what you have added.
    </p>

    <template v-else>
      <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{{ copy('myEntriesNote') }}</p>

      <p v-if="!recent.length" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
        {{ copy('myEntriesEmpty') }}
      </p>

      <ul v-else class="mt-3 space-y-2">
        <li
          v-for="entry in recent"
          :key="entry.id"
          class="rounded-xl border border-[hsl(var(--border))] px-3 py-2.5"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-[hsl(var(--foreground))]">
                {{ formatCount(entry.amount) }} {{ unitLabel(challenge, entry.amount) }}
              </p>
              <p class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" :class="statusClass(entry.status)">
                <span v-if="entry.dayKey" class="text-[hsl(var(--muted-foreground))]">
                  {{ formatUkDateLabel(entry.dayKey) }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <IconCheck v-if="entry.status === 'approved'" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <IconClockPause v-else-if="entry.status === 'pending'" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <IconX v-else class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {{ statusLabel(entry.status) }}
                </span>
              </p>
              <p v-if="entry.note" class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{{ entry.note }}</p>
              <p v-if="entry.reviewNote" class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {{ entry.reviewNote }}
              </p>
            </div>

            <!-- Two taps, not a dialog: a sheet on top of a sheet is worse than
                 a row that asks once, and the entry is gone for good. -->
            <button
              v-if="confirmingId !== entry.id"
              type="button"
              class="-mr-1 flex h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-40"
              :disabled="!!withdrawingId"
              @click="confirmingId = entry.id"
            >
              <IconTrash class="h-4 w-4" aria-hidden="true" />
              <span>Remove</span>
              <span class="sr-only">
                — {{ formatCount(entry.amount) }} {{ unitLabel(challenge, entry.amount) }}
              </span>
            </button>
          </div>

          <div
            v-if="confirmingId === entry.id"
            class="mt-2 rounded-lg bg-[hsl(var(--muted))]/70 px-3 py-2.5"
          >
            <p class="text-xs text-[hsl(var(--foreground))]">{{ copy('removeConfirm') }}</p>
            <p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              {{ entry.status === 'approved'
                ? 'It comes back out of the sangat\'s total.'
                : 'It was never in the sangat\'s total.' }}
            </p>
            <div class="mt-2 flex gap-2">
              <button
                type="button"
                class="min-h-[40px] flex-1 rounded-lg bg-red-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
                :disabled="!!withdrawingId"
                @click="confirmRemove(entry)"
              >
                {{ withdrawingId === entry.id ? 'Removing…' : 'Yes, remove it' }}
              </button>
              <button
                type="button"
                class="min-h-[40px] flex-1 rounded-lg border border-[hsl(var(--border))] bg-white px-3 text-xs font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--golden-50))]"
                :disabled="!!withdrawingId"
                @click="confirmingId = ''"
              >
                Keep it
              </button>
            </div>
          </div>
        </li>
      </ul>

      <p v-if="hiddenCount > 0" class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
        {{ hiddenCount }} older {{ hiddenCount === 1 ? 'entry is' : 'entries are' }} not shown here, and
        {{ hiddenCount === 1 ? 'stays' : 'stay' }} as {{ hiddenCount === 1 ? 'it is' : 'they are' }}.
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { IconCheck, IconClockPause, IconTrash, IconX } from '@tabler/icons-vue'
import type { NiyamChallenge, NiyamSubmission, NiyamSubmissionStatus } from '~/types'
import { formatUkDateLabel } from '~/utils/gameDay'
import { formatCount, unitLabel } from '~/utils/niyamChallenge'

/**
 * A devotee's own last few entries on one niyam, each removable.
 *
 * Only their own — `niyamSubmissions` is readable by its author and by admins
 * and by nobody else, so this list cannot show anyone else's sadhana even by
 * mistake. Five is deliberate: this exists to undo a mistyped count that the
 * 30-second undo on the log sheet has already timed out on, not to be a diary.
 */
const RECENT_LIMIT = 5

const props = defineProps<{
  challenge: NiyamChallenge
  submissions: NiyamSubmission[]
  isLoggedIn: boolean
  withdrawingId?: string
}>()

const emit = defineEmits<{ withdraw: [submission: NiyamSubmission] }>()

const copy = useNiyamCopy()
const confirmingId = ref('')

const recent = computed(() => props.submissions.slice(0, RECENT_LIMIT))
const hiddenCount = computed(() => Math.max(0, props.submissions.length - RECENT_LIMIT))

/**
 * The confirm stays open until the row actually goes.
 *
 * Closing it here would hide the "Removing…" state entirely, and — because the
 * removal is optimistic — a refused delete would put the row back with no
 * confirm and no obvious way to try again. The watcher below closes it once the
 * row is really gone.
 */
function confirmRemove(entry: NiyamSubmission) {
  emit('withdraw', entry)
}

function statusLabel(status: NiyamSubmissionStatus): string {
  if (status === 'approved') return 'Counted in the total'
  if (status === 'rejected') return 'Not counted'
  return 'Awaiting review'
}

/** Status carries an icon and a sentence, never colour on its own. */
function statusClass(status: NiyamSubmissionStatus): string {
  if (status === 'approved') return 'text-[hsl(var(--golden-900))]'
  if (status === 'rejected') return 'text-red-700'
  return 'text-[hsl(var(--muted-foreground))]'
}

// A removal that lands closes its confirm; one that is refused leaves it open
// on the row that came back.
watch(() => props.submissions, () => {
  if (confirmingId.value && !props.submissions.some(s => s.id === confirmingId.value)) {
    confirmingId.value = ''
  }
})
</script>
