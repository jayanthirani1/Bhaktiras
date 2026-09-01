import { collection, doc, getDoc, getDocs, type Firestore } from 'firebase/firestore'
import type { NiyamDocument } from '~/types'
import { mapNiyamDocument } from '~/utils/niyamDocument'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

/** Public read of niyam reading documents. */
export function useNiyamDocuments() {
  const documents = useState<NiyamDocument[]>('niyam-documents-all', () => [])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll(activeOnly = true) {
    const db = getDb()
    if (!db) {
      error.value = 'Firebase is not configured'
      return
    }
    loading.value = true
    error.value = ''
    try {
      const snap = await getDocs(collection(db, 'niyamDocuments'))
      let list = snap.docs.map(d => mapNiyamDocument(d.id, d.data() as Record<string, unknown>))
      if (activeOnly) list = list.filter(item => item.active)
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title))
      documents.value = list
    } catch (e) {
      error.value = (e as Error).message
      documents.value = []
    } finally {
      loading.value = false
    }
  }

  function documentById(id: string | null | undefined): NiyamDocument | null {
    const cleaned = (id || '').trim()
    if (!cleaned) return null
    return documents.value.find(item => item.id === cleaned) ?? null
  }

  return {
    documents,
    loading,
    error,
    fetchAll,
    documentById
  }
}

/** Load one document by id — for the reader page. */
export function useNiyamDocument(documentId: Ref<string> | ComputedRef<string>) {
  const document = ref<NiyamDocument | null>(null)
  const loading = ref(false)
  const error = ref('')
  const notFound = ref(false)

  async function fetchDocument() {
    const id = unref(documentId).trim()
    if (!id) {
      document.value = null
      notFound.value = true
      return
    }
    const db = getDb()
    if (!db) {
      error.value = 'Firebase is not configured'
      return
    }
    loading.value = true
    error.value = ''
    notFound.value = false
    document.value = null
    try {
      const snap = await getDoc(doc(db, 'niyamDocuments', id))
      if (!snap.exists()) {
        notFound.value = true
        return
      }
      const mapped = mapNiyamDocument(snap.id, snap.data() as Record<string, unknown>)
      if (!mapped.active) {
        notFound.value = true
        return
      }
      document.value = mapped
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  watch(documentId, () => {
    void fetchDocument()
  }, { immediate: true })

  return {
    document,
    loading,
    error,
    notFound,
    fetchDocument
  }
}

export function niyamDocumentPath(
  documentId: string | null | undefined,
  niyamId?: string | null
): string | null {
  const id = (documentId || '').trim()
  if (!id) return null
  const base = `/documents/${encodeURIComponent(id)}`
  const niyam = (niyamId || '').trim()
  return niyam ? `${base}?niyam=${encodeURIComponent(niyam)}` : base
}
