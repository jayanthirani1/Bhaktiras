<template>
  <section class="mt-5 border-t border-[hsl(var(--border))] pt-4">
    <h3 class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golden-900))]">
      Top contributors
    </h3>
    <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
      Highest {{ unitLabel(challenge, 5) }} counted so far.
    </p>

    <div v-if="loading" class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
      Loading…
    </div>
    <ul
      v-else-if="visibleLeaders.length"
      class="mt-3 overflow-hidden rounded-xl border border-[hsl(var(--golden-200))] divide-y divide-[hsl(var(--border))]"
    >
      <li
        v-for="row in visibleLeaders"
        :key="row.id"
        class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
        :class="row.mine ? 'bg-[hsl(var(--golden-50))]' : 'bg-white'"
      >
        <span class="min-w-0 font-medium text-[hsl(var(--foreground))]">
          <span class="tabular-nums text-[hsl(var(--muted-foreground))]">
            <template v-if="row.rank > 0">{{ row.rank }}.</template>
            <template v-else>—</template>
          </span>
          {{ row.name }}
          <span
            v-if="row.mine"
            class="ml-1 text-xs font-semibold text-[hsl(var(--golden-900))]"
          >
            you
          </span>
        </span>
        <span class="shrink-0 font-semibold tabular-nums text-[hsl(var(--primary))]">
          {{ formatCount(row.total) }}
          <span class="font-normal text-[hsl(var(--muted-foreground))]">
            {{ unitLabel(challenge, row.total) }}
          </span>
        </span>
      </li>
    </ul>
    <p v-else class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
      No entries yet — be the first on the board.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { NiyamChallenge, NiyamContributor } from '~/types'
import { formatCount, unitLabel } from '~/utils/niyamChallenge'

const props = defineProps<{
  challenge: NiyamChallenge
  leaders: NiyamContributor[]
  loading?: boolean
  currentUserId?: string
  myPersonal?: number
}>()

const visibleLeaders = computed(() => {
  const top = props.leaders.map((row, index) => ({
    id: row.id,
    rank: index + 1,
    name: row.userName,
    total: row.approvedTotal,
    mine: !!props.currentUserId && row.userId === props.currentUserId
  }))
  if (!props.currentUserId || top.some(row => row.mine)) return top

  const mine = Math.max(0, Number(props.myPersonal) || 0)
  if (mine <= 0) return top

  return [...top, {
    id: `mine-${props.currentUserId}`,
    rank: 0,
    name: 'You',
    total: mine,
    mine: true
  }]
})
</script>
