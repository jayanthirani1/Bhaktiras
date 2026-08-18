import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore'
import type { Niyam, NiyamStats } from '~/types'
import { USTAV_NIYAMS } from '~/data/niyams'

const STORAGE_KEY = 'bhaktiras-niyam-tracker'
const STATS_ID = 'totals'

function emptyStats(): NiyamStats {
  return { participants: 0, counts: {} }
}

function countDone(checked: Record<string, boolean>) {
  return Object.values(checked).filter(Boolean).length
}

function asCheckedMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, boolean> = {}
  for (const [key, on] of Object.entries(value as Record<string, unknown>)) {
    out[key] = !!on
  }
  return out
}

/**
 * Community totals were previously written with setDoc({ 'counts.puja': increment(1) }).
 * setDoc treats that as a literal field name, not nested counts.puja — so the UI
 * summing data.counts stayed at 0. Read both shapes and fold them together.
 */
function parseStatsData(data: Record<string, unknown> | undefined): {
  participants: number
  counts: Record<string, number>
  dottedKeys: string[]
} {
  const counts: Record<string, number> = {}
  const dottedKeys: string[] = []
  if (!data) return { participants: 0, counts, dottedKeys }

  const nested = data.counts
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    for (const [key, value] of Object.entries(nested as Record<string, unknown>)) {
      counts[key] = Number(value) || 0
    }
  }
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('counts.') || key === 'counts') continue
    const id = key.slice('counts.'.length)
    if (!id) continue
    counts[id] = (counts[id] || 0) + (Number(value) || 0)
    dottedKeys.push(key)
  }
  return {
    participants: Math.max(0, Number(data.participants) || 0),
    counts,
    dottedKeys
  }
}

