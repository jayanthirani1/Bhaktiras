<template>
  <div>
    <!-- Mobile top brand bar. On game pages it scrolls away so the game's own bar can pin. -->
    <div
      class="left-0 right-0 z-50 md:hidden overflow-visible bg-[hsl(var(--background))]/90 backdrop-blur-md border-b border-[hsl(var(--border))]"
      :class="isGamePage ? 'relative' : 'fixed top-0'"
    >
      <div class="relative h-14 px-3 flex items-center justify-center overflow-visible">
        <NuxtLink to="/" class="flex min-w-0 shrink-0 items-center overflow-visible">
          <BhaktirasLogo size="sm" animate />
        </NuxtLink>
        <!-- Positioned by a wrapper: the component's own root is `relative`, which
             would win over an `absolute` merged onto the same element. -->
        <div class="absolute right-2 top-1/2 -translate-y-1/2">
          <ClientOnly>
            <NotificationInbox />
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- Mobile bottom nav -->
    <div
      v-if="!isGamePage"
      class="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--card))]/95 backdrop-blur-md border-t border-[hsl(var(--border))] md:hidden"
    >
      <div class="flex items-center h-16 px-2 safe-bottom">
        <NuxtLink
          v-for="item in mobilePrimaryItems"
          :key="item.href"
          :to="item.href"
          :target="item.external ? '_blank' : undefined"
          :rel="item.external ? 'noopener noreferrer' : undefined"
          class="flex min-w-0 flex-1 flex-col items-center justify-center space-y-0.5 rounded-xl p-2 transition-colors"
          :class="isActive(item.href) ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]'"
          @click="closeDrawer"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          <span class="truncate text-[10px] font-medium">{{ item.label }}</span>
        </NuxtLink>
        <button
          type="button"
          class="flex min-w-0 flex-1 flex-col items-center justify-center space-y-0.5 rounded-xl p-2 transition-colors"
          :class="drawerOpen ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]'"
          aria-label="Open more navigation"
          :aria-expanded="drawerOpen"
          @click="drawerOpen = !drawerOpen"
        >
          <IconLayoutGrid class="h-5 w-5 shrink-0" />
          <span class="truncate text-[10px] font-medium">More</span>
        </button>
      </div>
    </div>

    <div
      v-if="drawerOpen && !isGamePage"
      class="fixed inset-0 z-[60] overflow-hidden overscroll-none touch-none md:hidden"
      @touchmove.prevent
      @wheel.prevent
    >
      <div class="absolute inset-0 bg-black/30" @click="closeDrawer" />
      <div
        class="absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/98 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1 shadow-2xl backdrop-blur-xl"
        :style="sheetOffset ? { transform: `translateY(${sheetOffset}px)` } : undefined"
        @pointerdown="onDrawerHandleDown"
        @touchmove.prevent
      >
        <button
          type="button"
          class="flex w-full flex-col items-center py-3"
          aria-label="Close menu"
          @click="onDrawerHandleClick"
        >
          <span class="h-1.5 w-12 rounded-full bg-[hsl(var(--border))]" />
        </button>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">More</h2>
          <button
            type="button"
            class="rounded-full p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]"
            aria-label="Close menu"
            @click="closeDrawer"
          >
            <IconX class="h-5 w-5" />
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <NuxtLink
            v-for="item in mobileSecondaryItems"
            :key="item.href"
            :to="item.href"
            :target="item.external ? '_blank' : undefined"
            :rel="item.external ? 'noopener noreferrer' : undefined"
            class="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 transition-colors"
            :class="isActive(item.href) ? 'text-[hsl(var(--primary))] border-[hsl(var(--primary))]/30' : 'text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))]/20 hover:text-[hsl(var(--primary))]'"
            @click="closeDrawer"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
            <span class="min-w-0 text-sm font-medium">{{ item.label }}</span>
          </NuxtLink>
          <NuxtLink
            :to="accountItem.href"
            class="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 transition-colors"
            :class="isActive(accountItem.href) ? 'text-[hsl(var(--primary))] border-[hsl(var(--primary))]/30' : 'text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))]/20 hover:text-[hsl(var(--primary))]'"
            @click="closeDrawer"
          >
            <component :is="accountItem.icon" class="h-5 w-5 shrink-0" />
            <span class="min-w-0 text-sm font-medium">{{ accountItem.label }}</span>
          </NuxtLink>
        </div>
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
            v-for="item in desktopNavItems"
            :key="item.href"
            :to="item.href"
            :target="item.external ? '_blank' : undefined"
            :rel="item.external ? 'noopener noreferrer' : undefined"
            class="px-3 py-2 rounded-full text-sm font-medium transition-all"
            :class="isActive(item.href)
              ? 'bg-[hsl(var(--primary))] text-white font-semibold'
              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]'"
          >
            {{ item.label }}
          </NuxtLink>
          <ClientOnly>
            <NotificationInbox class="ml-1" />
          </ClientOnly>
          <span :key="isLoggedIn ? 'in' : 'out'" class="inline-flex items-center gap-2">
            <NuxtLink
              v-if="!isLoggedIn"
              to="/login"
              class="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[hsl(var(--primary))] text-white hover:opacity-90"
            >
              <IconLogin class="w-4 h-4" />
              Sign in
            </NuxtLink>
            <NuxtLink
              v-else
              to="/account"
              class="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--golden-900))]"
            >
              <IconUserCircle class="w-4 h-4" />
              Account
            </NuxtLink>
          </span>
        </div>
      </div>
    </div>
    <div :class="isGamePage ? 'h-0 md:h-16' : 'h-14 md:h-16'" />
  </div>
