<template>
  <section
    v-if="ids.length"
    class="mt-10 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-left"
  >
    <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
      <IconCrown class="crown-sparkle h-4 w-4" />
      {{ heading }}
    </p>
    <p v-if="subtitle" class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{{ subtitle }}</p>
    <div class="mt-3 space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
      <p v-for="row in rows" :key="row.id">
        <span class="font-semibold text-[hsl(var(--primary))]">{{ row.title }}:</span>
        <template v-if="row.crown">
          <NuxtLink
            v-if="row.crown.holderUserId"
            :to="`/devotee/${row.crown.holderUserId}`"
            class="hover:underline"
          >
            {{ row.crown.holderName }}
          </NuxtLink>
          <template v-else>{{ row.crown.holderName }}</template>
          · {{ crownValue(row.crown) }}
          <span
            v-if="row.crown.holderUserId === currentUserId"
            class="font-semibold text-amber-700"
          >
            · You hold this crown
          </span>
        </template>
        <template v-else>
          {{ allTime ? 'Unclaimed' : 'Unclaimed this month' }}
        </template>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IconCrown } from '@tabler/icons-vue'
import { crownScope, crownTitle, crownValue } from '~/composables/useAchievements'
import { nextUkMonthCrownResetLabel } from '~/utils/gameDay'

const props = defineProps<{
  ids: string[]
}>()

const auth = useAuth()
const achievements = useAchievements()
const currentUserId = computed(() => auth.user.value?.uid)
const resetLabel = nextUkMonthCrownResetLabel()

const allTime = computed(() =>
  props.ids.length > 0 && props.ids.every(id => crownScope(id) === 'all-time')
)

const heading = computed(() => (allTime.value ? 'All-time Crown' : 'Monthly Crowns'))
const subtitle = computed(() => (
  allTime.value
    ? 'Does not reset each month — beat the record to take it.'
    : `Resets on the ${resetLabel}.`
))

onMounted(() => {
  void achievements.fetchAll()
})

const rows = computed(() =>
  props.ids.map(id => ({
    id,
    title: crownTitle(id),
    crown: achievements.crowns.value.find(crown => crown.id === id) || null
  }))
)
</script>
