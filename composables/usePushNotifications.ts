import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore
} from 'firebase/firestore'
import { getApp } from 'firebase/app'
import type { Messaging } from 'firebase/messaging'
import { isIos, isStandalone } from '~/utils/pwa'
import { consumeInteractiveSignIn } from '~/utils/signInSignal'
import { notificationPreviewBody } from '~/utils/notificationDetail'

export type PushTopic = 'announcements' | 'games' | 'niyams' | 'niyam-milestones'
export type PushPromptMoment = 'game-complete' | 'events' | 'signed-in'

const ALL_TOPICS: PushTopic[] = ['announcements', 'games', 'niyams', 'niyam-milestones']
const SUBSCRIPTION_ID_KEY = 'bhaktiras-push-subscription-id'
const TOPICS_KEY = 'bhaktiras-push-topics'
let foregroundUnsubscribe: (() => void) | null = null

/** One shared SW + messaging setup so toggles do not re-register from scratch. */
let messagingSetup: Promise<{ messaging: Messaging; registration: ServiceWorkerRegistration }> | null = null

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
    if (item === 'niyams') next.add('niyams')
    if (item === 'niyam-milestones') next.add('niyam-milestones')
    if (item === 'announcements' || item === 'patotsav' || item === 'events') next.add('announcements')
  }
  return ALL_TOPICS.filter(topic => next.has(topic))
}

function friendlyPushError(value: unknown): string {
  const message = value instanceof Error ? value.message : String(value || '')
  const code = typeof value === 'object' && value && 'code' in value
    ? String((value as { code?: string }).code || '')
    : ''
  if (
    code.includes('token-subscribe-failed')
    || /token-subscribe-failed|subscribing the user to FCM/i.test(message)
  ) {
    return 'Could not finish setting up notifications on this device. Close other Bhaktiras tabs, wait a moment, and try again. If it still fails, clear site data for this site in Chrome and reopen the app.'
  }
  if (code.includes('permission-blocked') || /permission/i.test(message) && /denied|blocked/i.test(message)) {
    return 'Notifications were blocked. Allow them for Bhaktiras in your browser or phone settings, then try again.'
  }
  return message || 'Could not enable notifications.'
}

/**
 * Android Chrome often fails FCM subscribe while the messaging service worker
 * is still installing. Wait until it is active before asking for a token.
 */
async function waitForActiveWorker(registration: ServiceWorkerRegistration) {
  if (registration.active) return
  const worker = registration.installing || registration.waiting
  if (!worker) {
    await navigator.serviceWorker.ready
    return
  }
  if (worker.state === 'activated') return
  await new Promise<void>((resolve) => {
    const done = () => resolve()
    const timer = setTimeout(done, 10_000)
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated' || registration.active) {
        clearTimeout(timer)
        done()
      }
    })
  })
}

async function ensureMessaging() {
  if (!messagingSetup) {
    messagingSetup = (async () => {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      await navigator.serviceWorker.ready
      await waitForActiveWorker(registration)
      const { getMessaging } = await import('firebase/messaging')
      return { messaging: getMessaging(getApp()), registration }
    })().catch((error) => {
      messagingSetup = null
      throw error
    })
  }
  return messagingSetup
}

/**
 * Reads the device's current FCM token. Only called once permission is granted,
 * so this never triggers a browser prompt.
 */
