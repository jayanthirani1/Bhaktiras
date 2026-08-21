import { doc, getDoc, type Firestore } from 'firebase/firestore'
import type { SiteContentSettings } from '~/types'
import {
  DEFAULT_SITE_CONTENT,
  communityPromptsFromSource,
  homeTilesFromSource,
  navItemsFromSource,
  parseSevaHeading,
  parseSevaIntro,
  sevaTeamsFromSource,
  SITE_CONTENT_DOC_ID
} from '~/data/siteContent'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

export function useSiteContent() {
  const content = useState<SiteContentSettings>('site-content', () => ({ ...DEFAULT_SITE_CONTENT }))
  const loading = useState<boolean>('site-content-loading', () => false)
  const fromCms = useState<boolean>('site-content-from-cms', () => false)

  async function fetchContent(force = false) {
    if (loading.value || (fromCms.value && !force)) return
    const db = getDb()
    if (!db) {
      content.value = { ...DEFAULT_SITE_CONTENT }
      fromCms.value = false
      return
    }
    loading.value = true
    try {
      const snap = await getDoc(doc(db, 'siteContent', SITE_CONTENT_DOC_ID))
      if (!snap.exists()) {
        content.value = { ...DEFAULT_SITE_CONTENT }
        fromCms.value = false
        return
      }
      const data = snap.data()
      content.value = {
        id: SITE_CONTENT_DOC_ID,
        homeTiles: homeTilesFromSource(data.homeTiles),
        navItems: navItemsFromSource(data.navItems),
        communityPrompts: communityPromptsFromSource(data.communityPrompts),
        sevaHeading: parseSevaHeading(data.sevaHeading),
        sevaIntro: parseSevaIntro(data.sevaIntro),
        sevaTeams: sevaTeamsFromSource(data.sevaTeams),
        updatedAt: data.updatedAt
      }
      fromCms.value = true
    } catch {
      content.value = { ...DEFAULT_SITE_CONTENT }
      fromCms.value = false
    } finally {
      loading.value = false
    }
  }

  const homeTiles = computed(() => content.value.homeTiles.filter(item => item.active !== false))
  const navItems = computed(() => content.value.navItems.filter(item => item.active !== false))
  const communityPrompts = computed(() => content.value.communityPrompts.filter(item => item.active !== false).map(item => item.text))
  const sevaHeading = computed(() => content.value.sevaHeading)
  const sevaIntro = computed(() => content.value.sevaIntro)
  const sevaTeams = computed(() => content.value.sevaTeams.filter(item => item.active !== false))

  onMounted(() => { void fetchContent() })

  return { content, homeTiles, navItems, communityPrompts, sevaHeading, sevaIntro, sevaTeams, loading, fromCms, fetchContent }
}
