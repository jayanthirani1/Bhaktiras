<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <PageHeader
        title="Yajman Opportunities"
        subtitle="Take part in the utsav through one of these seva opportunities."
      />

      <p v-if="loading" class="text-center text-sm text-[hsl(var(--muted-foreground))]">Loading opportunities…</p>
      <div v-else-if="!opportunities.length" class="card-surface p-8 text-center">
        <IconSparkles class="mx-auto h-9 w-9 text-[hsl(var(--golden-900))]" />
        <h2 class="mt-3 font-display text-xl font-semibold text-[hsl(var(--primary))]">More opportunities coming soon</h2>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Please check back as Patotsav approaches.</p>
      </div>

      <ul v-else class="space-y-4">
        <li v-for="item in opportunities" :key="item.id" class="card-surface p-5 sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ item.title }}</h2>
              <p class="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{{ item.detail }}</p>
            </div>
            <span v-if="item.amount" class="shrink-0 rounded-full bg-[hsl(var(--golden-50))] px-3 py-1 text-sm font-bold text-[hsl(var(--primary))]">
              {{ item.amount }}
            </span>
          </div>
          <a
            v-if="item.contactUrl"
            :href="item.contactUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-primary mt-5 inline-flex items-center gap-2 text-sm"
          >
            Enquire
            <IconExternalLink class="h-4 w-4" />
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, type Firestore } from 'firebase/firestore'
import { IconExternalLink, IconSparkles } from '@tabler/icons-vue'
import type { YajmanOpportunity } from '~/types'

const opportunities = ref<YajmanOpportunity[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const db = useNuxtApp().$firebaseDb as Firestore | null
    if (!db) return
    const snap = await getDocs(collection(db, 'yajmanOpportunities'))
    opportunities.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as YajmanOpportunity))
      .filter(item => item.active !== false && item.title)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))
  } catch {
    opportunities.value = []
  } finally {
    loading.value = false
  }
})

useHead({ title: 'Yajman Opportunities · Bhaktiras' })
</script>
