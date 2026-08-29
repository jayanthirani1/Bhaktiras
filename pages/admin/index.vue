<template>
  <div class="space-y-8">
    <!-- The dashboard is generated from the same menu the sidebar uses, so a new
         admin page can never be reachable from one and missing from the other. -->
    <section v-for="section in sections" :key="section.id" class="space-y-3">
      <h2
        v-if="section.label"
        class="text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]"
      >
        {{ section.label }}
      </h2>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="card in section.items"
          :key="card.to"
          :to="card.to"
          class="admin-panel group flex flex-col justify-between hover:border-[hsl(var(--primary))]/30"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">{{ card.label }}</h3>
              <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ card.subtitle }}</p>
            </div>
            <span
              v-if="card.collection && counts[card.collection] != null"
              class="shrink-0 rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs font-semibold text-[hsl(var(--primary))]"
            >
              {{ counts[card.collection] }}
            </span>
          </div>
          <p class="mt-4 text-sm font-semibold text-[hsl(var(--golden-900))] group-hover:underline">Edit →</p>
        </NuxtLink>
      </div>
    </section>

    <AdminLaunchReset />

    <AdminGameReset />
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, type Firestore } from 'firebase/firestore'
import { ADMIN_MENU, ADMIN_MENU_GROUPS, ADMIN_MENU_TOP } from '~/data/adminMenu'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const sections = [
  // Everything except the dashboard's own link back to itself.
  { id: 'top', label: '', items: ADMIN_MENU_TOP.filter(item => item.to !== '/admin') },
  ...ADMIN_MENU_GROUPS.map(group => ({ id: group.id, label: group.label, items: group.items }))
]

const collectionNames = [...new Set(ADMIN_MENU.map(item => item.collection).filter((name): name is string => !!name))]

const counts = reactive<Record<string, number | null>>(
  Object.fromEntries(collectionNames.map(name => [name, null]))
)

onMounted(async () => {
  const db = useNuxtApp().$firebaseDb as Firestore | null
  if (!db) return
  await Promise.all(collectionNames.map(async (name) => {
    try {
      counts[name] = (await getDocs(collection(db, name))).size
    } catch {
      counts[name] = null
    }
  }))
})

useHead({ title: 'Admin · Bhaktiras' })
</script>
