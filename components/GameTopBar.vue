<template>
  <!-- Pinned so Back, the clock and the game's own actions stay reachable while scrolling.
       Each page passes its own bleed (`-mx-4 px-4` and so on) to match its gutter. -->
  <div class="sticky top-0 z-40 mb-4 flex items-center gap-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 py-2 backdrop-blur md:top-16 md:mb-6">
    <NuxtLink
      to="/play"
      class="game-bar-pill tap-target font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
    >
      <IconArrowLeft class="h-4 w-4" aria-hidden="true" />
      Back
    </NuxtLink>
    <div class="ml-auto flex min-w-0 items-center gap-2">
      <span v-if="timer != null" role="timer" class="game-bar-pill tabular-nums text-[hsl(var(--primary))]">
        <IconClock class="h-4 w-4" aria-hidden="true" />
        <span class="sr-only">Time</span>
        {{ timer }}
      </span>
      <slot name="status" />
      <GameSoundToggle />
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconArrowLeft, IconClock } from '@tabler/icons-vue'

/**
 * The one top bar every daily game shares. The six games each grew their own —
 * "← Back" here, "‹ Back" there, the clock in the bar on some and under the
 * title on others — so moving between them felt like moving between sites.
 */
defineProps<{
  /** The game clock, already formatted. Leave it out for a game without one. */
  timer?: string
}>()
</script>
