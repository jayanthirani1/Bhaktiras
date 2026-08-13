import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  setDoc,
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
    Object.values(stats.value.counts).reduce((sum, n) => sum + (Number(n) || 0), 0)
  )

  function getDb(): Firestore | null {
    if (import.meta.server) return null
    return ($firebaseDb as Firestore | null) ?? null
  }

  function readLocal(): Record<string, boolean> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as Record<string, boolean>
    } catch (_) {}
    return {}
  }

  function writeLocal(value: Record<string, boolean>) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch (_) {}
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
      const data = snap.data()
      stats.value = {
        participants: Number(data?.participants) || 0,
        counts: (data?.counts && typeof data.counts === 'object') ? { ...data.counts } : {}
      }
    } catch {
      stats.value = emptyStats()
    }
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
      const ref = doc(db, 'niyamProgress', uid)
      const snap = await getDoc(ref)
      const remote = snap.exists() && snap.data().checked && typeof snap.data().checked === 'object'
        ? { ...snap.data().checked as Record<string, boolean> }
        : {}

      if (countDone(remote) > 0) {
        checked.value = remote
        writeLocal(remote)
        return
      }

      if (countDone(local) > 0) {
        await setDoc(ref, {
          userId: uid,
          checked: local,
          updatedAt: serverTimestamp()
        })
        const delta: Record<string, unknown> = {
          participants: increment(1)
        }
        for (const [id, on] of Object.entries(local)) {
          if (on) delta[`counts.${id}`] = increment(1)
        }
        await setDoc(doc(db, 'niyamStats', STATS_ID), delta, { merge: true })
        checked.value = local
        await fetchStats()
        return
      }

      checked.value = {}
    } catch (e) {
      error.value = (e as Error).message
      checked.value = local
    }
  }

  async function toggle(id: string) {
    if (savingId.value) return
    const nextOn = !checked.value[id]
    const prevDone = doneCount.value
    const nextChecked = { ...checked.value, [id]: nextOn }
    const nextDone = countDone(nextChecked)
    checked.value = nextChecked
    writeLocal(nextChecked)

    if (!isLoggedIn.value || !user.value?.uid) return

    const db = getDb()
    if (!db) return

    savingId.value = id
    error.value = ''
    try {
      await setDoc(doc(db, 'niyamProgress', user.value.uid), {
        userId: user.value.uid,
        checked: nextChecked,
        updatedAt: serverTimestamp()
      }, { merge: true })

      const participantDelta = prevDone === 0 && nextDone > 0 ? 1 : prevDone > 0 && nextDone === 0 ? -1 : 0
      const delta: Record<string, unknown> = {
        [`counts.${id}`]: increment(nextOn ? 1 : -1)
      }
      if (participantDelta) delta.participants = increment(participantDelta)
      await setDoc(doc(db, 'niyamStats', STATS_ID), delta, { merge: true })

      stats.value = {
        participants: Math.max(0, stats.value.participants + participantDelta),
        counts: {
          ...stats.value.counts,
          [id]: Math.max(0, (Number(stats.value.counts[id]) || 0) + (nextOn ? 1 : -1))
        }
      }
    } catch (e) {
      error.value = (e as Error).message
      checked.value = { ...checked.value, [id]: !nextOn }
      writeLocal(checked.value)
    } finally {
      savingId.value = null
    }
  }

  onMounted(async () => {
    loading.value = true
    await Promise.all([fetchNiyams(), fetchStats(), loadProgress()])
    loading.value = false
  })

  watch(() => user.value?.uid, async () => {
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
