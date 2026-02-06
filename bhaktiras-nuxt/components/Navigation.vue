<template>
  <div>
    <!-- Mobile bottom nav -->
    <div class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[hsl(var(--border))] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
      <div class="flex justify-around items-center h-16 px-2">
        <NuxtLink
          v-for="item in navItems.slice(0, 6)"
          :key="item.href"
          :to="item.href"
          class="w-full flex flex-col items-center justify-center space-y-1 p-2 rounded-xl transition-colors"
          :class="isActive(item.href) ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span class="text-[10px] font-medium">{{ item.label }}</span>
          <div
            v-if="isActive(item.href)"
            class="absolute bottom-1 w-1 h-1 rounded-full bg-[hsl(var(--primary))]"
          />
        </NuxtLink>
      </div>
    </div>

    <!-- Desktop top nav -->
    <div class="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[hsl(var(--border))] shadow-sm">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="font-display text-2xl font-bold text-[hsl(var(--foreground))]">
          Bhaktiras
        </NuxtLink>
        <div class="flex space-x-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.href"
            :to="item.href"
            class="px-4 py-2 rounded-full text-sm font-medium transition-all"
            :class="isActive(item.href)
              ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-bold'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--golden-50))] hover:text-[hsl(var(--foreground))]'"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
      </div>
    </div>
    <div class="md:h-16" />
  </div>
</template>

<script setup lang="ts">
import {
  IconHome,
  IconCalendar,
  IconUsers,
  IconHand,
  IconClock,
  IconPlayerPlay,
  IconMapPin
} from '@tabler/icons-vue'

const route = useRoute()
const navItems = [
  { href: '/', icon: IconHome, label: 'Home' },
  { href: '/journey', icon: IconMapPin, label: 'Journey' },
  { href: '/events', icon: IconCalendar, label: 'Events' },
  { href: '/community', icon: IconUsers, label: 'Community' },
  { href: '/seva', icon: IconHand, label: 'Seva' },
  { href: '/play', icon: IconPlayerPlay, label: 'Play' },
  { href: '/legacy', icon: IconClock, label: 'Legacy' }
]

function isActive(href: string) {
  if (href === '/') return route.path === '/'
  return route.path.startsWith(href)
}
</script>
