<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-8 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <PageHeader :title="page.title" />
      <p v-if="loading" class="text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      <article v-else class="legal-prose rounded-2xl border border-[hsl(var(--border))] bg-white p-5 sm:p-8" v-html="html" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LegalSlug } from '~/types'
import { renderSimpleMarkdown } from '~/utils/simpleMarkdown'

const props = defineProps<{ slug: LegalSlug }>()

const { page, loading } = useSitePage(props.slug)
const html = computed(() => renderSimpleMarkdown(page.value.body || ''))

useHead(() => ({ title: `${page.value.title} · Bhaktiras` }))
</script>
