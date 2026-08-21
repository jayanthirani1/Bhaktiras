<template>
  <div v-if="isLoggedIn" ref="root" class="relative">
    <button
      type="button"
      class="relative grid h-9 w-9 place-items-center rounded-full text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]"
      :class="open ? 'bg-[hsl(var(--muted))] text-[hsl(var(--primary))]' : ''"
      :aria-label="unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="toggle"
    >
      <IconBell class="h-5 w-5" aria-hidden="true" />
      <span
        v-if="unreadCount"
        class="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(var(--accent))] px-1 text-[10px] font-bold leading-none text-white"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-[70] mt-2 max-h-[70vh] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_22px_60px_-20px_rgba(56,32,97,0.45)]"
      role="dialog"
      aria-label="Notifications"
    >
      <div class="sticky top-0 flex items-center justify-between gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
        <h2 class="font-display text-sm font-semibold text-[hsl(var(--primary))]">Notifications</h2>
        <button
          v-if="unreadCount"
          type="button"
          class="text-xs font-semibold text-[hsl(var(--accent))]"
          @click="markAllRead"
        >
          Mark all read
        </button>
      </div>

      <p v-if="loading && !messages.length" class="px-4 py-6 text-sm text-[hsl(var(--muted-foreground))]">
        Loading…
      </p>
      <p v-else-if="error" role="alert" class="px-4 py-6 text-sm text-red-600">{{ error }}</p>
      <div v-else-if="!messages.length" class="px-4 py-8 text-center">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">No announcements yet.</p>
        <NuxtLink
          v-if="!push.enabled.value"
          to="/account"
          class="mt-2 inline-block text-xs font-semibold text-[hsl(var(--accent))]"
          @click="open = false"
        >
          Turn on notifications
        </NuxtLink>
      </div>
      <ul v-else class="divide-y divide-[hsl(var(--border))]">
        <li v-for="message in messages" :key="message.id">
          <NuxtLink
            :to="message.url"
            class="flex gap-3 px-4 py-3 transition-colors hover:bg-[hsl(var(--muted))]"
            @click="openMessage"
          >
            <span
              class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              :class="isUnread(message) ? 'bg-[hsl(var(--accent))]' : 'bg-transparent'"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="min-w-0 flex-1 text-sm font-semibold text-[hsl(var(--foreground))]">{{ message.title }}</span>
                <span
                  v-if="message.test"
                  class="shrink-0 rounded-full bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
                >Test</span>
              </span>
              <span class="mt-0.5 block text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{{ message.body }}</span>
              <span class="mt-1 block text-[11px] text-[hsl(var(--muted-foreground))]">{{ relativeTime(message.createdAt) }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconBell } from '@tabler/icons-vue'
import type { InboxMessage } from '~/composables/useNotificationInbox'

const { isLoggedIn } = useAuth()
const push = usePushNotifications()
const {
  messages,
  loading,
  error,
  unreadCount,
  restoreLastRead,
  load,
  markAllRead,
  isUnread
} = useNotificationInbox()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
  if (open.value) void load(true)
}

function openMessage() {
  markAllRead()
  open.value = false
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
  if (event.key === 'Escape') open.value = false
}

function onPointerDown(event: PointerEvent) {
  if (!open.value) return
  if (!root.value?.contains(event.target as Node)) open.value = false
}

onMounted(() => {
  restoreLastRead()
  void load()
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointerdown', onPointerDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointerdown', onPointerDown)
})

// A message that arrives while the app is open should light the bell up too.
watch(() => push.lastReceivedAt.value, () => { void load(true) })
watch(() => isLoggedIn.value, (value) => {
  if (value) void load(true)
  else open.value = false
})
</script>
