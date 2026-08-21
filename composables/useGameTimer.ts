/** Shared elapsed-time helpers for timed games. */

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Wall-clock game timer that keeps ticking while the user is away.
 * Persist startedAt (+ optional finishedAt) so leaving the page continues the countdown.
 */
export function useGameTimer(storageKey: string) {
  const startedAt = ref<number | null>(null)
  const finishedAt = ref<number | null>(null)
  const penaltyMs = ref(0)
  const now = ref(Date.now())
  let tick: ReturnType<typeof setInterval> | null = null

  const elapsedMs = computed(() => {
    if (!startedAt.value) return 0
    const end = finishedAt.value ?? now.value
    return Math.max(0, end - startedAt.value + penaltyMs.value)
  })

  const display = computed(() => formatElapsed(elapsedMs.value))
  const running = computed(() => !!startedAt.value && !finishedAt.value)

  function read() {
    if (import.meta.server) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const data = JSON.parse(raw) as {
        startedAt?: number
        finishedAt?: number | null
        penaltyMs?: number
      }
      if (data.startedAt) startedAt.value = data.startedAt
      if (data.finishedAt) finishedAt.value = data.finishedAt
      if (Number.isFinite(data.penaltyMs)) penaltyMs.value = Math.max(0, Number(data.penaltyMs))
    } catch {}
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
        penaltyMs: penaltyMs.value
      }))
    } catch {}
  }

  function ensureStarted() {
    if (startedAt.value || finishedAt.value) return
    startedAt.value = Date.now()
    write()
  }

  function stop() {
    if (!startedAt.value || finishedAt.value) return
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
    write()
  }

  function loadOrStart() {
    read()
    if (finishedAt.value) return
    if (!startedAt.value) {
      startedAt.value = Date.now()
      write()
    }
  }

  onMounted(() => {
    read()
    tick = setInterval(() => { now.value = Date.now() }, 250)
  })

  onUnmounted(() => {
    if (tick) clearInterval(tick)
  })

  return {
    startedAt,
    finishedAt,
    penaltyMs,
    elapsedMs,
    display,
    running,
    ensureStarted,
    loadOrStart,
    stop,
    addPenalty,
    reset,
    read,
    write
  }
}
