import { collection, getDocs, limit, query, where, type Firestore } from 'firebase/firestore'
import { MANDIR_DARSHAN_CHALLENGE_ID, userChallengeKey } from '~/utils/niyamChallenge'

/** Daily Darshan check-ins only count from the day the lock was introduced. */
export const LANKA_LEAP_UNLOCK_FROM = '2026-10-08'
export const LANKA_LEAP_UNLOCK_DAYS = 7
export const LANKA_LEAP_UNLOCK_FROM_LABEL = new Date(`${LANKA_LEAP_UNLOCK_FROM}T12:00:00Z`)
  .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'Europe/London' })

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

/**
 * Lanka Leap opens once a devotee has logged Daily Darshan on seven different
 * days since LANKA_LEAP_UNLOCK_FROM. Admins can always play.
 *
 * Reads the player's own `niyamSubmissions` with the same single-equality query
 * the niyam pages use, so no composite index is needed; the date and status
 * filters run in memory.
 */
export function useLankaLeapUnlock() {
  const { user, loading: authLoading } = useAuth()
  const { isAdminUser, adminChecked } = useAdminAccess()
  const daysDone = ref(0)
  const checked = ref(false)

  async function refresh() {
    const uid = user.value?.uid
    if (!uid) {
      daysDone.value = 0
      checked.value = true
      return
    }
    try {
      let db = getDb()
      if (!db) {
        await new Promise(resolve => setTimeout(resolve, 150))
        db = getDb()
      }
      if (!db) return
      const snap = await getDocs(query(
        collection(db, 'niyamSubmissions'),
        where('userChallengeKey', '==', userChallengeKey(uid, MANDIR_DARSHAN_CHALLENGE_ID)),
        limit(200)
      ))
      const days = new Set<string>()
      for (const item of snap.docs) {
        const data = item.data()
        const dayKey = String(data.dayKey || '')
        if (data.status !== 'rejected' && dayKey >= LANKA_LEAP_UNLOCK_FROM) days.add(dayKey)
      }
      daysDone.value = days.size
    } catch {
      daysDone.value = 0
    } finally {
      checked.value = true
    }
  }

  watch(() => user.value?.uid, () => {
    checked.value = false
    void refresh()
  }, { immediate: true })

  const ready = computed(() => !authLoading.value && checked.value && (!user.value || adminChecked.value))
  const unlocked = computed(() => isAdminUser.value || daysDone.value >= LANKA_LEAP_UNLOCK_DAYS)

  return { ready, unlocked, daysDone, isAdminUser, refresh }
}
