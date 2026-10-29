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

      <h2 class="mb-4 font-display text-xl font-semibold">{{ sevaHeading }}</h2>
      <p class="mb-6 text-sm text-[hsl(var(--muted-foreground))]">
        {{ sevaIntro }}
      </p>
      <div class="grid gap-4 sm:grid-cols-2">
        <article v-for="team in sevaTeams" :key="team.id" class="card-surface p-5 sm:p-6">
          <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">{{ team.name }}</h3>
          <p v-if="team.summary" class="mt-1 text-sm font-medium text-[hsl(var(--golden-900))]">{{ team.summary }}</p>
          <p class="mt-2 text-sm leading-relaxed text-[hsl(var(--foreground))]/80">{{ team.description }}</p>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SITE } from '~/data/site'

const { sevaHeading, sevaIntro, sevaTeams } = useSiteContent()

usePageSeo('Seva', 'Join a seva team for the Bhaktiras Patotsav — twelve teams, and a WhatsApp community to sign up through.')
</script>
