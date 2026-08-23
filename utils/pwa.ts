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
 * Safari on iOS (not Chrome / Firefox / Edge, which still use WebKit but a
 * different UA). Add to Home Screen is available from those browsers too;
 * this is only useful when a flow is genuinely Safari-only.
 */
export function isIosSafari() {
  if (!isIos() || typeof navigator === 'undefined') return false
  return !/CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(navigator.userAgent)
}
