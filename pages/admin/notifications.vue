<template>
  <div class="grid gap-5 xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
    <form class="admin-panel space-y-4" @submit.prevent="onSubmit">
      <div>
        <label for="push-title" class="admin-label">Title</label>
        <input
          id="push-title"
          v-model="form.title"
          class="admin-input"
          maxlength="80"
          required
          placeholder="Patotsav update"
          @input="resetConfirm"
        >
      </div>
      <div>
        <label for="push-body" class="admin-label">Message</label>
        <textarea
          id="push-body"
          v-model="form.body"
          class="admin-input min-h-36"
          maxlength="2000"
          required
          placeholder="Write the full notification message…"
          @input="resetConfirm"
        />
        <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          The device shows a short preview. Devotees tap the notification to read the full message.
        </p>
        <p class="mt-1 text-right text-xs text-[hsl(var(--muted-foreground))]">{{ form.body.length }}/2000</p>
      </div>
      <div>
        <label for="push-audience" class="admin-label">Audience</label>
        <select id="push-audience" v-model="form.topic" class="admin-input" @change="resetConfirm">
          <option value="all">All subscribers</option>
          <option value="announcements">Announcements</option>
          <option value="games">Daily games and records</option>
          <option value="niyams">Daily niyam reminder</option>
          <option value="niyam-milestones">Niyam milestones</option>
        </select>
        <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          <span v-if="audienceCount == null">Counting devices…</span>
          <span v-else>Reaches <strong>{{ audienceCount }}</strong> device{{ audienceCount === 1 ? '' : 's' }} right now.</span>
        </p>
      </div>
      <div>
        <label for="push-url" class="admin-label">Button on the message page</label>
        <input
          id="push-url"
          v-model="form.url"
          class="admin-input"
          maxlength="300"
          required
          pattern="/.*"
          placeholder="/events"
          @input="resetConfirm"
        >
        <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          After reading the full message, devotees can tap this link. Use an internal path beginning with /.
        </p>
      </div>

      <label class="flex items-start gap-2 text-sm text-[hsl(var(--foreground))]">
        <input v-model="form.inbox" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-[hsl(var(--border))]">
        <span>
          Keep a copy in the in-app inbox
          <span class="block text-xs text-[hsl(var(--muted-foreground))]">
            Anyone signed in can read it from the bell, even if they never turned notifications on.
          </span>
        </span>
      </label>

      <div>
        <div class="mb-1 flex items-center justify-between gap-2">
          <p class="admin-label mb-0">Preview</p>
          <div class="flex gap-1">
            <button
              v-for="mode in previewModes"
              :key="mode.id"
              type="button"
              class="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
              :class="preview === mode.id
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'"
              @click="preview = mode.id"
            >
              {{ mode.label }}
            </button>
          </div>
        </div>

        <div v-if="preview === 'device'" class="flex gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-3">
          <img src="/notification-icon.png" alt="" class="h-10 w-10 shrink-0 rounded-lg">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
              {{ form.title || 'Notification title' }}
            </p>
            <p class="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
              {{ previewBody }}
            </p>
            <p class="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
              Bhaktiras · tap to read full message
            </p>
          </div>
        </div>

        <!-- Mirrors NotificationInbox so the inbox row can be checked without
             writing a test message into the collection everyone reads. -->
        <div v-else class="rounded-xl border border-[hsl(var(--border))] bg-white p-0">
          <div class="border-b border-[hsl(var(--border))] px-4 py-3">
            <p class="font-display text-sm font-semibold text-[hsl(var(--primary))]">Notifications</p>
          </div>
          <div v-if="form.inbox" class="flex gap-3 px-4 py-3">
            <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--accent))]" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-[hsl(var(--foreground))]">
                {{ form.title || 'Notification title' }}
              </p>
              <p class="mt-0.5 line-clamp-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                {{ previewBody }}
              </p>
              <p class="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">Just now · tap to read full message</p>
            </div>
          </div>
          <p v-else class="px-4 py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
            This message will not be kept in the inbox.
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Push messages cannot be recalled. Send yourself a test first, then check the title, message and audience.
        A test reaches only your own devices, and its inbox copy is private to you — the community's inbox is untouched.
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          class="admin-btn-secondary"
          :disabled="sending || testing || !canSend"
          @click="sendTest"
        >
          {{ testing ? 'Sending test…' : 'Send test to me' }}
        </button>
        <button type="submit" class="admin-btn" :disabled="sending || testing || !canSend">
          <span v-if="sending">Sending…</span>
          <span v-else-if="confirming">Confirm send to {{ audienceCount ?? 'everyone' }}</span>
          <span v-else>Send notification</span>
        </button>
      </div>
      <button
        v-if="confirming && !sending"
        type="button"
        class="w-full text-xs font-semibold text-[hsl(var(--muted-foreground))]"
        @click="resetConfirm"
      >
        Cancel
      </button>

      <p v-if="testResult" class="text-sm text-[hsl(var(--muted-foreground))]">
        Test delivered to {{ testResult.successCount }} of your {{ testResult.recipientCount }} device{{ testResult.recipientCount === 1 ? '' : 's' }}.
        <span v-if="testResult.inbox">Check your own bell to see the inbox row — only you can see it.</span>
      </p>
      <div v-if="result" class="space-y-1">
        <p class="text-sm font-medium" :class="result.failureCount ? 'text-amber-700' : 'text-emerald-700'">
          Sent to {{ result.successCount }} device{{ result.successCount === 1 ? '' : 's' }}.
          <span v-if="result.failureCount">
            {{ result.failureCount }} of {{ result.recipientCount }} failed.
          </span>
        </p>
        <p v-if="staleTokenFailures" class="text-sm text-[hsl(var(--muted-foreground))]">
          Those failures are usually old subscriptions — for example someone deleted the Home Screen app, cleared site data, or turned notifications off. They are removed automatically after a send, so they should not appear on the next one.
        </p>
      </div>
      <p v-if="error" role="alert" class="text-sm text-red-600">{{ error }}</p>
    </form>

    <section class="admin-panel">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-display text-lg font-semibold text-[hsl(var(--primary))]">Recent messages</h2>
        <button type="button" class="text-xs font-semibold text-[hsl(var(--golden-900))]" @click="refresh">Refresh</button>
      </div>
      <p v-if="loading" class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Loading…</p>
      <p v-else-if="!messages.length" class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No notifications sent yet.</p>
      <div v-else class="mt-4 divide-y divide-[hsl(var(--border))]">
        <article v-for="message in messages" :key="message.id" class="py-4 first:pt-0">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold text-[hsl(var(--primary))]">{{ message.title }}</h3>
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
import { notificationPreviewBody } from '~/utils/notificationDetail'

