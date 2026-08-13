<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-5xl mx-auto">
      <PageHeader
        title="Our Journey"
        subtitle="The last 10 years — pick a year, then scroll the moments, photos and videos."
      />

      <ClientOnly>
        <div v-if="isLoading" class="flex min-h-[30vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
          Loading Journey...
        </div>
        <template v-else>
          <div class="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:overflow-visible">
            <button
              v-for="y in years"
              :key="y"
              type="button"
              class="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
              :class="selectedYear === String(y)
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]'"
              @click="selectedYear = String(y)"
            >
              {{ y }}
            </button>
          </div>

          <div v-if="yearMoments.length === 0" class="card-surface p-8 text-center">
            <p class="font-display text-3xl text-[hsl(var(--primary))]">{{ selectedYear }}</p>
            <p class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              No photos or stories for this year yet. Add a Firestore <code>timeline</code> document with
              <code>year</code>, <code>title</code>, <code>description</code>, and <code>media</code> (images/videos).
            </p>
          </div>

          <div v-else class="space-y-8">
            <article
              v-for="item in yearMoments"
              :key="item.id"
              class="card-surface overflow-hidden"
            >
              <div class="p-6 sm:p-8">
                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--accent))]">
                  {{ item.date || item.year }}
                </p>
                <h3 class="mt-2 text-2xl font-display font-semibold">{{ item.title }}</h3>
                <p class="mt-3 text-[hsl(var(--muted-foreground))] leading-relaxed">{{ item.description }}</p>
              </div>
              <div v-if="itemMedia(item).length" class="space-y-4 px-6 pb-6">
                <div
                  v-for="(m, i) in itemMedia(item)"
                  :key="i"
                  class="overflow-hidden rounded-xl bg-[hsl(var(--muted))]"
                >
                  <video
                    v-if="m.type === 'video'"
                    :src="m.url"
                    controls
                    class="h-auto w-full"
                  />
                  <img
                    v-else
                    :src="m.url"
                    :alt="m.caption || item.title"
                    class="h-auto w-full object-contain"
                  >
                  <p v-if="m.caption" class="px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">{{ m.caption }}</p>
                </div>
              </div>
            </article>
          </div>
        </template>
        <template #fallback>
          <div class="flex min-h-[30vh] items-center justify-center text-[hsl(var(--muted-foreground))]">Loading Journey...</div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimelineItem, TimelineMedia } from '~/types'
import { journeyYears } from '~/data/timeline'

const { timeline, isLoading } = useTimeline()
const years = journeyYears()
const nowYear = new Date().getFullYear()
const selectedYear = ref(String(years.includes(nowYear) ? nowYear : years[years.length - 1]))

const yearMoments = computed(() =>
  timeline.value.filter(t => t.year === selectedYear.value)
)

function itemMedia(item: TimelineItem): TimelineMedia[] {
  if (item.media?.length) return item.media
  const out: TimelineMedia[] = []
  if (item.imageUrl) out.push({ type: 'image', url: item.imageUrl })
  if (item.videoUrl) out.push({ type: 'video', url: item.videoUrl })
  return out
}
</script>
