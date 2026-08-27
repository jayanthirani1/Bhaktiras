<template>
  <p
    v-if="visible"
    class="rounded-2xl border border-[hsl(var(--golden-200))] bg-[hsl(var(--golden-50))] px-4 py-3 text-center text-sm text-[hsl(var(--foreground))]"
  >
    The sangat added
    <span class="font-display text-base font-semibold text-[hsl(var(--primary))]">{{ formatCount(today) }}</span>
    today
    <span class="px-1 text-[hsl(var(--golden-900))]" aria-hidden="true">·</span>
    <span class="font-display text-base font-semibold text-[hsl(var(--primary))]">{{ formatCount(week) }}</span>
    this week
  </p>
</template>

<script setup lang="ts">
import type { NiyamChallengeStats } from '~/types'
import { addedThisWeek, addedToday, formatCount } from '~/utils/niyamChallenge'

const props = defineProps<{ stats: NiyamChallengeStats[] }>()

const today = computed(() => props.stats.reduce((sum, s) => sum + addedToday(s), 0))
const week = computed(() => props.stats.reduce((sum, s) => sum + addedThisWeek(s), 0))

/**
 * `dailyTotals` only exists once the totals trigger has written it. Until then
 * the honest thing is no strip at all — "added 0 today" would report a quiet
 * sangat when what is really missing is the data.
 */
const visible = computed(() => props.stats.some(s => s.dailyTotals) && week.value > 0)
</script>
