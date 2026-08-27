<template>
  <div
    class="relative w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]"
    :style="{ height: `${height}px` }"
    role="progressbar"
    :aria-valuenow="approved"
    :aria-valuemin="0"
    :aria-valuemax="challenge.target"
    :aria-valuetext="valueText"
  >
    <!-- Counted. Never allowed to vanish: a real total that renders as an empty
         trough reads as "nothing has happened" for the first several months. -->
    <div
      class="absolute inset-y-0 left-0 rounded-full bg-[hsl(var(--golden-500))] transition-[width] duration-700 motion-reduce:transition-none"
      :style="approvedStyle"
    />
    <!-- Held for review: a stripe, so the difference survives greyscale. -->
    <div
      v-if="pendingWidth > 0"
      class="absolute inset-y-0 rounded-full transition-[width] duration-700 motion-reduce:transition-none"
      :style="pendingStyle"
    />
    <span
      v-for="tick in ticks"
      :key="tick"
      class="absolute inset-y-0 w-px bg-[hsl(var(--card))]/80"
      :style="{ left: `${tick * 100}%` }"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import type { NiyamChallenge } from '~/types'
import { barPercent, formatCount, formatTarget, milestoneFor, percentLabel, unitLabel } from '~/utils/niyamChallenge'

const props = withDefaults(defineProps<{
  challenge: NiyamChallenge
  approved: number
  pending?: number
  height?: number
  showTicks?: boolean
}>(), { pending: 0, height: 8, showTicks: true })

const approvedWidth = computed(() => barPercent(props.approved, props.challenge.target))

const approvedStyle = computed(() => ({
  width: `${approvedWidth.value}%`,
  minWidth: props.approved > 0 ? '6px' : '0'
}))

/** Held entries take the bar's remaining room, never the counted portion. */
const pendingWidth = computed(() =>
  Math.min(100 - approvedWidth.value, barPercent(props.pending, props.challenge.target))
)

const pendingStyle = computed(() => ({
  left: `${approvedWidth.value}%`,
  width: `${pendingWidth.value}%`,
  backgroundImage:
    'repeating-linear-gradient(135deg, hsl(var(--primary) / 0.45) 0 3px, hsl(var(--primary) / 0.12) 3px 6px)'
}))

const ticks = computed(() => (props.showTicks ? milestoneFor(props.approved, props.challenge.target).ticks : []))

/** Read the way a person would say it — the bare number against 1,000,000 means nothing. */
const valueText = computed(() =>
  `${formatCount(props.approved)} of ${formatTarget(props.challenge.target)} `
  + `${unitLabel(props.challenge, props.challenge.target)}, `
  + `${percentLabel(props.approved, props.challenge.target)}`
)
</script>
