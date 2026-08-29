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
          <div class="relative -mx-4 mb-8 md:mx-0">
            <div
              ref="yearRow"
              class="flex snap-x gap-2 overflow-x-auto px-4 pb-2 md:flex-wrap md:overflow-visible"
              @scroll.passive="updateEdges"
            >
              <button
                v-for="y in years"
                :key="y"
                :ref="el => setChipRef(el, y)"
                type="button"
                class="shrink-0 snap-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                :class="selectedYear === String(y)
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]'"
                @click="selectYear(y)"
              >
                {{ y }}
              </button>
            </div>

            <!-- Cues that more years sit off-screen; taps pass through to the chips. -->
            <div
              v-show="canScrollLeft"
              aria-hidden="true"
              class="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-start justify-start bg-gradient-to-r from-[hsl(var(--background))] via-[hsl(var(--background))]/80 to-transparent pb-2 md:hidden"
            >
              <IconChevronLeft class="h-6 w-6 text-[hsl(var(--primary))]/70" />
            </div>
            <div
              v-show="canScrollRight"
              aria-hidden="true"
              class="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-start justify-end bg-gradient-to-l from-[hsl(var(--background))] via-[hsl(var(--background))]/80 to-transparent pb-2 md:hidden"
            >
              <IconChevronRight class="h-6 w-6 text-[hsl(var(--primary))]/70" />
            </div>
          </div>

          <div v-if="yearMoments.length === 0" class="card-surface p-8 text-center">
            <p class="font-display text-3xl text-[hsl(var(--primary))]">{{ selectedYear }}</p>
            <p class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              No photos or stories for this year yet.
            </p>
          </div>

          <div v-else class="space-y-8">
            <article
              v-for="item in yearMoments"
              :key="item.id"
              class="card-surface overflow-hidden"
            >
              <div class="p-6 sm:p-8">
                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">
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
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import type { TimelineItem, TimelineMedia } from '~/types'
import { compareTimelineItems, journeyYears } from '~/data/timeline'

const { timeline, isLoading } = useTimeline()
const years = journeyYears()
const nowYear = new Date().getFullYear()
const selectedYear = ref(String(years.includes(nowYear) ? nowYear : years[years.length - 1]))

const yearMoments = computed(() =>
  timeline.value
    .filter(t => String(t.year) === selectedYear.value)
    .slice()
    .sort(compareTimelineItems)
)

const yearRow = ref<HTMLElement | null>(null)
const chips = new Map<number, HTMLElement>()
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function setChipRef(el: unknown, year: number) {
  if (el instanceof HTMLElement) chips.set(year, el)
  else chips.delete(year)
}

function updateEdges() {
  const el = yearRow.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft < max - 4
}

/** Centres a year in the strip so the active chip is never hidden off-screen. */
function centreOn(year: number, behavior: ScrollBehavior = 'smooth') {
  const el = yearRow.value
  const chip = chips.get(year)
  if (!el || !chip) return
  el.scrollTo({
    left: chip.offsetLeft - (el.clientWidth - chip.clientWidth) / 2,
    behavior
  })
}

function selectYear(year: number) {
  selectedYear.value = String(year)
  centreOn(year)
}

let observer: ResizeObserver | null = null

watch(isLoading, async loading => {
  if (loading) return
  await nextTick()
  const el = yearRow.value
  if (!el) return
  centreOn(Number(selectedYear.value), 'auto')
  updateEdges()
  observer?.disconnect()
  observer = new ResizeObserver(updateEdges)
  observer.observe(el)
}, { immediate: true })

onUnmounted(() => observer?.disconnect())

function itemMedia(item: TimelineItem): TimelineMedia[] {
  if (item.media?.length) return item.media
  const out: TimelineMedia[] = []
  if (item.imageUrl) out.push({ type: 'image', url: item.imageUrl })
  if (item.videoUrl) out.push({ type: 'video', url: item.videoUrl })
  return out
}

usePageSeo('Our Journey', 'Ten years with Ghanshyam Maharaj at Shree KS Swaminarayan Temple Woolwich, year by year, from 2017 to the Patotsav in 2027.')
</script>
