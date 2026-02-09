import { collection, getDocs, addDoc, query, limit, serverTimestamp } from 'firebase/firestore'
import type { WordleScoreEntry } from '~/types/wordle'

function getDb() {
  if (import.meta.server) return null
  return useNuxtApp().$firebaseDb as import('firebase/firestore').Firestore | null
}

export function useWordleLeaderboard() {
  const entries = ref<WordleScoreEntry[]>([])
  const loading = ref(true)

  async function fetchLeaderboard() {
    loading.value = true
    const stopLoading = () => { loading.value = false }
    const safetyTimer = setTimeout(stopLoading, 5000)

    try {
      const db = getDb()
      if (!db) {
        entries.value = []
        clearTimeout(safetyTimer)
        loading.value = false
        return
      }
      const q = query(collection(db, 'wordleScores'), limit(100))
      const snap = await getDocs(q)
      entries.value = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          userId: data.userId,
          userName: data.userName || 'Anonymous',
          userEmail: data.userEmail,
          guesses: data.guesses,
          word: data.word,
          completedAt: data.completedAt
        } as WordleScoreEntry
      })
      entries.value.sort((a, b) => {
        if (a.guesses !== b.guesses) return a.guesses - b.guesses
        const ta = (a.completedAt as { seconds?: number })?.seconds ?? 0
        const tb = (b.completedAt as { seconds?: number })?.seconds ?? 0
        return tb - ta
      })
    } catch (_) {
      entries.value = []
    } finally {
      clearTimeout(safetyTimer)
      loading.value = false
    }
  }

  async function submitScore(guesses: number, word: string, userName: string, userId: string, userEmail?: string) {
    const db = getDb()
    if (!db) throw new Error('Firebase not configured')
    await addDoc(collection(db, 'wordleScores'), {
      userId,
      userName,
      userEmail: userEmail || null,
      guesses,
      word,
      completedAt: serverTimestamp()
    })
    await fetchLeaderboard()
  }

  onMounted(() => {
    if (import.meta.client) nextTick(() => fetchLeaderboard())
  })
  return { entries, loading, refetch: fetchLeaderboard, submitScore }
}
