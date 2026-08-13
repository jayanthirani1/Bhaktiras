import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type Firestore
} from 'firebase/firestore'
import type { CrosswordPuzzle, Event, QuizQuestion, TimelineItem, WordleWordDoc } from '~/types'
import type { SpellingBeePuzzle } from '~/data/spellingBeePuzzles'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

function requireDb() {
  const db = getDb()
  if (!db) throw new Error('Firebase not configured')
  return db
}

/** Always use the Firestore document ID — never a field named `id` inside the doc. */
export function mapAdminItem<T extends { id: string }>(docId: string, data: DocumentData): T {
  const rest = { ...data } as Record<string, unknown>
  delete rest.id
  return { ...rest, id: docId } as T
}

function writePayload(data: Record<string, unknown>) {
  const rest = { ...data }
  delete rest.id
  return { ...rest, updatedAt: serverTimestamp() }
}

export function useAdminCollection<T extends { id: string }>(name: string) {
  const items = ref<T[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      const db = requireDb()
      const snap = await getDocs(collection(db, name))
      items.value = snap.docs.map(d => mapAdminItem<T>(d.id, d.data()))
    } catch (e) {
      error.value = (e as Error).message
      items.value = []
    } finally {
      loading.value = false
    }
  }

  async function create(data: Record<string, unknown>) {
    saving.value = true
    error.value = ''
    try {
      const db = requireDb()
      const ref = await addDoc(collection(db, name), writePayload(data))
      await fetchAll()
      return ref.id
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function updateItem(id: string, data: Record<string, unknown>) {
    if (!id) throw new Error('Missing document id')
    saving.value = true
    error.value = ''
    try {
      const db = requireDb()
      await updateDoc(doc(db, name, id), writePayload(data))
      await fetchAll()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      saving.value = false
    }
  }

  async function remove(id: string) {
    if (!id) throw new Error('Missing document id')
    saving.value = true
    error.value = ''
    try {
      const db = requireDb()
      await deleteDoc(doc(db, name, id))
      await fetchAll()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      saving.value = false
    }
  }

  return { items, loading, saving, error, fetchAll, create, updateItem, update: updateItem, remove }
}

export function useAdminTimeline() {
  return useAdminCollection<TimelineItem>('timeline')
}
export function useAdminEvents() {
  return useAdminCollection<Event>('events')
}
export function useAdminWordleWords() {
  return useAdminCollection<WordleWordDoc>('wordleWords')
}
export function useAdminQuiz() {
  return useAdminCollection<QuizQuestion>('quizQuestions')
}
export function useAdminCrossword() {
  return useAdminCollection<CrosswordPuzzle>('crosswordPuzzles')
}
export function useAdminSpellingBee() {
  return useAdminCollection<SpellingBeePuzzle & { id: string }>('spellingBeePuzzles')
}
