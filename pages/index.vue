<template>
  <div class="min-h-screen pb-28 md:pb-16">
    <section class="relative overflow-hidden px-4 pt-8 pb-10 md:pt-14 md:pb-16">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--golden-300))] to-transparent" />
      <div class="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[hsl(var(--golden-100))]/70 blur-3xl" />

      <div class="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <p class="reveal text-[11px] font-semibold uppercase tracking-[0.28em] text-[hsl(var(--accent))]">
          {{ greeting || 'Jai Swaminarayan' }}
        </p>
        <div class="reveal reveal-delay-1 mt-6 md:mt-8">
          <BhaktirasLogo size="lg" animate />
        </div>

        <p class="reveal reveal-delay-2 mt-6 text-sm font-medium tracking-wide text-[hsl(var(--primary))]">
          {{ SITE.patotsavDateLabel }}
        </p>

        <ClientOnly>
          <div class="reveal reveal-delay-2 mt-8 w-full max-w-lg">
            <p v-if="countdown.isLive.value" class="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
              Live now · {{ SITE.patotsavLabel }}
            </p>
            <p v-else-if="countdown.isPast.value" class="text-sm text-[hsl(var(--muted-foreground))]">
              {{ SITE.patotsavLabel }} has begun its next chapter.
            </p>
            <template v-else>
              <p class="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                Live countdown
              </p>
              <div class="grid grid-cols-4 gap-2 sm:gap-3">
                <div v-for="unit in countdownUnits" :key="unit.label" class="card-surface px-2 py-3 sm:py-4">
                  <div class="font-display text-2xl font-semibold tabular-nums text-[hsl(var(--primary))] sm:text-3xl">
                    {{ String(unit.value).padStart(2, '0') }}
                  </div>
                  <div class="mt-1 text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{{ unit.label }}</div>
                </div>
              </div>
            </template>
          </div>
          <template #fallback>
            <div class="mt-8 h-24 w-full max-w-lg rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />
          </template>
        </ClientOnly>

        <NuxtLink to="/seva" class="reveal reveal-delay-3 mt-8">
          <button class="btn-primary text-sm md:text-base">Join the seva</button>
        </NuxtLink>
      </div>
    </section>

    <section class="mx-auto max-w-2xl px-4">
      <div class="card-surface p-6 sm:p-8 text-center">
        <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--accent))]">Bhakti quote of the week</p>
        <blockquote class="mt-4 font-display text-xl italic leading-relaxed text-[hsl(var(--primary))] sm:text-2xl">
          “{{ weeklyQuote.quote }}”
        </blockquote>
        <p class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">— {{ weeklyQuote.source }}</p>
      </div>
    </section>

    <section class="mx-auto mt-12 max-w-6xl px-4 sm:px-6 md:mt-16">
      <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.id"
          :to="item.href"
          class="card-surface group flex flex-col items-center p-5 text-center sm:p-7"
        >
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:bg-[hsl(var(--primary))] group-hover:text-white sm:h-14 sm:w-14">
            <component :is="item.icon" class="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <h3 class="text-base font-semibold sm:text-lg">{{ item.title }}</h3>
          <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))] sm:text-sm">{{ item.desc }}</p>
        </NuxtLink>
      </div>
    </section>

    <footer class="mt-16 px-6 pb-10 text-center md:mt-24">
      <div class="mx-auto mb-5 h-px w-16 bg-gradient-to-r from-transparent via-[hsl(var(--golden-300))] to-transparent" />
      <blockquote class="font-display text-lg italic text-[hsl(var(--primary))]/80 md:text-2xl">
        “In the joy of others, lies our own.”
      </blockquote>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  IconMapPin,
  IconUsers,
  IconHandGrab,
  IconFlame,
  IconDeviceGamepad2,
  IconCalendarEvent
} from '@tabler/icons-vue'
import { SITE } from '~/data/site'
import { getQuoteOfTheWeek } from '~/utils/quotes'

const { greeting } = useAuth()
const countdown = useCountdown()
const weeklyQuote = getQuoteOfTheWeek()

const countdownUnits = computed(() => [
  { label: 'Days', value: countdown.parts.value.days },
  { label: 'Hours', value: countdown.parts.value.hours },
  { label: 'Mins', value: countdown.parts.value.minutes },
  { label: 'Secs', value: countdown.parts.value.seconds }
])

const menuItems = [
  { id: 'journey', title: 'Our Journey', desc: '10 years to Patotsav', icon: IconMapPin, href: '/journey' },
  { id: 'events', title: 'Our Events', desc: 'Sabhas & mahotsav dates', icon: IconCalendarEvent, href: '/events' },
  { id: 'community', title: 'Our Community', desc: 'What mandir means to you', icon: IconUsers, href: '/community' },
  { id: 'seva', title: 'Seva', desc: 'Teams & WhatsApp', icon: IconHandGrab, href: '/seva' },
  { id: 'niyams', title: 'Our Niyams', desc: 'Utsav niyams & tracker', icon: IconFlame, href: '/niyams' },
  { id: 'play', title: 'Games', desc: 'Coming along later', icon: IconDeviceGamepad2, href: '/play' }
]
</script>
