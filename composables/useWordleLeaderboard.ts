import { collection, getDocs, addDoc, query, limit, orderBy, serverTimestamp } from 'firebase/firestore'
import type { WordleScoreEntry } from '~/types/wordle'
import { WORD_LEN } from '~/utils/wordleDaily'

const USERNAME_MAX_LENGTH = 32
const VALID_USERNAME_REGEX = /^[\p{L}\p{N}\s\-_.]+$/u

function getDb() {
  if (import.meta.server) return null
  return useNuxtApp().$firebaseDb as import('firebase/firestore').Firestore | null
}

function validateScore(guesses: number, word: string, userName: string): void {
  if (!Number.isInteger(guesses) || guesses < 1 || guesses > 6) {
    throw new Error('Invalid guesses (must be 1–6).')
  }
  const w = (word || '').toUpperCase().trim()
  if (w.length !== WORD_LEN || !/^[A-Z]+$/.test(w)) {
    throw new Error('Invalid word.')
  }
  const name = (userName || '').trim()
  if (!name || name.length > USERNAME_MAX_LENGTH) {
    throw new Error('Display name must be 1–32 characters.')
  }
  if (!VALID_USERNAME_REGEX.test(name)) {
    throw new Error('Display name contains invalid characters.')
  }
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
      let snap
      try {
        const q = query(
          collection(db, 'wordleScores'),
          orderBy('guesses', 'asc'),
          orderBy('completedAt', 'desc'),
          limit(100)
        )
        snap = await getDocs(q)
      } catch {
        const q = query(collection(db, 'wordleScores'), limit(100))
        snap = await getDocs(q)
      }
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
    validateScore(guesses, word, userName)
    const db = getDb()
    if (!db) throw new Error('Firebase not configured')
    const safeName = (userName || '').trim().slice(0, USERNAME_MAX_LENGTH)
    await addDoc(collection(db, 'wordleScores'), {
      userId,
      userName: safeName,
      userEmail: userEmail || null,
      guesses,
      word: (word || '').toUpperCase().trim(),
      completedAt: serverTimestamp()
    })
    await fetchLeaderboard()
  }

  onMounted(() => {
    if (import.meta.client) nextTick(() => fetchLeaderboard())
  })
  return { entries, loading, refetch: fetchLeaderboard, submitScore }
}
