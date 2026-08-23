/**
 * Marks the sign-in a devotee just performed, as opposed to the one Firebase
 * restores on every launch.
 *
 * `auth.user` goes from null to a uid in both cases, so a watcher alone cannot
 * tell them apart — and prompting on a restore would ask on every cold start
 * rather than once, at the moment somebody actually joined.
 *
 * Session storage rather than local: the signal belongs to this tab's launch,
 * and must not survive it if nothing consumed it.
 */
const KEY = 'bhaktiras-signed-in-just-now'

/** Called from the interactive sign-in and sign-up paths only. */
export function markInteractiveSignIn() {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    // Storage denied — the prompt this feeds simply does not fire.
  }
}

/** True once, for the prompt that acts on it; the signal is spent either way. */
export function consumeInteractiveSignIn() {
  if (typeof sessionStorage === 'undefined') return false
  try {
    const signalled = sessionStorage.getItem(KEY) === '1'
    sessionStorage.removeItem(KEY)
    return signalled
  } catch {
    return false
  }
}
