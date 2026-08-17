/* Bhaktiras push service worker. FCM delivers a standard Web Push payload here. */
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { notification: { body: event.data.text() } }
  }

  const notification = payload.notification || {}
  const data = payload.data || {}
  const title = notification.title || data.title || 'Bhaktiras'
  const options = {
    body: notification.body || data.body || '',
    icon: '/Bhaktiras%20-%20Main.svg',
    badge: '/Bhaktiras%20-%20Main.svg',
    data: { url: data.url || '/' },
    tag: data.tag || 'bhaktiras-update',
    renotify: true
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find(client => client.url === target)
      if (existing) return existing.focus()
      return self.clients.openWindow(target)
    })
  )
})
