import type { SiteContentSettings } from '~/types'
import { DEFAULT_SITE_CONTENT, SITE_CONTENT_DOC_ID, siteContentFromDocData } from '~/data/siteContent'
import { readSiteContentDoc } from '~/server/utils/siteContentDoc'

/**
 * Fills the site content state before SSR renders, so the served HTML carries
 * the admin's navigation rather than the code defaults.
 *
 * The state is the same `useState` key `useSiteContent` uses, so it travels to
 * the browser in the payload and hydration reuses it: with `fromCms` already
 * true the client skips its own Firestore read entirely, which also spares
 * every visitor a document read on load.
 *
 * When the read fails this does nothing at all, leaving the defaults in place
 * and the client to fetch as it always did.
 */
export default defineNuxtPlugin(async () => {
  const content = useState<SiteContentSettings>('site-content', () => ({ ...DEFAULT_SITE_CONTENT }))
  const fromCms = useState<boolean>('site-content-from-cms', () => false)
  const ready = useState<boolean>('site-content-ready', () => false)
  if (fromCms.value) return

  const projectId = useRuntimeConfig().public.firebaseProjectId
  if (!projectId) return

  const data = await readSiteContentDoc(projectId, SITE_CONTENT_DOC_ID)
  if (!data) return

  content.value = siteContentFromDocData(data)
  fromCms.value = true
  // The nav is known, so the bar renders it rather than its loading skeleton.
  // `ready` is otherwise only ever set by `fetchContent`, which a client that
  // was handed its content by the server never calls — leaving the bar
  // shimmering for good.
  ready.value = true
})
