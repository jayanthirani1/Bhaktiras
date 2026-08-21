import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type DocumentData,
  type Firestore,
  type Timestamp
} from 'firebase/firestore'

export type InboxMessage = {
  id: string
  title: string
  body: string
  url: string
  topic: string
  test: boolean
  createdAt: Date | null
}

const LAST_READ_KEY = 'bhaktiras-inbox-last-read'
const INBOX_LIMIT = 30
const TEST_LIMIT = 10

function toDate(value?: Timestamp | Date | null) {
  if (!value) return null
  return value instanceof Date ? value : value.toDate()
}

function toMessage(id: string, data: DocumentData, test: boolean): InboxMessage {
  return {
    id,
    title: String(data.title || 'Bhaktiras'),
    body: String(data.body || ''),
    url: String(data.url || '/'),
    topic: String(data.topic || 'announcements'),
    test,
    createdAt: toDate(data.createdAt as Timestamp | undefined)
  }
}

function newestFirst(a: InboxMessage, b: InboxMessage) {
  return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
}

/**
 * The in-app copy of everything that went out as a push announcement.
 *
 * A web notification only exists while the OS chooses to show it — dismiss it,
 * or never grant permission, and the message is gone. Cloud Functions mirror
 * every announcement into `notifications`, and this reads them back. Read state
 * is a single timestamp on the device, which needs no write access and no extra
 * document per user.
 */
export function useNotificationInbox() {
  const auth = useAuth()
  const messages = useState<InboxMessage[]>('inbox-messages', () => [])
  const lastReadAt = useState<number>('inbox-last-read', () => 0)
  const loading = useState<boolean>('inbox-loading', () => false)
  const loaded = useState<boolean>('inbox-loaded', () => false)
  const error = useState<string>('inbox-error', () => '')

  const unreadCount = computed(() => messages.value.filter(
    message => (message.createdAt?.getTime() ?? 0) > lastReadAt.value
  ).length)

  /** First run starts from now, so existing history does not arrive pre-unread. */
  function restoreLastRead() {
    if (import.meta.server) return
    const saved = localStorage.getItem(LAST_READ_KEY)
    if (saved) {
      lastReadAt.value = Number(saved) || 0
      return
    }
    lastReadAt.value = Date.now()
    localStorage.setItem(LAST_READ_KEY, String(lastReadAt.value))
  }

  async function load(force = false) {
    if (import.meta.server || loading.value) return
    if (loaded.value && !force) return
    const uid = auth.user.value?.uid
    if (!uid) {
      messages.value = []
      loaded.value = false
      return
    }
    const db = useNuxtApp().$firebaseDb as Firestore | null
    if (!db) return

    loading.value = true
    error.value = ''
    try {
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
      messages.value = [
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

  function markAllRead() {
    const newest = messages.value[0]?.createdAt?.getTime() ?? Date.now()
    lastReadAt.value = Math.max(lastReadAt.value, newest)
    if (import.meta.client) localStorage.setItem(LAST_READ_KEY, String(lastReadAt.value))
  }

  function isUnread(message: InboxMessage) {
    return (message.createdAt?.getTime() ?? 0) > lastReadAt.value
  }

  return { messages, loading, loaded, error, unreadCount, restoreLastRead, load, markAllRead, isUnread }
}
