<template>
  <section
    v-if="items.length"
    class="mt-10 rounded-2xl border border-amber-200 bg-amber-50/70 p-5"
  >
    <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
      <IconCrown class="h-4 w-4" />
      All-time crowns
    </p>
    <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">These records never reset with the daily board.</p>
    <div class="mt-3 space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
      <p v-for="crown in items" :key="crown.id">
        <span class="font-semibold text-[hsl(var(--primary))]">{{ crownTitle(crown.id) }}:</span>
        {{ crown.holderName }} · {{ crownValue(crown) }}
        <span v-if="crown.holderUserId === currentUserId" class="font-semibold text-amber-700"> · You hold this crown</span>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IconCrown } from '@tabler/icons-vue'
import { crownTitle, crownValue } from '~/composables/useAchievements'

const props = defineProps<{
  ids: string[]
}>()

const auth = useAuth()
const achievements = useAchievements()
const currentUserId = computed(() => auth.user.value?.uid)

const items = computed(() =>
  props.ids
    .map(id => achievements.crowns.value.find(crown => crown.id === id))
    .filter((crown): crown is NonNullable<typeof crown> => !!crown)
)
</script>
