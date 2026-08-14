<template>
  <div>
    <!-- Mobile top brand bar. On game pages it scrolls away so the game's own bar can pin. -->
    <div
      class="left-0 right-0 z-50 md:hidden overflow-visible bg-[hsl(var(--background))]/90 backdrop-blur-md border-b border-[hsl(var(--border))]"
      :class="isGamePage ? 'relative' : 'fixed top-0'"
    >
      <div class="h-14 px-3 flex items-center justify-center overflow-visible">
        <NuxtLink to="/" class="flex min-w-0 shrink-0 items-center overflow-visible">
          <BhaktirasLogo size="sm" animate />
        </NuxtLink>
      </div>
    </div>

    <!-- Mobile bottom nav -->
    <div
      v-if="!isGamePage"
      class="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--card))]/95 backdrop-blur-md border-t border-[hsl(var(--border))] md:hidden"
    >
      <div class="flex justify-around items-center h-16 px-1 safe-bottom">
        <NuxtLink
          v-for="item in navItems"
          :key="item.href"
          :to="item.href"
          class="flex flex-col items-center justify-center space-y-0.5 p-2 rounded-xl transition-colors min-w-0 flex-1"
          :class="isActive(item.href) ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]'"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span class="text-[10px] font-medium truncate">{{ item.label }}</span>
        </NuxtLink>
        <span :key="isLoggedIn ? 'in' : 'out'" class="flex min-w-0 flex-1 flex-col items-center justify-center">
          <NuxtLink
            v-if="!isLoggedIn"
            to="/login"
            class="flex flex-col items-center justify-center space-y-0.5 p-2 rounded-xl transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent))]"
          >
            <IconLogin class="w-5 h-5 shrink-0" />
            <span class="text-[10px] font-medium">Sign in</span>
          </NuxtLink>
          <button
            v-else
            type="button"
            class="flex flex-col items-center justify-center space-y-0.5 p-2 rounded-xl transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent))]"
            @click="handleSignOut"
          >
            <IconLogout class="w-5 h-5 shrink-0" />
            <span class="text-[10px] font-medium">Sign out</span>
          </button>
        </span>
      </div>
    </div>

    <!-- Desktop top nav -->
    <div class="hidden md:block fixed top-0 left-0 right-0 z-50 overflow-visible bg-[hsl(var(--background))]/90 backdrop-blur-md border-b border-[hsl(var(--border))]">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between overflow-visible">
        <NuxtLink to="/" class="flex min-w-0 shrink-0 items-center overflow-visible">
          <BhaktirasLogo size="sm" animate />
        </NuxtLink>
        <div class="flex items-center space-x-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.href"
            :to="item.href"
            class="px-3 py-2 rounded-full text-sm font-medium transition-all"
            :class="isActive(item.href)
              ? 'bg-[hsl(var(--primary))] text-white font-semibold'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]'"
          >
            {{ item.label }}
          </NuxtLink>
          <span :key="isLoggedIn ? 'in' : 'out'" class="inline-flex items-center gap-2">
            <NuxtLink
              v-if="!isLoggedIn"
              to="/login"
              class="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[hsl(var(--primary))] text-white hover:opacity-90"
            >
              <IconLogin class="w-4 h-4" />
              Sign in
            </NuxtLink>
            <button
              v-else
              type="button"
              class="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--accent))]"
              @click="handleSignOut"
            >
              <IconLogout class="w-4 h-4" />
              Sign out
            </button>
          </span>
        </div>
      </div>
    </div>
    <div :class="isGamePage ? 'h-0 md:h-16' : 'h-14 md:h-16'" />
  </div>
</template>

<script setup lang="ts">
import {
  IconHome,
  IconUsers,
  IconHandGrab,
  IconFlame,
  IconPlayerPlay,
  IconMapPin,
  IconCalendarEvent,
  IconLogin,
  IconLogout
} from '@tabler/icons-vue'
import { isGamePagePath } from '~/utils/gameRoutes'

const route = useRoute()
const { isLoggedIn, signOut } = useAuth()
const navItems = [
  { href: '/', icon: IconHome, label: 'Home' },
  { href: '/journey', icon: IconMapPin, label: 'Journey' },
  { href: '/events', icon: IconCalendarEvent, label: 'Events' },
  { href: '/community', icon: IconUsers, label: 'Community' },
  { href: '/seva', icon: IconHandGrab, label: 'Seva' },
  { href: '/niyams', icon: IconFlame, label: 'Niyams' },
  { href: '/play', icon: IconPlayerPlay, label: 'Play' }
]

const isGamePage = computed(() => isGamePagePath(route.path))

function isActive(href: string) {
  if (href === '/') return route.path === '/'
  return route.path.startsWith(href)
}

async function handleSignOut() {
  await signOut()
  await navigateTo('/login')
}
</script>
