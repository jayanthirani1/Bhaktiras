<template>
  <div class="min-h-screen bg-stone-50 pb-24 pt-8 md:pt-12 px-4">
    <div class="max-w-4xl mx-auto">
      <PageHeader
        title="Live Darshan"
        subtitle="Experience the divinity from wherever you are."
      />

      <div class="relative aspect-video bg-black rounded-3xl shadow-2xl overflow-hidden mb-12 group">
        <img
          src="https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1600&auto=format&fit=crop&q=80"
          alt="Darshan Placeholder"
          class="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
        >
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="w-20 h-20 bg-[hsl(var(--primary))]/90 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-[hsl(var(--primary))]/30 backdrop-blur-sm">
            <IconPlayerPlay class="w-8 h-8 text-white ml-1 fill-white" />
          </div>
          <p class="mt-4 text-white/90 font-medium tracking-wide">Live Stream Offline</p>
          <p class="text-white/60 text-sm">Next Aarti: 7:00 PM</p>
        </div>
        <div class="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-red-500" />
            <span class="text-white text-xs font-bold uppercase tracking-wider">Offline</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-3xl p-8 shadow-sm border border-[hsl(var(--golden-200))] max-w-lg mx-auto text-center">
        <h3 class="text-2xl font-display font-bold text-[hsl(var(--foreground))] mb-2">Submit Sankalp</h3>
        <p class="text-[hsl(var(--muted-foreground))] mb-6 text-sm">Offer a prayer request for the evening Aarti.</p>
        <form class="space-y-4" @submit.prevent="handleSankalpSubmit">
          <input
            v-model="sankalpName"
            type="text"
            placeholder="Enter Name for Prayers"
            class="w-full px-4 py-3 rounded-xl bg-[hsl(var(--golden-50))]/50 border-2 border-[hsl(var(--golden-200))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-4 focus:ring-[hsl(var(--primary))]/10 transition-all text-center placeholder:text-[hsl(var(--muted-foreground))]/50"
          >
          <button
            type="submit"
            :disabled="!sankalpName.trim()"
            class="w-full py-3 rounded-xl bg-[hsl(var(--foreground))] text-white font-semibold shadow-lg shadow-[hsl(var(--foreground))]/20 hover:bg-[hsl(var(--foreground))]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Offer Prayer
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPlayerPlay } from '@tabler/icons-vue'
const sankalpName = ref('')
function handleSankalpSubmit() {
  if (!sankalpName.value.trim()) return
  // In a real app: save to Firebase or call API
  sankalpName.value = ''
}
</script>
