import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type Firestore,
  type Timestamp
} from 'firebase/firestore'
import { notificationDetailPath, notificationLinkUrl } from '~/utils/notificationDetail'

export type InboxMessage = {
  id: string
  title: string
  body: string
  /** Legacy destination; new sends open the detail page first. */
  url: string
  linkUrl: string
  topic: string
  test: boolean
  createdAt: Date | null
}

const LAST_READ_KEY = 'bhaktiras-inbox-last-read'
const DISMISSED_KEY = 'bhaktiras-inbox-dismissed'
const INBOX_LIMIT = 30
const TEST_LIMIT = 10
/** Matches the ceiling enforced in firestore.rules. */
const DISMISSED_CAP = 200
const PERSIST_DEBOUNCE_MS = 500

function toDate(value?: Timestamp | Date | null) {
  if (!value) return null
  return value instanceof Date ? value : value.toDate()
}

function toMessage(id: string, data: DocumentData, test: boolean): InboxMessage {
  const url = String(data.url || '/')
  const linkUrl = notificationLinkUrl({
    linkUrl: typeof data.linkUrl === 'string' ? data.linkUrl : '',
    url
  }) || '/'
  return {
    id,
    title: String(data.title || 'Bhaktiras'),
    body: String(data.body || ''),
    url,
    linkUrl,
    topic: String(data.topic || 'announcements'),
    test,
    createdAt: toDate(data.createdAt as Timestamp | undefined)
  }
}

function detailPathFor(message: InboxMessage) {
  if (message.url.startsWith('/notifications/')) {
    const path = message.url.split('?')[0]
    return message.test ? `${path}?test=1` : path
  }
  return notificationDetailPath(message)
}

function newestFirst(a: InboxMessage, b: InboxMessage) {
  return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
}

function readLocal<T>(key: string, fallback: T): T {
  if (import.meta.server) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function startOfDay(offsetDays = 0) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - offsetDays)
  return date.getTime()
}

/**
 * The in-app copy of everything that went out as a push announcement.
 *
 * A web notification only exists while the OS chooses to show it — dismiss it,
 * or never grant permission, and the message is gone. Cloud Functions mirror
 * every announcement into `notifications`, and this reads them back.
 *
 * Read and dismissed state cannot live on the messages: `notifications` is
 * shared and client-read-only. Both live in `notificationState/{uid}` instead,
 * a single document fetched by id — no composite index, so it stays clear of
 * the deploy account's inability to create them. Local storage mirrors it so
 * the badge paints correctly before the network answers, and the two are merged
 * rather than overwritten so a second device cannot clobber the first.
 */
