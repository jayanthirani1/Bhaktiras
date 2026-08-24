import { isIos, isStandalone } from '~/utils/pwa'

export type InstallPromptMoment = 'game-complete' | 'events' | 'launch'

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
const DAY_MS = 24 * 60 * 60 * 1000

/** Two "not now"s buy longer silence; the third retires the prompt for good. */
const SNOOZE_STEPS_MS = [14 * DAY_MS, 30 * DAY_MS]

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

export function useInstallPrompt() {
  const moment = useState<InstallPromptMoment | null>('install-prompt-moment', () => null)
  const canPrompt = useState<boolean>('install-can-prompt', () => false)
  const installed = useState<boolean>('install-completed', () => false)

  /**
   * A moment asked for before Chromium had anything to offer.
   *
   * `beforeinstallprompt` does not fire until the service worker registered on
   * this page load has activated, and on a first visit that lands well after
   * the launch-time ask has come and gone. `request` used to drop such an ask
   * on the floor, so a newcomer opening the link saw nothing — and then saw the
   * card the moment they tapped Events, because by then the event had arrived.
   * The moment is parked here instead and replayed as soon as it can be shown.
   */
  const wanted = useState<InstallPromptMoment | null>('install-prompt-wanted', () => null)
  const gate = useAppPrompts()

  /** Called by `plugins/pwa.client.ts` as the events arrive. */
  function capture(event: Event) {
    event.preventDefault()
    deferredEvent = event as BeforeInstallPromptEvent
    canPrompt.value = true
    if (wanted.value) request(wanted.value)
  }

  function markInstalled() {
    deferredEvent = null
    canPrompt.value = false
    installed.value = true
    wanted.value = null
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

  function show(value: InstallPromptMoment) {
    wanted.value = null
    moment.value = value
    gate.setPending('install', true)
  }

  /**
   * Ask for the card at a given moment.
   *
   * The difference between "not installable here" and "not installable *yet*"
   * matters: the first is a Firefox desktop that will never fire the event, the
   * second is the first two or three seconds of every Chromium page load. Only
   * the second is worth waiting for, and `capture` is what ends the wait.
   */
  function request(value: InstallPromptMoment) {
    if (import.meta.server || moment.value) return
    if (isStandalone() || installed.value || snoozed()) return
    if (!method.value) {
      wanted.value = value
      return
    }
    show(value)
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
    wanted.value = null
    gate.setPending('install', false)
  }

  /**
   * The deliberate way in, from the footer link.
   *
   * A snoozed banner must not become a dead end: someone who dismissed it in
   * March and wants the app in August has to be able to ask for it, so this
   * ignores the snooze. The link only renders when `available` is already true,
   * so there is nothing here to wait for.
   */
  function open() {
    if (import.meta.server || !available.value) return
    show('launch')
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
