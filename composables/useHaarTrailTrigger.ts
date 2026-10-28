import {
  HAAR_TRAIL_TRIGGER_TAPS,
  HAAR_TRAIL_TRIGGER_WINDOW_MS,
  HAAR_TRAIL_UNLOCK_KEY
} from '~/data/haarTrail'

/**
 * The hidden way into the Haar Trail: four quick taps on one seva team card.
 * Nothing on screen hints at it — the escape room's clue does that — and it
 * does nothing while an admin has the Haar Trail section switched off.
 */
export function useHaarTrailTrigger() {
  const { isSectionVisible } = useSiteContent()
  let taps: number[] = []

  function tap() {
    if (!isSectionVisible('haar-trail')) return
    const now = Date.now()
    taps = [...taps.filter(at => now - at < HAAR_TRAIL_TRIGGER_WINDOW_MS), now]
    if (taps.length < HAAR_TRAIL_TRIGGER_TAPS) return

    taps = []
    try {
      sessionStorage.setItem(HAAR_TRAIL_UNLOCK_KEY, '1')
    } catch {
      // Private mode can refuse storage; the page lets the visit through then.
    }
    try {
      navigator.vibrate?.(60)
    } catch {
      // Not every browser allows it.
    }
    navigateTo('/haar')
  }

  return { tap }
}
