<template>
  <div v-if="isLoggedIn" ref="root" class="relative">
    <button
      type="button"
      class="relative grid h-11 w-11 place-items-center rounded-full text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]"
      :class="open ? 'bg-[hsl(var(--muted))] text-[hsl(var(--primary))]' : ''"
      :aria-label="unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="toggle"
    >
      <IconBell class="h-5 w-5" aria-hidden="true" />
      <span
        v-if="unreadCount"
        class="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(var(--accent))] px-1 text-[10px] font-bold leading-none text-white"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- A dropdown pinned under the bell is unusable on a phone, so on narrow
         screens this becomes a bottom sheet, teleported out of the navigation's
         stacking context so it sits above the fixed bottom bar. -->
    <Teleport to="body" :disabled="!isMobile">
      <div v-if="open">
        <div
          v-if="isMobile"
          class="fixed inset-0 z-[80] bg-black/30"
          @click="close"
        />
        <div
          class="flex flex-col overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_22px_60px_-20px_rgba(56,32,97,0.45)]"
          :class="isMobile
            ? 'fixed inset-x-0 bottom-0 z-[81] max-h-[80vh] rounded-t-[28px] border-t pb-[env(safe-area-inset-bottom)]'
            : 'absolute right-0 z-[70] mt-2 max-h-[70vh] w-[22rem] rounded-2xl border'"
          role="dialog"
          aria-label="Notifications"
        >
          <button
            v-if="isMobile"
            type="button"
            class="flex w-full flex-col items-center py-3"
            aria-label="Close notifications"
            @click="close"
          >
            <span class="h-1.5 w-12 rounded-full bg-[hsl(var(--border))]" />
          </button>

          <div class="flex shrink-0 items-center justify-between gap-3 border-b border-[hsl(var(--border))] px-4 py-3">
            <h2 class="font-display text-sm font-semibold text-[hsl(var(--primary))]">Notifications</h2>
            <button
              v-if="messages.length"
              type="button"
              class="text-xs font-semibold text-[hsl(var(--accent))]"
              @click="dismissAll"
            >
              Clear all
            </button>
          </div>

          <p aria-live="polite" class="sr-only">{{ liveMessage }}</p>

          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div v-if="loading && !messages.length" class="divide-y divide-[hsl(var(--border))]">
              <div v-for="n in 3" :key="n" class="animate-pulse px-4 py-3">
                <div class="h-3 w-1/2 rounded bg-[hsl(var(--muted))]" />
                <div class="mt-2 h-3 w-4/5 rounded bg-[hsl(var(--muted))]" />
                <div class="mt-2 h-2 w-16 rounded bg-[hsl(var(--muted))]" />
              </div>
            </div>

            <div v-else-if="error" class="px-4 py-8 text-center">
              <p role="alert" class="text-sm text-red-600">{{ error }}</p>
              <button type="button" class="mt-2 text-xs font-semibold text-[hsl(var(--accent))]" @click="load(true)">
                Try again
              </button>
            </div>

            <div v-else-if="!messages.length" class="px-4 py-10 text-center">
              <div class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[hsl(var(--golden-100))] text-[hsl(var(--primary))]">
                <IconBell class="h-5 w-5" aria-hidden="true" />
              </div>
              <p class="mt-3 text-sm font-medium text-[hsl(var(--foreground))]">You're all caught up</p>
              <NuxtLink
                v-if="!push.enabled.value"
                to="/account"
                class="mt-1 inline-block text-xs font-semibold text-[hsl(var(--accent))]"
                @click="close"
              >
                Turn on notifications
              </NuxtLink>
            </div>

            <template v-else>
              <section v-for="group in groups" :key="group.label">
                <h3 class="sticky top-0 z-10 bg-[hsl(var(--card))] px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  {{ group.label }}
                </h3>
                <ul class="divide-y divide-[hsl(var(--border))]">
                  <li v-for="message in group.items" :key="message.id" class="relative overflow-hidden">
                    <div class="absolute inset-0 flex items-center justify-between bg-[hsl(var(--muted))] px-5 text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                      <span>Dismiss</span>
                      <span>Dismiss</span>
                    </div>
                    <div
                      class="group relative flex bg-[hsl(var(--card))]"
                      style="touch-action: pan-y"
                      :style="rowStyle(message.id)"
                      @pointerdown="onPointerDown($event, message.id)"
                    >
                      <NuxtLink
                        :to="message.url"
                        class="flex min-w-0 flex-1 gap-3 px-4 py-3 transition-colors hover:bg-[hsl(var(--muted))]"
                        @click="onRowClick"
                      >
                        <span
                          class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                          :class="isUnread(message) ? 'bg-[hsl(var(--accent))]' : 'bg-transparent'"
                          aria-hidden="true"
                        />
                        <span class="min-w-0 flex-1">
                          <span class="flex items-center gap-2">
                            <span class="min-w-0 flex-1 truncate text-sm font-semibold text-[hsl(var(--foreground))]">{{ message.title }}</span>
                            <span
                              v-if="message.test"
                              class="shrink-0 rounded-full bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
                            >Test</span>
                          </span>
                          <span class="mt-0.5 line-clamp-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{{ message.body }}</span>
                          <span class="mt-1 block text-[11px] text-[hsl(var(--muted-foreground))]">{{ relativeTime(message.createdAt) }}</span>
                        </span>
                      </NuxtLink>
                      <!-- Swipe is invisible and unreachable by keyboard, so the
                           same action is always available as a real button. -->
                      <button
                        type="button"
                        class="grid w-11 shrink-0 place-items-center text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity hover:text-[hsl(var(--primary))] focus-visible:opacity-100 group-hover:opacity-100 md:w-9"
                        :aria-label="`Dismiss ${message.title}`"
                        @click="onDismiss(message)"
                      >
                        <IconX class="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                </ul>
              </section>
            </template>
          </div>

          <div
            v-if="undoQueue.length"
            class="flex shrink-0 items-center justify-between gap-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5"
          >
            <span class="min-w-0 truncate text-xs text-[hsl(var(--muted-foreground))]">
              Dismissed {{ undoQueue.length }} notification{{ undoQueue.length === 1 ? '' : 's' }}
            </span>
            <button type="button" class="shrink-0 text-xs font-bold uppercase tracking-wide text-[hsl(var(--accent))]" @click="undo">
              Undo
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { IconBell, IconX } from '@tabler/icons-vue'
import type { InboxMessage } from '~/composables/useNotificationInbox'

