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

export interface PlayStreakRestartNotice {
  previousStreak: number
}

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

function restartNoticeStorageKey(uid: string, day: string) {
  return `bhaktiras-streak-restart:${uid}:${day}`
}

function readDismissedRestart(uid: string, day: string): boolean {
  if (!import.meta.client) return false
  try {
    return sessionStorage.getItem(restartNoticeStorageKey(uid, day)) === 'dismissed'
  } catch {
    return false
  }
}

function markRestartDismissed(uid: string, day: string) {
  if (!import.meta.client) return
  try {
    sessionStorage.setItem(restartNoticeStorageKey(uid, day), 'dismissed')
  } catch {
    /* ignore private-mode / quota */
  }
}

export function usePlayStreak() {
  const auth = useAuth()
  const record = useState<PlayStreakRecord | null>('play-streak-record', () => null)
  const recording = useState<boolean>('play-streak-recording', () => false)
  const recordedKey = useState<string>('play-streak-recorded-key', () => '')
  const error = useState<string>('play-streak-error', () => '')
  const restartNotice = useState<PlayStreakRestartNotice | null>('play-streak-restart-notice', () => null)

  function dismissRestartNotice() {
    const user = auth.user.value
    if (user) markRestartDismissed(user.uid, ukDateId())
    restartNotice.value = null
  }

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
      const { next, brokenFrom } = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref)
        const existing = snap.exists() ? snap.data() : null
        const lastVisitDate = String(existing?.lastVisitDate || '')
        const previousDay = addUkDays(today, -1)
        const previousStreak = Number(existing?.currentStreak) || 0

        let currentStreak = previousStreak
        let brokenFrom: number | null = null
        if (lastVisitDate !== today) {
          if (lastVisitDate === previousDay) {
            currentStreak = previousStreak + 1
          } else {
            if (lastVisitDate && previousStreak >= 2) brokenFrom = previousStreak
            currentStreak = 1
          }
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
          next: {
            id: user.uid,
            userId: user.uid,
            userName: userName.slice(0, 32),
            currentStreak,
            longestStreak,
            lastVisitDate: today
          } satisfies PlayStreakRecord,
          brokenFrom
        }
      })

      record.value = next
      recordedKey.value = key
      if (brokenFrom != null && !readDismissedRestart(user.uid, today)) {
        restartNotice.value = { previousStreak: brokenFrom }
      }
      void callGameAchievements('streak', { userName: next.userName }).catch(() => {})
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not update your streak.'
    } finally {
      recording.value = false
    }
  }

  return { record, recording, error, recordVisit, restartNotice, dismissRestartNotice }
}

export const STREAK_PAGE_SIZE = 20

export function usePlayStreakLeaderboard() {
  const entries = ref<PlayStreakRecord[]>([])
  const loading = ref(true)
  const error = ref('')
  const page = ref(1)

  const pageCount = computed(() =>
    Math.max(1, Math.ceil(entries.value.length / STREAK_PAGE_SIZE))
  )

  const pageEntries = computed(() => {
    const start = (page.value - 1) * STREAK_PAGE_SIZE
    return entries.value.slice(start, start + STREAK_PAGE_SIZE)
  })

  function setPage(next: number) {
    page.value = Math.min(pageCount.value, Math.max(1, next))
  }

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
      }      ).sort((a, b) =>
        b.currentStreak - a.currentStreak
        || b.longestStreak - a.longestStreak
        || a.userName.localeCompare(b.userName)
      )
      page.value = 1
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load streaks.'
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchLeaderboard)

  return { entries, pageEntries, page, pageCount, loading, error, setPage, refetch: fetchLeaderboard }
}
