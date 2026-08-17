import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'
import { getApp } from 'firebase/app'

export type PushTopic = 'patotsav' | 'games' | 'events'
export type PushPromptMoment = 'sign-in' | 'game-complete' | 'events'

const ALL_TOPICS: PushTopic[] = ['patotsav', 'games', 'events']
const SUBSCRIPTION_ID_KEY = 'bhaktiras-push-subscription-id'
const TOPICS_KEY = 'bhaktiras-push-topics'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

async function tokenHash(token: string) {
  const bytes = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

function storedTopics(): PushTopic[] {
  if (import.meta.server) return []
  try {
    const parsed = JSON.parse(localStorage.getItem(TOPICS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(topic => ALL_TOPICS.includes(topic)) : []
  } catch {
    return []
  }
}

/** Browser permission, FCM token registration and per-device topic preferences. */
export function usePushNotifications() {
  const auth = useAuth()
  const config = useRuntimeConfig().public
  const supported = useState<boolean | null>('push-supported', () => null)
  const enabled = useState<boolean>('push-enabled', () => false)
  const topics = useState<PushTopic[]>('push-topics', () => [])
  const busy = useState<boolean>('push-busy', () => false)
  const error = useState<string>('push-error', () => '')
  const permission = useState<NotificationPermission>('push-permission', () => 'default')
  let foregroundUnsubscribe: (() => void) | null = null

  async function initialise() {
    if (import.meta.server) return
    permission.value = typeof Notification === 'undefined' ? 'denied' : Notification.permission
    try {
      const { isSupported } = await import('firebase/messaging')
      supported.value = 'serviceWorker' in navigator && await isSupported()
    } catch {
      supported.value = false
    }
    topics.value = storedTopics()
    const id = localStorage.getItem(SUBSCRIPTION_ID_KEY)
    const uid = auth.user.value?.uid
    enabled.value = false
    if (id && uid && permission.value === 'granted') {
      const db = getDb()
      if (db) {
        try {
          const saved = await getDoc(doc(db, 'pushSubscriptions', id))
          const data = saved.exists() ? saved.data() : null
          enabled.value = !!data && data.userId === uid && data.enabled === true
          if (enabled.value && Array.isArray(data?.topics)) {
            topics.value = data.topics.filter((item: PushTopic) => ALL_TOPICS.includes(item))
          }
        } catch {
          enabled.value = false
        }
      }
    }
  }

  async function enable(topic?: PushTopic) {
    if (import.meta.server) return false
    if (!auth.user.value?.uid) throw new Error('Sign in to turn on notifications.')
    if (supported.value == null) await initialise()
    if (!supported.value) throw new Error('Push notifications are not supported on this device.')

    busy.value = true
    error.value = ''
    try {
      permission.value = await Notification.requestPermission()
      if (permission.value !== 'granted') {
        throw new Error('Notifications were not allowed. You can change this in your browser settings.')
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      const { getMessaging, getToken } = await import('firebase/messaging')
      const messaging = getMessaging(getApp())
      const vapidKey = String(config.firebaseVapidKey || '')
      const token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        ...(vapidKey ? { vapidKey } : {})
      })
      if (!token) throw new Error('This device could not be registered for notifications.')

      const uid = auth.user.value.uid
      const hash = await tokenHash(token)
      const subscriptionId = `${uid}_${hash.slice(0, 32)}`
      const db = getDb()
      if (!db) throw new Error('Firebase is not available.')

      const ref = doc(db, 'pushSubscriptions', subscriptionId)
      const existing = await getDoc(ref)
      const requested = topic ? [topic] : ALL_TOPICS
      const previous = existing.exists() && Array.isArray(existing.data().topics)
        ? existing.data().topics as PushTopic[]
        : storedTopics()
      const nextTopics = [...new Set([...previous, ...requested])]
        .filter(item => ALL_TOPICS.includes(item))

      await setDoc(ref, {
        userId: uid,
        token,
        topics: nextTopics,
        enabled: true,
        platform: navigator.userAgent.slice(0, 240),
        createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      localStorage.setItem(SUBSCRIPTION_ID_KEY, subscriptionId)
      localStorage.setItem(TOPICS_KEY, JSON.stringify(nextTopics))
      topics.value = nextTopics
      enabled.value = true
      return true
    } catch (value) {
      error.value = value instanceof Error ? value.message : 'Could not enable notifications.'
      throw value
    } finally {
      busy.value = false
    }
  }

  async function disable() {
    if (import.meta.server) return
    busy.value = true
    error.value = ''
    try {
      const id = localStorage.getItem(SUBSCRIPTION_ID_KEY)
      const db = getDb()
      if (id && db) await deleteDoc(doc(db, 'pushSubscriptions', id))
      try {
        const { deleteToken, getMessaging } = await import('firebase/messaging')
        await deleteToken(getMessaging(getApp()))
      } catch {
        // The Firestore record is the authoritative switch; token cleanup is best effort.
      }
      localStorage.removeItem(SUBSCRIPTION_ID_KEY)
      localStorage.removeItem(TOPICS_KEY)
      topics.value = []
      enabled.value = false
    } catch (value) {
      error.value = value instanceof Error ? value.message : 'Could not disable notifications.'
      throw value
    } finally {
      busy.value = false
    }
  }

  async function startForegroundListener() {
    if (import.meta.server || foregroundUnsubscribe) return
    try {
      const { getMessaging, onMessage } = await import('firebase/messaging')
      foregroundUnsubscribe = onMessage(getMessaging(getApp()), (payload) => {
        if (Notification.permission !== 'granted') return
        const title = payload.notification?.title || payload.data?.title || 'Bhaktiras'
        const body = payload.notification?.body || payload.data?.body || ''
        const notice = new Notification(title, {
          body,
          icon: '/Bhaktiras%20-%20Main.svg',
          data: { url: payload.data?.url || '/' }
        })
        notice.onclick = () => {
          window.focus()
          window.location.href = String(notice.data?.url || '/')
          notice.close()
        }
      })
    } catch {
      // Unsupported browsers simply do not install a foreground listener.
    }
  }

  watch(() => auth.user.value?.uid, () => { void initialise() })
  onMounted(() => { void initialise() })
  onUnmounted(() => {
    foregroundUnsubscribe?.()
    foregroundUnsubscribe = null
  })

  return {
    supported,
    enabled,
    topics,
    busy,
    error,
    permission,
    initialise,
    enable,
    disable,
    startForegroundListener
  }
}

/** Coordinates the contextual soft prompt without invoking browser permission itself. */
export function usePushPrompt() {
  const moment = useState<PushPromptMoment | null>('push-prompt-moment', () => null)
  const auth = useAuth()
  const push = usePushNotifications()

  function topicFor(value: PushPromptMoment): PushTopic {
    if (value === 'game-complete') return 'games'
    if (value === 'events') return 'events'
    return 'patotsav'
  }

  function request(value: PushPromptMoment) {
    if (import.meta.server || moment.value || !auth.user.value?.uid || push.permission.value === 'denied') return
    const topic = topicFor(value)
    if (push.topics.value.includes(topic)) return
    if (localStorage.getItem(`bhaktiras-push-prompt-seen:${value}`) === '1') return
    moment.value = value
  }

  function close(markSeen = true) {
    if (import.meta.client && markSeen && moment.value) {
      localStorage.setItem(`bhaktiras-push-prompt-seen:${moment.value}`, '1')
    }
    moment.value = null
  }

  async function accept() {
    if (!moment.value) return
    const current = moment.value
    await push.enable(topicFor(current))
    close(true)
  }

  return { moment, push, request, close, accept }
}
