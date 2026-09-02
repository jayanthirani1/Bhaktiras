<template>
  <span>{{ formatCount(shown) }}<template v-if="target > 0"> ({{ percentLabel(shown, target) }})</template></span>
</template>

<script setup lang="ts">
import { formatCount, percentLabel } from '~/utils/niyamChallenge'

/**
 * Runs once, on the devotee's own submission, from the total before their entry
 * to the total after it. Never on page load: a number that spins on arrival
 * steals attention and is unreadable to a screen reader while it moves.
 */
const props = withDefaults(defineProps<{
  from: number
  to: number
  target?: number
  duration?: number
}>(), { target: 0, duration: 800 })

const shown = ref(props.from)
let frame = 0

function run() {
  cancelAnimationFrame(frame)
  const reduced = import.meta.client
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduced || props.duration <= 0 || props.to === props.from) {
    shown.value = props.to
    return
  }
  const start = performance.now()
  const delta = props.to - props.from
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    const eased = 1 - Math.pow(1 - t, 3)
    shown.value = Math.round(props.from + delta * eased)
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

onMounted(run)
watch(() => [props.from, props.to], run)
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>
