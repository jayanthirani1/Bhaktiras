<template>
  <div>
    <div class="flex items-center justify-between gap-2">
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-full text-[hsl(var(--primary))] hover:bg-[hsl(var(--golden-50))] disabled:opacity-30"
        :disabled="!canPrev"
        aria-label="Previous month"
        @click="shiftMonth(-1)"
      >
        <IconChevronLeft class="h-5 w-5" aria-hidden="true" />
      </button>
      <p class="font-display text-base font-semibold text-[hsl(var(--primary))]">{{ monthLabel }}</p>
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-full text-[hsl(var(--primary))] hover:bg-[hsl(var(--golden-50))] disabled:opacity-30"
        :disabled="!canNext"
        aria-label="Next month"
        @click="shiftMonth(1)"
      >
        <IconChevronRight class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>

    <div class="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
      <span v-for="label in WEEKDAYS" :key="label">{{ label }}</span>
    </div>

    <div class="mt-1 grid grid-cols-7 gap-1">
      <template v-for="(week, weekIndex) in weeks" :key="weekIndex">
        <button
          v-for="(cell, dayIndex) in week"
          :key="`${weekIndex}-${dayIndex}`"
          type="button"
          class="flex h-11 flex-col items-center justify-center rounded-lg text-sm font-semibold"
          :class="cellClass(cell)"
          :disabled="!cell || !cell.enabled"
          :aria-pressed="cell?.key === selected"
          :aria-label="cell ? cellLabel(cell) : undefined"
          @click="cell && cell.enabled && emit('select', cell.key)"
        >
          <span>{{ cell?.day ?? '' }}</span>
          <span
            v-if="cell?.mark === 'both'"
            class="text-[10px] leading-none"
            :class="cell.key === selected ? 'text-white' : 'text-[hsl(var(--golden-900))]'"
            aria-hidden="true"
          >✓</span>
          <span
            v-else-if="cell?.mark === 'one'"
            class="mt-0.5 h-1 w-1 rounded-full"
            :class="cell.key === selected ? 'bg-white' : 'bg-[hsl(var(--golden-900))]'"
            aria-hidden="true"
          />
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const props = defineProps<{
  selected: string
  minDay: string
  maxDay: string
  /** Days that already have one or both sabhas. */
  marks: Record<string, 'one' | 'both'>
}>()

const emit = defineEmits<{ select: [day: string] }>()

const viewMonth = ref(props.selected.slice(0, 7))

watch(() => props.selected, (day) => {
  if (day && !day.startsWith(viewMonth.value)) viewMonth.value = day.slice(0, 7)
})

const monthLabel = computed(() => {
  const [year, month] = viewMonth.value.split('-').map(Number)
  if (!year || !month) return ''
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
})

const canPrev = computed(() => viewMonth.value > props.minDay.slice(0, 7))
const canNext = computed(() => viewMonth.value < props.maxDay.slice(0, 7))

type Cell = { key: string; day: number; enabled: boolean; mark: 'one' | 'both' | null }

const weeks = computed(() => {
  const [year, month] = viewMonth.value.split('-').map(Number)
  if (!year || !month) return []
  const first = new Date(Date.UTC(year, month - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: Array<Cell | null> = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${viewMonth.value}-${String(day).padStart(2, '0')}`
    cells.push({
      key,
      day,
      enabled: key >= props.minDay && key <= props.maxDay,
      mark: props.marks[key] ?? null
    })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: Array<Array<Cell | null>> = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
})

function shiftMonth(delta: number) {
  const [year, month] = viewMonth.value.split('-').map(Number)
  if (!year || !month) return
  const next = new Date(Date.UTC(year, month - 1 + delta, 1))
  const id = next.toISOString().slice(0, 7)
  if (id < props.minDay.slice(0, 7) || id > props.maxDay.slice(0, 7)) return
  viewMonth.value = id
}

function cellClass(cell: Cell | null) {
  if (!cell) return 'invisible'
  if (!cell.enabled) return 'text-[hsl(var(--muted-foreground))]/40'
  if (cell.key === props.selected) return 'bg-[hsl(var(--primary))] text-white'
  if (cell.key === props.maxDay) return 'text-[hsl(var(--primary))] ring-1 ring-[hsl(var(--golden-200))]'
  return 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--golden-50))]'
}

function cellLabel(cell: Cell) {
  const mark = cell.mark === 'both'
    ? ', both sabhas logged'
    : cell.mark === 'one'
      ? ', one sabha logged'
      : ''
  return `${cell.key}${mark}`
}
</script>
