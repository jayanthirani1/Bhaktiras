/**
 * Platform facts the install and push prompts both depend on.
 *
 * These were local to `usePushNotifications` until the install prompt needed
 * the same answers; the two must never drift apart, because "can this device
 * receive push" and "is this device installed" are the same question on iOS.
 */

/** iOS gates both web push and Add to Home Screen behind a Home Screen launch. */
export function isIos() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** True once the app is launched from the Home Screen, dock or app list. */
export function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as { standalone?: boolean }).standalone === true
}

/**
 * Every iOS browser is WebKit, but only Safari carries Add to Home Screen —
 * Chrome, Firefox and Edge on iOS have no way to install at all, so they get
 * different instructions rather than a Share menu that will not help them.
 */
export function isIosSafari() {
  if (!isIos() || typeof navigator === 'undefined') return false
  return !/CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(navigator.userAgent)
}
