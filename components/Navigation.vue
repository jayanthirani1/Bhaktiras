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

    <!-- Mobile bottom nav. Tab row stays a full 4rem; home-indicator inset is
         extra padding under it so icons are not crushed into the top of h-16. -->
    <div
      v-if="!isGamePage"
      class="fixed bottom-0 left-0 right-0 z-50 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:hidden"
    >
      <div class="flex h-16 items-center px-2">
        <template v-if="!navReady">
          <div
            v-for="i in 5"
            :key="i"
            class="flex min-w-0 flex-1 flex-col items-center justify-center space-y-1 p-2"
          >
            <span class="h-5 w-5 animate-pulse rounded-md bg-[hsl(var(--muted))]" />
            <span class="h-2 w-10 animate-pulse rounded bg-[hsl(var(--muted))]" />
          </div>
        </template>
        <template v-else>
        <NuxtLink
          v-for="item in mobilePrimaryItems"
          :key="item.href"
          :to="item.href"
          :target="item.external ? '_blank' : undefined"
          :rel="item.external ? 'noopener noreferrer' : undefined"
          class="flex min-w-0 flex-1 flex-col items-center justify-center space-y-0.5 rounded-xl p-2 transition-colors"
          :class="isActive(item.href) ? 'text-[#D9AE30]' : 'text-[hsl(var(--muted-foreground))] hover:text-[#D9AE30] active:text-[#D9AE30]'"
          @click="closeDrawer"
        >
          <component :is="item.icon" class="h-5 w-5 shrink-0" />
          <span class="truncate text-[10px] font-medium">{{ item.label }}</span>
        </NuxtLink>
        <button
          type="button"
          class="flex min-w-0 flex-1 flex-col items-center justify-center space-y-0.5 rounded-xl p-2 transition-colors"
          :class="drawerOpen || drawerHoldsRoute ? 'text-[#D9AE30]' : 'text-[hsl(var(--muted-foreground))] hover:text-[#D9AE30] active:text-[#D9AE30]'"
          aria-label="Open more navigation"
          :aria-expanded="drawerOpen"
          @click="drawerOpen = !drawerOpen"
        >
          <IconLayoutGrid class="h-5 w-5 shrink-0" />
          <span class="truncate text-[10px] font-medium">More</span>
        </button>
        </template>
      </div>
    </div>

    <div
      v-if="drawerOpen && !isGamePage"
      class="fixed inset-0 z-[75] overflow-hidden overscroll-none touch-none md:hidden"
      @touchmove.prevent
      @wheel.prevent
    >
      <div class="absolute inset-0 bg-black/30" @click="closeDrawer" />
      <div
        class="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-[hsl(var(--golden-200))] border-b-0 bg-white px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1 shadow-2xl"
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
          <span class="h-1.5 w-12 rounded-full bg-[#D9AE30]" />
        </button>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">More</h2>
          <button
            type="button"
            class="rounded-full p-2 text-[#D9AE30] transition-colors hover:bg-[hsl(var(--golden-50))]"
            aria-label="Close menu"
            @pointerdown.stop
            @click.stop="closeDrawer"
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
            class="flex items-center gap-3 rounded-2xl border border-[hsl(var(--golden-200))] bg-white px-4 py-3 text-[hsl(var(--primary))] transition-colors hover:border-[#D9AE30] hover:bg-[hsl(var(--golden-50))]"
            :class="isActive(item.href) ? 'border-[#D9AE30] bg-[hsl(var(--golden-50))]' : ''"
            @click="closeDrawer"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0 text-[hsl(var(--primary))]" />
            <span class="min-w-0 text-sm font-medium">{{ item.label }}</span>
          </NuxtLink>
          <NuxtLink
            :to="accountItem.href"
            class="flex items-center gap-3 rounded-2xl border border-[hsl(var(--golden-200))] bg-white px-4 py-3 text-[hsl(var(--primary))] transition-colors hover:border-[#D9AE30] hover:bg-[hsl(var(--golden-50))]"
            :class="isActive(accountItem.href) ? 'border-[#D9AE30] bg-[hsl(var(--golden-50))]' : ''"
            @click="closeDrawer"
          >
            <component :is="accountItem.icon" class="h-5 w-5 shrink-0 text-[hsl(var(--primary))]" />
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
          <template v-if="!navReady">
            <span
              v-for="i in 6"
              :key="i"
              class="h-9 w-16 animate-pulse rounded-full bg-[hsl(var(--muted))]"
            />
          </template>
          <template v-else>
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
          </template>
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
const { navItems: managedNavItems, ready: navReady } = useSiteContent()
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

/**
 * True on a page that lives in the More sheet rather than on the tab bar.
 *
 * Without it the bar had no active tab at all on Community, Seva, Journey,
 * Yajman or Account — More only lit up while the sheet was open, so four of the
 * nav destinations left every tab dark and no indication of where you were.
 * `/account` and `/login` are checked by path rather than through `accountItem`
 * so the highlight does not depend on auth state the server cannot know.
 */
const drawerHoldsRoute = computed(() =>
  mobileSecondaryItems.value.some(item => !item.external && isActive(item.href))
  || isActive('/account')
  || isActive('/login'))

function isActive(href: string) {
  if (/^https?:\/\//.test(href)) return false
  if (href === '/') return route.path === '/'
  return route.path.startsWith(href)
}

/** Closes with no tap shield — for closes no finger caused (a resize, unmount). */
function resetDrawer() {
  drawerOpen.value = false
  sheetOffset.value = 0
}

function closeDrawer() {
  const wasOpen = drawerOpen.value
  resetDrawer()
  // Closing under a tap must not reopen More via the tab underneath. Only a
  // close a tap actually caused needs that: this also runs on every route
  // change, and shielding those left ~400ms of dead screen after each
  // navigation, swallowing the next tap anywhere on the page.
  if (!wasOpen || import.meta.server || typeof document === 'undefined') return
  const shield = document.createElement('div')
  shield.setAttribute('aria-hidden', 'true')
  shield.style.cssText = 'position:fixed;inset:0;z-index:10000;touch-action:none;'
  document.body.appendChild(shield)
  const remove = () => shield.remove()
  shield.addEventListener('pointerup', remove, { once: true })
  shield.addEventListener('click', remove, { once: true })
  window.setTimeout(remove, 400)
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

/**
 * The sheet is `md:hidden`, so past the breakpoint it vanishes while
 * `drawerOpen` stays true — and with it the background scroll lock, on a page
 * that now has no More button to close it. A rotation to landscape on a tablet
 * left the site frozen with nothing on screen to explain it.
 */
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'
let desktopMedia: MediaQueryList | null = null

function onDesktopBreakpoint(event: MediaQueryListEvent) {
  if (event.matches) resetDrawer()
}

onMounted(() => {
  desktopMedia = window.matchMedia(DESKTOP_MEDIA_QUERY)
  desktopMedia.addEventListener('change', onDesktopBreakpoint)
})

watch(drawerOpen, (open) => {
  if (open) lockBackgroundScroll()
  else unlockBackgroundScroll()
})

watch(() => route.path, closeDrawer)

onUnmounted(() => {
  desktopMedia?.removeEventListener('change', onDesktopBreakpoint)
  if (drawerOpen.value) unlockBackgroundScroll()
})

</script>
