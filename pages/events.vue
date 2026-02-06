<template>
  <div class="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-5xl mx-auto">
      <PageHeader
        title="Celebration Schedule"
        subtitle="Join us in these auspicious moments of joy and devotion."
      />

      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="h-48 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(event, index) in events"
          :key="event.id"
          class="bg-white rounded-2xl p-6 shadow-sm border border-[hsl(var(--golden-200))] hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
        >
          <div
            v-if="event.isLive"
            class="absolute top-4 right-4 flex items-center space-x-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse"
          >
            <span class="w-2 h-2 bg-red-600 rounded-full" />
            <span>LIVE NOW</span>
          </div>
          <div class="w-12 h-12 bg-[hsl(var(--golden-50))] rounded-xl flex items-center justify-center text-[hsl(var(--golden-600))] mb-4 group-hover:bg-[hsl(var(--primary))] group-hover:text-white transition-colors duration-300">
            <IconCalendar class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-[hsl(var(--foreground))] mb-2">{{ event.title }}</h3>
          <div class="flex items-center text-[hsl(var(--muted-foreground))] text-sm mb-4 space-x-2">
            <IconClock class="w-4 h-4" />
            <span>{{ event.time }}</span>
          </div>
          <p class="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed mb-6">
            {{ event.description }}
          </p>
          <button class="w-full py-2.5 rounded-xl border border-[hsl(var(--golden-200))] text-[hsl(var(--foreground))] font-medium hover:bg-[hsl(var(--golden-50))] hover:border-[hsl(var(--golden-300))] transition-colors">
            Add to Calendar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconCalendar, IconClock } from '@tabler/icons-vue'
const { events, isLoading } = useEvents()
</script>
