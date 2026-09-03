/** Shared elapsed-time helpers for timed games. */

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

type StoredTimer = {
  startedAt?: number | null
  finishedAt?: number | null
  penaltyMs?: number
  accumulatedMs?: number
}

/** How often an in-flight segment is banked to storage, so a crash loses at most this much. */
const CHECKPOINT_MS = 5_000

/**
 * Active-play game timer. The clock only runs while the player is actually on
 * the game with the app in the foreground: minimising the app, switching tabs
 * or windows, or navigating away banks the time played so far and pauses;
 * coming back resumes from there. Every game starts at zero and the clock
 * stops for good when the game finishes.
 */
export function useGameTimer(storageKey: string) {
  // When the game first began — kept for the record; elapsed time is not derived from it.
  const startedAt = ref<number | null>(null)
  const finishedAt = ref<number | null>(null)
  const penaltyMs = ref(0)
  // Active play banked from finished segments.
  const accumulatedMs = ref(0)
  // Start of the segment being played right now; null whenever the timer is paused.
  const segmentStartedAt = ref<number | null>(null)
  const now = ref(Date.now())
  let tick: ReturnType<typeof setInterval> | null = null
  let lastCheckpoint = 0

  const running = computed(() => !!startedAt.value && !finishedAt.value)
  const active = computed(() => running.value && segmentStartedAt.value !== null)

  const elapsedMs = computed(() => {
    const live = segmentStartedAt.value !== null && !finishedAt.value
      ? Math.max(0, now.value - segmentStartedAt.value)
      : 0
    return Math.max(0, accumulatedMs.value + live + penaltyMs.value)
  })

  const display = computed(() => formatElapsed(elapsedMs.value))

  function isVisible() {
    if (import.meta.server || typeof document === 'undefined') return false
    return document.visibilityState !== 'hidden'
  }

  function startTick() {
    if (tick || import.meta.server) return
    tick = setInterval(() => {
      now.value = Date.now()
      if (segmentStartedAt.value !== null && now.value - lastCheckpoint >= CHECKPOINT_MS) {
        bank()
        write()
      }
    }, 250)
  }

  function stopTick() {
    if (!tick) return
    clearInterval(tick)
    tick = null
  }

  /** Fold the time played since the segment began into the bank, leaving the segment open. */
  function bank() {
    if (segmentStartedAt.value === null) return
    const at = Date.now()
    accumulatedMs.value += Math.max(0, at - segmentStartedAt.value)
    segmentStartedAt.value = at
    lastCheckpoint = at
    now.value = at
  }

  function read() {
    if (import.meta.server) return
    const wasActive = segmentStartedAt.value !== null
    // Never drop time already played in this session.
    bank()
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const data = JSON.parse(raw) as StoredTimer
      if (data.startedAt) startedAt.value = data.startedAt
      if (data.finishedAt) finishedAt.value = data.finishedAt
      if (Number.isFinite(data.penaltyMs)) {
        penaltyMs.value = Math.max(penaltyMs.value, Number(data.penaltyMs))
      }
      if (Number.isFinite(data.accumulatedMs)) {
        accumulatedMs.value = Math.max(accumulatedMs.value, Number(data.accumulatedMs))
      } else if (data.startedAt) {
        // Legacy wall-clock entry: carry over what it was showing so the clock
        // doesn't jump, then count active play only from here on.
        const end = data.finishedAt ?? Date.now()
        accumulatedMs.value = Math.max(accumulatedMs.value, end - data.startedAt)
      }
    } catch {}
    // A reload or a fresh mount is never time spent playing.
    if (!wasActive) segmentStartedAt.value = null
  }

  function write() {
    if (import.meta.server) return
    try {
      if (!startedAt.value) {
        localStorage.removeItem(storageKey)
        return
      }
      localStorage.setItem(storageKey, JSON.stringify({
        startedAt: startedAt.value,
        finishedAt: finishedAt.value,
        penaltyMs: penaltyMs.value,
        accumulatedMs: accumulatedMs.value
      }))
    } catch {}
  }

  /** Bank the current segment and hold the clock — the player left the game. */
  function pause() {
    if (segmentStartedAt.value === null) return
    bank()
    segmentStartedAt.value = null
    stopTick()
    write()
  }

  /** Start counting again — the player is back on the game. */
  function resume() {
    if (!running.value || segmentStartedAt.value !== null) return
    if (!isVisible()) return
    const at = Date.now()
    segmentStartedAt.value = at
    lastCheckpoint = at
    now.value = at
    startTick()
    write()
  }

  function ensureStarted() {
    if (finishedAt.value) return
    if (!startedAt.value) {
      startedAt.value = Date.now()
      accumulatedMs.value = 0
      segmentStartedAt.value = null
    }
    write()
    resume()
  }

  function stop() {
    if (!startedAt.value || finishedAt.value) return
    bank()
    segmentStartedAt.value = null
    stopTick()
    finishedAt.value = Date.now()
    write()
  }

  function addPenalty(ms: number) {
    if (!Number.isFinite(ms) || ms <= 0) return
    ensureStarted()
    penaltyMs.value += Math.trunc(ms)
    write()
  }

  function reset() {
    startedAt.value = null
    finishedAt.value = null
    penaltyMs.value = 0
    accumulatedMs.value = 0
    segmentStartedAt.value = null
    stopTick()
    write()
  }

  /** Restore a finished clock (e.g. after reload) so resubmits keep the real time. */
  function hydrateFinished(elapsed: number) {
    const ms = Math.max(0, Math.trunc(elapsed))
    if (ms < 1) return
    const at = Date.now()
    startedAt.value = at - ms
    finishedAt.value = at
    accumulatedMs.value = ms
    penaltyMs.value = 0
    segmentStartedAt.value = null
    now.value = at
    stopTick()
    write()
  }

  function loadOrStart() {
    read()
    if (finishedAt.value) return
    if (!startedAt.value) {
      startedAt.value = Date.now()
      accumulatedMs.value = 0
    }
    write()
    resume()
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') pause()
    else resume()
  }
  function onHide() { pause() }
  function onShow() { resume() }

  onMounted(() => {
    read()
    document.addEventListener('visibilitychange', onVisibility)
    // Minimising, switching apps or moving to another window doesn't always
    // flip visibility — losing focus does.
    window.addEventListener('blur', onHide)
    window.addEventListener('focus', onShow)
    window.addEventListener('pagehide', onHide)
    window.addEventListener('pageshow', onShow)
    document.addEventListener('freeze', onHide)
    document.addEventListener('resume', onShow)
  })

  onUnmounted(() => {
    // Navigating away from the game page is time off the clock.
    pause()
    stopTick()
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('blur', onHide)
    window.removeEventListener('focus', onShow)
    window.removeEventListener('pagehide', onHide)
    window.removeEventListener('pageshow', onShow)
    document.removeEventListener('freeze', onHide)
    document.removeEventListener('resume', onShow)
  })

  return {
    startedAt,
    finishedAt,
    penaltyMs,
    accumulatedMs,
    elapsedMs,
    display,
    running,
    active,
    ensureStarted,
    loadOrStart,
    pause,
    resume,
    stop,
    addPenalty,
    reset,
    hydrateFinished,
    read,
    write
  }
}
