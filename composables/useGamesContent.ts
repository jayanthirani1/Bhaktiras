import { collection, doc, getDoc, getDocs, type Firestore } from 'firebase/firestore'
import type { BracketCityPuzzle, ConnectionsPuzzle, CrosswordPuzzle, GameWordEntry, OnePercentQuestion, WordleWordDoc } from '~/types'
import { DEFAULT_MINI_CROSSWORD } from '~/data/miniCrossword'
import { DEFAULT_CONNECTIONS_PUZZLES } from '~/data/connectionsPuzzles'
import { DEFAULT_BRACKET_CITY_PUZZLES } from '~/data/bracketCityPuzzles'
import { CHARITRA_BRACKET_CITY_PUZZLES } from '~/data/bracketCityCharitra'
import { rngForSeed, shuffle } from '~/utils/seededRandom'
import { buildDailyBracketCity } from '~/utils/bracketCityGenerator'
import { parseBracketSource } from '~/utils/bracketCity'
import {
  onePercentPackForDate,
  withShuffledOptions,
  type OnePercentPack
} from '~/data/onePercentClub'
import { ukDateId } from '~/utils/gameDay'
import { wordleDateId } from '~/utils/wordleDaily'
import {
  createFittedDailyCrossword,
  gameTargetsForAnswer,
  mergeGameWords,
  normalizeGameWord
} from '~/utils/gameWordBank'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

function mapCustomGameWords(snap: Awaited<ReturnType<typeof getDocs>>): GameWordEntry[] {
  return snap.docs.map((item) => {
    const data = item.data() as Record<string, unknown>
    const answer = normalizeGameWord(String(data.answer || data.display || ''))
    const replaces = normalizeGameWord(String(data.replaces || ''))
    return {
      id: item.id,
      answer,
      display: String(data.display || answer).trim(),
      clue: String(data.clue || '').trim(),
      category: String(data.category || 'custom').trim() || 'custom',
      source: replaces ? 'Edited' : 'Custom',
      games: gameTargetsForAnswer(answer),
      ...(replaces ? { replaces } : {})
    }
  }).filter(entry => entry.answer.length >= 3 && entry.answer.length <= 24 && entry.clue)
}

export async function fetchMergedGameWords(): Promise<GameWordEntry[]> {
  const db = getDb()
  if (!db) return mergeGameWords()
  const snap = await getDocs(collection(db, 'gameWords'))
  return mergeGameWords(mapCustomGameWords(snap))
}

export function useMiniCrosswordPuzzles() {
  const today = wordleDateId()
  // Falls back to the curated puzzle if no roll fits, so a broken grid never ships.
  const dailyPuzzle = createFittedDailyCrossword(today) || { ...DEFAULT_MINI_CROSSWORD }
  const puzzles = ref<CrosswordPuzzle[]>([dailyPuzzle])
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const [snap, wordSnap] = await Promise.all([
        getDocs(collection(db, 'miniCrosswordPuzzles')),
        getDocs(collection(db, 'gameWords'))
      ])
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as CrosswordPuzzle))
        .filter(p => p.title && p.clues?.length)
      const customDaily = createFittedDailyCrossword(
        today,
        mergeGameWords(mapCustomGameWords(wordSnap))
      )
      const overrideId = `daily-${today}`
      const override = remote.find(p => p.id === overrideId)
      // The generated puzzle is the only player-facing crossword. Admin-authored
      // puzzles and the built-in fallback remain if generation has too few words.
      puzzles.value = [
        override
        || customDaily
        || remote[0]
        || { ...DEFAULT_MINI_CROSSWORD }
      ]
    } finally {
      loading.value = false
    }
  })

  return { puzzles, loading }
}

export function useOnePercentQuestions() {
  const dateId = ukDateId()
  const fallback = onePercentPackForDate(dateId)
  const pack = ref<OnePercentPack>(fallback)
  const questions = ref<OnePercentQuestion[]>(fallback.questions.map(q => withShuffledOptions(q, dateId)))
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const snap = await getDocs(collection(db, 'onePercentQuestions'))
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as OnePercentQuestion))
        .filter(q => q.question && q.options?.length && q.correctAnswer && q.percent != null)
      const todayExact = remote
        .filter(q => q.dateId === dateId || q.packId === `daily-${dateId}`)
        .sort((a, b) => (b.percent - a.percent) || (a.order ?? 0) - (b.order ?? 0))
      const packOverride = remote
        .filter(q => q.packId === fallback.id)
        .sort((a, b) => (b.percent - a.percent) || (a.order ?? 0) - (b.order ?? 0))
      const chosen = todayExact.length >= 4 ? todayExact : packOverride.length >= 4 ? packOverride : fallback.questions
      if (todayExact.length >= 4) {
        pack.value = {
          ...fallback,
          id: `daily-${dateId}`,
          title: 'Today’s Vachnamrut ladder',
          questions: todayExact
        }
      }
      questions.value = chosen.map(q => withShuffledOptions(q, dateId))
    } finally {
      loading.value = false
    }
  })

  return { questions, pack, dateId, loading }
}

