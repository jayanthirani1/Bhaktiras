import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'
import type { GameLeaderboardId, GameScoreEntry } from '~/types'
import { ukDateId } from '~/utils/gameDay'

const USERNAME_MAX_LENGTH = 32
const SCORES_COLLECTION = 'gameScores'
const LEGACY_WORDLE_COLLECTION = 'wordleScores'
const MAX_CLEANSE = 400

function getDb() {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as import('firebase/firestore').Firestore | null) ?? null
}

function safeDisplayName(userName: string): string {
  const cleaned = (userName || '')
    .replace(/[^\p{L}\p{N}\s\-_.']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, USERNAME_MAX_LENGTH)
  return cleaned || 'Player'
}

function timestampSeconds(value: GameScoreEntry['completedAt']): number {
  if (!value) return 0
  if (value instanceof Date) return Math.floor(value.getTime() / 1000)
  return value.seconds ?? 0
}

async function deleteOwnDuplicates(
  db: import('firebase/firestore').Firestore,
  extraIds: string[]
) {
  for (const id of extraIds.slice(0, 50)) {
    try {
      await deleteDoc(doc(db, SCORES_COLLECTION, id))
    } catch {
      // Other users' leftover rows stay in the DB; the list is already deduped.
    }
  }
}

async function cleanseOldScores(db: import('firebase/firestore').Firestore, today: string) {
  try {
    const oldSnap = await getDocs(query(
      collection(db, SCORES_COLLECTION),
      where('dateId', '<', today),
      limit(MAX_CLEANSE)
    ))
    if (!oldSnap.empty) {
      const batch = writeBatch(db)
      oldSnap.docs.forEach(doc => batch.delete(doc.ref))
      await batch.commit()
    }
  } catch {
    // Rules or index may not be deployed yet; leaderboard still works for today.
  }

  try {
    const legacy = await getDocs(query(collection(db, LEGACY_WORDLE_COLLECTION), limit(MAX_CLEANSE)))
    if (!legacy.empty) {
      const batch = writeBatch(db)
      legacy.docs.forEach((doc) => {
        const dateId = doc.data().dateId
        if (!dateId || dateId < today) batch.delete(doc.ref)
      })
      await batch.commit()
    }
  } catch {
    // Legacy collection optional.
  }
}

export function useGameLeaderboard(
  game: GameLeaderboardId,
  options: { sort?: 'asc' | 'desc' } = {}
) {
  const sortDir = options.sort ?? 'desc'
  const entries = ref<GameScoreEntry[]>([])
  const loading = ref(false)
  const dateId = ref(ukDateId())

  async function fetchLeaderboard() {
    loading.value = true
    const today = ukDateId()
    dateId.value = today
    try {
      let db = getDb()
      if (!db) {
        await new Promise(r => setTimeout(r, 150))
        db = getDb()
      }
      if (!db) {
        entries.value = []
        return
      }

      let snap
      try {
        snap = await getDocs(query(
          collection(db, SCORES_COLLECTION),
          where('game', '==', game),
          where('dateId', '==', today),
          limit(100)
        ))
      } catch {
        snap = await getDocs(query(collection(db, SCORES_COLLECTION), limit(100)))
      }

      const mapped = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          game: (data.game || game) as GameLeaderboardId,
          dateId: data.dateId || '',
          userId: data.userId,
          userName: data.userName || 'Anonymous',
          userEmail: data.userEmail,
          score: Number(data.score ?? data.guesses ?? 0),
          detail: data.detail || data.word || '',
          completedAt: data.completedAt
        } as GameScoreEntry
      }).filter(e => e.dateId === today)

      const bestByUser = new Map<string, GameScoreEntry>()
      const extraIds: string[] = []
      for (const e of mapped) {
        const prev = bestByUser.get(e.userId)
        if (!prev) {
          bestByUser.set(e.userId, e)
          continue
        }
        const takeNew = sortDir === 'asc' ? e.score < prev.score : e.score > prev.score
        if (takeNew) {
          extraIds.push(prev.id)
          bestByUser.set(e.userId, e)
        } else {
          extraIds.push(e.id)
        }
      }

      const deduped = [...bestByUser.values()]
      deduped.sort((a, b) => {
        if (a.score !== b.score) return sortDir === 'asc' ? a.score - b.score : b.score - a.score
        return timestampSeconds(b.completedAt) - timestampSeconds(a.completedAt)
      })
      entries.value = deduped
      void cleanseOldScores(db, today)
      if (extraIds.length) void deleteOwnDuplicates(db, extraIds)
    } catch {
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  async function submitScore(payload: {
    score: number
    userName: string
    userId: string
    userEmail?: string
    detail?: string
  }) {
    if (!payload.userId) throw new Error('Sign in to submit your score.')
    if (!Number.isFinite(payload.score) || payload.score < 0) throw new Error('Invalid score.')
    const db = getDb()
    if (!db) throw new Error('Firebase not configured')
    const today = ukDateId()
    dateId.value = today

    const scoreId = `${game}_${today}_${payload.userId}`
    const scoreRef = doc(db, SCORES_COLLECTION, scoreId)
    const existing = await getDoc(scoreRef)
    if (existing.exists()) {
      await fetchLeaderboard()
      return
    }

    const data: Record<string, unknown> = {
      game,
      dateId: today,
      userId: payload.userId,
      userName: safeDisplayName(payload.userName),
      score: Math.round(payload.score),
      completedAt: serverTimestamp()
    }
    if (payload.detail) data.detail = String(payload.detail).slice(0, 64)
    if (payload.userEmail) data.userEmail = payload.userEmail

    try {
      await setDoc(scoreRef, data)
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code || ''
      if (!code.includes('permission-denied') && !code.includes('already-exists')) throw e
    }
    await fetchLeaderboard()
  }

  function onVisible() {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      fetchLeaderboard()
    }
  }

  onMounted(() => {
    fetchLeaderboard()
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible)
    }
  })

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisible)
    }
  })

  return {
    entries,
    loading,
    dateId,
    refetch: fetchLeaderboard,
    submitScore
  }
}

export function useDailySubmitFlag(game: GameLeaderboardId) {
  const submitted = ref(false)

  function storageKey() {
    return `leaderboard-submitted:${game}:${ukDateId()}`
  }

  onMounted(() => {
    try {
      submitted.value = localStorage.getItem(storageKey()) === '1'
    } catch {
      submitted.value = false
    }
  })

  function markSubmitted() {
    submitted.value = true
    try {
      localStorage.setItem(storageKey(), '1')
    } catch {}
  }

  return { submitted, markSubmitted }
}
