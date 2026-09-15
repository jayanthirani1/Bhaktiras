<template>
  <div class="journey-page min-h-screen bg-[hsl(var(--background))] pb-24">
    <!-- Opening composition: brand + one line + scroll cue -->
    <header class="journey-hero relative flex min-h-[52vh] flex-col justify-end overflow-hidden px-4 pb-12 pt-20 md:min-h-[58vh] md:pb-16 md:pt-24">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,hsl(var(--golden-100))_0%,transparent_55%),radial-gradient(ellipse_at_80%_70%,hsl(var(--golden-200)/0.45)_0%,transparent_50%),hsl(var(--background))]"
        aria-hidden="true"
      />
      <div
        class="journey-hero-drift pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-[hsl(var(--golden-200)/0.35)] blur-3xl md:h-96 md:w-96"
        aria-hidden="true"
      />
      <div class="relative z-10 mx-auto w-full max-w-3xl">
        <p class="text-[11px] font-bold uppercase tracking-[0.28em] text-[hsl(var(--golden-900))]">
          {{ SITE.journeyStartYear }} — {{ SITE.journeyEndYear }}
        </p>
        <h1 class="mt-3 font-display text-5xl font-semibold leading-[1.05] text-[hsl(var(--primary))] sm:text-6xl md:text-7xl">
          Our Journey
        </h1>
        <p class="mt-4 max-w-md text-base leading-relaxed text-[hsl(var(--muted-foreground))] sm:text-lg">
          Ten years with Ghanshyam Maharaj — scroll from the beginning to the Patotsav ahead.
        </p>
        <p class="mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--primary))]/70">
          <span class="journey-scroll-cue inline-block h-8 w-px bg-[hsl(var(--primary))]/40" aria-hidden="true" />
          Scroll to begin
        </p>
      </div>
    </header>

    <ClientOnly>
      <div v-if="isLoading" class="flex min-h-[30vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading Journey…
      </div>

      <template v-else-if="chronological.length">
        <div
          class="sticky top-0 z-30 border-b border-[hsl(var(--golden-200))]/80 bg-[hsl(var(--background))]/92 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/80"
        >
          <div class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
            <p class="hidden shrink-0 font-display text-lg font-semibold tabular-nums text-[hsl(var(--primary))] sm:block">
              {{ activeYear }}
            </p>
            <div
              ref="yearRow"
              class="flex min-w-0 flex-1 snap-x gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <button
                v-for="y in yearsOnJourney"
                :key="y"
                :ref="el => setChipRef(el, y)"
                type="button"
                class="shrink-0 snap-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                :class="activeYear === String(y)
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]'"
                @click="jumpToYear(y)"
              >
                {{ y }}
              </button>
            </div>
          </div>
          <div class="h-0.5 bg-[hsl(var(--golden-100))]" aria-hidden="true">
            <div
              class="h-full bg-[hsl(var(--primary))] transition-[width] duration-150 ease-out"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <div class="relative mx-auto max-w-5xl px-4 pt-6">
          <div
            class="pointer-events-none absolute bottom-0 left-[1.35rem] top-6 w-px bg-gradient-to-b from-[hsl(var(--golden-200))] via-[hsl(var(--primary))]/35 to-[hsl(var(--golden-200))] md:left-1/2 md:-translate-x-px"
            aria-hidden="true"
          />

          <section
            v-for="group in yearGroups"
            :id="`year-${group.year}`"
            :key="group.year"
            :data-year="group.year"
            class="journey-year relative scroll-mt-24 pb-10 md:pb-16"
          >
            <div class="mb-8 flex items-center gap-3 md:justify-center">
              <span class="relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 border-[hsl(var(--golden-200))] bg-[hsl(var(--background))] font-display text-sm font-bold text-[hsl(var(--primary))] shadow-sm">
                {{ String(group.year).slice(2) }}
              </span>
              <h2 class="font-display text-3xl font-semibold text-[hsl(var(--primary))] md:sr-only">
                {{ group.year }}
              </h2>
            </div>

            <article
              v-for="(item, index) in group.moments"
              :key="item.id"
              :data-moment-id="item.id"
              class="journey-moment relative mb-14 last:mb-4 md:mb-24"
              :class="index % 2 === 0 ? 'md:pr-[52%]' : 'md:pl-[52%]'"
            >
              <div
                class="absolute left-[1.1rem] top-3 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[hsl(var(--primary))] ring-4 ring-[hsl(var(--background))] md:left-1/2"
                aria-hidden="true"
              />

              <div class="overflow-hidden rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--card))] shadow-[0_24px_60px_-40px_rgba(61,0,102,0.45)]">
                <div
                  v-if="primaryMedia(item)"
                  class="journey-parallax-frame relative aspect-[4/3] overflow-hidden bg-[hsl(var(--muted))] sm:aspect-[16/10]"
                >
                  <video
                    v-if="primaryMedia(item)!.type === 'video'"
                    :src="primaryMedia(item)!.url"
                    class="journey-parallax-media absolute inset-0 h-[120%] w-full object-cover"
                    :style="parallaxStyle(item.id)"
                    controls
                    playsinline
                    preload="metadata"
                  />
                  <img
                    v-else
                    :src="primaryMedia(item)!.url"
                    :alt="primaryMedia(item)!.caption || item.title"
                    class="journey-parallax-media absolute inset-0 h-[120%] w-full object-cover"
                    :style="parallaxStyle(item.id)"
                    loading="lazy"
                  >
                  <div
                    class="pointer-events-none absolute inset-0 bg-gradient-to-t from-[hsl(var(--primary))]/55 via-transparent to-transparent"
                    aria-hidden="true"
                  />
                  <p class="absolute bottom-3 left-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
                    {{ item.date || item.year }}
                  </p>
                </div>

                <div class="space-y-3 p-5 sm:p-7">
                  <p
                    v-if="!primaryMedia(item)"
                    class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]"
                  >
                    {{ item.date || item.year }}
                  </p>
                  <h3 class="font-display text-2xl font-semibold leading-tight text-[hsl(var(--primary))] sm:text-3xl">
                    {{ item.title }}
                  </h3>
                  <p class="text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {{ item.description }}
                  </p>

                  <div
                    v-if="extraMedia(item).length"
                    class="grid gap-3 pt-2 sm:grid-cols-2"
                  >
                    <div
                      v-for="(m, i) in extraMedia(item)"
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
                        class="h-auto w-full object-cover"
                        loading="lazy"
                      >
                      <p v-if="m.caption" class="px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
                        {{ m.caption }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <footer class="relative z-10 pb-8 pt-4 text-center">
            <p class="font-display text-2xl font-semibold text-[hsl(var(--primary))] sm:text-3xl">
              Towards Patotsav {{ SITE.journeyEndYear }}
            </p>
            <p class="mx-auto mt-2 max-w-md text-sm text-[hsl(var(--muted-foreground))]">
              {{ SITE.patotsavDateLabel }} — celebrating ten years with Ghanshyam Maharaj.
            </p>
          </footer>
        </div>
      </template>

      <div
        v-else
        class="mx-auto max-w-lg px-4 py-16 text-center"
      >
        <p class="font-display text-2xl text-[hsl(var(--primary))]">Our Journey</p>
        <p class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
          Moments will appear here as the timeline is filled in.
        </p>
      </div>

      <template #fallback>
        <div class="flex min-h-[30vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
          Loading Journey…
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import type { TimelineItem, TimelineMedia } from '~/types'
import { SITE } from '~/data/site'
import { compareTimelineItems } from '~/data/timeline'

const { timeline, isLoading } = useTimeline()

const chronological = computed(() =>
  timeline.value.slice().sort(compareTimelineItems)
)

const yearGroups = computed(() => {
  const map = new Map<string, TimelineItem[]>()
  for (const item of chronological.value) {
    const year = String(item.year || '').trim() || '—'
    const list = map.get(year) || []
    list.push(item)
    map.set(year, list)
  }
  return [...map.entries()].map(([year, moments]) => ({ year, moments }))
})

const yearsOnJourney = computed(() =>
  yearGroups.value
    .map(group => Number(group.year))
    .filter(year => Number.isFinite(year))
)

const activeYear = ref('')
const progressPercent = ref(0)
const yearRow = ref<HTMLElement | null>(null)
const chips = new Map<number, HTMLElement>()
const parallaxOffsets = ref<Record<string, number>>({})
const reduceMotion = ref(false)

function setChipRef(el: unknown, year: number) {
  if (el instanceof HTMLElement) chips.set(year, el)
  else chips.delete(year)
}

function itemMedia(item: TimelineItem): TimelineMedia[] {
  if (item.media?.length) return item.media
  const out: TimelineMedia[] = []
  if (item.imageUrl) out.push({ type: 'image', url: item.imageUrl })
  if (item.videoUrl) out.push({ type: 'video', url: item.videoUrl })
  return out
}

function primaryMedia(item: TimelineItem): TimelineMedia | null {
  return itemMedia(item)[0] || null
}

function extraMedia(item: TimelineItem): TimelineMedia[] {
  return itemMedia(item).slice(1)
}

function parallaxStyle(id: string) {
  if (reduceMotion.value) return undefined
  const offset = parallaxOffsets.value[id] || 0
  return { transform: `translate3d(0, ${offset}px, 0)` }
}

function centreChip(year: number, behavior: ScrollBehavior = 'smooth') {
  const row = yearRow.value
  const chip = chips.get(year)
  if (!row || !chip) return
  row.scrollTo({
    left: chip.offsetLeft - (row.clientWidth - chip.clientWidth) / 2,
    behavior
  })
}

function jumpToYear(year: number) {
  const el = document.getElementById(`year-${year}`)
  if (!el) return
  activeYear.value = String(year)
  centreChip(year)
  el.scrollIntoView({ behavior: reduceMotion.value ? 'auto' : 'smooth', block: 'start' })
}

function updateScrollState() {
  const yearNodes = [...document.querySelectorAll<HTMLElement>('.journey-year[data-year]')]
  if (!yearNodes.length) return

  const marker = window.innerHeight * 0.28
  let current = yearNodes[0]?.dataset.year || ''
  for (const node of yearNodes) {
    const top = node.getBoundingClientRect().top
    if (top <= marker) current = node.dataset.year || current
  }
  if (current && current !== activeYear.value) {
    activeYear.value = current
    const asNumber = Number(current)
    if (Number.isFinite(asNumber)) centreChip(asNumber, 'smooth')
  }

  const doc = document.documentElement
  const max = doc.scrollHeight - window.innerHeight
  progressPercent.value = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0

  if (reduceMotion.value) return

  const next: Record<string, number> = {}
  document.querySelectorAll<HTMLElement>('[data-moment-id]').forEach((node) => {
    const id = node.dataset.momentId
    if (!id) return
    const frame = node.querySelector('.journey-parallax-frame')
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    const mid = rect.top + rect.height / 2
    const viewMid = window.innerHeight / 2
    const delta = (mid - viewMid) / window.innerHeight
    next[id] = Math.max(-36, Math.min(36, delta * -42))
  })
  parallaxOffsets.value = next
}

let ticking = false
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    updateScrollState()
    ticking = false
  })
}

