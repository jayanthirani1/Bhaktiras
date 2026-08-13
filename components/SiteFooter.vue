<template>
  <footer class="mt-auto border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pb-10">
    <div class="mx-auto flex max-w-3xl flex-col items-center gap-2 text-center text-xs text-[hsl(var(--muted-foreground))] sm:text-sm">
      <p class="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
        <IconCopyright class="h-3.5 w-3.5 shrink-0" />
        <span>{{ SITE.name }} {{ year }}</span>
        <span aria-hidden="true">|</span>
        <span>{{ SITE.templeName }}</span>
      </p>
      <p class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <NuxtLink to="/privacy" class="font-medium text-[hsl(var(--primary))] hover:underline">Privacy</NuxtLink>
        <span aria-hidden="true">|</span>
        <NuxtLink to="/policy" class="font-medium text-[hsl(var(--primary))] hover:underline">Policy</NuxtLink>
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { IconCopyright } from '@tabler/icons-vue'
import { SITE } from '~/data/site'

const year = new Date().getFullYear()
</script>
