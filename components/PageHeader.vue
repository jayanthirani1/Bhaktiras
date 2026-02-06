<template>
  <div
    class="mb-8 text-center"
    :class="className"
  >
    <h1 class="text-3xl md:text-4xl font-bold text-[hsl(var(--foreground))] mb-2">
      {{ title }}
    </h1>
    <p v-if="subtitle" class="text-[hsl(var(--muted-foreground))] max-w-lg mx-auto leading-relaxed">
      {{ subtitle }}
    </p>
    <div class="mt-4 mx-auto w-16 h-1 bg-gradient-to-r from-transparent via-[hsl(var(--primary))] to-transparent rounded-full" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  className?: string
}>()
</script>
