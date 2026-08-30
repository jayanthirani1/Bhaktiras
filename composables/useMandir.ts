import {
  collection,
  getDocs,
  addDoc,
  doc,
  writeBatch,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type DocumentData,
  type Firestore
} from 'firebase/firestore'
import { normalizeEventDateId } from '~/utils/eventSharing'
import type {
  TimelineItem,
  TimelineMedia,
  Event,
  GratitudeMessage,
  CommunityReactionCounts,
  VolunteerRole,
  TimeCapsuleMessage
} from '~/types'
import { compareTimelineItems } from '~/data/timeline'
import { COMMUNITY_REACTIONS } from '~/data/communityReactions'

/** Newest notes shown on the community wall in one page. */
const GRATITUDE_PAGE_SIZE = 60

/** Max length for time capsule message (chars). */
export const TIME_CAPSULE_MESSAGE_MAX_LENGTH = 1000

function getDb(): Firestore | null {
  // Only access Firebase on client (plugin runs in firebase.client.ts)
  if (import.meta.server) return null
  const nuxtApp = useNuxtApp()
  return (nuxtApp.$firebaseDb as Firestore | null) ?? null
}
function mapDoc<T>(id: string, data: DocumentData): T {
  const rest = { ...data } as Record<string, unknown>
  delete rest.id
  return { ...rest, id } as T
}

function mapTimestamp(d: unknown): Date | undefined {
  if (!d || typeof d !== 'object') return undefined
  const t = (d as { seconds?: number }).seconds
  return t ? new Date(t * 1000) : undefined
}

export function useTimeline() {
  const items = ref<TimelineItem[]>([])
  const loading = ref(true)
  const error = ref<Error | null>(null)

  async function fetchTimeline() {
    loading.value = true
    error.value = null
    try {
      const db = getDb()
      if (!db) {
        items.value = []
        error.value = null
        return
      }
      const snap = await getDocs(collection(db, 'timeline'))
      items.value = snap.docs.map((d) => {
        const data = d.data()
        const media = Array.isArray(data.media) ? (data.media as TimelineMedia[]) : []
        if (data.imageUrl && !media.some(m => m.url === data.imageUrl)) {
          media.unshift({ type: 'image', url: data.imageUrl })
        }
        if (data.videoUrl && !media.some(m => m.url === data.videoUrl)) {
          media.push({ type: 'video', url: data.videoUrl })
        }
        return mapDoc<TimelineItem>(d.id, {
          ...data,
          year: String(data.year ?? ''),
          imageUrl: data.imageUrl ?? null,
          videoUrl: data.videoUrl ?? null,
          media
        })
      }).sort(compareTimelineItems)
    } catch (e) {
      error.value = e as Error
      items.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => { fetchTimeline() })
  return { timeline: items, isLoading: loading, error, refetch: fetchTimeline }
}

export function useEvents() {
  const items = ref<Event[]>([])
  const loading = ref(true)

  async function fetchEvents() {
    loading.value = true
    try {
      const db = getDb()
      if (!db) { items.value = []; return }
      const snap = await getDocs(collection(db, 'events'))
      items.value = snap.docs
        .map((d) => {
          const data = d.data()
          return mapDoc<Event>(d.id, {
            title: data.title || '',
            date: normalizeEventDateId(data.date || data.time || ''),
            description: data.description || '',
            posterUrl: data.posterUrl ?? null,
            flickrAlbumId: data.flickrAlbumId ?? null,
            time: data.time ?? null,
            isLive: data.isLive ?? false
          })
        })
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    } catch (e) {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => { fetchEvents() })
  return { events: items, isLoading: loading, refetch: fetchEvents }
}

/**
 * Keep only the five keys the wall knows about, and only sane numbers.
 *
 * The rules stop a browser writing anything else, but an admin edit or an
 * older document can still leave something odd here, and a stray key would
 * otherwise render as a blank pill. Counts are clamped at zero rather than
 * hidden: a negative tally is a bug to be swallowed in the display, not a
 * reason to drop the post.
 */
function readReactionCounts(raw: unknown): CommunityReactionCounts {
  if (!raw || typeof raw !== 'object') return {}
  const source = raw as Record<string, unknown>
  const counts: CommunityReactionCounts = {}
  for (const { key } of COMMUNITY_REACTIONS) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      counts[key] = Math.floor(value)
    }
  }
  return counts
}

