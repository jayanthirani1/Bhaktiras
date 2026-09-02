<template>
  <div class="min-h-screen bg-[hsl(var(--background))] px-4 pb-mobile-nav pt-8 md:pb-10 md:pt-12">
    <div class="mx-auto max-w-2xl">
      <button
        type="button"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        @click="goBack"
      >
        ← Back
      </button>

      <div v-if="authLoading || loading" class="card-surface p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Loading…
      </div>

      <div v-else-if="!isLoggedIn" class="card-surface p-8 text-center">
        <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Sign in to read this message</h1>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Notifications are saved for signed-in devotees.
        </p>
        <NuxtLink
          :to="loginPath"
          class="mt-5 inline-flex rounded-full bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </NuxtLink>
      </div>

      <div v-else-if="error" class="card-surface p-8 text-center text-sm text-red-600">
        {{ error }}
      </div>

      <div v-else-if="notFound" class="card-surface p-8 text-center">
        <h1 class="font-display text-2xl font-semibold text-[hsl(var(--primary))]">Message not found</h1>
        <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          This notification may have expired or is no longer available.
        </p>
      </div>

      <article v-else-if="message" class="card-surface overflow-hidden">
        <div class="border-b border-[hsl(var(--border))] px-5 py-4 sm:px-6">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-[hsl(var(--golden-100))] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--golden-900))]">
              {{ topicLabel(message.topic) }}
            </span>
            <span
              v-if="message.test"
              class="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
            >
              Test
            </span>
          </div>
          <h1 class="mt-3 font-display text-2xl font-semibold leading-tight text-[hsl(var(--primary))] sm:text-3xl">
            {{ message.title }}
          </h1>
          <p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {{ formattedDate }}
          </p>
        </div>

        <div class="px-5 py-6 sm:px-6">
          <p class="whitespace-pre-wrap text-base leading-relaxed text-[hsl(var(--foreground))]">
            {{ message.body }}
          </p>

          <NuxtLink
            v-if="linkUrl"
            :to="linkUrl"
            class="mt-6 inline-flex rounded-full bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {{ linkLabel }}
          </NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, getDoc, type Firestore, type Timestamp } from 'firebase/firestore'
import { notificationLinkUrl } from '~/utils/notificationDetail'

definePageMeta({ ssr: false })

type NotificationRecord = {
  title: string
  body: string
  topic: string
  url?: string
  linkUrl?: string
  test?: boolean
  createdAt: Date | null
}

const route = useRoute()
const router = useRouter()
const { isLoggedIn, loading: authLoading, user } = useAuth()

const id = computed(() => String(route.params.id || '').trim())
const isTest = computed(() => route.query.test === '1')

const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const message = ref<NotificationRecord | null>(null)

const linkUrl = computed(() => message.value ? notificationLinkUrl(message.value) : null)

const linkLabel = computed(() => {
  const path = linkUrl.value || '/'
  if (path.startsWith('/events')) return 'View events'
  if (path.startsWith('/niyams')) return 'Open niyams'
  if (path.startsWith('/play')) return 'Open games'
  if (path.startsWith('/documents')) return 'Open reading'
  return 'Continue'
})

const formattedDate = computed(() => {
  const date = message.value?.createdAt
  if (!date) return 'Recently'
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(date)
})

const loginPath = computed(() => ({
  path: '/login',
  query: { redirect: route.fullPath }
}))

function toDate(value?: Timestamp | Date | null) {
  if (!value) return null
  return value instanceof Date ? value : value.toDate()
}

function topicLabel(topic: string) {
  switch (topic) {
    case 'games': return 'Games'
    case 'niyams': return 'Niyams'
    case 'niyam-milestones': return 'Niyam milestone'
    case 'announcements': return 'Announcement'
    default: return 'Bhaktiras'
  }
}

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  void navigateTo('/')
}

async function loadMessage() {
  loading.value = true
  error.value = ''
  notFound.value = false
  message.value = null

  if (!id.value) {
    notFound.value = true
    loading.value = false
    return
  }

  const uid = user.value?.uid
  if (!uid) {
    loading.value = false
    return
  }

  const db = useNuxtApp().$firebaseDb as Firestore | null
  if (!db) {
    error.value = 'Could not load this message right now.'
    loading.value = false
    return
  }

  try {
    const messageDocRef = isTest.value
      ? doc(db, 'testNotifications', uid, 'messages', id.value)
      : doc(db, 'notifications', id.value)
    const snap = await getDoc(messageDocRef)
    if (!snap.exists()) {
      notFound.value = true
      return
    }
    const data = snap.data()
    message.value = {
      title: String(data.title || 'Bhaktiras'),
      body: String(data.body || ''),
      topic: String(data.topic || 'announcements'),
      url: String(data.url || ''),
      linkUrl: String(data.linkUrl || ''),
      test: isTest.value || data.test === true,
      createdAt: toDate(data.createdAt as Timestamp | undefined)
    }
  } catch {
    error.value = 'Could not load this message right now.'
  } finally {
    loading.value = false
  }
}

watch([() => isLoggedIn.value, () => authLoading.value, id, isTest], () => {
  if (authLoading.value) return
  void loadMessage()
}, { immediate: true })

useHead(() => ({
  title: message.value?.title ? `${message.value.title} · Bhaktiras` : 'Notification · Bhaktiras'
}))
</script>
