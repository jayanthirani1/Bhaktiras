import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore
} from 'firebase/firestore'
import { getApp } from 'firebase/app'

export type PushTopic = 'announcements' | 'games'
export type PushPromptMoment = 'sign-in' | 'game-complete' | 'events'

const ALL_TOPICS: PushTopic[] = ['announcements', 'games']
const SUBSCRIPTION_ID_KEY = 'bhaktiras-push-subscription-id'
const TOPICS_KEY = 'bhaktiras-push-topics'
let foregroundUnsubscribe: (() => void) | null = null

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

/** Maps legacy patotsav/events preferences onto announcements. */
function normalizeTopics(raw: unknown): PushTopic[] {
  if (!Array.isArray(raw)) return []
  const next = new Set<PushTopic>()
  for (const item of raw) {
    if (item === 'games') next.add('games')
    if (item === 'announcements' || item === 'patotsav' || item === 'events') next.add('announcements')
  }
  return ALL_TOPICS.filter(topic => next.has(topic))
}

/**
 * Rebuilds the subscription id for this device from its FCM token so the saved
 * record is still found when local storage has been cleared. Only called once
 * permission is granted, so this never triggers a browser prompt.
 */
async function deriveSubscriptionId(uid: string, vapidKey: string) {
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const { getMessaging, getToken } = await import('firebase/messaging')
    const token = await getToken(getMessaging(getApp()), {
      serviceWorkerRegistration: registration,
      ...(vapidKey ? { vapidKey } : {})
    })
    if (!token) return null
    const hash = await tokenHash(token)
    return `${uid}_${hash.slice(0, 32)}`
  } catch {
    return null
  }
}

let initialiseRun = 0

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

  async function initialise() {
    if (import.meta.server) return
    const run = ++initialiseRun
    const stale = () => run !== initialiseRun

    permission.value = typeof Notification === 'undefined' ? 'denied' : Notification.permission
    try {
      const { isSupported } = await import('firebase/messaging')
      if (stale()) return
      supported.value = 'serviceWorker' in navigator && await isSupported()
    } catch {
      supported.value = false
    }
    if (stale()) return

    const uid = auth.user.value?.uid
    const db = getDb()
    if (!uid || !db || permission.value !== 'granted' || !supported.value) {
      if (stale()) return
      enabled.value = false
      topics.value = []
      return
    }

    let id = localStorage.getItem(SUBSCRIPTION_ID_KEY)
    if (!id) id = await deriveSubscriptionId(uid, String(config.firebaseVapidKey || ''))
    if (stale()) return
    if (!id) {
      enabled.value = false
      topics.value = []
      return
    }

    try {
      const saved = await getDoc(doc(db, 'pushSubscriptions', id))
      if (stale()) return
      const data = saved.exists() ? saved.data() : null
      const mine = !!data && data.userId === uid && data.enabled === true
      enabled.value = mine
      topics.value = mine ? normalizeTopics(data?.topics) : []
      if (mine) {
        localStorage.setItem(SUBSCRIPTION_ID_KEY, id)
        localStorage.setItem(TOPICS_KEY, JSON.stringify(topics.value))
      }
    } catch {
      if (stale()) return
      enabled.value = false
      topics.value = []
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
      const previous = existing.exists() ? normalizeTopics(existing.data().topics) : []
      const nextTopics = normalizeTopics([...previous, ...requested])

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
      const uid = auth.user.value?.uid
      const db = getDb()
      const id = localStorage.getItem(SUBSCRIPTION_ID_KEY)
        || (uid ? await deriveSubscriptionId(uid, String(config.firebaseVapidKey || '')) : null)
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

  async function setTopicEnabled(topic: PushTopic, selected: boolean) {
    if (selected) {
      await enable(topic)
      return
    }
    if (!enabled.value || !topics.value.includes(topic)) return

    const nextTopics = topics.value.filter(item => item !== topic)
    if (!nextTopics.length) {
      await disable()
      return
    }

    busy.value = true
    error.value = ''
    try {
      const uid = auth.user.value?.uid
      const db = getDb()
      if (!uid || !db) throw new Error('Sign in to update notification preferences.')
      const id = localStorage.getItem(SUBSCRIPTION_ID_KEY)
        || await deriveSubscriptionId(uid, String(config.firebaseVapidKey || ''))
      if (!id) throw new Error('This notification subscription could not be found.')
      await updateDoc(doc(db, 'pushSubscriptions', id), {
        topics: nextTopics,
        updatedAt: serverTimestamp()
      })
      localStorage.setItem(SUBSCRIPTION_ID_KEY, id)
      localStorage.setItem(TOPICS_KEY, JSON.stringify(nextTopics))
      topics.value = nextTopics
    } catch (value) {
      error.value = value instanceof Error ? value.message : 'Could not update notification preferences.'
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
    setTopicEnabled,
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
    return 'announcements'
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
