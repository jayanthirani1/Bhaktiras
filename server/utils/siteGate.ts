import { createHash, timingSafeEqual } from 'node:crypto'

export const SITE_GATE_COOKIE = 'bhaktiras_preview'

export function siteGateToken(password: string) {
  return createHash('sha256').update(`bhaktiras-gate:${password}`).digest('hex')
}

export function siteGateUnlocked(cookie: string | undefined, password: string) {
  if (!password || !cookie) return false
  const expected = Buffer.from(siteGateToken(password))
  const got = Buffer.from(cookie)
  if (expected.length !== got.length) return false
  return timingSafeEqual(expected, got)
}
