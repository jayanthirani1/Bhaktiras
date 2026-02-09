<template>
  <div>
    <!-- Mobile: greeting bar when logged in -->
    <div
      v-if="auth.isLoggedIn && auth.greeting"
      class="fixed bottom-16 left-0 right-0 z-40 md:hidden py-1.5 px-3 bg-[hsl(var(--golden-50))]/95 border-t border-[hsl(var(--border))] text-center"
    >
      <span class="text-xs font-medium text-[hsl(var(--primary))]">{{ auth.greeting }}</span>
    </div>
    <!-- Mobile bottom nav -->
    <div class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[hsl(var(--border))] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
      <div class="flex justify-around items-center h-16 px-1">
        <NuxtLink
          v-for="item in navItems.slice(0, 6)"
          :key="item.href"
          :to="item.href"
          class="flex flex-col items-center justify-center space-y-0.5 p-2 rounded-xl transition-colors min-w-0 flex-1"
          :class="isActive(item.href) ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span class="text-[10px] font-medium truncate">{{ item.label }}</span>
        </NuxtLink>
        <span :key="auth.user ? 'in' : 'out'" class="flex min-w-0 flex-1 flex-col items-center justify-center">
          <NuxtLink
            v-if="!auth.user"
            to="/login"
            class="flex flex-col items-center justify-center space-y-0.5 p-2 rounded-xl transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <IconLogin class="w-5 h-5 shrink-0" />
            <span class="text-[10px] font-medium">Sign in</span>
          </NuxtLink>
          <button
            v-else
            type="button"
            class="flex flex-col items-center justify-center space-y-0.5 p-2 rounded-xl transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            @click="handleSignOut"
          >
            <IconLogout class="w-5 h-5 shrink-0" />
            <span class="text-[10px] font-medium">Sign out</span>
          </button>
        </span>
      </div>
    </div>

    <!-- Desktop top nav -->
    <div class="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[hsl(var(--border))] shadow-sm">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="font-display text-2xl font-bold text-[hsl(var(--foreground))]">
            Bhaktiras
          </NuxtLink>
        </div>
        <div class="flex items-center space-x-1">
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
          <span :key="auth.user ? 'in' : 'out'" class="inline-flex items-center gap-2">
            <NuxtLink
              v-if="!auth.user"
              to="/login"
              class="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20"
            >
              <IconLogin class="w-4 h-4" />
              Sign in
            </NuxtLink>
            <div v-else class="ml-2 inline-flex items-center gap-2">
              <span class="text-xs font-medium text-[hsl(var(--muted-foreground))] hidden sm:inline">{{ auth.userName }}</span>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-stone-100"
                @click="handleSignOut"
              >
                <IconLogout class="w-4 h-4" />
                Sign out
              </button>
            </div>
          </span>
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
  IconHandGrab,
  IconClock,
  IconPlayerPlay,
  IconMapPin,
  IconLogin,
  IconLogout
} from '@tabler/icons-vue'

const route = useRoute()
const auth = useAuth()
const navItems = [
  { href: '/', icon: IconHome, label: 'Home' },
  { href: '/journey', icon: IconMapPin, label: 'Journey' },
  { href: '/events', icon: IconCalendar, label: 'Events' },
  { href: '/community', icon: IconUsers, label: 'Community' },
  { href: '/seva', icon: IconHandGrab, label: 'Seva' },
  { href: '/play', icon: IconPlayerPlay, label: 'Play' },
  { href: '/legacy', icon: IconClock, label: 'Legacy' }
]

function isActive(href: string) {
  if (href === '/') return route.path === '/'
  return route.path.startsWith(href)
}

async function handleSignOut() {
  await auth.signOut()
  await navigateTo('/login')
}
</script>
