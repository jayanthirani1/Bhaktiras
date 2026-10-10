import { collection, getDocs, query, where, type Firestore } from 'firebase/firestore'
import { MANDIR_DARSHAN_CHALLENGE_ID, MANDIR_DARSHAN_LAUNCH_DAY } from '~/utils/niyamChallenge'

/** Distinct Daily Darshan days needed before Lanka Leap opens. */
export const LANKA_LEAP_UNLOCK_DAYS = 7

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

/**
 * Lanka Leap opens once a devotee has logged Daily Darshan on seven different
 * days since the niyam launched. Admins can always play. Days already logged
 * count — morning and evening on the same day are one day.
 *
 * The list is filtered on `userId`. Rules only allow a collection query when
 * they can prove `userId == auth.uid`. A `userChallengeKey` filter does not
 * prove that, so devotees were denied and the unlock stayed at zero. Admins
 * slipped through because `isAdmin()` allows any list.
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
        where('userId', '==', uid)
      ))
      const days = new Set<string>()
      for (const item of snap.docs) {
        const data = item.data()
        if (data.challengeId !== MANDIR_DARSHAN_CHALLENGE_ID) continue
        const dayKey = String(data.dayKey || '')
        if (data.status !== 'rejected' && dayKey >= MANDIR_DARSHAN_LAUNCH_DAY) days.add(dayKey)
      }
      daysDone.value = days.size
    } catch (error) {
      console.warn('[lanka-leap] could not read Daily Darshan days', error)
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
