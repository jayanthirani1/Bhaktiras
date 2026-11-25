import { collection, doc, getDoc, getDocs, type Firestore } from 'firebase/firestore'
import type { ConnectionsPuzzle, CrosswordPuzzle, GameWordEntry, OnePercentQuestion, WordleWordDoc } from '~/types'
import type { OnePercentPack } from '~/data/onePercentClub'
import { ukDateId } from '~/utils/gameDay'
import { wordleDateId } from '~/utils/wordleDaily'
import { mergeGameWords } from '~/utils/gameWordBank'
import {
  mapCustomGameWords as mapCustomWordDocs,
  pickConnectionsPuzzle,
  pickDailyCrossword,
  pickOnePercent,
  type PlainDoc
} from '~/utils/gameVerify'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

function mapCustomGameWords(snap: Awaited<ReturnType<typeof getDocs>>): GameWordEntry[] {
  return mapCustomWordDocs(plainDocs(snap))
}

function plainDocs(snap: Awaited<ReturnType<typeof getDocs>>): PlainDoc[] {
  return snap.docs.map(item => ({ id: item.id, data: item.data() as Record<string, unknown> }))
}

export async function fetchMergedGameWords(): Promise<GameWordEntry[]> {
  const db = getDb()
  if (!db) return mergeGameWords()
  const snap = await getDocs(collection(db, 'gameWords'))
  return mergeGameWords(mapCustomGameWords(snap))
}

export function useMiniCrosswordPuzzles(dateId = wordleDateId()) {
  const today = dateId
  // Stay empty until the final daily puzzle is chosen. Seeding a static-bank
  // grid first caused restore() to see a signature mismatch and wipe progress
  // when the Firestore word-bank puzzle replaced it.
  const puzzles = ref<CrosswordPuzzle[]>([])
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) {
        puzzles.value = [pickDailyCrossword(today)]
        return
      }
      const [snap, wordSnap] = await Promise.all([
        getDocs(collection(db, 'miniCrosswordPuzzles')),
        getDocs(collection(db, 'gameWords'))
      ])
      // The generated puzzle is the only player-facing crossword. Admin-authored
      // puzzles and the built-in fallback remain if generation has too few words.
      puzzles.value = [pickDailyCrossword(today, plainDocs(snap), plainDocs(wordSnap))]
    } finally {
      loading.value = false
    }
  })

  return { puzzles, loading }
}

export function useOnePercentQuestions(dateId = ukDateId()) {
  const fallback = pickOnePercent(dateId)
  const pack = ref<OnePercentPack>(fallback.pack)
  const questions = ref<OnePercentQuestion[]>(fallback.questions)
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const snap = await getDocs(collection(db, 'onePercentQuestions'))
      const chosen = pickOnePercent(dateId, plainDocs(snap))
      pack.value = chosen.pack
      questions.value = chosen.questions
    } finally {
      loading.value = false
    }
  })

  return { questions, pack, dateId, loading }
}

export function useConnectionsPuzzle(dateId = ukDateId()) {
  const puzzle = ref<ConnectionsPuzzle>(pickConnectionsPuzzle(dateId))
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const snap = await getDocs(collection(db, 'connectionsPuzzles'))
      puzzle.value = pickConnectionsPuzzle(dateId, plainDocs(snap))
    } finally {
      loading.value = false
    }
  })

  return { puzzle, loading }
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
