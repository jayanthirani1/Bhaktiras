import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp
} from 'firebase/firestore'
import type { GameLeaderboardId, GameScoreEntry } from '~/types'
import { ukDateId } from '~/utils/gameDay'

const USERNAME_MAX_LENGTH = 32
const SCORES_COLLECTION = 'gameScores'
/** Max score value (covers time in seconds or ms-scale rankings). */
const SCORE_MAX = 9_999_999

/** Older Surya Chandra rows were written as Bhakti Marg. Read both; write the new id. */
const SCORE_GAME_ALIASES: Partial<Record<GameLeaderboardId, GameLeaderboardId[]>> = {
  'surya-chandra': ['bhakti-marg']
}

function scoreQueryIds(game: GameLeaderboardId): GameLeaderboardId[] {
  return [game, ...(SCORE_GAME_ALIASES[game] || [])]
}

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

/**
 * `deleteOwnDuplicates` and `cleanseOldScores` used to live here.
 *
 * Both deleted Firestore documents from the browser on every leaderboard
 * fetch — the sweep alone was a 400-document query plus a 400-document batch
 * delete, run again by every visitor. It also forced `gameScores` to allow
 * unauthenticated deletes, because the rule had to permit whatever the client
 * was doing.
 *
 * Yesterday's rows are now cleared by `pruneOldGameScores`, a scheduled
 * function running at 03:10 UK. Duplicates cannot accumulate any more either:
 * the document id is `{game}_{dateId}_{uid}` and the rules pin it, so a player
 * has exactly one row per game per day by construction. The board still dedups
 * in memory below to stay correct against rows written before that rule.
 */

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
    for (const e of list) {
      if (!e.userId) continue
      const prev = bestByUser.get(e.userId)
      if (!prev || isBetter(e, prev, sortDir)) bestByUser.set(e.userId, e)
    }
    const deduped = [...bestByUser.values()]
    deduped.sort((a, b) => {
      if (a.score !== b.score) return sortDir === 'asc' ? a.score - b.score : b.score - a.score
      const at = a.timeMs ?? Number.POSITIVE_INFINITY
      const bt = b.timeMs ?? Number.POSITIVE_INFINITY
      if (at !== bt) return at - bt
      return timestampSeconds(b.completedAt) - timestampSeconds(a.completedAt)
    })
    return deduped
  }

  function upsertLocal(entry: GameScoreEntry) {
    entries.value = sortEntries([...entries.value.filter(e => e.id !== entry.id), entry])
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

      const ids = scoreQueryIds(game)
      const known = new Set(ids)

      async function queryGame(id: GameLeaderboardId) {
        try {
          return allTime
            ? await getDocs(query(
              collection(db, SCORES_COLLECTION),
              where('game', '==', id),
              limit(200)
            ))
            : await getDocs(query(
              collection(db, SCORES_COLLECTION),
              where('game', '==', id),
              where('dateId', '==', today),
              limit(100)
            ))
        } catch {
          return getDocs(query(
            collection(db, SCORES_COLLECTION),
            where('game', '==', id),
            limit(200)
          ))
        }
      }

      const snaps = await Promise.all(ids.map(queryGame))
      const mapped = snaps
        .flatMap(snap => snap.docs.map(d => mapScoreDoc(d.id, d.data() as Record<string, unknown>, game)))
        .filter(e => known.has(e.game) && (allTime || e.dateId === today))

      const uid = currentUid()
      if (uid && !mapped.some(e => e.userId === uid)) {
        for (const id of ids) {
          const mineId = allTime ? `${id}_${uid}` : `${id}_${today}_${uid}`
          try {
            const mine = await getDoc(doc(db, SCORES_COLLECTION, mineId))
            if (mine.exists()) {
              const row = mapScoreDoc(mine.id, mine.data() as Record<string, unknown>, game)
              if (known.has(row.game) && (allTime || row.dateId === today)) {
                mapped.push(row)
                break
              }
            }
          } catch {
            // ignore
          }
        }
      }

      entries.value = sortEntries(mapped)
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
    for (const alias of SCORE_GAME_ALIASES[game] || []) {
      const legacyId = allTime ? `${alias}_${payload.userId}` : `${alias}_${today}_${payload.userId}`
      try {
        await deleteDoc(doc(db, SCORES_COLLECTION, legacyId))
      } catch {
        // Old Bhakti Marg row may not exist.
      }
    }
    // Merge locally rather than refetching: the write has already succeeded, and
    // `completedAt` is the only field the server fills in — it matters for tie
    // breaks, so use the moment of writing until the next natural refresh.
    upsertLocal(mapScoreDoc(scoreId, { ...data, completedAt: new Date() }, game))
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
