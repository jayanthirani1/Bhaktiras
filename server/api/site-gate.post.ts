import { timingSafeEqual } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const password = useRuntimeConfig(event).sitePassword
  if (!password) {
    return { ok: true, unlocked: true }
  }

  const body = await readBody<{ password?: string }>(event)
  const submitted = String(body?.password || '')
  const a = Buffer.from(submitted)
  const b = Buffer.from(password)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw createError({ statusCode: 401, statusMessage: 'Wrong password' })
  }

  setCookie(event, SITE_GATE_COOKIE, siteGateToken(password), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })

  return { ok: true }
})
