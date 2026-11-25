<template>
  <button
    type="button"
    class="tap-target inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
    :aria-label="muted ? 'Turn game sounds on' : 'Mute game sounds'"
    :aria-pressed="!muted"
    @click="toggle"
  >
    <IconVolumeOff v-if="muted" class="h-4 w-4" />
    <IconVolume v-else class="h-4 w-4" />
  </button>
</template>

<script setup lang="ts">
import { IconVolume, IconVolumeOff } from '@tabler/icons-vue'

const { muted, toggle } = useGameSound()
</script>
