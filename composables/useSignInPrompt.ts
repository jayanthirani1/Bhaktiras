import { isStandalone } from '~/utils/pwa'

const SHOWN_THIS_LAUNCH_KEY = 'bhaktiras-signin-prompt-shown'
const DISMISSALS_KEY = 'bhaktiras-signin-prompt-dismissals'
const SNOOZE_KEY = 'bhaktiras-signin-prompt-snoozed-until'
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Once per launch, until three refusals say it plainly — then a month's
 * silence, after which the count resets and it may ask again. Someone who
 * deliberately plays signed out should not be asked forever, but a devotee who
 * simply has not got round to it should not be written off after one tap.
 */
const MAX_DISMISSALS = 3
const SNOOZE_MS = 30 * DAY_MS

/**
 * Pages where the ask is noise: the devotee is already signing in, reading the
 * terms of doing so, or is an admin who is signed in by definition.
 */
const EXCLUDED = ['/login', '/signup', '/account', '/privacy', '/policy', '/admin']

function excluded(path: string) {
  return EXCLUDED.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

/**
 * The one-per-launch nudge for a signed-out installed app.
 *
 * Only installed users see it. In a browser tab the app is something you
 * stumbled onto; on the Home Screen it is something you chose, and the things
 * sign-in unlocks — streaks, achievements, niyam progress, the leaderboards —
 * are exactly what an installed devotee is there for. The community wall stays
 * open to everyone, so this never blocks anything.
 */
export function useSignInPrompt() {
  const visible = useState<boolean>('signin-prompt-visible', () => false)
  const auth = useAuth()
  const route = useRoute()
  const gate = useAppPrompts()

  function readNumber(key: string) {
    const raw = Number(localStorage.getItem(key))
    return Number.isFinite(raw) ? raw : 0
  }

  function retired() {
    try {
      const until = readNumber(SNOOZE_KEY)
      if (until && Date.now() < until) return true
      // The snooze has run out — start the count again rather than staying mute.
      if (until && Date.now() >= until) {
        localStorage.removeItem(SNOOZE_KEY)
        localStorage.removeItem(DISMISSALS_KEY)
      }
      return false
    } catch {
      return false
    }
  }

  function request() {
    if (import.meta.server || visible.value) return
    if (!isStandalone()) return
    if (auth.loading.value || auth.user.value?.uid) return
    if (excluded(route.path)) return
    try {
      if (sessionStorage.getItem(SHOWN_THIS_LAUNCH_KEY) === '1') return
    } catch {
      // Storage denied — falls back to the in-memory `visible` guard above.
    }
    if (retired()) return
    visible.value = true
    try {
      sessionStorage.setItem(SHOWN_THIS_LAUNCH_KEY, '1')
    } catch {
      // See above.
    }
    gate.setPending('sign-in', true)
  }

  /** `countDismissal` is false when the card closes because they went to sign in. */
  function close(countDismissal = true) {
    if (import.meta.client && countDismissal && visible.value) {
      try {
        const dismissals = readNumber(DISMISSALS_KEY) + 1
        localStorage.setItem(DISMISSALS_KEY, String(dismissals))
        if (dismissals >= MAX_DISMISSALS) {
          localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS))
        }
      } catch {
        // An uncounted dismissal only means it asks again next launch.
      }
    }
    visible.value = false
    gate.setPending('sign-in', false)
  }

  /** Sends them to sign in and back to wherever they were. */
  async function accept() {
    const redirect = route.fullPath
    close(false)
    await navigateTo({ path: '/login', query: redirect && redirect !== '/' ? { redirect } : {} })
  }

  return { visible, request, close, accept }
}
