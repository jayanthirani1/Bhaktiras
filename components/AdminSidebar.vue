<template>
  <div class="flex h-full min-h-0 flex-col bg-white">
    <div class="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-4">
      <NuxtLink to="/admin" class="min-w-0" @click="$emit('navigate')">
        <p class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Bhaktiras</p>
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--accent))]">Admin portal</p>
      </NuxtLink>
      <button
        v-if="showClose"
        type="button"
        class="rounded-lg p-2 text-[hsl(var(--muted-foreground))]"
        @click="$emit('close')"
      >
        ✕
      </button>
    </div>

    <nav class="flex-1 space-y-0.5 overflow-y-auto p-3">
      <NuxtLink
        v-for="item in ADMIN_MENU"
        :key="item.to"
        :to="item.to"
        class="block rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="isActive(item.to)
          ? 'bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'
          : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]'"
        @click="$emit('navigate')"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="border-t border-[hsl(var(--border))] p-4">
      <p class="truncate text-sm font-medium text-[hsl(var(--primary))]">{{ adminRecord?.name || 'Admin' }}</p>
      <p class="mb-3 truncate text-xs text-[hsl(var(--muted-foreground))]">{{ adminRecord?.role || 'admin' }}</p>
      <button type="button" class="admin-btn-danger w-full" @click="$emit('logout')">
        Sign out
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_MENU } from '~/data/adminMenu'

defineProps<{ showClose?: boolean }>()
defineEmits<{ navigate: []; close: []; logout: [] }>()

const route = useRoute()
const { adminRecord } = useAdminAccess()

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin' || route.path === '/admin/'
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>
