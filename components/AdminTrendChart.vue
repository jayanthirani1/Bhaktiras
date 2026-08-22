<template>
  <figure class="m-0">
    <figcaption class="flex flex-wrap items-baseline justify-between gap-2">
      <span class="text-sm font-semibold text-[hsl(var(--foreground))]">{{ caption }}</span>
      <span class="text-xs text-[hsl(var(--muted-foreground))]">
        Peak {{ max }} · average {{ average }}
      </span>
    </figcaption>

    <div
      ref="frame"
      class="relative mt-3 select-none"
      @pointermove="onMove"
      @pointerleave="hoverIndex = null"
    >
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="block h-44 w-full overflow-visible"
        role="img"
        :aria-label="summary"
        preserveAspectRatio="none"
      >
        <!-- Recessive hairline gridlines, solid rather than dashed. -->
        <g>
          <line
            v-for="tick in ticks"
            :key="tick.value"
            :x1="0"
            :x2="W"
            :y1="tick.y"
            :y2="tick.y"
            stroke="hsl(var(--border))"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        </g>

        <path :d="areaPath" :fill="`hsl(var(--primary) / 0.10)`" />
        <path
          :d="linePath"
          fill="none"
          stroke="hsl(var(--primary))"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />

        <template v-if="active">
          <line
            :x1="active.x"
            :x2="active.x"
            :y1="0"
            :y2="H"
            stroke="hsl(var(--primary) / 0.35)"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        </template>
      </svg>

      <!-- y-axis labels sit outside the stretched viewBox so they keep their shape -->
      <span
        v-for="tick in ticks"
        :key="`label-${tick.value}`"
        class="pointer-events-none absolute left-0 text-[10px] tabular-nums text-[hsl(var(--muted-foreground))]"
        :style="{ top: `${(tick.y / H) * 100}%`, transform: 'translate(calc(-100% - 0.5rem), -50%)' }"
      >{{ tick.value }}</span>

      <!-- 2px ring in the surface colour, not a stroke around the mark. Drawn in
           HTML because the stretched viewBox would flatten an SVG circle. -->
      <span
        v-if="active"
        class="pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--primary))] ring-2 ring-[hsl(var(--card))]"
        :style="{ left: `${active.leftPct}%`, top: `${(active.y / H) * 100}%` }"
      />
      <div
        v-if="active"
        class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-1 text-center shadow-lg"
        :style="{ left: `${active.tooltipPct}%`, top: `calc(${(active.y / H) * 100}% - 0.5rem)` }"
      >
        <span class="block text-[10px] text-[hsl(var(--muted-foreground))]">{{ active.label }}</span>
        <span class="block text-sm font-semibold tabular-nums text-[hsl(var(--foreground))]">{{ active.value }}</span>
      </div>
    </div>

    <!-- Selective direct labels: the ends and the middle, never every point. -->
    <div class="mt-1.5 flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
      <span>{{ shortDate(points[0]?.dateId) }}</span>
      <span>{{ shortDate(points[Math.floor(points.length / 2)]?.dateId) }}</span>
      <span>Today</span>
    </div>

    <details class="mt-3">
      <summary class="cursor-pointer text-xs font-semibold text-[hsl(var(--muted-foreground))]">
        View as table
      </summary>
      <div class="mt-2 max-h-48 overflow-y-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-[hsl(var(--muted-foreground))]">
              <th scope="col" class="py-1 font-semibold">Date</th>
              <th scope="col" class="py-1 text-right font-semibold">{{ seriesLabel }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in [...points].reverse()" :key="point.dateId" class="border-t border-[hsl(var(--border))]">
              <td class="py-1">{{ shortDate(point.dateId) }}</td>
              <td class="py-1 text-right tabular-nums">{{ point.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </figure>
</template>

<script setup lang="ts">
const props = defineProps<{
  caption: string
  seriesLabel: string
  points: Array<{ dateId: string; value: number }>
}>()

const W = 300
const H = 100

const frame = ref<HTMLElement | null>(null)
const hoverIndex = ref<number | null>(null)

const values = computed(() => props.points.map(point => point.value))
const max = computed(() => Math.max(1, ...values.value))
const average = computed(() => {
  if (!values.value.length) return 0
  return Math.round(values.value.reduce((sum, value) => sum + value, 0) / values.value.length)
})

/** Rounded to a friendly top so the gridlines land on whole numbers. */
const top = computed(() => {
  const value = max.value
  if (value <= 5) return 5
  const step = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / step) * step
})

const ticks = computed(() => [0, top.value / 2, top.value].map(value => ({
  value,
  y: H - (value / top.value) * H
})))

function xOf(index: number) {
  if (props.points.length < 2) return W / 2
  return (index / (props.points.length - 1)) * W
}

function yOf(value: number) {
  return H - (value / top.value) * H
}

const linePath = computed(() => props.points
  .map((point, index) => `${index === 0 ? 'M' : 'L'}${xOf(index).toFixed(2)},${yOf(point.value).toFixed(2)}`)
  .join(' '))

const areaPath = computed(() => {
  if (!props.points.length) return ''
  return `${linePath.value} L${W},${H} L0,${H} Z`
})

const active = computed(() => {
  const index = hoverIndex.value
  if (index == null || !props.points[index]) return null
  const point = props.points[index]
  return {
    x: xOf(index),
    y: yOf(point.value),
    leftPct: props.points.length < 2 ? 50 : (index / (props.points.length - 1)) * 100,
    tooltipPct: props.points.length < 2
      ? 50
      : Math.min(92, Math.max(8, (index / (props.points.length - 1)) * 100)),
    value: point.value,
    label: shortDate(point.dateId)
  }
})

const summary = computed(() =>
  `${props.seriesLabel} over the last ${props.points.length} days. `
  + `Peak ${max.value}, average ${average.value}.`)

/** Hit targets are the whole column, not the 5px mark. */
function onMove(event: PointerEvent) {
  const box = frame.value?.getBoundingClientRect()
  if (!box || !props.points.length) return
  const fraction = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width))
  hoverIndex.value = Math.round(fraction * (props.points.length - 1))
}

function shortDate(dateId?: string) {
  if (!dateId) return ''
  const [year, month, day] = dateId.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
    .format(new Date(year, month - 1, day))
}
</script>
