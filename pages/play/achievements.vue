<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-3xl">
      <NuxtLink
        to="/play/streaks"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        ← Back to streaks
      </NuxtLink>

      <PageHeader
        title="Achievements"
        subtitle="Permanent unlocks for your account, plus the current all-time crowns."
      />

      <div v-if="!auth.user.value" class="card-surface p-8 text-center">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">Sign in to view your achievements and crowns.</p>
        <NuxtLink to="/login?redirect=/play/achievements" class="btn-primary mt-4 inline-flex">Sign in</NuxtLink>
      </div>

      <template v-else>
        <section class="card-surface mt-8 p-5 sm:p-6">
          <div class="flex items-center gap-2">
            <IconCrown class="h-5 w-5 text-[hsl(var(--accent))]" />
            <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Current crowns</h2>
          </div>
          <div v-if="achievements.loading.value" class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading crowns…</div>
          <div v-else class="mt-4 grid gap-3 md:grid-cols-2">
            <div
              v-for="crown in achievements.crowns.value"
              :key="crown.id"
              class="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4"
            >
              <p class="text-sm font-semibold text-[hsl(var(--primary))]">{{ crownTitle(crown.id) }}</p>
              <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ crown.holderName }}</p>
              <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--accent))]">{{ crownValue(crown) }}</p>
              <p v-if="crown.holderUserId === auth.user.value?.uid" class="mt-2 text-xs font-semibold text-amber-700">You currently hold this crown.</p>
            </div>
            <p v-if="!achievements.crowns.value.length" class="text-sm text-[hsl(var(--muted-foreground))]">No crowns claimed yet.</p>
          </div>
        </section>

        <section
          v-for="group in achievements.groupedAchievements.value"
          :key="group.id"
          class="card-surface mt-5 p-5 sm:p-6"
        >
          <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">{{ group.title }}</h2>
          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="rounded-2xl border p-4"
              :class="item.unlocked ? 'border-emerald-200 bg-emerald-50/70' : 'border-[hsl(var(--border))] bg-[hsl(var(--background))]'"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-[hsl(var(--primary))]">{{ item.title }}</p>
                  <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ item.description }}</p>
                </div>
                <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="item.unlocked ? 'bg-emerald-600 text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'">
                  {{ item.unlocked ? 'Unlocked' : 'Locked' }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconCrown } from '@tabler/icons-vue'
import { crownTitle, crownValue } from '~/composables/useAchievements'

const auth = useAuth()
const achievements = useAchievements()

useHead({ title: 'Achievements · Bhaktiras' })
</script>
