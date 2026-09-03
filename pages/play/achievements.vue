<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-3xl">
      <NuxtLink
        to="/play"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        ← Back games
      </NuxtLink>

      <PageHeader
        title="Achievements"
        subtitle="Long-term medals you work toward, plus a few rare one-shots. Progress saves to your account."
      />

      <section class="card-surface mt-8 p-5 sm:p-6">
        <div class="flex items-center gap-2">
          <IconCrown class="h-5 w-5 text-[hsl(var(--golden-900))]" />
          <h2 class="font-display text-xl font-semibold text-[hsl(var(--primary))]">Monthly Crowns</h2>
        </div>
        <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Best results this month. Resets on the {{ resetLabel }}.
        </p>
        <div v-if="achievements.loading.value && !achievements.crowns.value.length" class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
          Loading crowns…
        </div>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div
            v-for="def in crownDefinitions"
            :key="def.id"
            class="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4"
          >
            <div class="flex items-start gap-3">
              <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 text-amber-900">
                <IconCrown class="h-5 w-5" />
              </span>
              <div>
                <p class="text-sm font-semibold text-[hsl(var(--primary))]">{{ def.title }}</p>
                <template v-if="crownById(def.id)">
                  <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    <NuxtLink
                      v-if="crownById(def.id)?.holderUserId"
                      :to="`/devotee/${crownById(def.id)?.holderUserId}`"
                      class="hover:underline"
                    >
                      {{ crownById(def.id)?.holderName }}
                    </NuxtLink>
                    <template v-else>{{ crownById(def.id)?.holderName }}</template>
                  </p>
                  <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--golden-900))]">
                    {{ crownValue(crownById(def.id)!) }}
                  </p>
                  <p
                    v-if="crownById(def.id)?.holderUserId === auth.user.value?.uid"
                    class="mt-2 text-xs font-semibold text-amber-700"
                  >
                    You currently hold this crown.
                  </p>
                </template>
                <p v-else class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Unclaimed this month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div v-if="!auth.user.value" class="card-surface mt-5 p-8 text-center">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">Sign in to view your medals and progress.</p>
        <NuxtLink to="/login?redirect=/play/achievements" class="btn-primary mt-4 inline-flex">Sign in</NuxtLink>
      </div>

      <template v-else>
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
              <div class="flex items-start gap-3">
                <AchievementMedal :medal="item.medal" :unlocked="item.unlocked" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <p class="text-sm font-semibold text-[hsl(var(--primary))]">{{ item.title }}</p>
                    <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" :class="item.unlocked ? 'bg-emerald-700 text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'">
                      {{ item.unlocked ? 'Unlocked' : 'Locked' }}
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ item.description }}</p>
                  <div v-if="item.progressBar" class="mt-3">
                    <div class="flex items-center justify-between text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">
                      <span>{{ item.progressBar.label }}</span>
                      <span>{{ item.unlocked ? 'Done' : `${item.progressBar.percent}%` }}</span>
                    </div>
                    <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="item.unlocked ? 'bg-emerald-600' : 'bg-[hsl(var(--primary))]'"
                        :style="{ width: `${item.unlocked ? 100 : item.progressBar.percent}%` }"
                      />
                    </div>
                  </div>
                </div>
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
import { CROWN_DEFINITIONS, crownValue } from '~/composables/useAchievements'
import { nextUkMonthCrownResetLabel } from '~/utils/gameDay'

const auth = useAuth()
const achievements = useAchievements()
const crownDefinitions = CROWN_DEFINITIONS
const resetLabel = nextUkMonthCrownResetLabel()

function crownById(id: string) {
  return achievements.crowns.value.find(crown => crown.id === id) || null
}

useHead({ title: 'Achievements · Bhaktiras' })
</script>
