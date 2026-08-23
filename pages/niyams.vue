<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="mx-auto max-w-2xl">
      <PageHeader
        title="Our Niyams"
        subtitle="Goals we keep together. Add what you have done and watch the sangat's total climb."
      />

      <!-- Two things live here: shared challenges with a target, and the
           everyday niyam checklist that came before them. -->
      <div class="mb-6 flex justify-center">
        <div class="inline-flex rounded-full border border-[hsl(var(--border))] bg-white p-1">
          <button
            v-for="option in tabs"
            :key="option.id"
            type="button"
            class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
            :class="tab === option.id
              ? 'bg-[hsl(var(--primary))] text-white'
              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]'"
            @click="tab = option.id"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- ── Challenges ────────────────────────────────────────────── -->
      <section v-if="tab === 'challenges'">
        <p v-if="challengeError" class="mb-4 text-sm text-red-600">{{ challengeError }}</p>
        <p v-if="challengesLoading" class="text-sm text-[hsl(var(--muted-foreground))]">
          Loading challenges…
        </p>

        <div
          v-else-if="!openChallenges.length && !closedChallenges.length"
          class="card-surface p-6 text-center"
        >
          <p class="font-semibold text-[hsl(var(--primary))]">No challenge running right now</p>
          <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            When the mandir sets one — like ten thousand malas before Patotsav — it will appear here
            and everyone's count will add up towards it.
          </p>
        </div>

        <div v-else class="space-y-6">
          <NiyamChallengeCard
            v-for="challenge in openChallenges"
            :key="challenge.id"
            :challenge="challenge"
            :stats="statsFor(challenge.id)"
            :my-approved="myApprovedTotal(challenge.id)"
            :my-pending="myPendingTotal(challenge.id)"
            :my-submissions="submissionsFor(challenge.id)"
            :is-logged-in="isLoggedIn"
            :submitting="submitting"
            @submit="onSubmit(challenge, $event)"
            @withdraw="withdraw"
          />

          <div v-if="closedChallenges.length">
            <h2 class="mb-3 mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
              Finished &amp; upcoming
            </h2>
            <div class="space-y-6">
              <NiyamChallengeCard
                v-for="challenge in closedChallenges"
                :key="challenge.id"
                :challenge="challenge"
                :stats="statsFor(challenge.id)"
                :my-approved="myApprovedTotal(challenge.id)"
                :my-pending="myPendingTotal(challenge.id)"
                :my-submissions="submissionsFor(challenge.id)"
                :is-logged-in="isLoggedIn"
                :submitting="submitting"
                @submit="onSubmit(challenge, $event)"
                @withdraw="withdraw"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- ── Daily niyams ──────────────────────────────────────────── -->
      <section v-else>
        <div class="card-surface mb-6 p-5 text-center sm:p-6">
          <p class="text-sm font-semibold text-[hsl(var(--golden-900))]">
            Niyams completed together with all Devotees
          </p>
          <p class="mt-2 font-display text-4xl text-[hsl(var(--primary))]">
            {{ communityChecks }}
          </p>
        </div>

        <div class="card-surface mb-8 p-5 text-center sm:p-6">
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">Your tracker</p>
          <p class="mt-2 font-display text-4xl text-[hsl(var(--primary))]">
            {{ doneCount }}/{{ total }}
          </p>
          <div class="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
            <div
              class="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-500"
              :style="{ width: `${percent}%` }"
            />
          </div>
          <p v-if="!isLoggedIn" class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
            <NuxtLink to="/login?redirect=/niyams" class="font-semibold text-[hsl(var(--golden-900))] hover:underline">
              Sign in
            </NuxtLink>
            to save your niyams to your account and add to the community total.
          </p>
        </div>

        <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
        <p v-if="loading" class="mb-4 text-sm text-[hsl(var(--muted-foreground))]">Loading niyams…</p>

        <ul class="space-y-3">
          <li
            v-for="n in niyams"
            :key="n.id"
            class="card-surface flex gap-4 p-4 sm:p-5"
          >
            <input
              :id="n.id"
              type="checkbox"
              class="mt-1 h-5 w-5 shrink-0 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
              :checked="!!checked[n.id]"
              :disabled="!!savingId"
              @change="toggle(n.id)"
            >
            <label :for="n.id" class="min-w-0 cursor-pointer">
              <span class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span class="font-semibold text-[hsl(var(--foreground))]">{{ n.title }}</span>
                <span class="text-xs text-[hsl(var(--muted-foreground))]">
                  {{ countLabel(n.id) }}
                </span>
              </span>
              <span class="mt-1 block text-sm text-[hsl(var(--muted-foreground))]">{{ n.detail }}</span>
            </label>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NiyamChallenge, NiyamSubmissionStatus } from '~/types'

type TabId = 'challenges' | 'daily'

const tabs: { id: TabId; label: string }[] = [
  { id: 'challenges', label: 'Challenges' },
  { id: 'daily', label: 'Daily niyams' }
]

const tab = ref<TabId>('challenges')

const {
  openChallenges,
  closedChallenges,
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
  niyams,
  checked,
  stats,
  loading,
  savingId,
  error,
  doneCount,
  total,
  percent,
  communityChecks,
  toggle
} = useNiyamTracker()

/**
 * The card owns its own form state, so it hands us the values plus the
 * callbacks to resolve into — that keeps the "counted" vs "waiting for an
 * admin" message next to the form it came from.
 */
async function onSubmit(
  challenge: NiyamChallenge,
  payload: {
    amount: number
    note: string
    done: (status: NiyamSubmissionStatus) => void
    fail: (message: string) => void
  }
) {
  try {
    const status = await submit(challenge, payload.amount, payload.note)
    payload.done(status)
  } catch (e) {
    payload.fail((e as Error).message)
  }
}

function countLabel(id: string) {
  const n = Number(stats.value.counts[id]) || 0
  if (!n) return 'Be the first'
  return `${n} keeping this`
}

useHead({ title: 'Niyams · Bhaktiras' })
</script>
