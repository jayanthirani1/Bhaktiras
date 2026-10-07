<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <NuxtLink to="/play/lanka-leap" class="inline-flex rounded-full bg-[hsl(var(--muted))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))]">
        ‹ Back to Lanka Leap
      </NuxtLink>

      <PageHeader title="The flight to Lanka" subtitle="The Sundar Kand episodes behind Lanka Leap." />

      <p class="mt-6 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
        Sent by Shri Ram to find Sita, Hanumanji leapt from Mount Mahendra and flew across the ocean to Lanka.
        On the way he met a friend, a test and an enemy, and at the end of his flight, the guardian of the city.
      </p>

      <nav class="mt-5 flex flex-wrap gap-2" aria-label="Characters">
        <a
          v-for="story in LANKA_LEAP_STORIES"
          :key="story.id"
          :href="`#${story.id}`"
          class="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-800"
        >{{ story.name }}</a>
      </nav>

      <article
        v-for="story in LANKA_LEAP_STORIES"
        :id="story.id"
        :key="story.id"
        class="card-surface mt-6 scroll-mt-24 space-y-3 p-5 sm:p-6"
      >
        <header>
          <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">{{ story.name }}</h2>
          <p class="text-sm font-medium text-[hsl(var(--golden-900))]">{{ story.role }}</p>
        </header>
        <p
          v-for="(paragraph, index) in story.paragraphs"
          :key="index"
          class="text-[15px] leading-relaxed text-[hsl(var(--foreground))]"
        >{{ paragraph }}</p>
        <p class="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">
          <span class="font-semibold">In the game:</span> {{ story.inGame }}
        </p>
      </article>

      <p class="mt-6 text-xs text-[hsl(var(--muted-foreground))]">Source: {{ LANKA_LEAP_STORY_SOURCE }}.</p>

      <NuxtLink to="/play/lanka-leap" class="mt-6 inline-flex rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white">
        Play Lanka Leap
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LANKA_LEAP_STORIES, LANKA_LEAP_STORY_SOURCE } from '~/data/lankaLeapStories'

usePageSeo('The flight to Lanka', 'Mainak, Surasa, Simhika and Lankini: the Sundar Kand episodes behind Lanka Leap.')
</script>
