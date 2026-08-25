import { getCurrentInstance } from 'vue'
import { doc, getDoc, type Firestore } from 'firebase/firestore'
import type { SiteContentSettings, SiteSectionContent } from '~/types'
import {
  DEFAULT_SITE_CONTENT,
  communityPromptsFromSource,
  homeTilesFromSource,
  navItemsFromSource,
  parseContentRevision,
  parseSevaHeading,
  parseSevaIntro,
  sevaTeamsFromSource,
  SITE_CONTENT_DOC_ID
} from '~/data/siteContent'
import { linkIsVisible, sectionForPath, siteSectionsFromSource } from '~/data/siteSections'

/** Where the section switches are cached so a repeat visit hides things before Firestore answers. */
const GATE_CACHE_KEY = 'bhaktiras:site-gates'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

/**
 * Shared across every caller so a route guard and a component asking at the same
 * moment wait on one request rather than the second returning early with defaults.
 */
let inFlight: Promise<void> | null = null

interface GateCache {
  sections: Array<{ id: string, visible: boolean }>
}

function readGateCache(): GateCache | null {
  if (import.meta.server || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(GATE_CACHE_KEY)
    return raw ? JSON.parse(raw) as GateCache : null
  } catch {
    return null
  }
}

function writeGateCache(sections: SiteSectionContent[]) {
  if (import.meta.server || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(GATE_CACHE_KEY, JSON.stringify({
      sections: sections.map(section => ({ id: section.id, visible: section.visible }))
    }))
  } catch {
    // A full or blocked store just means the first paint waits for Firestore.
  }
}

export function useSiteContent() {
  const content = useState<SiteContentSettings>('site-content', () => ({ ...DEFAULT_SITE_CONTENT }))
  const loading = useState<boolean>('site-content-loading', () => false)
  const fromCms = useState<boolean>('site-content-from-cms', () => false)

  async function fetchContent(force = false) {
    if (inFlight && !force) return inFlight
    if (fromCms.value && !force) return
    const db = getDb()
    if (!db) {
      content.value = fallbackContent()
      fromCms.value = false
      return
    }
    loading.value = true
    inFlight = (async () => {
      try {
        const snap = await getDoc(doc(db, 'siteContent', SITE_CONTENT_DOC_ID))
        if (!snap.exists()) {
          content.value = fallbackContent()
          fromCms.value = false
          return
        }
        const data = snap.data()
        content.value = {
          id: SITE_CONTENT_DOC_ID,
          // Stored tiles or nav older than the current defaults are ignored, so the
          // page does not flip back to stale content a moment after every load.
          homeTiles: homeTilesFromSource(data.homeTiles, data.homeTilesRevision),
          homeTilesRevision: parseContentRevision(data.homeTilesRevision),
          navItems: navItemsFromSource(data.navItems, data.navItemsRevision),
          navItemsRevision: parseContentRevision(data.navItemsRevision),
          communityPrompts: communityPromptsFromSource(data.communityPrompts),
          sevaHeading: parseSevaHeading(data.sevaHeading),
          sevaIntro: parseSevaIntro(data.sevaIntro),
          sevaTeams: sevaTeamsFromSource(data.sevaTeams),
          sections: siteSectionsFromSource(data.sections),
          updatedAt: data.updatedAt
        }
        fromCms.value = true
        writeGateCache(content.value.sections)
      } catch {
        content.value = fallbackContent()
        fromCms.value = false
      } finally {
        loading.value = false
        inFlight = null
      }
    })()
    return inFlight
  }

  /**
   * Applies the last known section switches straight from localStorage.
   *
   * Without it a hidden section is on screen for as long as Firestore takes to
   * answer. Only the switches are cached — the content itself still comes from
   * the network, so a stale cache can hide something for one paint at worst.
   */
  function applyCachedGates() {
    if (fromCms.value) return
    const cache = readGateCache()
    if (!cache) return
    content.value = {
      ...content.value,
      sections: siteSectionsFromSource(cache.sections)
    }
  }

  /**
   * Static content, but keeping whatever switches are already in hand.
   *
   * Without this, a failed read — or a dev server with no Firebase config —
   * would reset every section to visible a moment after the cached switches
   * were applied, flashing a hidden section back onto the screen.
   */
  function fallbackContent(): SiteContentSettings {
    return {
      ...DEFAULT_SITE_CONTENT,
      sections: content.value.sections
    }
  }

  const sections = computed(() => content.value.sections)

  function isSectionVisible(id: string) {
    return sections.value.find(section => section.id === id)?.visible !== false
  }

  /** The section that owns a route, hidden or not. */
  function sectionFor(path: string) {
    return sectionForPath(sections.value, path)
  }

  /** False when a route sits in a switched-off section. */
  function pathIsVisible(path: string) {
    const section = sectionFor(path)
    return !section || section.visible
  }

  const homeTiles = computed(() => content.value.homeTiles.filter(item =>
    item.active !== false && linkIsVisible(sections.value, item.href)))
  const navItems = computed(() => content.value.navItems.filter(item =>
    item.active !== false && linkIsVisible(sections.value, item.href)))
  const communityPrompts = computed(() => content.value.communityPrompts.filter(item => item.active !== false).map(item => item.text))
  const sevaHeading = computed(() => content.value.sevaHeading)
  const sevaIntro = computed(() => content.value.sevaIntro)
  const sevaTeams = computed(() => content.value.sevaTeams.filter(item => item.active !== false))

  // Route middleware calls this composable outside of a component, where there
  // is no mount to hook — it awaits `fetchContent` itself instead.
  if (getCurrentInstance()) {
    onMounted(() => {
      applyCachedGates()
      void fetchContent()
    })
  }

  return {
    content,
    homeTiles,
    navItems,
    communityPrompts,
    sevaHeading,
    sevaIntro,
    sevaTeams,
    sections,
    isSectionVisible,
    sectionFor,
    pathIsVisible,
    loading,
    fromCms,
    fetchContent
  }
}
