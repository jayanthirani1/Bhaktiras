const OPEN = [
  '/gate',
  '/api/site-gate',
  '/favicon.ico',
  '/robots.txt',
  '/firebase-messaging-sw.js'
]

export default defineEventHandler((event) => {
  const password = useRuntimeConfig(event).sitePassword
  if (!password) return

  const path = getRequestURL(event).pathname
  if (OPEN.some(p => path === p || path.startsWith(`${p}/`))) return
  if (path.startsWith('/_nuxt/') || path.startsWith('/__nuxt')) return

  if (siteGateUnlocked(getCookie(event, SITE_GATE_COOKIE), password)) return

  if (path.startsWith('/api/')) {
    throw createError({ statusCode: 401, statusMessage: 'Site is locked' })
  }

  return sendRedirect(event, '/gate', 302)
})
