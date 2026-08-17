<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="mx-auto max-w-4xl">
      <PageHeader
        title="Seva"
        subtitle="Join the WhatsApp community and find a team where you can help."
      />

      <a
        :href="SITE.whatsappInviteUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="btn-primary mb-10 inline-flex w-full justify-center sm:w-auto"
      >
        {{ SITE.whatsappLabel }}
      </a>

      <h2 class="mb-4 font-display text-xl font-semibold">Bhaktiras Volunteer Teams</h2>
      <p class="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
        Once you’re in WhatsApp, pick a team that fits. Ask the seva desk if you’re unsure.
      </p>
      <div class="grid gap-4 sm:grid-cols-2">
        <article v-for="team in teams" :key="team.id" class="card-surface p-5 sm:p-6">
          <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">{{ team.name }}</h3>
          <p v-if="team.summary" class="mt-1 text-sm font-medium text-[hsl(var(--accent))]">{{ team.summary }}</p>
          <p class="mt-2 text-sm leading-relaxed text-[hsl(var(--foreground))]/80">{{ team.description }}</p>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SITE } from '~/data/site'
import { SEVA_TEAMS } from '~/data/sevaTeams'

const teams = SEVA_TEAMS
</script>