async function currentToken(vapidKey: string) {
  try {
    const { messaging, registration } = await ensureMessaging()
    const { getToken } = await import('firebase/messaging')
    return await getToken(messaging, {
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

type AccountSubscription = { id: string; topics: PushTopic[]; enabled: boolean }

/**
 * Every subscription document on the account — one per device the devotee has
 * ever turned notifications on for.
 *
 * Topic preferences are chosen in Account settings, which reads as an account
 * setting rather than a per-device one, so every read and every write below
 * spans the account. Editing only the document belonging to the browser making
 * the change is what let a devotee turn "Daily games and records" off on their
 * laptop and keep getting game pushes on their phone.
 */
async function loadAccountSubscriptions(db: Firestore, uid: string): Promise<AccountSubscription[]> {
  const snap = await getDocs(query(collection(db, 'pushSubscriptions'), where('userId', '==', uid)))
  return snap.docs.map(item => ({
    id: item.id,
    topics: normalizeTopics(item.data().topics),
    enabled: item.data().enabled === true
  }))
}

function enabledOnly(subscriptions: AccountSubscription[]) {
  return subscriptions.filter(item => item.enabled)
}

/**
 * What the account is actually receiving: a topic is on if any device is
 * subscribed to it. Devices only diverge on records written before preferences
 * became account-wide, and the first toggle converges them.
 */
function unionTopics(subscriptions: AccountSubscription[]): PushTopic[] {
  const chosen = new Set<PushTopic>()
  enabledOnly(subscriptions).forEach(item => item.topics.forEach(topic => chosen.add(topic)))
  return ALL_TOPICS.filter(topic => chosen.has(topic))
}

function sameTopics(left: PushTopic[], right: PushTopic[]) {
  return left.length === right.length && left.every((topic, index) => topic === right[index])
}

/** Writes one topic set to every subscribed device on the account. */
async function writeAccountTopics(db: Firestore, subscriptions: AccountSubscription[], topics: PushTopic[]) {
  const behind = enabledOnly(subscriptions).filter(item => !sameTopics(item.topics, topics))
  if (!behind.length) return
  const write = writeBatch(db)
  behind.forEach(item => write.update(doc(db, 'pushSubscriptions', item.id), {
    topics,
    updatedAt: serverTimestamp()
  }))
  await write.commit()
}

/** Unsubscribes every device on the account, so "off" means off everywhere. */
async function deleteAccountSubscriptions(db: Firestore, ids: string[]) {
  if (!ids.length) return
  const write = writeBatch(db)
  ids.forEach(id => write.delete(doc(db, 'pushSubscriptions', id)))
  await write.commit()
}

let initialiseRun = 0

/** Browser permission, FCM token registration and account-wide topic preferences. */
export function usePushNotifications() {
  const auth = useAuth()
  const config = useRuntimeConfig().public
  const supported = useState<boolean | null>('push-supported', () => null)
  const needsHomeScreen = useState<boolean>('push-needs-home-screen', () => false)
  // `enabled` is the account switch — on while any device is subscribed.
  // `deviceEnabled` is whether this browser is one of them.
  const enabled = useState<boolean>('push-enabled', () => false)
  const deviceEnabled = useState<boolean>('push-device-enabled', () => false)
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
      // Warm the SW + messaging client so the first toggle is not cold.
      if (supported.value) void ensureMessaging().catch(() => {})
    } catch {
      supported.value = false
    }
    if (stale()) return

    const uid = auth.user.value?.uid
    const db = getDb()
    if (!uid || !db) {
      if (stale()) return
      enabled.value = false
      deviceEnabled.value = false
      topics.value = []
      return
    }

    try {
      // A device that cannot hold a token still reads the account's settings —
      // an iOS browser tab should show what the Home Screen app is receiving.
      const synced = permission.value === 'granted' && supported.value
        ? await syncSubscription(db, uid, String(config.firebaseVapidKey || ''))
        : null
      if (stale()) return
      const subscriptions = await loadAccountSubscriptions(db, uid)
      if (stale()) return
      deviceEnabled.value = !!synced
      enabled.value = enabledOnly(subscriptions).length > 0
      topics.value = unionTopics(subscriptions)
      if (synced) localStorage.setItem(SUBSCRIPTION_ID_KEY, synced.id)
      localStorage.setItem(TOPICS_KEY, JSON.stringify(topics.value))
    } catch {
      if (stale()) return
      enabled.value = false
      deviceEnabled.value = false
      topics.value = []
    }
  }

  async function enable(topic?: PushTopic) {
    if (import.meta.server) return false
    if (!auth.user.value?.uid) throw new Error('Sign in to turn on notifications.')
    if (supported.value == null) await initialise()
    if (!supported.value) throw new Error('Push notifications are not supported on this device.')

    const previousEnabled = enabled.value
    const previousDeviceEnabled = deviceEnabled.value
    const previousTopics = [...topics.value]
    // With no category named this is the master switch, or a second device
    // joining an account that is already on: adopt what the account receives,
    // and only fall back to everything when nothing is chosen yet.
    const optimisticTopics = normalizeTopics([
      ...previousTopics,
      ...(topic ? [topic] : previousTopics.length ? previousTopics : ALL_TOPICS)
    ])

    // Flip the switch immediately — the FCM handshake can take a few seconds on
    // Android, and leaving the toggle stuck mid-press feels broken.
    enabled.value = true
    deviceEnabled.value = true
    topics.value = optimisticTopics.length ? optimisticTopics : ALL_TOPICS
    busy.value = true
    error.value = ''
    try {
      permission.value = await Notification.requestPermission()
      if (permission.value !== 'granted') {
        throw new Error('Notifications were not allowed. You can change this in your browser settings.')
      }

      const vapidKey = String(config.firebaseVapidKey || '')
      const { messaging, registration } = await ensureMessaging()
      const { getToken } = await import('firebase/messaging')

      let token: string | null = null
      try {
        token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          ...(vapidKey ? { vapidKey } : {})
        })
      } catch (first) {
        // One retry after forcing the SW ready again — Android intermittent
        // token-subscribe-failed often clears on a second attempt.
        messagingSetup = null
        const retry = await ensureMessaging()
        const { getToken: getTokenAgain } = await import('firebase/messaging')
        try {
          token = await getTokenAgain(retry.messaging, {
            serviceWorkerRegistration: retry.registration,
            ...(vapidKey ? { vapidKey } : {})
          })
        } catch (second) {
          throw second || first
        }
      }
      if (!token) throw new Error('This device could not be registered for notifications.')

      const uid = auth.user.value.uid
      const hash = await tokenHash(token)
      const subscriptionId = `${uid}_${hash.slice(0, 32)}`
      const db = getDb()
      if (!db) throw new Error('Firebase is not available.')

      const ref = doc(db, 'pushSubscriptions', subscriptionId)
      const existing = await getDoc(ref)
      // Turning a category on is an account choice, so it starts from what the
      // account already receives rather than from this device's own record.
      const subscriptions = await loadAccountSubscriptions(db, uid)
      const accountTopics = unionTopics(subscriptions)
      const requested = topic
        ? [topic]
        : accountTopics.length ? accountTopics : ALL_TOPICS
      const nextTopics = normalizeTopics([...accountTopics, ...requested])

      await setDoc(ref, {
        userId: uid,
        token,
        topics: nextTopics,
        enabled: true,
        platform: navigator.userAgent.slice(0, 240),
        createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      await writeAccountTopics(
        db,
        subscriptions.filter(item => item.id !== subscriptionId),
        nextTopics
      )

      localStorage.setItem(SUBSCRIPTION_ID_KEY, subscriptionId)
      localStorage.setItem(TOPICS_KEY, JSON.stringify(nextTopics))
      topics.value = nextTopics
      enabled.value = true
      deviceEnabled.value = true
      return true
    } catch (value) {
      enabled.value = previousEnabled
      deviceEnabled.value = previousDeviceEnabled
      topics.value = previousTopics
      error.value = friendlyPushError(value)
      throw value instanceof Error ? value : new Error(error.value)
    } finally {
      busy.value = false
    }
  }

  /** Turns notifications off for the whole account, every device included. */
  async function disable() {
    if (import.meta.server) return
    const previousEnabled = enabled.value
    const previousDeviceEnabled = deviceEnabled.value
    const previousTopics = [...topics.value]
    enabled.value = false
    deviceEnabled.value = false
    topics.value = []
    busy.value = true
    error.value = ''
    try {
      const uid = auth.user.value?.uid
      const db = getDb()
      // The live token may have rotated since this device last saved an id, so
      // clear both the current record and any stranded predecessor.
      const synced = uid && db && permission.value === 'granted' && supported.value
        ? await syncSubscription(db, uid, String(config.firebaseVapidKey || ''))
        : null
      if (uid && db) {
        const subscriptions = await loadAccountSubscriptions(db, uid)
        const ids = new Set(subscriptions.map(item => item.id))
        // A stranded id is only safe to delete once it is known to exist and to
        // belong to this account — the rules reject a delete of a missing doc.
        const strays = [synced?.id, localStorage.getItem(SUBSCRIPTION_ID_KEY)]
          .filter((id): id is string => !!id && !ids.has(id))
        for (const id of strays) {
          const stray = await getDoc(doc(db, 'pushSubscriptions', id))
          if (stray.exists() && stray.data().userId === uid) ids.add(id)
        }
        await deleteAccountSubscriptions(db, [...ids])
      }
      try {
        const { deleteToken, getMessaging } = await import('firebase/messaging')
        await deleteToken(getMessaging(getApp()))
      } catch {
        // The Firestore record is the authoritative switch; token cleanup is best effort.
      }
      localStorage.removeItem(SUBSCRIPTION_ID_KEY)
      localStorage.removeItem(TOPICS_KEY)
    } catch (value) {
      enabled.value = previousEnabled
      deviceEnabled.value = previousDeviceEnabled
      topics.value = previousTopics
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

    const previousTopics = [...topics.value]
    busy.value = true
    error.value = ''
    try {
      const uid = auth.user.value?.uid
      const db = getDb()
      if (!uid || !db) throw new Error('Sign in to update notification preferences.')
      // Bring this device's own record under its live token first, so it is in
      // the account list about to be rewritten rather than left on the old id.
      const synced = permission.value === 'granted' && supported.value
        ? await syncSubscription(db, uid, String(config.firebaseVapidKey || ''))
        : null
      if (synced) localStorage.setItem(SUBSCRIPTION_ID_KEY, synced.id)

      const subscriptions = await loadAccountSubscriptions(db, uid)
      const nextTopics = unionTopics(subscriptions).filter(item => item !== topic)
      // An empty topic list still matches an "everyone" send, so the last
      // category going off unsubscribes the account rather than muting it.
      if (!nextTopics.length) {
        await disable()
        return
      }
      await writeAccountTopics(db, subscriptions, nextTopics)
      localStorage.setItem(TOPICS_KEY, JSON.stringify(nextTopics))
      topics.value = nextTopics
    } catch (value) {
      topics.value = previousTopics
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
        const body = data.preview || notificationPreviewBody(String(data.body || payload.notification?.body || ''))
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
    deviceEnabled,
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
