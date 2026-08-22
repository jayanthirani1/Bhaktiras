/**
 * Turns Firebase Auth error codes into something a devotee can act on.
 *
 * Login and signup used to render `e.message` directly, so the most-hit failure
 * in the app read `Firebase: Error (auth/invalid-credential).` The account page
 * already had a mapper like this one; it just was never shared.
 *
 * Every message says what to do next, because that is the only part the reader
 * needs.
 */
const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'That email and password do not match. Check them and try again.',
  'auth/invalid-login-credentials': 'That email and password do not match. Check them and try again.',
  'auth/wrong-password': 'That password is not right. Try again, or reset it below.',
  'auth/user-not-found': 'We could not find an account with that email. Create one instead?',
  'auth/invalid-email': 'That does not look like an email address.',
  'auth/user-disabled': 'This account has been disabled. Please speak to a mandir admin.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes, then try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
  'auth/weak-password': 'Please choose a password of at least 6 characters.',
  'auth/popup-closed-by-user': 'The Google window was closed before sign-in finished.',
  'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site, then try again.',
  'auth/cancelled-popup-request': 'The Google window was closed before sign-in finished.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email. Sign in with your email and password, then link Google from Your account.',
  'auth/requires-recent-login': 'For safety, please sign out and sign in again, then retry.',
  'auth/missing-password': 'Please enter your password.'
}

export function useAuthErrors() {
  /** `fallback` covers a code we have not seen; never show the raw message. */
  function authErrorMessage(value: unknown, fallback = 'Something went wrong. Please try again.') {
    const raw = (value as { code?: string; message?: string })
    const code = raw?.code || ''
    if (code && AUTH_ERRORS[code]) return AUTH_ERRORS[code]

    // Older Firebase builds put the code inside the message instead.
    const message = raw?.message || ''
    for (const [known, friendly] of Object.entries(AUTH_ERRORS)) {
      if (message.includes(known)) return friendly
    }
    return fallback
  }

  return { authErrorMessage }
}