const { request: requestPushPrompt } = usePushPrompt()
let pushPromptTimer: number | null = null

onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  pushPromptTimer = window.setTimeout(() => requestPushPrompt('journey'), 1800)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})

watch([isLoading, chronological], async ([loading]) => {
  if (loading) return
  await nextTick()
  if (!activeYear.value && yearsOnJourney.value.length) {
    activeYear.value = String(yearsOnJourney.value[0])
  }
  updateScrollState()
}, { immediate: true })

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (pushPromptTimer) window.clearTimeout(pushPromptTimer)
})

usePageSeo(
  'Our Journey',
  'Ten years with Ghanshyam Maharaj at Shree KS Swaminarayan Temple Woolwich, year by year, from 2017 to the Patotsav in 2027.'
)
</script>

<style scoped>
.journey-hero-drift {
  animation: journey-drift 14s ease-in-out infinite alternate;
}

.journey-scroll-cue {
  animation: journey-pulse 1.8s ease-in-out infinite;
}

@keyframes journey-drift {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to { transform: translate3d(-24px, 40px, 0) scale(1.08); }
}

@keyframes journey-pulse {
  0%, 100% { opacity: 0.35; transform: scaleY(0.7); transform-origin: top; }
  50% { opacity: 1; transform: scaleY(1); transform-origin: top; }
}

.journey-parallax-media {
  will-change: transform;
  transition: transform 0.12s linear;
}

@media (prefers-reduced-motion: reduce) {
  .journey-hero-drift,
  .journey-scroll-cue {
    animation: none;
  }
  .journey-parallax-media {
    transition: none;
    transform: none !important;
    height: 100% !important;
  }
}
</style>