definePageMeta({ layout: 'admin', middleware: 'admin' })

type SendResult = {
  recipientCount: number
  successCount: number
  failureCount: number
  errorCodes?: string[]
  inbox?: boolean
}
type AudienceCounts = { all: number; announcements: number; games: number; niyams: number; 'niyam-milestones': number }
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
  topic: 'all' as keyof AudienceCounts,
  url: '/events',
  inbox: true
})
const sending = ref(false)
const testing = ref(false)
const confirming = ref(false)
const loading = ref(false)
const error = ref('')
const result = ref<SendResult | null>(null)
const testResult = ref<SendResult | null>(null)
const messages = ref<MessageRow[]>([])
const audience = ref<AudienceCounts | null>(null)
const preview = ref<'device' | 'inbox'>('device')
const previewModes = [
  { id: 'device' as const, label: 'On the device' },
  { id: 'inbox' as const, label: 'In the inbox' }
]

const previewBody = computed(() => {
  const text = form.body.trim()
  if (!text) return 'The short preview people see on their device appears here.'
  return notificationPreviewBody(text)
})
const audienceCount = computed(() => audience.value?.[form.topic] ?? null)
const canSend = computed(() => form.title.trim().length >= 3
  && form.body.trim().length >= 3
  && form.url.startsWith('/'))
const staleTokenFailures = computed(() => {
  const codes = result.value?.errorCodes || []
  return codes.some(code =>
    code === 'messaging/registration-token-not-registered'
    || code === 'messaging/invalid-registration-token'
  )
})

// Automatic niyam topics are nudges, not announcements worth keeping.
watch(() => form.topic, (topic) => {
  form.inbox = topic !== 'games' && topic !== 'niyams' && topic !== 'niyam-milestones'
})

function callable<Result>(name: string) {
  return httpsCallable<Record<string, unknown>, Result>(
    getFunctions(getApp(), 'europe-west2'),
    name
  )
}

function resetConfirm() {
  confirming.value = false
}

/** A send cannot be recalled, so the first click only arms the button. */
function onSubmit() {
  if (!confirming.value) {
    error.value = ''
    result.value = null
    confirming.value = true
    return
  }
  void send()
}

async function send() {
  sending.value = true
  error.value = ''
  result.value = null
  testResult.value = null
  try {
    const response = await callable<SendResult>('sendPushNotification')({ ...form })
    result.value = response.data
    confirming.value = false
    form.title = ''
    form.body = ''
    await refresh()
  } catch (value) {
    error.value = (value as { message?: string })?.message || 'Could not send notification.'
  } finally {
    sending.value = false
  }
}

async function sendTest() {
  testing.value = true
  error.value = ''
  testResult.value = null
  try {
    const response = await callable<SendResult>('sendTestPushNotification')({ ...form })
    testResult.value = response.data
  } catch (value) {
    error.value = (value as { message?: string })?.message || 'Could not send the test notification.'
  } finally {
    testing.value = false
  }
}

async function loadAudience() {
  try {
    const response = await callable<AudienceCounts>('getPushAudience')({})
    audience.value = response.data
  } catch {
    audience.value = null
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

async function refresh() {
  await Promise.all([loadMessages(), loadAudience()])
}

function formatDate(value?: Timestamp | Date) {
  if (!value) return 'Just now'
  const date = value instanceof Date ? value : value.toDate()
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

onMounted(refresh)
useHead({ title: 'Push notifications · Admin' })
</script>
