<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex gap-2">
        <button
          v-for="option in filters"
          :key="option.value"
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-semibold"
          :class="filter === option.value ? 'bg-[hsl(var(--primary))] text-white' : 'bg-white text-[hsl(var(--muted-foreground))]'"
          @click="filter = option.value"
        >
          {{ option.label }} ({{ count(option.value) }})
        </button>
      </div>
      <button type="button" class="admin-btn-secondary" :disabled="loading" @click="fetchAll">
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="error" class="mb-3 text-sm text-red-600">{{ error }}</p>
    <div v-if="loading" class="admin-panel text-sm text-[hsl(var(--muted-foreground))]">Loading bug reports…</div>
    <div v-else-if="!visible.length" class="admin-panel text-sm text-[hsl(var(--muted-foreground))]">
      No {{ filter === 'all' ? '' : filter }} bug reports.
    </div>

    <div v-else class="space-y-3">
      <article v-for="bug in visible" :key="bug.id" class="admin-panel">
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                :class="statusClass(bug.status)"
              >
                {{ bug.status }}
              </span>
              <time class="text-xs text-[hsl(var(--muted-foreground))]">{{ formatDate(bug.createdAt) }}</time>
            </div>
            <h2 class="mt-2 font-display text-lg font-semibold text-[hsl(var(--primary))]">{{ bug.title }}</h2>
            <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{{ bug.description }}</p>
            <div class="mt-3 space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
              <p v-if="bug.pageUrl">
                Page:
                <a
                  v-if="safePageUrl(bug.pageUrl)"
                  :href="safePageUrl(bug.pageUrl)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium text-[hsl(var(--primary))] underline"
                >
                  {{ bug.pageUrl }}
                </a>
                <!-- Not a link when the scheme is not http(s): a bug report is
                     unauthenticated, so this value is attacker-controlled. -->
                <span v-else class="break-all font-medium">{{ bug.pageUrl }}</span>
              </p>
              <p v-if="bug.contactEmail">
                Contact:
                <a :href="`mailto:${bug.contactEmail}`" class="font-medium text-[hsl(var(--primary))] underline">{{ bug.contactEmail }}</a>
              </p>
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap gap-2">
            <button
              v-if="bug.status === 'open'"
              type="button"
              class="admin-btn"
              :disabled="saving"
              @click="setStatus(bug, 'resolved')"
            >
              ✓ Resolve
            </button>
            <button
              v-if="bug.status !== 'closed'"
              type="button"
              class="admin-btn-secondary"
              :disabled="saving"
              @click="setStatus(bug, 'closed')"
            >
              Close
            </button>
            <button
              v-else
              type="button"
              class="admin-btn-secondary"
              :disabled="saving"
              @click="setStatus(bug, 'open')"
            >
              Reopen
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { serverTimestamp } from 'firebase/firestore'
import type { BugReport, BugReportStatus } from '~/types'

definePageMeta({ layout: 'admin', middleware: 'admin' })

/**
 * Bug reports can be filed without signing in, so `pageUrl` is attacker
 * controlled. Vue does not sanitise `:href`, and `target="_blank"` does not
 * stop a `javascript:` URL — it runs in this document, which is an
 * authenticated admin session. Anything that is not plain http(s) is rendered
 * as text instead of a link.
 */
function safePageUrl(value: string | null | undefined): string | undefined {
  const url = String(value || '').trim()
  return /^https?:\/\//i.test(url) ? url : undefined
}

const { items, loading, saving, error, fetchAll, updateItem } = useAdminCollection<BugReport>('bugReports')
const filter = ref<'all' | BugReportStatus>('open')
const filters = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' }
] as const

const sorted = computed(() => [...items.value].sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt)))
const visible = computed(() => filter.value === 'all' ? sorted.value : sorted.value.filter(b => b.status === filter.value))

function count(status: 'all' | BugReportStatus) {
  return status === 'all' ? items.value.length : items.value.filter(b => b.status === status).length
}

function timestamp(value: BugReport['createdAt']) {
  if (value instanceof Date) return value.getTime()
  return Number(value?.seconds || 0) * 1000
}

function formatDate(value: BugReport['createdAt']) {
  const time = timestamp(value)
  if (!time) return 'Just now'
  return new Date(time).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

function statusClass(status: BugReportStatus) {
  if (status === 'resolved') return 'bg-emerald-100 text-emerald-700'
  if (status === 'closed') return 'bg-slate-200 text-slate-700'
  return 'bg-amber-100 text-amber-800'
}

async function setStatus(bug: BugReport, status: BugReportStatus) {
  const payload: Record<string, unknown> = { status }
  if (status === 'resolved') payload.resolvedAt = serverTimestamp()
  if (status === 'closed') payload.closedAt = serverTimestamp()
  if (status === 'open') {
    payload.resolvedAt = null
    payload.closedAt = null
  }
  await updateItem(bug.id, payload)
}

onMounted(fetchAll)
useHead({ title: 'Bug reports · Admin' })
</script>
