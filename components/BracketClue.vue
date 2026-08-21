<template>
  <span
    v-if="isSolved"
    class="mx-0.5 inline rounded-md px-1.5 py-0.5 font-semibold"
    :class="peekedIds.includes(node.id)
      ? 'bg-amber-100 text-amber-900'
      : 'bg-emerald-100 text-emerald-900'"
  >{{ node.answer }}</span>

  <span
    v-else
    class="mx-0.5 inline rounded-md px-1 py-0.5 ring-1 transition-colors"
    :class="[
      active
        ? 'cursor-pointer bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] ring-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--primary))]/20'
        : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] ring-transparent',
      selectedId === node.id ? 'ring-2 ring-[hsl(var(--primary))]' : ''
    ]"
    :role="active ? 'button' : undefined"
    :tabindex="active ? 0 : undefined"
    :aria-label="active ? `Answer clue: ${clueLabel}` : undefined"
    @click.stop="active && emit('select', node.id)"
    @keydown.enter.stop.prevent="active && emit('select', node.id)"
    @keydown.space.stop.prevent="active && emit('select', node.id)"
  >
    <span aria-hidden="true" class="opacity-40">[</span><template
      v-for="(part, index) in node.parts"
      :key="index"
    ><template v-if="typeof part === 'string'">{{ part }}</template><BracketClue
      v-else
      :node="part"
      :solved-ids="solvedIds"
      :peeked-ids="peekedIds"
      :selected-id="selectedId"
      @select="emit('select', $event)"
    /></template><span aria-hidden="true" class="opacity-40">]</span>
  </span>
</template>

<script setup lang="ts">
import { clueText, isActive, type BracketNode } from '~/utils/bracketCity'

const props = defineProps<{
  node: BracketNode
  solvedIds: string[]
  peekedIds: string[]
  selectedId: string | null
}>()

const emit = defineEmits<{ select: [id: string] }>()

const isSolved = computed(() => props.solvedIds.includes(props.node.id))
const active = computed(() => isActive(props.node, new Set(props.solvedIds)))
const clueLabel = computed(() => clueText(props.node, new Set(props.solvedIds)))
</script>