export function useNiyamTracker() {
  const { $firebaseDb } = useNuxtApp()
  const { user, isLoggedIn } = useAuth()

  const niyams = ref<Niyam[]>([...USTAV_NIYAMS])
  const checked = ref<Record<string, boolean>>({})
  const stats = ref<NiyamStats>(emptyStats())
  const loading = ref(true)
  const savingId = ref<string | null>(null)
  const error = ref('')

  const doneCount = computed(() => niyams.value.filter(n => checked.value[n.id]).length)
  const total = computed(() => niyams.value.length)
  const percent = computed(() => total.value ? Math.round((doneCount.value / total.value) * 100) : 0)
  const communityChecks = computed(() =>
    Object.values(stats.value.counts).reduce((sum, n) => sum + Math.max(0, Number(n) || 0), 0)
  )

  function getDb(): Firestore | null {
    if (import.meta.server) return null
    return ($firebaseDb as Firestore | null) ?? null
  }

  function readLocal(): Record<string, boolean> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return asCheckedMap(JSON.parse(raw))
    } catch (_) {}
    return {}
  }

  function writeLocal(value: Record<string, boolean>) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch (_) {}
  }

  function applyParsedStats(parsed: ReturnType<typeof parseStatsData>) {
    stats.value = {
      participants: parsed.participants,
      counts: { ...parsed.counts }
    }
  }

  async function fetchNiyams() {
    const db = getDb()
    if (!db) {
      niyams.value = [...USTAV_NIYAMS]
      return
    }
    try {
      const snap = await getDocs(collection(db, 'niyams'))
      const list = snap.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          title: String(data.title || ''),
          detail: String(data.detail || ''),
          order: Number(data.order) || 0
        } satisfies Niyam
      }).filter(n => n.title)
      list.sort((a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title))
      niyams.value = list.length ? list : [...USTAV_NIYAMS]
    } catch {
      niyams.value = [...USTAV_NIYAMS]
    }
  }

  async function fetchStats() {
    const db = getDb()
    if (!db) {
      stats.value = emptyStats()
      return
    }
    try {
      const snap = await getDoc(doc(db, 'niyamStats', STATS_ID))
      applyParsedStats(parseStatsData(snap.data() as Record<string, unknown> | undefined))
    } catch {
      stats.value = emptyStats()
    }
  }

  let persistLock = Promise.resolve()

  async function persistAccountState(
    db: Firestore,
    uid: string,
    desired: Record<string, boolean>,
    mode: 'replace' | 'merge'
  ) {
    const run = async () => {
      const progressRef = doc(db, 'niyamProgress', uid)
      const statsRef = doc(db, 'niyamStats', STATS_ID)

      const result = await runTransaction(db, async (tx) => {
        const progressSnap = await tx.get(progressRef)
        const statsSnap = await tx.get(statsRef)
        const remote = asCheckedMap(progressSnap.data()?.checked)
        const parsed = parseStatsData(statsSnap.data() as Record<string, unknown> | undefined)

        const nextChecked = { ...remote }
        for (const [id, on] of Object.entries(desired)) {
          if (mode === 'merge') {
            if (on) nextChecked[id] = true
          } else {
            nextChecked[id] = !!on
          }
        }

        const countDeltas: Record<string, number> = {}
        const ids = new Set([...Object.keys(remote), ...Object.keys(nextChecked)])
        for (const id of ids) {
          const wasOn = !!remote[id]
          const nowOn = !!nextChecked[id]
          if (wasOn === nowOn) continue
          countDeltas[id] = nowOn ? 1 : -1
          parsed.counts[id] = Math.max(0, (parsed.counts[id] || 0) + countDeltas[id])
        }

        const prevDone = countDone(remote)
        const nextDone = countDone(nextChecked)
        if (prevDone === 0 && nextDone > 0) parsed.participants += 1
        else if (prevDone > 0 && nextDone === 0) parsed.participants = Math.max(0, parsed.participants - 1)

        const progressChanged = JSON.stringify(remote) !== JSON.stringify(nextChecked)
        const statsChanged = Object.keys(countDeltas).length > 0 || parsed.dottedKeys.length > 0
        if (!progressChanged && !statsChanged) return { nextChecked, parsed }

        if (progressChanged) {
          tx.set(progressRef, {
            userId: uid,
            checked: nextChecked,
            updatedAt: serverTimestamp()
          }, { merge: true })
        }

        if (statsChanged) {
          const payload: Record<string, unknown> = {
            participants: parsed.participants,
            counts: parsed.counts
          }
          for (const key of parsed.dottedKeys) payload[key] = deleteField()
          tx.set(statsRef, payload, { merge: true })
        }

        return { nextChecked, parsed }
      })

      checked.value = result.nextChecked
      writeLocal(result.nextChecked)
      applyParsedStats(result.parsed)
    }

    const wait = persistLock.then(run, run)
    persistLock = wait.then(() => undefined, () => undefined)
    await wait
  }

  async function loadProgress() {
    const local = readLocal()
    const db = getDb()
    const uid = user.value?.uid

    if (!db || !uid) {
      checked.value = local
      return
    }

    try {
      await persistAccountState(db, uid, local, 'merge')
    } catch (e) {
      error.value = (e as Error).message
      checked.value = local
    }
  }

  async function toggle(id: string) {
    if (savingId.value) return
    const nextOn = !checked.value[id]
    const nextChecked = { ...checked.value, [id]: nextOn }
    const previous = { ...checked.value }
    checked.value = nextChecked
    writeLocal(nextChecked)

    if (!isLoggedIn.value || !user.value?.uid) return

    const db = getDb()
    if (!db) return

    savingId.value = id
    error.value = ''
    try {
      await persistAccountState(db, user.value.uid, nextChecked, 'replace')
    } catch (e) {
      error.value = (e as Error).message
      checked.value = previous
      writeLocal(previous)
    } finally {
      savingId.value = null
    }
  }

  onMounted(async () => {
    loading.value = true
    await Promise.all([fetchNiyams(), fetchStats()])
    await loadProgress()
    loading.value = false
  })

  watch(() => user.value?.uid, async (uid, prev) => {
    if (uid === prev) return
    await loadProgress()
  })

  return {
    niyams,
    checked,
    stats,
    loading,
    savingId,
    error,
    isLoggedIn,
    doneCount,
    total,
    percent,
    communityChecks,
    toggle
  }
}
