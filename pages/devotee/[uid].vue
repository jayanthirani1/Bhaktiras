<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-24 pt-8 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <NuxtLink
        to="/play"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
      >
        ← Back
      </NuxtLink>

      <div v-if="loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading profile…
      </div>

      <div v-else-if="error" class="card-surface p-8 text-center">
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>

      <div v-else-if="notFound || !profile" class="card-surface p-8 text-center">
        <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Profile not found</h1>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          This devotee has not appeared on a leaderboard or niyam board yet.
        </p>
      </div>

      <template v-else>
        <header class="mb-6 text-center">
          <p class="text-xs font-bold uppercase tracking-[0.16em] text-[hsl(var(--golden-900))]">
            Devotee profile
          </p>
          <h1 class="mt-2 font-display text-3xl font-semibold text-[hsl(var(--primary))]">
            {{ profile.displayName }}
          </h1>
          <p v-if="isOwn" class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            This is how others see you.
            <NuxtLink to="/account" class="font-semibold text-[hsl(var(--primary))] underline">
              Edit your name
            </NuxtLink>
          </p>
        </header>

        <section v-if="profile.streak" class="card-surface mb-5 p-5">
          <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Play streak</h2>
          <dl class="mt-3 grid grid-cols-2 gap-3 text-center">
            <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-3 py-3">
              <dt class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">
                Current
              </dt>
              <dd class="mt-1 font-display text-2xl text-[hsl(var(--primary))]">
                {{ profile.streak.currentStreak }}
              </dd>
            </div>
            <div class="rounded-xl bg-[hsl(var(--muted))]/60 px-3 py-3">
              <dt class="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--golden-900))]">
                Longest
              </dt>
              <dd class="mt-1 font-display text-2xl text-[hsl(var(--primary))]">
                {{ profile.streak.longestStreak }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="card-surface mb-5 p-5">
          <div class="flex items-center gap-2">
            <IconCrown class="h-5 w-5 text-[hsl(var(--golden-900))]" />
            <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">
              Crowns ({{ profile.crowns.length }})
            </h2>
          </div>
          <ul v-if="profile.crowns.length" class="mt-4 space-y-3">
            <li
              v-for="crown in profile.crowns"
              :key="crown.id"
              class="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
            >
              <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 text-amber-900">
                <IconCrown class="h-5 w-5" />
              </span>
              <div>
                <p class="text-sm font-semibold text-[hsl(var(--primary))]">{{ crown.title }}</p>
                <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--golden-900))]">
                  {{ crown.valueLabel }}
                </p>
              </div>
            </li>
          </ul>
          <p v-else class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            No all-time crowns held right now.
          </p>
        </section>

        <section class="card-surface mb-5 p-5">
          <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">
            Achievements ({{ profile.achievements.length }})
          </h2>
          <ul v-if="profile.achievements.length" class="mt-4 grid gap-3 sm:grid-cols-2">
            <li
              v-for="item in profile.achievements"
              :key="item.id"
              class="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4"
            >
              <div class="flex items-start gap-3">
                <AchievementMedal :medal="item.medal" :unlocked="true" />
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-[hsl(var(--primary))]">{{ item.title }}</p>
                  <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{{ item.description }}</p>
                </div>
              </div>
            </li>
          </ul>
          <p v-else class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            No achievements unlocked yet.
          </p>
        </section>

        <section class="card-surface p-5">
          <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">
            Niyams ({{ profile.niyams.length }})
          </h2>
          <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Shared totals only — individual entries stay private.
          </p>
          <ul v-if="profile.niyams.length" class="mt-4 divide-y divide-[hsl(var(--border))]">
            <li
              v-for="niyam in profile.niyams"
              :key="niyam.challengeId"
              class="flex items-center justify-between gap-3 py-3"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--golden-50))] text-[hsl(var(--golden-900))]"
                >
                  <NiyamIcon :name="niyam.icon || 'niyam'" class="h-5 w-5" />
                </span>
                <span class="truncate font-semibold text-[hsl(var(--foreground))]">{{ niyam.title }}</span>
              </div>
              <span class="shrink-0 text-sm font-semibold tabular-nums text-[hsl(var(--primary))]">
                {{ formatCount(niyam.approvedTotal) }}
                <span class="font-normal text-[hsl(var(--muted-foreground))]">{{ niyam.unitLabel }}</span>
              </span>
            </li>
          </ul>
          <p v-else class="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            No counted niyam contributions yet.
          </p>
          <NuxtLink
            to="/niyams"
            class="mt-4 inline-flex text-sm font-semibold text-[hsl(var(--primary))] underline"
          >
            See the sangat niyams
          </NuxtLink>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconCrown } from '@tabler/icons-vue'
import { formatCount } from '~/utils/niyamChallenge'

const route = useRoute()
const auth = useAuth()
const { profile, loading, error, notFound, fetchProfile } = usePublicProfile()

const uid = computed(() => String(route.params.uid || ''))
const isOwn = computed(() => !!auth.user.value?.uid && auth.user.value.uid === uid.value)

watch(uid, (value) => {
  if (value) void fetchProfile(value)
}, { immediate: true })

useHead(() => ({
  title: profile.value
    ? `${profile.value.displayName} · Bhaktiras`
    : 'Devotee profile · Bhaktiras'
}))
</script>
