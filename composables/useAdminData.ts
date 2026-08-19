import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Firestore
} from 'firebase/firestore'
import type { ConnectionsPuzzle, CrosswordPuzzle, Event, GameWordEntry, Niyam, OnePercentQuestion, SiteContentSettings, SitePage, TimelineItem, WordleWordDoc, YajmanOpportunity } from '~/types'
import {
  communityPromptsFromSource,
  homeTilesFromSource,
  navItemsFromSource,
  parseCommunityPrompts,
  parseHomeTiles,
  parseNavItems,
  SITE_CONTENT_DOC_ID,
  siteContentWritePayload
} from '~/data/siteContent'

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

  async function setItem(id: string, data: Record<string, unknown>) {
    if (!id) throw new Error('Missing document id')
    saving.value = true
    error.value = ''
    try {
      const db = requireDb()
      await setDoc(doc(db, name, id), writePayload(data), { merge: true })
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

  return { items, loading, saving, error, fetchAll, create, setItem, updateItem, update: updateItem, remove }
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
export function useAdminGameWords() {
  return useAdminCollection<GameWordEntry>('gameWords')
}
export function useAdminNiyams() {
  return useAdminCollection<Niyam>('niyams')
}
export function useAdminYajmanOpportunities() {
  return useAdminCollection<YajmanOpportunity>('yajmanOpportunities')
}
export function useAdminOnePercent() {
  return useAdminCollection<OnePercentQuestion>('onePercentQuestions')
}
export function useAdminMiniCrossword() {
  return useAdminCollection<CrosswordPuzzle>('miniCrosswordPuzzles')
}
export function useAdminConnections() {
  return useAdminCollection<ConnectionsPuzzle>('connectionsPuzzles')
}

export function useAdminSitePages() {
  const items = ref<SitePage[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      const db = requireDb()
      const snap = await getDocs(collection(db, 'sitePages'))
      items.value = snap.docs.map(d => mapAdminItem<SitePage>(d.id, d.data()))
    } catch (e) {
      error.value = (e as Error).message
      items.value = []
    } finally {
      loading.value = false
    }
  }

  async function save(id: string, data: { title: string, body: string }) {
    if (!id) throw new Error('Missing page id')
    saving.value = true
    error.value = ''
    try {
      const db = requireDb()
      await setDoc(doc(db, 'sitePages', id), writePayload({ title: data.title, body: data.body }), { merge: true })
      await fetchAll()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      saving.value = false
    }
  }

  return { items, loading, saving, error, fetchAll, save }
}

export function useAdminSiteContent() {
  const item = ref<SiteContentSettings>({
    id: SITE_CONTENT_DOC_ID,
    homeTiles: homeTilesFromSource(undefined),
    navItems: navItemsFromSource(undefined),
    communityPrompts: communityPromptsFromSource(undefined)
  })
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const db = requireDb()
      const ref = doc(db, 'siteContent', SITE_CONTENT_DOC_ID)
      const snap = await getDoc(ref)
      const data = snap.exists() ? snap.data() : {}
      const next = {
        homeTiles: homeTilesFromSource(data.homeTiles),
        navItems: navItemsFromSource(data.navItems),
        communityPrompts: communityPromptsFromSource(data.communityPrompts)
      }
      const needsSeed = !snap.exists()
        || !Array.isArray(data.homeTiles)
        || !data.homeTiles.length
        || !Array.isArray(data.navItems)
        || !data.navItems.length
        || !Array.isArray(data.communityPrompts)
        || !data.communityPrompts.length
      if (needsSeed) {
        await setDoc(ref, { ...siteContentWritePayload(next), updatedAt: serverTimestamp() }, { merge: true })
      }
      item.value = { id: SITE_CONTENT_DOC_ID, ...next, updatedAt: data.updatedAt }
    } catch (e) {
      error.value = (e as Error).message
      item.value = {
        id: SITE_CONTENT_DOC_ID,
        homeTiles: homeTilesFromSource(undefined),
        navItems: navItemsFromSource(undefined),
        communityPrompts: communityPromptsFromSource(undefined)
      }
    } finally {
      loading.value = false
    }
  }

  async function save(data: Partial<Pick<SiteContentSettings, 'homeTiles' | 'navItems' | 'communityPrompts'>>) {
    saving.value = true
    error.value = ''
    try {
      const db = requireDb()
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }
      if (data.homeTiles !== undefined) payload.homeTiles = parseHomeTiles(data.homeTiles)
      if (data.navItems !== undefined) payload.navItems = parseNavItems(data.navItems)
      if (data.communityPrompts !== undefined) payload.communityPrompts = parseCommunityPrompts(data.communityPrompts)
      await setDoc(doc(db, 'siteContent', SITE_CONTENT_DOC_ID), payload, { merge: true })
      await load()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      saving.value = false
    }
  }

  return { item, loading, saving, error, load, save }
}
