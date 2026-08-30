<template>
  <!-- Counts only. Who reacted is deliberately absent: the wall lets people
       post anonymously, and a list of names under a note would undo that. -->
  <div class="mt-4 flex flex-wrap items-center gap-1.5">
    <button
      v-for="reaction in COMMUNITY_REACTIONS"
      :key="reaction.key"
      type="button"
      :disabled="disabled"
      :aria-pressed="mine === reaction.key"
      :title="titleFor(reaction)"
      class="inline-flex min-h-[2rem] items-center gap-1 rounded-full border px-2.5 py-1 text-sm leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      :class="mine === reaction.key
        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'
        : 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--golden-200))] hover:bg-[hsl(var(--muted))]/50'"
      @click="emit('react', reaction.key)"
    >
      <span aria-hidden="true">{{ reaction.emoji }}</span>
      <span
        v-if="countFor(reaction.key) > 0"
        class="text-xs font-semibold tabular-nums"
      >{{ countFor(reaction.key) }}</span>
      <span class="sr-only">{{ titleFor(reaction) }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { COMMUNITY_REACTIONS, type CommunityReaction } from '~/data/communityReactions'
import type { CommunityReactionCounts, CommunityReactionKey } from '~/types'

const props = defineProps<{
  counts?: CommunityReactionCounts
  /** The current user's own choice, so the pill can show as picked. */
  mine?: CommunityReactionKey
  disabled?: boolean
}>()

const emit = defineEmits<{ react: [key: CommunityReactionKey] }>()

function countFor(key: CommunityReactionKey) {
  return props.counts?.[key] ?? 0
}

function titleFor(reaction: CommunityReaction) {
  const count = countFor(reaction.key)
  const tally = count === 1 ? '1 reaction' : `${count} reactions`
  if (props.mine === reaction.key) return `${reaction.label} — ${tally}, including yours. Tap to remove.`
  return `${reaction.label} — ${tally}`
}
</script>
