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
import { isIos, isStandalone } from '~/utils/pwa'
import { consumeInteractiveSignIn } from '~/utils/signInSignal'

export type PushTopic = 'announcements' | 'games'
export type PushPromptMoment = 'game-complete' | 'events' | 'signed-in'

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
 * Reads the device's current FCM token. Only called once permission is granted,
 * so this never triggers a browser prompt.
 */
async function currentToken(vapidKey: string) {
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const { getMessaging, getToken } = await import('firebase/messaging')
    return await getToken(getMessaging(getApp()), {
      serviceWorkerRegistration: registration,
      ...(vapidKey ? { vapidKey } : {})
    })
  } catch {
    return null
  }
}

async function subscriptionIdFor(uid: string, token: string) {
  const hash = await tokenHash(token)
  return `${uid}_${hash.slice(0, 32)}`
}

/** A saved token this old is refreshed on next load so sends never hit a dead one. */
const TOKEN_REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000

function savedAtMillis(value: unknown) {
  const stamp = value as { toMillis?: () => number } | undefined
  return typeof stamp?.toMillis === 'function' ? stamp.toMillis() : 0
}

type SyncResult = { id: string; topics: PushTopic[] } | null

/**
 * Reconciles this device's saved subscription with its live FCM token.
 *
 * Subscription ids are derived from the token, so a rotated token leaves the
 * saved record stranded under the old id: the account looks unsubscribed in the
 * UI while the server keeps pushing to a token that no longer exists. This
 * re-registers under the new id, carries the chosen topics across, and drops
 * the dead record. It also refreshes an ageing token in place.
 */
async function syncSubscription(db: Firestore, uid: string, vapidKey: string): Promise<SyncResult> {
  const token = await currentToken(vapidKey)
  if (!token) return null
  const id = await subscriptionIdFor(uid, token)

  const current = await getDoc(doc(db, 'pushSubscriptions', id))
  const currentData = current.exists() ? current.data() : null
  if (currentData && currentData.userId === uid && currentData.enabled === true) {
    const topics = normalizeTopics(currentData.topics)
    const aged = Date.now() - savedAtMillis(currentData.updatedAt) > TOKEN_REFRESH_AFTER_MS
    if (aged || currentData.token !== token) {
      await updateDoc(doc(db, 'pushSubscriptions', id), {
        token,
        topics,
        updatedAt: serverTimestamp()
      })
    }
    return { id, topics }
  }

  // No record under the live token — look for one left behind by an older token.
  const previousId = localStorage.getItem(SUBSCRIPTION_ID_KEY)
  if (!previousId || previousId === id) return null
  const previous = await getDoc(doc(db, 'pushSubscriptions', previousId))
  const previousData = previous.exists() ? previous.data() : null
  if (!previousData || previousData.userId !== uid || previousData.enabled !== true) return null

  const topics = normalizeTopics(previousData.topics)
  await setDoc(doc(db, 'pushSubscriptions', id), {
    userId: uid,
    token,
    topics,
    enabled: true,
    platform: navigator.userAgent.slice(0, 240),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  await deleteDoc(doc(db, 'pushSubscriptions', previousId)).catch(() => {
    // The new record is already live; a leftover old one is pruned on first failed send.
  })
  return { id, topics }
}

let initialiseRun = 0

/** Browser permission, FCM token registration and per-device topic preferences. */
export function usePushNotifications() {
  const auth = useAuth()
  const config = useRuntimeConfig().public
  const supported = useState<boolean | null>('push-supported', () => null)
  const needsHomeScreen = useState<boolean>('push-needs-home-screen', () => false)
  const enabled = useState<boolean>('push-enabled', () => false)
  const topics = useState<PushTopic[]>('push-topics', () => [])
  const busy = useState<boolean>('push-busy', () => false)
  const error = useState<string>('push-error', () => '')
  const permission = useState<NotificationPermission>('push-permission', () => 'default')
  // Bumped whenever a message lands while the app is open, so the inbox can refresh.
  const lastReceivedAt = useState<number>('push-last-received', () => 0)

  async function initialise() {
    if (import.meta.server) return
    const run = ++initialiseRun
    const stale = () => run !== initialiseRun

    permission.value = typeof Notification === 'undefined' ? 'denied' : Notification.permission
    needsHomeScreen.value = isIos() && !isStandalone()
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

    try {
      const synced = await syncSubscription(db, uid, String(config.firebaseVapidKey || ''))
      if (stale()) return
      enabled.value = !!synced
      topics.value = synced?.topics ?? []
      if (synced) {
        localStorage.setItem(SUBSCRIPTION_ID_KEY, synced.id)
        localStorage.setItem(TOPICS_KEY, JSON.stringify(synced.topics))
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
      // The live token may have rotated since this device last saved an id, so
      // clear both the current record and any stranded predecessor.
      const synced = uid && db ? await syncSubscription(db, uid, String(config.firebaseVapidKey || '')) : null
      const ids = new Set([synced?.id, localStorage.getItem(SUBSCRIPTION_ID_KEY)].filter(Boolean) as string[])
      if (db) {
        for (const id of ids) await deleteDoc(doc(db, 'pushSubscriptions', id))
      }
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
      const synced = await syncSubscription(db, uid, String(config.firebaseVapidKey || ''))
      const id = synced?.id
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
        lastReceivedAt.value = Date.now()
        if (Notification.permission !== 'granted') return
        const data = payload.data || {}
        const title = payload.notification?.title || data.title || 'Bhaktiras'
        const body = payload.notification?.body || data.body || ''
        const url = data.url || '/'
        void navigator.serviceWorker.ready.then((registration) => {
          void registration.showNotification(title, {
            body,
            icon: '/notification-icon.png',
            badge: '/notification-badge.png',
            data: { url },
            tag: data.tag || 'bhaktiras-update'
          })
        })
      })
    } catch {
      // Unsupported browsers simply do not install a foreground listener.
    }
  }

  watch(() => auth.user.value?.uid, () => { void initialise() })
  onMounted(() => { void initialise() })

  return {
    supported,
    needsHomeScreen,
    enabled,
    topics,
    busy,
    error,
    permission,
    lastReceivedAt,
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
  const gate = useAppPrompts()

  function topicFor(value: PushPromptMoment): PushTopic {
    if (value === 'game-complete') return 'games'
    return 'announcements'
  }

  function request(value: PushPromptMoment) {
    if (import.meta.server || moment.value || !auth.user.value?.uid || push.permission.value === 'denied') return
    const topic = topicFor(value)
    if (push.topics.value.includes(topic)) return
    if (localStorage.getItem(`bhaktiras-push-prompt-seen:${value}`) === '1') return
    if (value === 'signed-in') {
      // On iOS, push arrives only through a Home Screen launch. Asking in a
      // browser tab spends the one ask on something that cannot be granted, so
      // the install prompt gets this devotee instead.
      if (push.needsHomeScreen.value) return
      // Only the sign-in that just happened counts. Firebase restores a session
      // on every launch, which would otherwise read as signing in again.
      if (!consumeInteractiveSignIn()) return
    }
    moment.value = value
    gate.setPending('push', true)
  }

  function close(markSeen = true) {
    if (import.meta.client && markSeen && moment.value) {
      localStorage.setItem(`bhaktiras-push-prompt-seen:${moment.value}`, '1')
    }
    moment.value = null
    gate.setPending('push', false)
  }

  async function accept() {
    if (!moment.value) return
    const current = moment.value
    await push.enable(topicFor(current))
    close(true)
  }

  return { moment, push, request, close, accept }
}
