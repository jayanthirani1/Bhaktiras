<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="mx-auto max-w-4xl">
      <PageHeader
        title="Seva"
        subtitle="Join the WhatsApp community, find a team, and quietly log hours — no names, no leaderboard."
      />

      <a
        :href="SITE.whatsappInviteUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="btn-primary mb-10 inline-flex w-full justify-center sm:w-auto"
      >
        {{ SITE.whatsappLabel }}
      </a>

      <section class="card-surface mb-10 p-6 sm:p-8 text-center">
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--accent))]">Anonymous seva counter</p>
        <p class="mt-3 font-display text-5xl font-semibold tabular-nums text-[hsl(var(--primary))]">
          {{ seva.isLoading.value ? '—' : Math.round(seva.totalHours.value) }}
        </p>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">hours offered towards Patotsav</p>
        <form class="mx-auto mt-6 flex max-w-xs flex-col gap-3 sm:flex-row" @submit.prevent="onLogHours">
          <input
            v-model.number="hoursInput"
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            placeholder="Hours"
            class="w-full rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-2.5 text-center"
          >
          <button type="submit" :disabled="seva.isPending.value" class="btn-primary shrink-0 px-5 py-2.5 text-sm">
            {{ seva.isPending.value ? 'Saving…' : 'Log hours' }}
          </button>
        </form>
        <p v-if="hoursError" class="mt-2 text-sm text-red-600">{{ hoursError }}</p>
        <p class="mt-3 text-[11px] text-[hsl(var(--muted-foreground))]">No name is stored. Please log honestly — this is for the mandir, not a competition.</p>
      </section>

      <h2 class="mb-4 font-display text-xl font-semibold">Teams &amp; responsibilities</h2>
      <p class="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
        Once you’re in WhatsApp, pick a team that fits. Ask the seva desk if you’re unsure.
      </p>
      <div class="grid gap-4 sm:grid-cols-2">
        <article v-for="team in teams" :key="team.id" class="card-surface p-5 sm:p-6">
          <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">{{ team.name }}</h3>
          <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ team.summary }}</p>
          <ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-[hsl(var(--foreground))]/80">
            <li v-for="r in team.responsibilities" :key="r">{{ r }}</li>
          </ul>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SITE } from '~/data/site'
import { SEVA_TEAMS } from '~/data/sevaTeams'

const teams = SEVA_TEAMS
const seva = useSevaHours()
const hoursInput = ref<number | null>(2)
const hoursError = ref('')

async function onLogHours() {
  hoursError.value = ''
  try {
    await seva.logHours(Number(hoursInput.value))
    hoursInput.value = 2
  } catch (e) {
    hoursError.value = (e as Error).message
  }
}
</script>
