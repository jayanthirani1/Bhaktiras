/**
 * Stops a single finger press from entering a letter twice.
 *
 * Mobile browsers often fire pointerdown (touch) and then a compatibility
 * mouse click/pointer. A bounce on a small key can also land a second down
 * within a few dozen milliseconds.
 */
export function useKeyTapGuard(cooldownMs = 240) {
  let lastKey = ''
  let lastAt = 0
  let blockClicksUntil = 0

  function allow(key: string) {
    const now = performance.now()
    if (now - lastAt < 50) return false
    if (key === lastKey && now - lastAt < cooldownMs) return false
    lastKey = key
    lastAt = now
    return true
  }

  function markPointerHandled() {
    blockClicksUntil = performance.now() + 700
  }

  function clickIsEcho() {
    return performance.now() < blockClicksUntil
  }

  return { allow, markPointerHandled, clickIsEcho }
}
