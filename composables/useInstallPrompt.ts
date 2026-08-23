import { isIos, isStandalone } from '~/utils/pwa'

export type InstallPromptMoment = 'game-complete' | 'events' | 'return-visit'

/**
 * How this device can install, or `null` when it simply cannot.
 *
 * `prompt` is Chromium's real install dialog. `ios` is Share → Add to Home
 * Screen, which Safari, Chrome, Firefox and Edge on iPhone all expose. Apple
 * still offers no install API, so the card is instructions rather than a button.
 */
export type InstallMethod = 'prompt' | 'ios'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const SNOOZE_KEY = 'bhaktiras-install-prompt-snoozed-until'
const DISMISSALS_KEY = 'bhaktiras-install-prompt-dismissals'
const INSTALLED_KEY = 'bhaktiras-installed'
const SESSIONS_KEY = 'bhaktiras-session-count'
const SESSION_MARKER = 'bhaktiras-session-counted'
const DAY_MS = 24 * 60 * 60 * 1000

/** Two "not now"s buy longer silence; the third retires the prompt for good. */
const SNOOZE_STEPS_MS = [14 * DAY_MS, 30 * DAY_MS]

/**
 * The banner is only offered to someone who has already got something out of
 * the app — a finished game, a look at the events, or a second visit. A cold
 * install ask on first paint is the one people dismiss by reflex, and a
 * dismissal costs the slot. This mirrors the reasoning in `layouts/default.vue`
 * that moved the push ask off sign-in and onto a finished game.
 */
const RETURN_VISIT_MIN_SESSIONS = 2

/**
 * Chromium fires `beforeinstallprompt` once, early, and discards it if nothing
 * calls `preventDefault()`. It is a live event object, not serialisable state,
 * so it is held at module scope rather than in `useState`.
 */
let deferredEvent: BeforeInstallPromptEvent | null = null

function readNumber(key: string) {
  const raw = Number(localStorage.getItem(key))
  return Number.isFinite(raw) ? raw : 0
}

/** Counts app launches, not page views — a reload keeps the same session. */
export function recordSession() {
  try {
    if (sessionStorage.getItem(SESSION_MARKER) === '1') return
    sessionStorage.setItem(SESSION_MARKER, '1')
    localStorage.setItem(SESSIONS_KEY, String(readNumber(SESSIONS_KEY) + 1))
  } catch {
    // Private browsing with storage denied: the prompt just stays quiet.
  }
}

export function useInstallPrompt() {
  const moment = useState<InstallPromptMoment | null>('install-prompt-moment', () => null)
  const canPrompt = useState<boolean>('install-can-prompt', () => false)
  const installed = useState<boolean>('install-completed', () => false)
  const gate = useAppPrompts()

  /** Called by `plugins/pwa.client.ts` as the events arrive. */
  function capture(event: Event) {
    event.preventDefault()
    deferredEvent = event as BeforeInstallPromptEvent
    canPrompt.value = true
  }

  function markInstalled() {
    deferredEvent = null
    canPrompt.value = false
    installed.value = true
    close(false)
    try {
      localStorage.setItem(INSTALLED_KEY, '1')
    } catch {
      // Nothing to do — `isStandalone()` still suppresses the prompt in the app.
    }
  }

  const method = computed<InstallMethod | null>(() => {
    if (import.meta.server) return null
    if (canPrompt.value) return 'prompt'
    if (isIos()) return 'ios'
    return null
  })

  /** True when the app is installable here and not already installed. */
  const available = computed(() => {
    if (import.meta.server || isStandalone() || installed.value) return false
    return method.value !== null
  })

  function snoozed() {
    try {
      if (localStorage.getItem(INSTALLED_KEY) === '1') return true
      if (readNumber(DISMISSALS_KEY) > SNOOZE_STEPS_MS.length) return true
      return Date.now() < readNumber(SNOOZE_KEY)
    } catch {
      return false
    }
  }

  function request(value: InstallPromptMoment) {
    if (import.meta.server || moment.value || !available.value || snoozed()) return
    if (value === 'return-visit' && readNumber(SESSIONS_KEY) < RETURN_VISIT_MIN_SESSIONS) return
    moment.value = value
    gate.setPending('install', true)
  }

  /**
   * `markSnoozed` is false when the card closes because the install succeeded
   * or the gate never showed it — only a real "not now" should spend a step.
   */
  function close(markSnoozed = true) {
    if (import.meta.client && markSnoozed && moment.value) {
      try {
        const dismissals = readNumber(DISMISSALS_KEY) + 1
        localStorage.setItem(DISMISSALS_KEY, String(dismissals))
        const step = SNOOZE_STEPS_MS[Math.min(dismissals, SNOOZE_STEPS_MS.length) - 1]
        localStorage.setItem(SNOOZE_KEY, String(Date.now() + step))
      } catch {
        // Unstored dismissals reappear next session; better than never showing.
      }
    }
    moment.value = null
    gate.setPending('install', false)
  }

  /**
   * The deliberate way in, from the footer link.
   *
   * A snoozed banner must not become a dead end: someone who dismissed it in
   * March and wants the app in August has to be able to ask for it, so this
   * ignores both the snooze and the engagement gate.
   */
  function open() {
    if (import.meta.server || !available.value) return
    moment.value = 'return-visit'
    gate.setPending('install', true)
  }

  /**
   * Hands over to Chromium's own dialog. The event is single-use: whatever the
   * devotee chooses, it cannot be shown again this page load, so it is dropped
   * either way and `appinstalled` handles the success case.
   */
  async function accept() {
    if (!deferredEvent) return
    const event = deferredEvent
    deferredEvent = null
    canPrompt.value = false
    try {
      await event.prompt()
      const { outcome } = await event.userChoice
      close(outcome === 'dismissed')
    } catch {
      close(false)
    }
  }

  return { moment, method, available, canPrompt, installed, capture, markInstalled, request, open, close, accept }
}
