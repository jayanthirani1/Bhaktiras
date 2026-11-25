<template>
  <div
    class="text-center"
    :class="[compactOnMobile ? 'mb-4 md:mb-8' : 'mb-8', className]"
  >
    <h1
      class="font-bold text-[hsl(var(--primary))]"
      :class="compactOnMobile ? 'text-2xl md:mb-2 md:text-4xl' : 'mb-2 text-3xl md:text-4xl'"
    >
      <slot>{{ title }}</slot>
    </h1>
    <p
      v-if="subtitle"
      class="text-[hsl(var(--muted-foreground))] max-w-lg mx-auto leading-relaxed"
      :class="{ 'hidden md:block': compactOnMobile }"
    >
      {{ subtitle }}
    </p>
    <div
      class="mt-4 mx-auto h-px w-16 bg-gradient-to-r from-transparent via-[hsl(var(--golden-300))] to-transparent"
      :class="{ 'hidden md:block': compactOnMobile }"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  className?: string
  /**
   * Title only on phones. Game pages use it: their subtitle repeats the How to
   * play card, and on a phone the lines it takes push the board and keyboard
   * below the fold.
   */
  compactOnMobile?: boolean
}>()
</script>
