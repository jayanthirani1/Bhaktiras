<template>
  <div class="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-4xl mx-auto">
      <PageHeader
        title="Our Journey"
        subtitle="Tracing the footsteps of devotion that led us to this momentous milestone."
      />

      <div v-if="isLoading" class="flex min-h-[40vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading Journey...
      </div>
      <div v-else-if="error" class="flex min-h-[40vh] items-center justify-center text-red-500">
        Failed to load timeline
      </div>
      <div v-else class="relative mt-12">
        <div class="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(var(--primary))]/10 via-[hsl(var(--primary))]/40 to-[hsl(var(--primary))]/10 transform md:-translate-x-1/2" />
        <div class="space-y-12">
          <div
            v-for="(item, index) in timeline"
            :key="item.id"
            class="relative flex flex-col md:flex-row gap-8"
            :class="index % 2 === 0 ? 'md:flex-row-reverse' : ''"
          >
            <div class="absolute left-4 md:left-1/2 w-8 h-8 rounded-full bg-white border-4 border-[hsl(var(--primary))] shadow-lg transform -translate-x-1/2 z-10 flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
            </div>
            <div class="ml-12 md:ml-0 md:w-1/2 md:px-8">
              <div
                class="bg-white p-6 rounded-2xl shadow-sm border border-[hsl(var(--golden-200))] hover:shadow-md transition-shadow"
                :class="index % 2 === 0 ? 'text-left' : 'md:text-right'"
              >
                <span class="inline-block px-3 py-1 bg-[hsl(var(--golden-50))] text-[hsl(var(--foreground))] text-xs font-bold rounded-full mb-3">
                  {{ item.year }}
                </span>
                <h3 class="text-xl font-bold text-[hsl(var(--foreground))] mb-2">{{ item.title }}</h3>
                <p class="text-[hsl(var(--muted-foreground))] leading-relaxed text-sm">{{ item.description }}</p>
                <div v-if="item.imageUrl" class="mt-4 rounded-lg overflow-hidden h-40 w-full relative">
                  <img
                    :src="item.imageUrl"
                    :alt="item.title"
                    class="w-full h-full object-cover"
                    @error="($event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545638100-249071c33c37?w=800&auto=format&fit=crop&q=60'"
                  >
                </div>
              </div>
            </div>
            <div class="md:w-1/2" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { timeline, isLoading, error } = useTimeline()
</script>