export function useGratitudeMessages() {
  const items = ref<GratitudeMessage[]>([])
  const loading = ref(true)

  async function fetchGratitude() {
    loading.value = true
    try {
      const db = getDb()
      if (!db) { items.value = []; return }
      const snap = await getDocs(query(
        collection(db, 'gratitude'),
        orderBy('createdAt', 'desc'),
        limit(GRATITUDE_PAGE_SIZE)
      ))
      items.value = snap.docs.map((d) => {
        const data = d.data()
        return mapDoc<GratitudeMessage>(d.id, {
          ...data,
          name: data.anonymous ? 'Anonymous' : (data.name || 'Anonymous'),
          prompt: data.prompt ?? null,
          anonymous: !!data.anonymous,
          reactions: readReactionCounts(data.reactions),
          createdAt: data.createdAt ?? undefined
        })
      })
      items.value.sort((a, b) => {
        const toMs = (x: GratitudeMessage['createdAt']) =>
          typeof x === 'object' && x && 'seconds' in x ? (x as { seconds: number }).seconds * 1000 : x instanceof Date ? x.getTime() : 0
        return toMs(b.createdAt) - toMs(a.createdAt)
      })
    } catch (_) {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => { fetchGratitude() })
  return { messages: items, isLoading: loading, refetch: fetchGratitude }
}

export function useCreateGratitudeMessage() {
  const pending = ref(false)

  async function create(data: { name?: string; message: string; prompt?: string; anonymous?: boolean }) {
    pending.value = true
    try {
      const db = getDb()
      if (!db) throw new Error('Firebase is not configured, so the wall cannot save yet. Check .env and restart the dev server.')
      // Posting is signed-in only, so a note can no longer be signed with
      // someone else's name.
      //
      // But an anonymous post must not carry `userId`. The wall is world
      // readable, and `playStreaks` is a public uid-to-name map — so a stored
      // uid made "anonymous" a UI mask over a document that named its author to
      // anyone willing to make two requests. The author link for an anonymous
      // post lives in `gratitudeAuthors`, which only admins can read, so
      // moderation still works and the wall itself gives nothing away.
      const auth = useNuxtApp().$firebaseAuth as import('firebase/auth').Auth | null
      const uid = auth?.currentUser?.uid
      if (!uid) throw new Error('Please sign in to add your message to the wall.')
      const nameTrim = data.name?.trim().slice(0, 50) || ''
      const anonymous = data.anonymous === true || !nameTrim
      const name = anonymous ? 'Anonymous' : nameTrim
      const payload: Record<string, unknown> = {
        name,
        message: data.message.trim(),
        prompt: data.prompt?.trim().slice(0, 120) || null,
        anonymous,
        createdAt: serverTimestamp()
      }
      // A signed post already names its author, so nothing is gained by hiding
      // the uid there — and keeping it lets the author delete their own note.
      if (!anonymous) payload.userId = uid

      // Both writes or neither: a post whose author record failed to save would
      // be unmoderatable, and an author record with no post is a dangling link.
      const postRef = doc(collection(db, 'gratitude'))
      const batch = writeBatch(db)
      batch.set(postRef, payload)
      batch.set(doc(db, 'gratitudeAuthors', postRef.id), {
        postId: postRef.id,
        userId: uid,
        createdAt: serverTimestamp()
      })
      await batch.commit()
      return { id: postRef.id, ...payload, createdAt: new Date() }
    } finally {
      pending.value = false
    }
  }

  return { create, isPending: pending }
}
export function useVolunteerRoles() {
  const items = ref<VolunteerRole[]>([])
  const loading = ref(true)

  async function fetchVolunteers() {
    loading.value = true
    try {
      const db = getDb()
      if (!db) { items.value = []; return }
      const snap = await getDocs(collection(db, 'volunteerRoles'))
      items.value = snap.docs.map((d) =>
        mapDoc<VolunteerRole>(d.id, { ...d.data(), isFilled: d.data().isFilled ?? false })
      )
    } catch (_) {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => { fetchVolunteers() })
  return { roles: items, isLoading: loading, refetch: fetchVolunteers }
}

export function useVolunteerSignUp() {
  const pending = ref(false)

  async function signUp(id: string) {
    pending.value = true
    try {
      const db = getDb()
      if (!db) throw new Error('Firebase not configured')
      await updateDoc(doc(db, 'volunteerRoles', id), { isFilled: true })
      const snap = await getDocs(collection(db, 'volunteerRoles'))
      const found = snap.docs.find((d) => d.id === id)
      return found ? mapDoc<VolunteerRole>(found.id, { ...found.data(), isFilled: true }) : undefined
    } finally {
      pending.value = false
    }
  }

  return { signUp, isPending: pending }
}

export function useCreateTimeCapsuleMessage() {
  const pending = ref(false)

  async function create(data: { message: string }) {
    const trimmed = data.message.trim()
    if (trimmed.length > TIME_CAPSULE_MESSAGE_MAX_LENGTH) {
      throw new Error(`Message must be ${TIME_CAPSULE_MESSAGE_MAX_LENGTH} characters or fewer.`)
    }
    pending.value = true
    try {
      const db = getDb()
      if (!db) throw new Error('Firebase not configured')
      const ref = await addDoc(collection(db, 'timeCapsule'), {
        message: trimmed,
        submittedAt: serverTimestamp()
      })
      return { id: ref.id, message: trimmed, submittedAt: new Date() }
    } finally {
      pending.value = false
    }
  }

  return { create, isPending: pending }
}