import { getApp } from 'firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit
} from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import type { GameLeaderboardId, GameScoreEntry, LegacyGameLeaderboardId } from '~/types'
import { ukDateId } from '~/utils/gameDay'

const USERNAME_MAX_LENGTH = 32
const SCORES_COLLECTION = 'gameScores'

/** What a finished game proves, replayed by `submitGameScore` (see utils/gameVerify.ts). */
export type ScoreProof = {
  guesses?: string[]
  attempts?: string[][]
  answers?: string[]
  letters?: Record<string, string>
  drops?: Array<[number, number]>
  board?: Array<Array<0 | 1 | null>>
}

/** Older Surya Chandra rows were written as Bhakti Marg. Read both; write the new id. */
const SCORE_GAME_ALIASES: Partial<Record<GameLeaderboardId, LegacyGameLeaderboardId[]>> = {
  'surya-chandra': ['bhakti-marg']
}

function scoreQueryIds(game: GameLeaderboardId): Array<GameLeaderboardId | LegacyGameLeaderboardId> {
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

/** Newer Lanka Leap rows store `tulsi`; older ones only mention it in `detail`. */
function tulsiFromScore(data: Record<string, unknown>): number | undefined {
  const fromField = Number(data.tulsi)
  const match = String(data.detail || '').match(/(\d+)\s+tulsi/)
  const fromDetail = match ? Number(match[1]) : 0
  const tulsi = Math.max(Number.isFinite(fromField) ? fromField : 0, fromDetail)
  return tulsi > 0 ? tulsi : undefined
}

/** Legacy Surya Chandra rows stored move count in `score` and time in `timeMs`. */
function parseMovesFromDetail(entry: GameScoreEntry): number {
  const match = entry.detail?.match(/(\d+)\s+moves?/)
  if (match) return Number(match[1])
  if (entry.timeMs != null && entry.score > 0 && entry.score < 10_000) return entry.score
  return Number.POSITIVE_INFINITY
}

function rankValue(entry: GameScoreEntry, rankBy: 'score' | 'timeMs'): number {
  if (rankBy === 'timeMs') {
    const ms = entry.timeMs ?? (entry.score >= 1000 ? entry.score : null)
    return ms != null && ms > 0 ? ms : Number.POSITIVE_INFINITY
  }
  return entry.score
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
    // Always label with the live game id — alias rows may still say bhakti-marg.
    game,
    dateId: String(data.dateId || ''),
    userId: String(data.userId || ''),
    userName: String(data.userName || 'Anonymous'),
    userEmail: data.userEmail ? String(data.userEmail) : undefined,
    score: Number(data.score ?? data.guesses ?? 0),
    tulsi: tulsiFromScore(data),
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
  sortDir: 'asc' | 'desc',
  rankBy: 'score' | 'timeMs'
) {
  const cs = rankValue(candidate, rankBy)
  const es = rankValue(existing, rankBy)
  if (cs !== es) {
    return sortDir === 'asc' ? cs < es : cs > es
  }
  if (rankBy === 'timeMs') {
    const cm = parseMovesFromDetail(candidate)
    const em = parseMovesFromDetail(existing)
    if (cm !== em) return cm < em
  } else if (candidate.score === existing.score) {
    const ct = candidate.timeMs ?? Number.POSITIVE_INFINITY
    const et = existing.timeMs ?? Number.POSITIVE_INFINITY
    if (ct !== et) return ct < et
  }
  return timestampSeconds(candidate.completedAt) > timestampSeconds(existing.completedAt)
}

export function useGameLeaderboard(
  game: GameLeaderboardId,
  options: { sort?: 'asc' | 'desc'; allTime?: boolean; rankBy?: 'score' | 'timeMs' } = {}
) {
  const sortDir = options.sort ?? 'desc'
  const rankBy = options.rankBy ?? 'score'
  const allTime = !!options.allTime
  const entries = ref<GameScoreEntry[]>([])
  const loading = ref(false)
  const dateId = ref(ukDateId())

  function sortEntries(list: GameScoreEntry[]) {
    const bestByUser = new Map<string, GameScoreEntry>()
    for (const e of list) {
      if (!e.userId) continue
      const prev = bestByUser.get(e.userId)
      if (!prev || isBetter(e, prev, sortDir, rankBy)) bestByUser.set(e.userId, e)
    }
    const deduped = [...bestByUser.values()]
    deduped.sort((a, b) => {
      const av = rankValue(a, rankBy)
      const bv = rankValue(b, rankBy)
      if (av !== bv) return sortDir === 'asc' ? av - bv : bv - av
      if (rankBy === 'timeMs') {
        const am = parseMovesFromDetail(a)
        const bm = parseMovesFromDetail(b)
        if (am !== bm) return am - bm
      } else if (a.score !== b.score) {
        return sortDir === 'asc' ? a.score - b.score : b.score - a.score
      } else {
        const at = a.timeMs ?? Number.POSITIVE_INFINITY
        const bt = b.timeMs ?? Number.POSITIVE_INFINITY
        if (at !== bt) return at - bt
      }
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
      // `db` is a `let`, so TypeScript discards the null-narrowing inside the
      // nested closure below — a closure could observe a later reassignment.
      // Pinning it to a const keeps the narrowing where `queryGame` can see it.
      const database = db

      const ids = scoreQueryIds(game)
      const known = new Set(ids)

      async function queryGame(id: GameLeaderboardId | LegacyGameLeaderboardId) {
        try {
          return allTime
            ? await getDocs(query(
              collection(database, SCORES_COLLECTION),
              where('game', '==', id),
              limit(200)
            ))
            : await getDocs(query(
              collection(database, SCORES_COLLECTION),
              where('game', '==', id),
              where('dateId', '==', today),
              limit(100)
            ))
        } catch {
          return getDocs(query(
            collection(database, SCORES_COLLECTION),
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
            const mine = await getDoc(doc(database, SCORES_COLLECTION, mineId))
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

  /**
   * Sends a finished game to `submitGameScore`, which replays `proof` against
   * the day's puzzle and writes the row itself; browsers cannot write scores.
   * The server keeps whichever row ranks better and returns it.
   */
  async function submitScore(payload: {
    userName: string
    userId: string
    timeMs: number
    proof: ScoreProof
    hintsUsed?: number
    moves?: number
  }) {
    if (!payload.userId) throw new Error('Sign in to submit your score.')
    const today = ukDateId()
    dateId.value = today
    const call = httpsCallable<
      { game: GameLeaderboardId; dateId: string; userName: string; timeMs: number; proof: ScoreProof; hintsUsed?: number; moves?: number },
      { id: string; entry: Record<string, unknown> }
    >(getFunctions(getApp(), 'europe-west2'), 'submitGameScore')
    try {
      const { data } = await call({
        game,
        dateId: today,
        userName: safeDisplayName(payload.userName),
        timeMs: Math.trunc(payload.timeMs),
        proof: payload.proof,
        hintsUsed: payload.hintsUsed,
        moves: payload.moves
      })
      // `completedAt` is the one field the server fills in; use now until the next refresh.
      upsertLocal(mapScoreDoc(data.id, { ...data.entry, completedAt: new Date() }, game))
    } catch (error) {
      const message = (error as { message?: string })?.message || ''
      throw new Error(message && !/^internal$/i.test(message) ? message : 'Could not submit your score. Please try again.')
    }
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
