<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full shadow-sm"
    :class="[sizeClass, unlocked ? toneClass : 'bg-slate-200 text-slate-400 grayscale']"
    :title="label"
  >
    <IconMedal :class="iconClass" />
  </span>
</template>

<script setup lang="ts">
import { IconMedal } from '@tabler/icons-vue'
import type { AchievementMedal } from '~/composables/useAchievements'

const props = withDefaults(defineProps<{
  medal: AchievementMedal
  unlocked?: boolean
  size?: 'sm' | 'md' | 'lg'
}>(), {
  unlocked: true,
  size: 'md'
})

const labels: Record<AchievementMedal, string> = {
  bronze: 'Bronze medal',
  silver: 'Silver medal',
  gold: 'Gold medal',
  platinum: 'Platinum medal'
}

const label = computed(() => labels[props.medal])
const sizeClass = computed(() => ({
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16'
}[props.size]))
const iconClass = computed(() => ({
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8'
}[props.size]))
const toneClass = computed(() => ({
  bronze: 'bg-gradient-to-b from-amber-600 to-amber-800 text-amber-100',
  silver: 'bg-gradient-to-b from-slate-200 to-slate-400 text-slate-700',
  gold: 'bg-gradient-to-b from-yellow-300 to-amber-500 text-amber-900',
  platinum: 'bg-gradient-to-b from-violet-200 to-purple-600 text-white'
}[props.medal]))
</script>
