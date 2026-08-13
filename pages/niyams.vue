<template>
  <div class="min-h-screen bg-[hsl(var(--background))] pb-24 pt-8 md:pt-12 px-4">
    <div class="mx-auto max-w-2xl">
      <PageHeader
        title="Our Niyams"
        subtitle="Utsav niyams to keep together. Tick them on this device only — a personal tracker, not a public score."
      />

      <div class="card-surface mb-8 p-5 text-center sm:p-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--accent))]">Your tracker</p>
        <p class="mt-2 font-display text-4xl text-[hsl(var(--primary))]">{{ tracker.doneCount.value }}/{{ tracker.total }}</p>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
          <div
            class="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-500"
            :style="{ width: `${tracker.percent.value}%` }"
          />
        </div>
      </div>

      <ul class="space-y-3">
        <li
          v-for="n in tracker.niyams"
          :key="n.id"
          class="card-surface flex gap-4 p-4 sm:p-5"
        >
          <input
            :id="n.id"
            type="checkbox"
            class="mt-1 h-5 w-5 shrink-0 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
            :checked="!!tracker.checked.value[n.id]"
            @change="tracker.toggle(n.id)"
          >
          <label :for="n.id" class="min-w-0 cursor-pointer">
            <span class="block font-semibold text-[hsl(var(--foreground))]">{{ n.title }}</span>
            <span class="mt-1 block text-sm text-[hsl(var(--muted-foreground))]">{{ n.detail }}</span>
          </label>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const tracker = useNiyamTracker()
</script>
