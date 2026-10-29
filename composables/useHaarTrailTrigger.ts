import {
  HAAR_TRAIL_TRIGGER_HREF,
  HAAR_TRAIL_TRIGGER_TAPS,
  HAAR_TRAIL_TRIGGER_WINDOW_MS,
  HAAR_TRAIL_UNLOCK_KEY
} from '~/data/haarTrail'

/**
 * The hidden way into the Haar Trail: four quick taps on Seva in the
 * navigation bar. The first tap goes to /seva as usual; tapping the link you
 * are already on does nothing, so the rest only count. Nothing on screen hints
 * at it — the escape room's clue does that — and it does nothing while an admin
 * has the Haar Trail section switched off.
 */
export function useHaarTrailTrigger() {
  const { isSectionVisible } = useSiteContent()
  let taps: number[] = []

  function tap(href: string) {
    if (href !== HAAR_TRAIL_TRIGGER_HREF || !isSectionVisible('haar-trail')) return
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
