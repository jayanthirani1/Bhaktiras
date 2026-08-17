<template>
  <div class="grid gap-5 xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
    <form class="admin-panel space-y-4" @submit.prevent="send">
      <div>
        <label for="push-title" class="admin-label">Title</label>
        <input
          id="push-title"
          v-model="form.title"
          class="admin-input"
          maxlength="80"
          required
          placeholder="Patotsav update"
        >
      </div>
      <div>
        <label for="push-body" class="admin-label">Message</label>
        <textarea
          id="push-body"
          v-model="form.body"
          class="admin-input min-h-28"
          maxlength="240"
          required
          placeholder="Write the notification people will receive…"
        />
        <p class="mt-1 text-right text-xs text-[hsl(var(--muted-foreground))]">{{ form.body.length }}/240</p>
      </div>
      <div>
        <label for="push-audience" class="admin-label">Audience</label>
        <select id="push-audience" v-model="form.topic" class="admin-input">
          <option value="all">All subscribers</option>
          <option value="announcements">Announcements</option>
          <option value="games">Daily game reminders</option>
        </select>
      </div>
      <div>
        <label for="push-url" class="admin-label">Open page</label>
        <input
          id="push-url"
          v-model="form.url"
          class="admin-input"
          maxlength="300"
          required
          pattern="/.*"
          placeholder="/events"
        >
        <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Use an internal path beginning with /.</p>
      </div>

      <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Push messages cannot be recalled. Check the title, message and audience before sending.
      </div>
      <button type="submit" class="admin-btn w-full" :disabled="sending">
        {{ sending ? 'Sending…' : 'Send notification' }}
      </button>
      <p v-if="result" class="text-sm font-medium" :class="result.failureCount ? 'text-amber-700' : 'text-emerald-700'">
        Sent to {{ result.successCount }} device{{ result.successCount === 1 ? '' : 's' }}.
        <span v-if="result.failureCount">
          {{ result.failureCount }} of {{ result.recipientCount }} failed<span v-if="result.errorCodes?.length">: {{ result.errorCodes.join(', ') }}</span>.
        </span>
      </p>
      <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
    </form>

    <section class="admin-panel">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Recent messages</h2>
        <button type="button" class="text-xs font-semibold text-[hsl(var(--accent))]" @click="loadMessages">Refresh</button>
      </div>
      <p v-if="loading" class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      <p v-else-if="!messages.length" class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No notifications sent yet.</p>
      <div v-else class="mt-4 divide-y divide-[hsl(var(--border))]">
        <article v-for="message in messages" :key="message.id" class="py-4 first:pt-0">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold text-[hsl(var(--foreground))]">{{ message.title }}</h3>
              <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{{ message.body }}</p>
            </div>
            <span class="rounded-full bg-[hsl(var(--muted))] px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
              {{ message.topic }}
            </span>
          </div>
          <p class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            {{ message.successCount || 0 }} delivered · {{ formatDate(message.createdAt) }}
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getApp } from 'firebase/app'
import { getFunctions, httpsCallable } from 'firebase/functions'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type Firestore,
  type Timestamp
} from 'firebase/firestore'

definePageMeta({ layout: 'admin', middleware: 'admin' })

type SendResult = {
  recipientCount: number
  successCount: number
  failureCount: number
  errorCodes?: string[]
}
type MessageRow = {
  id: string
  title: string
  body: string
  topic: string
  successCount?: number
  createdAt?: Timestamp | Date
}

const form = reactive({
  title: '',
  body: '',
  topic: 'all',
  url: '/events'
})
const sending = ref(false)
const loading = ref(false)
const error = ref('')
const result = ref<SendResult | null>(null)
const messages = ref<MessageRow[]>([])

async function send() {
  sending.value = true
  error.value = ''
  result.value = null
  try {
    const functions = getFunctions(getApp(), 'europe-west2')
    const call = httpsCallable<typeof form, SendResult>(functions, 'sendPushNotification')
    const response = await call({ ...form })
    result.value = response.data
    form.title = ''
    form.body = ''
    await loadMessages()
  } catch (value) {
    error.value = (value as { message?: string })?.message || 'Could not send notification.'
  } finally {
    sending.value = false
  }
}

async function loadMessages() {
  loading.value = true
  try {
    const db = useNuxtApp().$firebaseDb as Firestore | null
    if (!db) return
    const snap = await getDocs(query(
      collection(db, 'pushMessages'),
      orderBy('createdAt', 'desc'),
      limit(20)
    ))
    messages.value = snap.docs.map(item => ({ id: item.id, ...item.data() } as MessageRow))
  } catch {
    messages.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(value?: Timestamp | Date) {
  if (!value) return 'Just now'
  const date = value instanceof Date ? value : value.toDate()
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

onMounted(loadMessages)
useHead({ title: 'Push notifications · Admin' })
</script>
