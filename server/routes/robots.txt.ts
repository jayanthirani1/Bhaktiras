import { SITE } from '~/data/site'

/**
 * Served from Nitro rather than public/ so the Sitemap line follows SITE.url —
 * a static file would keep pointing at the old origin the day the site moves
 * to a custom domain.
 *
 * server/middleware/site-gate.ts already lets /robots.txt through the
 * pre-launch password gate, so this stays reachable while the site is locked.
 */
export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  // While SITE_PASSWORD is set the site is not public yet, and every route
  // redirects to /gate. Inviting crawlers in would only index the gate.
  if (useRuntimeConfig(event).sitePassword) {
    return 'User-agent: *\nDisallow: /\n'
  }

  return `User-agent: *
Disallow: /admin
Disallow: /account
Disallow: /gate

Sitemap: ${SITE.url}/sitemap.xml
`
})