const { isLoggedIn } = useAuth()
const push = usePushNotifications()
const {
  messages,
  groups,
  loading,
  error,
  unreadCount,
  load,
  markAllRead,
  clearViewedUnread,
  dismiss,
  restore,
  isUnread
} = useNotificationInbox()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const isMobile = ref(false)
const undoQueue = ref<string[]>([])
const liveMessage = ref('')

/** Past this, releasing the row dismisses it rather than springing back. */
const SWIPE_COMMIT_PX = 96
const UNDO_TIMEOUT_MS = 6000

const swipeId = ref<string | null>(null)
const swipeDx = ref(0)
const settling = ref(false)

function rowStyle(id: string) {
  if (swipeId.value !== id || !swipeDx.value) return undefined
  return {
    transform: `translateX(${swipeDx.value}px)`,
    transition: settling.value ? 'transform 180ms ease-out' : 'none',
    touchAction: 'pan-y'
  }
}

// 3. Read state is taken after the refresh lands, so anything that arrived
// while the panel was shut still shows its dot for this viewing.
async function toggle() {
  open.value = !open.value
  if (!open.value) {
    close()
    return
  }
  await load(true)
  // Opening is the read signal; the dots survive this viewing on purpose.
  markAllRead()
}

function close() {
  open.value = false
  clearViewedUnread()
  flushUndo()
}

let undoTimer: ReturnType<typeof setTimeout> | null = null

function queueUndo(id: string) {
  undoQueue.value = [...undoQueue.value, id]
  if (undoTimer) clearTimeout(undoTimer)
  undoTimer = setTimeout(flushUndo, UNDO_TIMEOUT_MS)
}

function flushUndo() {
  if (undoTimer) clearTimeout(undoTimer)
  undoTimer = null
  undoQueue.value = []
}

