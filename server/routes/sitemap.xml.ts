import { SITE } from '~/data/site'

/**
 * The public routes, listed once. Admin, account and the pre-launch gate are
 * deliberately absent — they carry `noindex` too.
 *
 * Hand-maintained because the set is small and stable. Adding a public page
 * means adding a line here; nothing enforces that, which is the trade for not
 * pulling in a sitemap module.
 */
const PATHS = [
  '/',
  '/journey',
  '/events',
  '/community',
  '/seva',
  '/niyams',
  '/yajman',
  '/darshan',
  '/legacy',
  '/play',
  '/play/wordle',
  '/play/crossword',
  '/play/connections',
  '/play/one-percent',
  '/play/bracket-city',
  '/play/surya-chandra',
  '/play/ras-rani',
  '/play/achievements',
  '/play/streaks',
  '/privacy',
  '/policy',
  '/submit-bug'
]

export default defineEventHandler((event) => {
  const urls = PATHS
    .map(path => `  <url><loc>${SITE.url}${path === '/' ? '/' : path}</loc></url>`)
    .join('\n')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
})
