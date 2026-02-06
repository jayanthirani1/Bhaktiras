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
import type { TimelineItem, Event, GratitudeMessage, VolunteerRole, TimeCapsuleMessage } from '~/types'

function getDb(): Firestore | null {
  return useNuxtApp().$firebaseDb as Firestore | null
}

function mapDoc<T>(id: string, data: DocumentData): T {
  return { id, ...data } as T
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
      if (!db) { items.value = []; return }
      const snap = await getDocs(collection(db, 'timeline'))
      items.value = snap.docs.map((d) =>
        mapDoc<TimelineItem>(d.id, { ...d.data(), imageUrl: d.data().imageUrl ?? null })
      )
      items.value.sort((a, b) => a.year.localeCompare(b.year))
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchTimeline)
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
      items.value = snap.docs.map((d) =>
        mapDoc<Event>(d.id, { ...d.data(), isLive: d.data().isLive ?? false })
      )
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchEvents)
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
          createdAt: data.createdAt ?? undefined
        })
      })
      items.value.sort((a, b) => {
        const toMs = (x: GratitudeMessage['createdAt']) =>
          typeof x === 'object' && x && 'seconds' in x ? (x as { seconds: number }).seconds * 1000 : x instanceof Date ? x.getTime() : 0
        return toMs(b.createdAt) - toMs(a.createdAt)
      })
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchGratitude)
  return { messages: items, isLoading: loading, refetch: fetchGratitude }
}

export function useCreateGratitudeMessage() {
  const pending = ref(false)

  async function create(data: { name: string; message: string }) {
    pending.value = true
    try {
      const db = getDb()
      if (!db) throw new Error('Firebase not configured')
      const ref = await addDoc(collection(db, 'gratitude'), {
        ...data,
        createdAt: serverTimestamp()
      })
      return { id: ref.id, ...data, createdAt: new Date() }
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
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchVolunteers)
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
    pending.value = true
    try {
      const db = getDb()
      if (!db) throw new Error('Firebase not configured')
      const ref = await addDoc(collection(db, 'timeCapsule'), {
        ...data,
        submittedAt: serverTimestamp()
      })
      return { id: ref.id, ...data, submittedAt: new Date() }
    } finally {
      pending.value = false
    }
  }

  return { create, isPending: pending }
}
