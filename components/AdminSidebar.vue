<template>
  <div class="flex h-full min-h-0 flex-col bg-white">
    <div class="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-4">
      <NuxtLink to="/admin" class="min-w-0" @click="$emit('navigate')">
        <p class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Bhaktiras</p>
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--golden-900))]">Admin portal</p>
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

    <nav class="flex-1 space-y-4 overflow-y-auto p-3">
      <div class="space-y-0.5">
        <NuxtLink
          v-for="item in ADMIN_MENU_TOP"
          :key="item.to"
          :to="item.to"
          class="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="linkClass(item.to)"
          @click="$emit('navigate')"
        >
          <span class="min-w-0 truncate">{{ item.label }}</span>
          <span
            v-if="item.to === '/admin/bugs' && openBugCount != null && openBugCount > 0"
            class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-amber-800"
            :aria-label="`${openBugCount} open bug${openBugCount === 1 ? '' : 's'}`"
          >
            {{ openBugCount }}
          </span>
        </NuxtLink>
      </div>

      <div v-for="group in ADMIN_MENU_GROUPS" :key="group.id" class="space-y-0.5">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]"
          :aria-expanded="isOpen(group.id)"
          @click="toggleGroup(group.id)"
        >
          <span>{{ group.label }}</span>
          <span class="text-xs font-semibold normal-case tracking-normal tabular-nums opacity-70">
            {{ isOpen(group.id) ? '−' : `+ ${group.items.length}` }}
          </span>
        </button>

        <div v-show="isOpen(group.id)" class="ml-1 space-y-0.5 border-l border-[hsl(var(--border))] pl-2">
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            :class="linkClass(item.to)"
            @click="$emit('navigate')"
          >
            <span class="min-w-0 truncate">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <div class="border-t border-[hsl(var(--border))] p-4">
      <p class="truncate text-sm font-medium text-[hsl(var(--primary))]">{{ adminRecord?.name || 'Admin' }}</p>
      <!-- Every admins document is full access; there is no tier to display. -->
      <p class="mb-3 truncate text-xs text-[hsl(var(--muted-foreground))]">Full access</p>
      <button type="button" class="admin-btn-danger w-full" @click="$emit('logout')">
        Sign out
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { collection, getDocs, query, where, type Firestore } from 'firebase/firestore'
import { ADMIN_MENU_GROUPS, ADMIN_MENU_TOP } from '~/data/adminMenu'

defineProps<{ showClose?: boolean }>()
defineEmits<{ navigate: []; close: []; logout: [] }>()

const route = useRoute()
const { adminRecord } = useAdminAccess()
const openBugCount = useState<number | null>('admin-open-bug-count', () => null)
const openGroups = useState<Record<string, boolean>>('admin-nav-open-groups', () => ({ content: true }))

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin' || route.path === '/admin/'
  return route.path === to
}

function linkClass(to: string) {
  return isActive(to)
    ? 'bg-[hsl(var(--golden-50))] text-[hsl(var(--primary))]'
    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]'
}

function groupContainsActive(groupId: string) {
  const group = ADMIN_MENU_GROUPS.find(g => g.id === groupId)
  return !!group?.items.some(item => isActive(item.to))
}

function isOpen(groupId: string) {
  if (openGroups.value[groupId] != null) return openGroups.value[groupId]
  return groupContainsActive(groupId)
}

function toggleGroup(groupId: string) {
  openGroups.value = {
    ...openGroups.value,
    [groupId]: !isOpen(groupId)
  }
}

function ensureActiveGroupOpen() {
  for (const group of ADMIN_MENU_GROUPS) {
    if (groupContainsActive(group.id)) {
      openGroups.value = { ...openGroups.value, [group.id]: true }
    }
  }
}

async function loadOpenBugCount() {
  try {
    const db = useNuxtApp().$firebaseDb as Firestore | null
    if (!db) return
    const snap = await getDocs(query(collection(db, 'bugReports'), where('status', '==', 'open')))
    openBugCount.value = snap.size
  } catch {
    openBugCount.value = null
  }
}

onMounted(() => {
  ensureActiveGroupOpen()
  void loadOpenBugCount()
})

watch(() => route.path, (path, prev) => {
  ensureActiveGroupOpen()
  if (prev === '/admin/bugs' || path === '/admin/bugs') void loadOpenBugCount()
})
</script>
