import { doc, getDoc, type Firestore } from 'firebase/firestore'
import type { LegalSlug, SitePage } from '~/types'
import { DEFAULT_LEGAL_PAGES } from '~/data/legalPages'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

export function useSitePage(slug: LegalSlug) {
  const page = ref<SitePage>({ ...DEFAULT_LEGAL_PAGES[slug] })
  const loading = ref(true)
  const fromCms = ref(false)

  async function fetchPage() {
    loading.value = true
    const fallback = DEFAULT_LEGAL_PAGES[slug]
    const db = getDb()
    if (!db) {
      page.value = { ...fallback }
      fromCms.value = false
      loading.value = false
      return
    }
    try {
      const snap = await getDoc(doc(db, 'sitePages', slug))
      if (snap.exists()) {
        const data = snap.data()
        page.value = {
          id: slug,
          title: String(data.title || fallback.title),
          body: String(data.body || fallback.body),
          updatedAt: data.updatedAt
        }
        fromCms.value = true
      } else {
        page.value = { ...fallback }
        fromCms.value = false
      }
    } catch {
      page.value = { ...fallback }
      fromCms.value = false
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchPage)

  return { page, loading, fromCms, fetchPage }
}
