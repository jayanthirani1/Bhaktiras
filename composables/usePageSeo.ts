import { SITE } from '~/data/site'

/**
 * Per-page title and description, with the og:/twitter: twins kept in step.
 *
 * `app.vue` sets the site-wide defaults; this overrides them for one page.
 * Pass the bare page name — the site name is appended here, so every page
 * reads the same way in a browser tab and in a WhatsApp link preview.
 *
 * Setting a title through plain `useHead` still works and several pages do,
 * but then the preview keeps the site-wide og:title. Prefer this.
 */
export function usePageSeo(title: string, description?: string) {
  const fullTitle = `${title} · ${SITE.name}`
  const desc = description || SITE.description

  useSeoMeta({
    title: fullTitle,
    description: desc,
    ogTitle: fullTitle,
    ogDescription: desc,
    twitterTitle: fullTitle,
    twitterDescription: desc
  })
}

/**
 * Pages that must never appear in search results: the pre-launch gate, the
 * admin area, a devotee's own account page, and the 404.
 */
export function useNoIndex() {
  useSeoMeta({ robots: 'noindex, nofollow' })
}
