<template>
  <div
    class="mb-8 text-center"
    :class="className"
  >
    <h1 class="mb-2 text-3xl font-bold text-[hsl(var(--primary))] md:text-4xl">
      <slot>{{ title }}</slot>
    </h1>
    <p v-if="subtitle" class="text-[hsl(var(--muted-foreground))] max-w-lg mx-auto leading-relaxed">
      {{ subtitle }}
    </p>
    <div class="mt-4 mx-auto h-px w-16 bg-gradient-to-r from-transparent via-[hsl(var(--golden-300))] to-transparent" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  className?: string
}>()
</script>
