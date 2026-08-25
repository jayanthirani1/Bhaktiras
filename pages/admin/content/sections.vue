<template>
  <div class="space-y-4">
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Sections</h1>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          Switch a whole part of the app off. A hidden section disappears from the navigation and the
          homepage tiles, and its pages tell anyone with the link that it is not available.
        </p>
      </div>
      <p class="rounded-full bg-[hsl(var(--muted))] px-4 py-1.5 text-sm font-semibold text-[hsl(var(--primary))]">
        {{ visibleCount }} of {{ sections.length }} showing
      </p>
    </div>

    <div class="admin-panel divide-y divide-[hsl(var(--border))] p-0">
      <div
        v-for="section in sections"
        :key="section.id"
        class="flex flex-wrap items-center gap-4 px-5 py-4"
      >
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="font-semibold text-[hsl(var(--primary))]">{{ section.label }}</p>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              :class="section.visible ? 'bg-emerald-100 text-emerald-700' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'"
            >
              {{ section.visible ? 'Showing' : 'Hidden' }}
            </span>
          </div>
          <p class="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">{{ section.description }}</p>
          <p class="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{{ section.paths.join(', ') }}</p>
        </div>
        <label class="inline-flex shrink-0 items-center gap-2 text-sm font-semibold">
          <input v-model="section.visible" type="checkbox" class="h-4 w-4">
          Show in the app
        </label>
      </div>
    </div>

    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      Hiding Games also hides every game, the streak leaderboard and achievements. To stagger
      individual games instead, use
      <NuxtLink to="/admin/games/releases" class="font-semibold text-[hsl(var(--golden-900))] underline">Game releases</NuxtLink>.
    </p>

    <button type="button" class="admin-btn" :disabled="saving" @click="saveSections">
      {{ saving ? 'Saving…' : 'Save sections' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SiteSectionContent } from '~/types'
import { siteSectionsFromSource } from '~/data/siteSections'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { item, saving, error, load, save } = useAdminSiteContent()
const sections = ref<SiteSectionContent[]>(siteSectionsFromSource(undefined))

const visibleCount = computed(() => sections.value.filter(section => section.visible).length)

function fill() {
  sections.value = item.value.sections.map(section => ({ ...section, paths: [...section.paths] }))
}

async function saveSections() {
  await save({ sections: sections.value })
  fill()
}

onMounted(async () => {
  await load()
  fill()
})

useHead({ title: 'Sections · Admin' })
</script>
