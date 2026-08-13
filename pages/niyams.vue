<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="mx-auto max-w-2xl">
      <PageHeader
        title="Our Niyams"
        subtitle="Utsav niyams we keep together. Tick your own; community totals encourage everyone."
      />

      <div class="card-surface mb-6 p-5 text-center sm:p-6">
        <p class="text-sm font-semibold text-[hsl(var(--accent))]">
          Niyams completed together with all Devotees
        </p>
        <p class="mt-2 font-display text-4xl text-[hsl(var(--primary))]">
          {{ communityChecks }}
        </p>
      </div>

      <div class="card-surface mb-8 p-5 text-center sm:p-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--accent))]">Your tracker</p>
        <p class="mt-2 font-display text-4xl text-[hsl(var(--primary))]">
          {{ doneCount }}/{{ total }}
        </p>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
          <div
            class="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-500"
            :style="{ width: `${percent}%` }"
          />
        </div>
        <p v-if="!isLoggedIn" class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
          <NuxtLink to="/login?redirect=/niyams" class="font-semibold text-[hsl(var(--accent))] hover:underline">
            Sign in
          </NuxtLink>
          to save your niyams to your account and add to the community total.
        </p>
      </div>

      <p v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</p>
      <p v-if="loading" class="mb-4 text-sm text-[hsl(var(--muted-foreground))]">Loading niyams…</p>

      <ul class="space-y-3">
        <li
          v-for="n in niyams"
          :key="n.id"
          class="card-surface flex gap-4 p-4 sm:p-5"
        >
          <input
            :id="n.id"
            type="checkbox"
            class="mt-1 h-5 w-5 shrink-0 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
            :checked="!!checked[n.id]"
            :disabled="!!savingId"
            @change="toggle(n.id)"
          >
          <label :for="n.id" class="min-w-0 cursor-pointer">
            <span class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span class="font-semibold text-[hsl(var(--foreground))]">{{ n.title }}</span>
              <span class="text-xs text-[hsl(var(--muted-foreground))]">
                {{ countLabel(n.id) }}
              </span>
            </span>
            <span class="mt-1 block text-sm text-[hsl(var(--muted-foreground))]">{{ n.detail }}</span>
          </label>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  niyams,
  checked,
  stats,
  loading,
  savingId,
  error,
  isLoggedIn,
  doneCount,
  total,
  percent,
  communityChecks,
  toggle
} = useNiyamTracker()

function countLabel(id: string) {
  const n = Number(stats.value.counts[id]) || 0
  if (!n) return 'Be the first'
  return `${n} keeping this`
}

useHead({ title: 'Niyams · Bhaktiras' })
</script>
