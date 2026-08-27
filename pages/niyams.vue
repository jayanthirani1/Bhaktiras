<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="mx-auto max-w-2xl">
      <PageHeader
        title="Our Niyams"
        subtitle="Goals we keep together. Add what you have done and watch the sangat's total climb."
      />

      <!-- Personal Niyams Section -->
      <section class="mb-8">
        <h2 class="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
          Personal niyams
        </h2>
        <MandirVisitCard />
      </section>

      <!-- Community Challenges Section -->
      <section>
        <h2 class="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
          Community challenges
        </h2>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NiyamChallenge, NiyamSubmissionStatus } from '~/types'

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

useHead({ title: 'Niyams · Bhaktiras' })
</script>
