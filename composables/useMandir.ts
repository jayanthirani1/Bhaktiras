import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
  type Firestore
} from 'firebase/firestore'
import type { TimelineItem, TimelineMedia, Event, GratitudeMessage, VolunteerRole, TimeCapsuleMessage, SevaHourLog } from '~/types'
import { JOURNEY_MILESTONES } from '~/data/timeline'

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
        items.value = [...JOURNEY_MILESTONES].sort((a, b) => a.year.localeCompare(b.year))
        error.value = null
        return
      }
      const snap = await getDocs(collection(db, 'timeline'))
      const remote = snap.docs.map((d) => {
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
          imageUrl: data.imageUrl ?? null,
          videoUrl: data.videoUrl ?? null,
          media
        })
      })
      const byId = new Map<string, TimelineItem>()
      for (const m of JOURNEY_MILESTONES) byId.set(m.id, { ...m, media: m.media ?? [] })
      for (const r of remote) byId.set(r.id, r)
      items.value = Array.from(byId.values()).sort((a, b) => {
        const y = a.year.localeCompare(b.year)
        if (y !== 0) return y
        return (a.date || '').localeCompare(b.date || '')
      })
    } catch (e) {
      error.value = e as Error
      items.value = [...JOURNEY_MILESTONES].sort((a, b) => a.year.localeCompare(b.year))
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
            date: data.date || data.time || '',
            description: data.description || '',
            posterUrl: data.posterUrl ?? null,
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

export function useGratitudeMessages() {
  const items = ref<GratitudeMessage[]>([])
  const loading = ref(true)

  async function fetchGratitude() {
    loading.value = true
    try {
      const db = getDb()
      if (!db) { items.value = []; return }
      const snap = await getDocs(collection(db, 'gratitude'))
      items.value = snap.docs.map((d) => {
        const data = d.data()
        return mapDoc<GratitudeMessage>(d.id, {
          ...data,
          name: data.anonymous ? 'Anonymous' : (data.name || 'Anonymous'),
          prompt: data.prompt ?? null,
          anonymous: !!data.anonymous,
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
      const nameTrim = data.name?.trim() || ''
      const anonymous = data.anonymous === true || !nameTrim
      const name = anonymous ? 'Anonymous' : nameTrim
      const payload = {
        name,
        message: data.message.trim(),
        prompt: data.prompt?.trim() || null,
        anonymous,
        createdAt: serverTimestamp()
      }
      const ref = await addDoc(collection(db, 'gratitude'), payload)
      return { id: ref.id, ...payload, createdAt: new Date() }
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

export function useSevaHours() {
  const logs = ref<SevaHourLog[]>([])
  const loading = ref(true)
  const pending = ref(false)

  const totalHours = computed(() =>
    logs.value.reduce((sum, l) => sum + (Number(l.hours) || 0), 0)
  )

  async function fetchHours() {
    loading.value = true
    try {
      const db = getDb()
      if (!db) { logs.value = []; return }
      const snap = await getDocs(collection(db, 'sevaHours'))
      logs.value = snap.docs.map((d) =>
        mapDoc<SevaHourLog>(d.id, { hours: Number(d.data().hours) || 0, createdAt: d.data().createdAt })
      )
    } catch (_) {
      logs.value = []
    } finally {
      loading.value = false
    }
  }

  async function logHours(hours: number) {
    const h = Math.round(hours * 10) / 10
    if (h < 0.5 || h > 24) throw new Error('Enter between 0.5 and 24 hours')
    const db = getDb()
    if (!db) throw new Error('Firebase not configured')
    pending.value = true
    try {
      await addDoc(collection(db, 'sevaHours'), {
        hours: h,
        createdAt: serverTimestamp()
      })
      await fetchHours()
    } finally {
      pending.value = false
    }
  }

  onMounted(() => { fetchHours() })
  return { logs, totalHours, isLoading: loading, isPending: pending, logHours, refetch: fetchHours }
}
