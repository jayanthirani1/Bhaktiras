<template>
  <section class="mt-5 border-t border-[hsl(var(--border))] pt-4">
    <!-- The all-time crown is the top of the board below: the highest counted
         total. Offline counts have no contributor row, so they never hold it. -->
    <div
      v-if="!loading"
      class="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3"
    >
      <p class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-800">
        <IconCrown class="crown-sparkle h-4 w-4" aria-hidden="true" />
        {{ copy('crownTitle') }}
      </p>
      <template v-if="crownHolders.length">
        <p class="mt-1.5 text-sm text-[hsl(var(--foreground))]">
          <span class="font-semibold text-[hsl(var(--primary))]">
            {{ crownHolders.map(row => row.name).join(' & ') }}
          </span>
          · {{ formatCount(crownHolders[0]!.total) }} {{ unitLabel(challenge, crownHolders[0]!.total) }}
          <span v-if="crownHolders.some(row => row.mine)" class="font-semibold text-amber-700">
            · You hold this crown
          </span>
        </p>
        <p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{{ copy('crownHint') }}</p>
      </template>
      <p v-else class="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">
        {{ copy('crownUnclaimed') }}
      </p>
    </div>

    <h3 class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--golden-900))]">
      {{ copy('leaderboardTitle') }}
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
          <IconCrown
            v-if="row.crowned"
            class="crown-sparkle -mt-0.5 ml-0.5 inline h-3.5 w-3.5 text-amber-600"
            :aria-label="copy('crownTitle')"
          />
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
      {{ copy('leaderboardEmpty') }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { IconCrown } from '@tabler/icons-vue'
import type { NiyamChallenge, NiyamContributor } from '~/types'
import { formatCount, unitLabel } from '~/utils/niyamChallenge'

const props = defineProps<{
  challenge: NiyamChallenge
  leaders: NiyamContributor[]
  loading?: boolean
  currentUserId?: string
  myApproved?: number
  myName?: string
}>()

const copy = useNiyamCopy()

/** Everyone level on the highest total shares the crown. */
const crownTotal = computed(() => Math.max(0, props.leaders[0]?.approvedTotal || 0))

const visibleLeaders = computed(() => {
  const liveName = props.myName?.trim() || ''
  const top = props.leaders.map((row, index) => {
    const mine = !!props.currentUserId && row.userId === props.currentUserId
    return {
      id: row.id,
      rank: index + 1,
      name: mine && liveName ? liveName : row.userName,
      total: row.approvedTotal,
      mine,
      crowned: crownTotal.value > 0 && row.approvedTotal === crownTotal.value
    }
  })
  if (!props.currentUserId || top.some(row => row.mine)) return top

  const mine = Math.max(0, Number(props.myApproved) || 0)
  if (mine <= 0) return top

  return [...top, {
    id: `mine-${props.currentUserId}`,
    rank: 0,
    name: liveName || 'You',
    total: mine,
    mine: true,
    crowned: false
  }]
})

const crownHolders = computed(() => visibleLeaders.value.filter(row => row.crowned))
</script>
