<template>
  <div class="flex min-h-[70vh] items-center justify-center px-4 py-16">
    <div class="w-full max-w-md text-center">
      <div class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[hsl(var(--muted))] text-[hsl(var(--primary))]">
        <component :is="comingSoon ? IconClock : IconLock" class="h-8 w-8" stroke-width="1.7" />
      </div>
      <h1 class="mt-6 font-display text-2xl font-bold text-[hsl(var(--foreground))]">
        {{ title }}
      </h1>
      <p class="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
        {{ message }}
      </p>
      <p v-if="releaseLabel" class="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-800">
        <IconCalendarEvent class="h-4 w-4" />
        Unlocks {{ releaseLabel }}
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
import { IconCalendarEvent, IconClock, IconLock } from '@tabler/icons-vue'

/**
 * Shown in place of a page that an admin has switched off, or a game that has
 * not been released yet. Keeping the URL rather than redirecting means a shared
 * link to a game still lands somewhere that says when it opens.
 */
const props = defineProps<{
  title: string
  message: string
  releaseLabel?: string
  comingSoon?: boolean
  backTo?: string
  backLabel?: string
}>()

const backTo = computed(() => props.backTo || '/')
const backLabel = computed(() => props.backLabel || 'Back to home')

useHead({ title: props.title })
</script>
