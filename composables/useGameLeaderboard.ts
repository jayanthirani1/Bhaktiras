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
/** Max score value (covers time in seconds or ms-scale rankings). */
const SCORE_MAX = 9_999_999

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

async function cleanseOldScores(
  db: import('firebase/firestore').Firestore,
  today: string,
  game: GameLeaderboardId
) {
  // Clean up yesterday's rows for games whose leaderboards reset each UK day.
  const dailyGames: GameLeaderboardId[] = [
    'wordle',
    'one-percent',
    'mini-crossword',
    'connections',
    'bracket-city',
  ]
  if (!dailyGames.includes(game)) return

  try {
    const oldSnap = await getDocs(query(
      collection(db, SCORES_COLLECTION),
      where('game', '==', game),
      where('dateId', '<', today),
      limit(MAX_CLEANSE)
    ))
    if (!oldSnap.empty) {
      const batch = writeBatch(db)
      oldSnap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
    }
  } catch {
    // Rules or index may not be deployed yet; leaderboard still works for today.
  }

  if (game === 'wordle') {
    try {
      const legacy = await getDocs(query(collection(db, LEGACY_WORDLE_COLLECTION), limit(MAX_CLEANSE)))
      if (!legacy.empty) {
        const batch = writeBatch(db)
        legacy.docs.forEach((d) => {
          const dateId = d.data().dateId
          if (!dateId || dateId < today) batch.delete(d.ref)
        })
        await batch.commit()
      }
    } catch {
      // Legacy collection optional.
    }
  }
}

function mapScoreDoc(
  id: string,
  data: Record<string, unknown>,
  game: GameLeaderboardId
): GameScoreEntry {
  return {
    id,
    game: (data.game || game) as GameLeaderboardId,
    dateId: String(data.dateId || ''),
    userId: String(data.userId || ''),
    userName: String(data.userName || 'Anonymous'),
    userEmail: data.userEmail ? String(data.userEmail) : undefined,
    score: Number(data.score ?? data.guesses ?? 0),
    timeMs: data.timeMs != null ? Number(data.timeMs) : undefined,
    detail: String(data.detail || data.word || ''),
    completedAt: data.completedAt as GameScoreEntry['completedAt']
  }
}

function currentUid() {
  if (import.meta.server) return ''
  const auth = useNuxtApp().$firebaseAuth as import('firebase/auth').Auth | null
  return auth?.currentUser?.uid || ''
}

function isBetter(
  candidate: GameScoreEntry,
  existing: GameScoreEntry,
  sortDir: 'asc' | 'desc'
) {
  if (candidate.score !== existing.score) {
    return sortDir === 'asc' ? candidate.score < existing.score : candidate.score > existing.score
  }
  const ct = candidate.timeMs ?? Number.POSITIVE_INFINITY
  const et = existing.timeMs ?? Number.POSITIVE_INFINITY
  if (ct !== et) return ct < et
  return timestampSeconds(candidate.completedAt) > timestampSeconds(existing.completedAt)
}

