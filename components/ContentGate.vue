<template>
  <div class="flex min-h-[70vh] items-center justify-center px-4 py-16">
    <div class="w-full max-w-md text-center">
      <div class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[hsl(var(--muted))] text-[hsl(var(--primary))]">
        <IconLock class="h-8 w-8" stroke-width="1.7" />
      </div>
      <h1 class="mt-6 font-display text-2xl font-bold text-[hsl(var(--primary))]">
        {{ title }}
      </h1>
      <p class="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
        {{ message }}
      </p>
      <div class="mt-8">
        <NuxtLink
          :to="backTo"
          class="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90"
        >
          {{ backLabel }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconLock } from '@tabler/icons-vue'

/**
 * Shown in place of a page whose section an admin has switched off. Keeping the
 * URL rather than redirecting means an old link lands somewhere that says why
 * there is nothing here.
 */
const props = defineProps<{
  title: string
  message: string
  backTo?: string
  backLabel?: string
}>()

const backTo = computed(() => props.backTo || '/')
const backLabel = computed(() => props.backLabel || 'Back to home')

useHead({ title: props.title })
</script>
