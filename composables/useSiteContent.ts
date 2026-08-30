import { getCurrentInstance } from 'vue'
import { doc, getDoc, type Firestore } from 'firebase/firestore'
import type { SiteContentSettings } from '~/types'
import {
  DEFAULT_SITE_CONTENT,
  navItemsAreStale,
  navItemsFromSource,
  siteContentFromDocData,
  SITE_CONTENT_DOC_ID
} from '~/data/siteContent'
import { linkIsVisible, sectionForPath, siteSectionsFromSource } from '~/data/siteSections'

/**
 * Where the admin-controlled shell — the section switches and the nav items —
 * is cached, so a repeat visit paints the right one before Firestore answers.
 *
 * The key still says `gates` because it predates the nav entry: an existing
 * visitor's cache keeps working rather than being dropped on the deploy that
 * widened it.
 */
const SHELL_CACHE_KEY = 'bhaktiras:site-gates'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

/**
 * Shared across every caller so a route guard and a component asking at the same
 * moment wait on one request rather than the second returning early with defaults.
 */
let inFlight: Promise<void> | null = null

interface ShellCache {
  sections: Array<{ id: string, visible: boolean }>
  /** Both absent in a cache written before the nav was cached. */
  navItems?: unknown
  navItemsRevision?: number
}

function readShellCache(): ShellCache | null {
  if (import.meta.server || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(SHELL_CACHE_KEY)
    return raw ? JSON.parse(raw) as ShellCache : null
  } catch {
    return null
  }
}

function writeShellCache(settings: SiteContentSettings) {
  if (import.meta.server || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SHELL_CACHE_KEY, JSON.stringify({
      sections: settings.sections.map(section => ({ id: section.id, visible: section.visible })),
      navItems: settings.navItems,
      navItemsRevision: settings.navItemsRevision
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
      // No client SDK on the server, and none in a dev run without Firebase
      // config. Content the server-side read already supplied stands.
      if (fromCms.value) return
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
        content.value = siteContentFromDocData(snap.data())
        fromCms.value = true
        writeShellCache(content.value)
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
   * Applies the last known switches and nav straight from localStorage.
   *
   * Without it the shell is wrong for as long as Firestore takes to answer.
   * A hidden section stays on screen, and — because the server renders the code
   * defaults, having no Firebase of its own — the tab bar paints the default
   * items and then visibly swaps one once the CMS lands: on this build the
   * third tab read Events and turned into Seva a moment later. Only the shell
   * is cached; the content still comes from the network, so a stale cache is
   * one paint out of date at worst.
   *
   * A cache older than the current DEFAULT_NAV_ITEMS is ignored for its nav —
   * the same rule `navItemsFromSource` applies to a stored document, so a nav
   * the code has since moved past cannot come back through the cache.
   */
  function applyCachedShell() {
    if (fromCms.value) return
    const cache = readShellCache()
    if (!cache) return
    const cachedNav = cache.navItems && !navItemsAreStale(cache.navItemsRevision)
      ? navItemsFromSource(cache.navItems, cache.navItemsRevision)
      : null
    content.value = {
      ...content.value,
      sections: siteSectionsFromSource(cache.sections),
      ...(cachedNav ? { navItems: cachedNav } : {})
    }
  }

  /**
   * Static content, but keeping whatever switches are already in hand.
   *
   * Without this, a failed read — or a dev server with no Firebase config —
   * would reset every section to visible a moment after the cached shell was
   * applied, flashing a hidden section back onto the screen and the nav back
   * to the code defaults.
   */
  function fallbackContent(): SiteContentSettings {
    return {
      ...DEFAULT_SITE_CONTENT,
      sections: content.value.sections,
      navItems: content.value.navItems,
      navItemsRevision: content.value.navItemsRevision
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
      if (fromCms.value) {
        // SSR served the real content. Keep the cache fresh anyway, so a later
        // load whose server-side read fails still paints the right shell.
        writeShellCache(content.value)
        return
      }
      applyCachedShell()
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
