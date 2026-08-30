<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="mx-auto max-w-4xl">
      <PageHeader
        title="Our Events"
        subtitle="Lead-up sabhas, cultural programmes, and mahotsav dates."
      />

      <ClientOnly>
        <div v-if="isLoading" class="grid gap-4 sm:grid-cols-2">
          <div v-for="i in 4" :key="i" class="h-64 animate-pulse rounded-2xl bg-[hsl(var(--muted))]" />
        </div>

        <div v-else-if="events.length" class="space-y-12">
          <section>
            <div class="mb-5 flex items-end justify-between gap-3">
              <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Upcoming</h2>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                {{ upcoming.length }} event{{ upcoming.length === 1 ? '' : 's' }}
              </p>
            </div>

            <div v-if="upcoming.length" class="grid gap-5 sm:grid-cols-2">
              <article v-for="event in upcoming" :key="event.id" class="card-surface overflow-hidden">
                <img
                  v-if="event.posterUrl"
                  :src="event.posterUrl"
                  :alt="event.title"
                  class="h-auto w-full object-contain bg-[hsl(var(--muted))]"
                >
                <div class="p-5 sm:p-6">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golden-900))]">
                    {{ formatDate(event.date) }}
                  </p>
                  <h3 class="mt-2 font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ event.title }}</h3>
                  <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {{ event.description }}
                  </p>
                  <EventActions :event="event" allow-calendar />
                </div>
                <EventFlickrAlbum
                  v-if="event.flickrAlbumId"
                  :album-id="event.flickrAlbumId"
                  :event-title="event.title"
                />
              </article>
            </div>
            <div v-else class="card-surface p-6 text-sm text-[hsl(var(--muted-foreground))]">
              No upcoming events yet. Check back as Patotsav approaches.
            </div>
          </section>

          <section v-if="past.length">
            <div class="mb-5 flex items-end justify-between gap-3">
              <h2 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Past</h2>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                {{ past.length }} event{{ past.length === 1 ? '' : 's' }}
              </p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <article v-for="event in past" :key="event.id" class="card-surface overflow-hidden opacity-95">
                <img
                  v-if="event.posterUrl"
                  :src="event.posterUrl"
                  :alt="event.title"
                  class="h-auto w-full object-contain bg-[hsl(var(--muted))]"
                >
                <div class="p-5 sm:p-6">
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golden-900))]">
                    {{ formatDate(event.date) }}
                  </p>
                  <h3 class="mt-2 font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ event.title }}</h3>
                  <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                    {{ event.description }}
                  </p>
                  <EventActions :event="event" />
                </div>
                <EventFlickrAlbum
                  v-if="event.flickrAlbumId"
                  :album-id="event.flickrAlbumId"
                  :event-title="event.title"
                />
              </article>
            </div>
          </section>
        </div>

        <div v-else class="card-surface p-8 text-center sm:p-12">
          <p class="font-display text-xl text-[hsl(var(--primary))]">Coming soon</p>
          <p class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            Until then, keep the niyams, join WhatsApp seva, and watch the countdown on the home page.
          </p>
          <NuxtLink to="/" class="btn-primary mt-6 inline-flex text-sm">Back home</NuxtLink>
        </div>
        <template #fallback>
          <div class="h-48 animate-pulse rounded-2xl bg-[hsl(var(--muted))]" />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ukDateId } from '~/utils/gameDay'
import { formatEventDateLong, isPastEventDate, isUpcomingEventDate, normalizeEventDateId } from '~/utils/eventSharing'
import type { Event } from '~/types'

const { events, isLoading } = useEvents()
const { request: requestPushPrompt } = usePushPrompt()
const { request: requestInstallPrompt } = useInstallPrompt()
let pushPromptTimer: number | null = null

onMounted(() => {
  pushPromptTimer = window.setTimeout(() => {
    requestInstallPrompt('events')
    requestPushPrompt('events')
  }, 1200)
})
onUnmounted(() => {
  if (pushPromptTimer) window.clearTimeout(pushPromptTimer)
})

/** UK calendar day — event dates are compared as YYYY-MM-DD strings. */
const todayId = computed(() => ukDateId())

function eventSortKey(event: Event) {
  const id = normalizeEventDateId(event.date)
  return /^\d{4}-\d{2}-\d{2}$/.test(id) ? id : '9999-99-99'
}

const upcoming = computed(() =>
  events.value
    .filter(event => isUpcomingEventDate(event.date, todayId.value))
    .sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)))
)

const past = computed(() =>
  events.value
    .filter(event => isPastEventDate(event.date, todayId.value))
    .sort((a, b) => eventSortKey(b).localeCompare(eventSortKey(a)))
)

const formatDate = formatEventDateLong

usePageSeo('Our Events', 'Upcoming and past events at Shree KS Swaminarayan Temple Woolwich, with photographs from each celebration.')
</script>