export function useConnectionsPuzzle() {
  const dateId = ukDateId()
  const dateSeed = [...dateId].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
  const fallbackIndex = dateSeed % DEFAULT_CONNECTIONS_PUZZLES.length
  const puzzle = ref<ConnectionsPuzzle>(DEFAULT_CONNECTIONS_PUZZLES[fallbackIndex])
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const snap = await getDocs(collection(db, 'connectionsPuzzles'))
      const remote = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ConnectionsPuzzle))
        .filter(item =>
          item.published !== false
          && item.groups?.length === 4
          && item.groups.every(group => group.title && group.words?.length === 4)
        )
      const exact = remote.find(item => item.id === `daily-${dateId}` || item.dateId === dateId)
      if (exact) puzzle.value = exact
      else if (remote.length) {
        puzzle.value = remote[dateSeed % remote.length]
      }
    } finally {
      loading.value = false
    }
  })

  return { puzzle, loading }
}

/** Falls back to the next candidate when a source will not parse, so the day is never unplayable. */
function playableBracketCity(candidates: Array<BracketCityPuzzle | null>): BracketCityPuzzle | null {
  for (const candidate of candidates) {
    if (!candidate?.source) continue
    try {
      parseBracketSource(candidate.source)
      return candidate
    } catch {
      // Try the next candidate.
    }
  }
  return null
}

function dayNumber(dateId: string): number {
  const [year, month, day] = dateId.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

/**
 * One puzzle from the authored pool per day.
 *
 * Every puzzle is used once before any repeats, and the order is reshuffled
 * each time the pool has been worked through, so the cycle is as long as the
 * pool is deep — adding puzzles is what pushes a repeat further away.
 */
function pooledPuzzleFor(pool: BracketCityPuzzle[], dateId: string): BracketCityPuzzle | null {
  if (!pool.length) return null
  const day = dayNumber(dateId)
  const size = pool.length
  const cycle = Math.floor(day / size)
  const order = shuffle(pool, rngForSeed(`bracket-city-pool:${size}:${cycle}`))
  return order[((day % size) + size) % size] ?? null
}

export function useBracketCityPuzzle() {
  const dateId = ukDateId()
  // Authored episodes first: a generated puzzle can only ever finish on a list
  // of words, where these finish on a sentence that tells a story.
  const authored = [...CHARITRA_BRACKET_CITY_PUZZLES, ...DEFAULT_BRACKET_CITY_PUZZLES]
  const puzzle = ref<BracketCityPuzzle>(
    playableBracketCity([pooledPuzzleFor(authored, dateId), buildDailyBracketCity(dateId)])
      ?? DEFAULT_BRACKET_CITY_PUZZLES[0]
  )
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const [snap, wordSnap] = await Promise.all([
        getDocs(collection(db, 'bracketCityPuzzles')),
        getDocs(collection(db, 'gameWords'))
      ])
      const remote = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as BracketCityPuzzle))
        .filter(item => item.published !== false && item.source)
      // A puzzle scheduled for today wins outright; undated admin puzzles join
      // the rotating pool; the word-bank generator is the last resort.
      const override = remote.find(item => item.id === `daily-${dateId}` || item.dateId === dateId)
      const pool = [...authored, ...remote.filter(item => !item.dateId)]
      const generated = buildDailyBracketCity(dateId, mergeGameWords(mapCustomGameWords(wordSnap)))
      puzzle.value = playableBracketCity([
        override || null,
        pooledPuzzleFor(pool, dateId),
        generated
      ]) ?? puzzle.value
    } finally {
      loading.value = false
    }
  })

  return { puzzle, dateId, loading }
}

export async function fetchWordleRemote(date = new Date()) {
  let db = getDb()
  if (!db) {
    await new Promise(resolve => setTimeout(resolve, 50))
    db = getDb()
  }
  if (!db) {
    return {
      extraWords: [] as string[],
      dailyWord: null as string | null,
      wordEntries: [] as GameWordEntry[]
    }
  }
  const dateId = wordleDateId(date)
  const [dailySnap, wordsSnap, gameWordsSnap] = await Promise.all([
    getDoc(doc(db, 'wordleDaily', dateId)),
    getDocs(collection(db, 'wordleWords')),
    getDocs(collection(db, 'gameWords'))
  ])
  const customEntries = mapCustomGameWords(gameWordsSnap)
    .filter(entry => entry.games.includes('wordle'))
  const customWords = customEntries.map(entry => entry.answer)
  const extraWords = [...wordsSnap.docs
    .map(d => String((d.data() as WordleWordDoc).word || '').toUpperCase())
    .filter(w => w.length === 5), ...customWords]
  const dailyWord = dailySnap.exists() ? String(dailySnap.data().word || '').trim().toUpperCase() : null
  return {
    extraWords,
    dailyWord: dailyWord && dailyWord.length === 5 && /^[A-Z]+$/.test(dailyWord) ? dailyWord : null,
    wordEntries: customEntries
  }
}