export function useNotificationInbox() {
  const auth = useAuth()
  const all = useState<InboxMessage[]>('inbox-messages', () => [])
  const dismissedIds = useState<string[]>('inbox-dismissed', () => [])
  const lastReadAt = useState<number>('inbox-last-read', () => 0)
  const loading = useState<boolean>('inbox-loading', () => false)
  const loaded = useState<boolean>('inbox-loaded', () => false)
  const error = useState<string>('inbox-error', () => '')
  /**
   * Unread ids captured when the panel opens. Opening marks everything read so
   * the badge clears, but the dots stay put for that viewing — otherwise the
   * one signal telling you what is new vanishes the instant you look at it.
   */
  const viewedUnread = useState<string[]>('inbox-viewed-unread', () => [])

  const dismissed = computed(() => new Set(dismissedIds.value))
  const messages = computed(() => all.value.filter(item => !dismissed.value.has(item.id)))
  const unreadCount = computed(() => messages.value.filter(
    item => (item.createdAt?.getTime() ?? 0) > lastReadAt.value
  ).length)

  /** Today / Yesterday / Earlier, so a long feed can be scanned at a glance. */
  const groups = computed(() => {
    const today = startOfDay()
    const yesterday = startOfDay(1)
    const buckets: Array<{ label: string; items: InboxMessage[] }> = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Earlier', items: [] }
    ]
    for (const item of messages.value) {
      const at = item.createdAt?.getTime() ?? 0
      if (at >= today) buckets[0].items.push(item)
      else if (at >= yesterday) buckets[1].items.push(item)
      else buckets[2].items.push(item)
    }
    return buckets.filter(bucket => bucket.items.length)
  })

  function isUnread(message: InboxMessage) {
    if (viewedUnread.value.includes(message.id)) return true
    return (message.createdAt?.getTime() ?? 0) > lastReadAt.value
  }

  function writeLocal() {
    if (import.meta.server) return
    localStorage.setItem(LAST_READ_KEY, String(lastReadAt.value))
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedIds.value))
  }

  let persistTimer: ReturnType<typeof setTimeout> | null = null

  /** Local storage updates immediately; Firestore catches up once per burst. */
  function persist() {
    writeLocal()
    if (import.meta.server) return
    const uid = auth.user.value?.uid
    const db = useNuxtApp().$firebaseDb as Firestore | null
    if (!uid || !db) return
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      void setDoc(doc(db, 'notificationState', uid), {
        userId: uid,
        lastReadAt: lastReadAt.value,
        dismissedIds: dismissedIds.value.slice(-DISMISSED_CAP),
        updatedAt: serverTimestamp()
      }).catch(() => {
        // Local storage already holds it; the next change retries the write.
      })
    }, PERSIST_DEBOUNCE_MS)
  }

  async function loadState(db: Firestore, uid: string) {
    const localRead = Number(readLocal<string | number>(LAST_READ_KEY, 0)) || 0
    const localDismissed = readLocal<string[]>(DISMISSED_KEY, [])
    let remoteRead = 0
    let remoteDismissed: string[] = []
    try {
      const snap = await getDoc(doc(db, 'notificationState', uid))
      const data = snap.exists() ? snap.data() : null
      if (data) {
        remoteRead = Number(data.lastReadAt) || 0
        remoteDismissed = Array.isArray(data.dismissedIds) ? data.dismissedIds.map(String) : []
      }
    } catch {
      // Offline or blocked: the local mirror is enough to render correctly.
    }
    // Union rather than last-write-wins, so two devices cannot undo each other.
    const merged = Array.from(new Set([...localDismissed, ...remoteDismissed]))
    dismissedIds.value = merged.slice(-DISMISSED_CAP)
    const read = Math.max(localRead, remoteRead)
    // A first-time reader starts from now, so history does not arrive unread.
    lastReadAt.value = read || Date.now()
    if (!read) persist()
  }

  async function load(force = false) {
    if (import.meta.server || loading.value) return
    if (loaded.value && !force) return
    const uid = auth.user.value?.uid
    if (!uid) {
      all.value = []
      loaded.value = false
      return
    }
    const db = useNuxtApp().$firebaseDb as Firestore | null
    if (!db) return

    loading.value = true
    error.value = ''
    try {
      await loadState(db, uid)
      // Admins also see their own test sends. Everyone else's subcollection is
      // simply empty, so this costs one read and needs no role check.
      const [announcements, tests] = await Promise.all([
        getDocs(query(
          collection(db, 'notifications'),
          orderBy('createdAt', 'desc'),
          limit(INBOX_LIMIT)
        )),
        getDocs(query(
          collection(db, 'testNotifications', uid, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(TEST_LIMIT)
        )).catch(() => null)
      ])
      all.value = [
        ...announcements.docs.map(item => toMessage(item.id, item.data(), false)),
        ...(tests?.docs.map(item => toMessage(item.id, item.data(), true)) ?? [])
      ].sort(newestFirst).slice(0, INBOX_LIMIT)
      loaded.value = true
    } catch {
      error.value = 'Could not load your notifications just now.'
    } finally {
      loading.value = false
    }
  }

  /** Called when the panel opens: clears the badge, keeps this view's dots. */
  function markAllRead() {
    viewedUnread.value = messages.value.filter(
      item => (item.createdAt?.getTime() ?? 0) > lastReadAt.value
    ).map(item => item.id)
    const newest = messages.value[0]?.createdAt?.getTime() ?? 0
    lastReadAt.value = Math.max(lastReadAt.value, newest, Date.now())
    persist()
  }

  function clearViewedUnread() {
    viewedUnread.value = []
  }

  function dismiss(id: string) {
    if (dismissed.value.has(id)) return
    dismissedIds.value = [...dismissedIds.value, id].slice(-DISMISSED_CAP)
    persist()
  }

  function restore(id: string) {
    dismissedIds.value = dismissedIds.value.filter(item => item !== id)
    persist()
  }

  return {
    messages,
    groups,
    loading,
    loaded,
    error,
    unreadCount,
    load,
    markAllRead,
    clearViewedUnread,
    dismiss,
    restore,
    isUnread,
    detailPathFor
  }
}
