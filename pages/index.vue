<template>
  <div class="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-fixed pb-24 md:pb-12">
    <section class="relative h-[60vh] md:h-[50vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      <div class="absolute inset-0 z-0 bg-gradient-to-b from-[hsl(var(--golden-50))] to-transparent opacity-50" />
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-[hsl(var(--primary))]/10 rounded-full blur-3xl" />
      <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />

      <div class="z-10 relative max-w-2xl mx-auto">
        <span class="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-[hsl(var(--foreground))] uppercase bg-[hsl(var(--golden-100))] rounded-full">
          {{ auth.greeting || 'Jai Swaminarayan' }}
        </span>
        <h1 class="text-5xl md:text-7xl font-display font-bold text-[hsl(var(--foreground))] mb-4 tracking-tight">
          Bhaktiras
        </h1>
        <p class="text-lg md:text-xl text-[hsl(var(--muted-foreground))] font-light leading-relaxed mb-8">
          Celebrating a decade of devotion, community, and selfless service.
          Join us in commemorating 10 glorious years.
        </p>
        <NuxtLink to="/events">
          <button class="px-8 py-3 rounded-full bg-[hsl(var(--primary))] text-white font-semibold shadow-lg shadow-[hsl(var(--primary))]/20 hover:shadow-[hsl(var(--primary))]/40 hover:-translate-y-1 transition-all duration-300">
            Join Celebrations
          </button>
        </NuxtLink>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        <NuxtLink
          v-for="(item, index) in menuItems"
          :key="item.id"
          :to="item.href"
          class="group h-full bg-white p-6 rounded-2xl shadow-sm border border-[hsl(var(--golden-200))] hover:shadow-xl hover:border-[hsl(var(--primary))]/20 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
        >
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
            :class="item.color"
          >
            <component :is="item.icon" class="w-7 h-7" />
          </div>
          <h3 class="text-lg font-bold text-[hsl(var(--foreground))] mb-1">{{ item.title }}</h3>
          <p class="text-sm text-[hsl(var(--muted-foreground))] font-medium">{{ item.desc }}</p>
        </NuxtLink>
      </div>
    </section>

    <footer class="mt-20 text-center px-6">
      <blockquote class="font-display text-2xl italic text-[hsl(var(--muted-foreground))]/80 max-w-2xl mx-auto">
        "In the joy of others, lies our own."
      </blockquote>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  IconMapPin,
  IconCalendar,
  IconUsers,
  IconVideo,
  IconHandGrab,
  IconDeviceGamepad2,
  IconClock
} from '@tabler/icons-vue'

const auth = useAuth()
const menuItems = [
  { id: 'journey', title: 'Journey', desc: '10 Years of Grace', icon: IconMapPin, color: 'bg-orange-100 text-orange-600', href: '/journey' },
  { id: 'events', title: 'Events', desc: 'Celebration Schedule', icon: IconCalendar, color: 'bg-blue-100 text-blue-600', href: '/events' },
  { id: 'community', title: 'Community', desc: 'Wall of Gratitude', icon: IconUsers, color: 'bg-rose-100 text-rose-600', href: '/community' },
  { id: 'darshan', title: 'Darshan', desc: 'Live Streaming', icon: IconVideo, color: 'bg-purple-100 text-purple-600', href: '/darshan' },
  { id: 'seva', title: 'Seva', desc: 'Volunteer Roles', icon: IconHandGrab, color: 'bg-green-100 text-green-600', href: '/seva' },
  { id: 'play', title: 'Play', desc: 'Quiz, Wordle, Spelling Bee & more', icon: IconDeviceGamepad2, color: 'bg-yellow-100 text-yellow-600', href: '/play' },
  { id: 'legacy', title: 'Legacy', desc: 'Time Capsule', icon: IconClock, color: 'bg-indigo-100 text-indigo-600', href: '/legacy' }
]
</script>
