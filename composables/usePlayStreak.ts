import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore'
import type { PlayStreakRecord } from '~/types'
import { addUkDays, ukDateId } from '~/utils/gameDay'
import { callGameAchievements } from '~/composables/useAchievements'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

export function usePlayStreak() {
  const auth = useAuth()
  const record = useState<PlayStreakRecord | null>('play-streak-record', () => null)
  const recording = useState<boolean>('play-streak-recording', () => false)
  const recordedKey = useState<string>('play-streak-recorded-key', () => '')
  const error = useState<string>('play-streak-error', () => '')

  async function recordVisit() {
    const user = auth.user.value
    const db = getDb()
    if (!user || !db || recording.value) return

    const today = ukDateId()
    const key = `${user.uid}:${today}`
    if (recordedKey.value === key && record.value) return

    recording.value = true
    error.value = ''
    try {
      const ref = doc(db, 'playStreaks', user.uid)
      const next = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref)
        const existing = snap.exists() ? snap.data() : null
        const lastVisitDate = String(existing?.lastVisitDate || '')
        const previousDay = addUkDays(today, -1)

        let currentStreak = Number(existing?.currentStreak) || 0
        if (lastVisitDate !== today) {
          currentStreak = lastVisitDate === previousDay ? currentStreak + 1 : 1
        }
        const longestStreak = Math.max(Number(existing?.longestStreak) || 0, currentStreak)
        const userName = auth.userName.value || auth.userEmail.value || 'Player'

        transaction.set(ref, {
          userId: user.uid,
          userName: userName.slice(0, 32),
          currentStreak,
          longestStreak,
          lastVisitDate: today,
          updatedAt: serverTimestamp()
        }, { merge: true })

        return {
          id: user.uid,
          userId: user.uid,
          userName: userName.slice(0, 32),
          currentStreak,
          longestStreak,
          lastVisitDate: today
        } satisfies PlayStreakRecord
      })

      record.value = next
      recordedKey.value = key
      void callGameAchievements('streak', { userName: next.userName }).catch(() => {})
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not update your streak.'
    } finally {
      recording.value = false
    }
  }

  return { record, recording, error, recordVisit }
}

export function usePlayStreakLeaderboard() {
  const entries = ref<PlayStreakRecord[]>([])
  const loading = ref(true)
  const error = ref('')

  async function fetchLeaderboard() {
    loading.value = true
    error.value = ''
    try {
      const db = getDb()
      if (!db) {
        entries.value = []
        return
      }
      const snap = await getDocs(collection(db, 'playStreaks'))
      const today = ukDateId()
      const yesterday = addUkDays(today, -1)
      entries.value = snap.docs.map((item) => {
        const data = item.data()
        const lastVisitDate = String(data.lastVisitDate || '')
        const active = lastVisitDate === today || lastVisitDate === yesterday
        return {
          id: item.id,
          userId: String(data.userId || item.id),
          userName: String(data.userName || 'Player'),
          currentStreak: active ? Number(data.currentStreak) || 0 : 0,
          longestStreak: Number(data.longestStreak) || 0,
          lastVisitDate
        } satisfies PlayStreakRecord
      }).sort((a, b) =>
        b.currentStreak - a.currentStreak
        || b.longestStreak - a.longestStreak
        || a.userName.localeCompare(b.userName)
      )
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load streaks.'
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchLeaderboard)

  return { entries, loading, error, refetch: fetchLeaderboard }
}