export function useGameLeaderboard(
  game: GameLeaderboardId,
  options: { sort?: 'asc' | 'desc'; allTime?: boolean } = {}
) {
  const sortDir = options.sort ?? 'desc'
  const allTime = !!options.allTime
  const entries = ref<GameScoreEntry[]>([])
  const loading = ref(false)
  const dateId = ref(ukDateId())

  function sortEntries(list: GameScoreEntry[]) {
    const bestByUser = new Map<string, GameScoreEntry>()
    const extraIds: string[] = []
    for (const e of list) {
      if (!e.userId) continue
      const prev = bestByUser.get(e.userId)
      if (!prev) {
        bestByUser.set(e.userId, e)
        continue
      }
      if (isBetter(e, prev, sortDir)) {
        extraIds.push(prev.id)
        bestByUser.set(e.userId, e)
      } else {
        extraIds.push(e.id)
      }
    }
    const deduped = [...bestByUser.values()]
    deduped.sort((a, b) => {
      if (a.score !== b.score) return sortDir === 'asc' ? a.score - b.score : b.score - a.score
      const at = a.timeMs ?? Number.POSITIVE_INFINITY
      const bt = b.timeMs ?? Number.POSITIVE_INFINITY
      if (at !== bt) return at - bt
      return timestampSeconds(b.completedAt) - timestampSeconds(a.completedAt)
    })
    return { deduped, extraIds }
  }

  function upsertLocal(entry: GameScoreEntry) {
    const { deduped } = sortEntries([...entries.value.filter(e => e.id !== entry.id), entry])
    entries.value = deduped
  }

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
        snap = allTime
          ? await getDocs(query(
            collection(db, SCORES_COLLECTION),
            where('game', '==', game),
            limit(200)
          ))
          : await getDocs(query(
            collection(db, SCORES_COLLECTION),
            where('game', '==', game),
            where('dateId', '==', today),
            limit(100)
          ))
      } catch {
        snap = await getDocs(query(
          collection(db, SCORES_COLLECTION),
          where('game', '==', game),
          limit(200)
        ))
      }

      const mapped = snap.docs.map(d => mapScoreDoc(d.id, d.data() as Record<string, unknown>, game))
        .filter(e => e.game === game && (allTime || e.dateId === today))

      const uid = currentUid()
      if (uid) {
        const mineId = allTime ? `${game}_${uid}` : `${game}_${today}_${uid}`
        if (!mapped.some(e => e.id === mineId || e.userId === uid)) {
          try {
            const mine = await getDoc(doc(db, SCORES_COLLECTION, mineId))
            if (mine.exists()) {
              const row = mapScoreDoc(mine.id, mine.data() as Record<string, unknown>, game)
              if (row.game === game && (allTime || row.dateId === today)) mapped.push(row)
            }
          } catch {
            // ignore
          }
        }
      }

      const { deduped, extraIds } = sortEntries(mapped)
      entries.value = deduped
      if (!allTime) void cleanseOldScores(db, today, game)
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
    timeMs?: number
  }) {
    if (!payload.userId) throw new Error('Sign in to submit your score.')
    if (!Number.isFinite(payload.score) || payload.score < 0) throw new Error('Invalid score.')
    const db = getDb()
    if (!db) throw new Error('Firebase not configured')
    const today = ukDateId()
    dateId.value = today
    const score = Math.trunc(Number(payload.score))
    if (score > SCORE_MAX) throw new Error('Invalid score.')

    const scoreId = allTime ? `${game}_${payload.userId}` : `${game}_${today}_${payload.userId}`
    const scoreRef = doc(db, SCORES_COLLECTION, scoreId)
    const existing = await getDoc(scoreRef)
    if (existing.exists()) {
      const prev = mapScoreDoc(existing.id, existing.data() as Record<string, unknown>, game)
      const next: GameScoreEntry = {
        ...prev,
        score,
        timeMs: payload.timeMs,
        detail: payload.detail,
        userName: safeDisplayName(payload.userName)
      }
      if (!isBetter(next, prev, sortDir)) {
        upsertLocal(prev)
        await fetchLeaderboard()
        return
      }
    }

    const data: Record<string, unknown> = {
      game,
      dateId: today,
      userId: payload.userId,
      userName: safeDisplayName(payload.userName),
      score,
      completedAt: serverTimestamp()
    }
    if (payload.detail) data.detail = String(payload.detail).slice(0, 64)
    if (payload.timeMs != null && Number.isFinite(payload.timeMs)) {
      data.timeMs = Math.max(0, Math.trunc(payload.timeMs))
    }

    await setDoc(scoreRef, data)
    const written = await getDoc(scoreRef)
    if (!written.exists()) throw new Error('Score did not save. Please try again.')
    upsertLocal(mapScoreDoc(written.id, written.data() as Record<string, unknown>, game))
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
