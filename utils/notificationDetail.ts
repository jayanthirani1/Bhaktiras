/** Short preview for OS banners; full text lives on the detail page. */
export const NOTIFICATION_PREVIEW_MAX = 120

export type NotificationDetailSource = {
  id: string
  test?: boolean
}

export function notificationDetailPath(message: NotificationDetailSource): string {
  const base = `/notifications/${message.id}`
  return message.test ? `${base}?test=1` : base
}

export function notificationPreviewBody(body: string, max = NOTIFICATION_PREVIEW_MAX): string {
  const trimmed = body.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trimEnd()}…`
}

export function notificationLinkUrl(data: {
  linkUrl?: string | null
  url?: string | null
}): string | null {
  const explicit = String(data.linkUrl || '').trim()
  if (explicit.startsWith('/')) return explicit
  const legacy = String(data.url || '').trim()
  if (legacy.startsWith('/') && !legacy.startsWith('/notifications/')) return legacy
  return null
}