</template>

<script setup lang="ts">
import {
  IconLayoutGrid,
  IconLogin,
  IconUserCircle,
  IconX
} from '@tabler/icons-vue'
import { SITE_ICON_COMPONENTS } from '~/data/siteContent'
import { isGamePagePath } from '~/utils/gameRoutes'

const route = useRoute()
const { isLoggedIn } = useAuth()
const { navItems: managedNavItems } = useSiteContent()
const drawerOpen = ref(false)
const sheetOffset = ref(0)
const isGamePage = computed(() => isGamePagePath(route.path))
const navItems = computed(() => managedNavItems.value.map(item => ({
  ...item,
  icon: SITE_ICON_COMPONENTS[item.icon]
})))
const desktopNavItems = computed(() => navItems.value.filter(item => item.showInDesktopNav))
const mobileNavItems = computed(() => navItems.value.filter(item => item.showInMobileNav))
const mobilePrimaryItems = computed(() => {
  const preferred = mobileNavItems.value.filter(item => item.mobilePrimary)
  return preferred.slice(0, 4)
})
const mobileSecondaryItems = computed(() => mobileNavItems.value.filter(item => !mobilePrimaryItems.value.includes(item)))
const accountItem = computed(() => (
  isLoggedIn.value
    ? { href: '/account', icon: IconUserCircle, label: 'Account' }
    : { href: '/login', icon: IconLogin, label: 'Sign in' }
))

function isActive(href: string) {
  if (/^https?:\/\//.test(href)) return false
  if (href === '/') return route.path === '/'
  return route.path.startsWith(href)
}

function closeDrawer() {
  drawerOpen.value = false
  sheetOffset.value = 0
}

const SCROLL_LOCK_CLASS = 'drawer-scroll-lock'
let scrollLocked = false
let lockedScrollY = 0

function preventBackgroundScroll(event: Event) {
  event.preventDefault()
}

function lockBackgroundScroll() {
  if (import.meta.server || scrollLocked) return
  scrollLocked = true
  lockedScrollY = window.scrollY
  const html = document.documentElement
  const body = document.body
  html.classList.add(SCROLL_LOCK_CLASS)
  body.classList.add(SCROLL_LOCK_CLASS)
  body.style.position = 'fixed'
  body.style.top = `-${lockedScrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  // iOS home-screen apps ignore overflow:hidden; this is what actually stops the pan.
  window.addEventListener('touchmove', preventBackgroundScroll, { passive: false, capture: true })
  window.addEventListener('wheel', preventBackgroundScroll, { passive: false, capture: true })
}

function unlockBackgroundScroll() {
  if (import.meta.server || !scrollLocked) return
  scrollLocked = false
  const html = document.documentElement
  const body = document.body
  html.classList.remove(SCROLL_LOCK_CLASS)
  body.classList.remove(SCROLL_LOCK_CLASS)
  body.style.position = ''
  body.style.top = ''
  body.style.left = ''
  body.style.right = ''
  body.style.width = ''
  window.removeEventListener('touchmove', preventBackgroundScroll, { capture: true })
  window.removeEventListener('wheel', preventBackgroundScroll, { capture: true })
  window.scrollTo(0, lockedScrollY)
}

let handleStartY = 0
let draggingHandle = false
let swipedHandle = false

function onDrawerHandleClick() {
  if (swipedHandle) {
    swipedHandle = false
    return
  }
  closeDrawer()
}

function onDrawerHandleDown(event: PointerEvent) {
  if (event.button != null && event.button !== 0) return
  const target = event.target as HTMLElement | null
  if (target?.closest('a, button:not([aria-label="Close menu"])')) return
  draggingHandle = true
  swipedHandle = false
  handleStartY = event.clientY
  sheetOffset.value = 0
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)

  function onMove(moveEvent: PointerEvent) {
    if (!draggingHandle) return
    moveEvent.preventDefault()
    const dy = Math.max(0, moveEvent.clientY - handleStartY)
    if (dy > 10) swipedHandle = true
    sheetOffset.value = dy
  }

  function onUp() {
    const shouldClose = sheetOffset.value > 56
    draggingHandle = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    if (shouldClose) closeDrawer()
    else sheetOffset.value = 0
  }

  window.addEventListener('pointermove', onMove, { passive: false })
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

watch(drawerOpen, (open) => {
  if (open) lockBackgroundScroll()
  else unlockBackgroundScroll()
})

watch(() => route.path, closeDrawer)

onUnmounted(() => {
  if (drawerOpen.value) unlockBackgroundScroll()
})

</script>
