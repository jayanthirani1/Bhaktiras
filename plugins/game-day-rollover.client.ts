import { isStaleGameDay, ukDateId } from '~/utils/gameDay'

/**
 * Rolls the daily puzzles over when the app is reopened on a new day.
 *
 * Every game decides its day exactly once, at mount: the board's storage key,
 * `useGameTimer`'s key, the leaderboard it fetches and the completion record it
 * writes all come from a `ukDateId()` read during setup. An app that is
 * minimised overnight never mounts again, so a player who opened Wordle in the
 * evening and came back in the morning was still looking at — and still able to
 * finish — yesterday's board. Finishing it filed yesterday's game against
 * today: `submitScore` and `markDone` both stamp a *fresh* `ukDateId()`, so the
 * result landed on today's leaderboard carrying a clock that had been running
 * since the night before (or none at all, if the timer never started).
 *
 * There is no partial version of this. The day is baked into too many places to
 * patch one at a time, so when the player comes back to a day that has moved on,
 * reload and let every game read the calendar again. All progress lives in
 * localStorage keyed by day, so a reload loses nothing that belonged to today.
 */
export default defineNuxtPlugin(() => {
  // Captured here: `check` runs from a listener, long outside Nuxt's context.
  const router = useRouter()
  let day = ukDateId()
  let reloading = false

  function check() {
    if (reloading || document.visibilityState !== 'visible') return
    if (!isStaleGameDay(day)) return

    day = ukDateId()
    // Everywhere else already re-reads the day on its next mount, and a reload
    // there would only interrupt something like a half-written admin form.
    if (!router.currentRoute.value.path.startsWith('/play')) return

    reloading = true
    window.location.reload()
  }

  document.addEventListener('visibilitychange', check)
  window.addEventListener('focus', check)
  // Back/forward cache: the page is restored wholesale, without a mount.
  window.addEventListener('pageshow', check)
})