function undo() {
  undoQueue.value.forEach(restore)
  liveMessage.value = 'Notifications restored'
  flushUndo()
}

function onDismiss(message: InboxMessage) {
  dismiss(message.id)
  liveMessage.value = `Dismissed ${message.title}`
  queueUndo(message.id)
}

function dismissAll() {
  const ids = messages.value.map(item => item.id)
  ids.forEach(dismiss)
  liveMessage.value = `Dismissed ${ids.length} notifications`
  ids.forEach(queueUndo)
}

let swipeStartX = 0
let swipeStartY = 0
let axis: 'none' | 'x' | 'y' = 'none'
let swiped = false

function onPointerDown(event: PointerEvent, id: string) {
  if (event.button != null && event.button !== 0) return
  swipeStartX = event.clientX
  swipeStartY = event.clientY
  axis = 'none'
  swiped = false
  settling.value = false
  swipeId.value = id
  swipeDx.value = 0
  const target = event.currentTarget as HTMLElement

  function onMove(move: PointerEvent) {
    const dx = move.clientX - swipeStartX
    const dy = move.clientY - swipeStartY
    if (axis === 'none') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      // Vertical wins ties so the list still scrolls normally under a thumb.
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axis === 'x') target.setPointerCapture?.(move.pointerId)
    }
    if (axis !== 'x') return
    swiped = true
    swipeDx.value = dx
  }

  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    if (axis !== 'x') {
      swipeId.value = null
      return
    }
    const committed = Math.abs(swipeDx.value) > SWIPE_COMMIT_PX
    settling.value = true
    if (committed) {
      const message = messages.value.find(item => item.id === id)
      swipeDx.value = swipeDx.value > 0 ? 400 : -400
      setTimeout(() => {
        if (message) onDismiss(message)
        swipeId.value = null
        swipeDx.value = 0
      }, 160)
      return
    }
    swipeDx.value = 0
    setTimeout(() => { swipeId.value = null }, 180)
  }

  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

/** A swipe must never also count as a tap on the row's link. */
function onRowClick(event: MouseEvent) {
  if (swiped) {
    event.preventDefault()
    event.stopPropagation()
    swiped = false
    return
  }
  close()
}

function relativeTime(value: InboxMessage['createdAt']) {
  if (!value) return 'Just now'
  const elapsed = Date.now() - value.getTime()
  if (elapsed < 60_000) return 'Just now'
  if (elapsed >= 604_800_000) {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(value)
  }
  const [unit, ms]: [Intl.RelativeTimeFormatUnit, number] = elapsed < 3_600_000
    ? ['minute', 60_000]
    : elapsed < 86_400_000
      ? ['hour', 3_600_000]
      : ['day', 86_400_000]
  return new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })
    .format(-Math.round(elapsed / ms), unit)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close()
}

function onPointerDownOutside(event: PointerEvent) {
  if (!open.value || isMobile.value) return
  if (!root.value?.contains(event.target as Node)) close()
}

let media: MediaQueryList | null = null
function onMediaChange(event: MediaQueryListEvent | MediaQueryList) {
  isMobile.value = event.matches
}

// The sheet owns the screen on mobile, so the page behind it must not scroll.
watch([open, isMobile], ([isOpen, mobile]) => {
  if (import.meta.server) return
  document.body.style.overflow = isOpen && mobile ? 'hidden' : ''
})

watch(unreadCount, (count, previous) => {
  if (count > previous) liveMessage.value = `${count} unread notification${count === 1 ? '' : 's'}`
})

onMounted(() => {
  media = window.matchMedia('(max-width: 767px)')
  onMediaChange(media)
  media.addEventListener('change', onMediaChange)
  void load()
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointerdown', onPointerDownOutside)
})

onUnmounted(() => {
  media?.removeEventListener('change', onMediaChange)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointerdown', onPointerDownOutside)
  if (import.meta.client) document.body.style.overflow = ''
  flushUndo()
})

// A message that arrives while the app is open should light the bell up too.
watch(() => push.lastReceivedAt.value, () => { void load(true) })
watch(() => isLoggedIn.value, (value) => {
  if (value) void load(true)
  else close()
})
</script>
