/**
 * Arms installation.
 *
 * Chromium will not offer "Install app" — and will not fire
 * `beforeinstallprompt` — unless a service worker with a fetch handler is
 * already registered. The only service worker here is the Firebase messaging
 * one, and it used to be registered lazily, deep inside the push opt-in, so on
 * a device that had never enabled notifications the browser never saw one and
 * the install path stayed shut. Registering it at start-up costs nothing and
 * asks for no permission; the notification prompt is still entirely separate.
 */
export default defineNuxtPlugin(() => {
  const install = useInstallPrompt()
  const config = useRuntimeConfig().public

  recordSession()

  // The worker is only written when the Firebase config was present at build
  // time (see `scripts/writeFirebaseMessagingSw.mjs`), so this mirrors that
  // condition rather than requesting a file that is not there — a local dev run
  // without .env would otherwise log a failed script fetch on every page.
  if ('serviceWorker' in navigator && config.firebaseProjectId && config.firebaseAppId) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {
      // A failed registration only means no install prompt and no push.
    })
  }

  window.addEventListener('beforeinstallprompt', event => install.capture(event))
  window.addEventListener('appinstalled', () => install.markInstalled())
})
