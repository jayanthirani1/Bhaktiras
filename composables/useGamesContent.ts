import { collection, doc, getDoc, getDocs, type Firestore } from 'firebase/firestore'
import type { CrosswordPuzzle, GameWordEntry, OnePercentQuestion, QuizQuestion, WordleWordDoc } from '~/types'
import type { SpellingBeePuzzle } from '~/data/spellingBeePuzzles'
import { SPELLING_BEE_PUZZLES } from '~/data/spellingBeePuzzles'
import { DEFAULT_ONE_PERCENT } from '~/data/onePercentClub'
import { DEFAULT_MINI_CROSSWORD } from '~/data/miniCrossword'
import { wordleDateId } from '~/utils/wordleDaily'
import {
  buildWordBankSpellingBeePuzzles,
  createWordBankCrossword,
  gameTargetsForAnswer,
  mergeGameWords,
  normalizeGameWord,
  WORD_BANK_SPELLING_BEE_PUZZLES
} from '~/utils/gameWordBank'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

const FALLBACK_QUIZ: QuizQuestion[] = [
  { id: '1', question: 'Which year was the temple inaugurated?', options: ['2013', '2014', '2015', '2016'], correctAnswer: '2014' },
  { id: '2', question: "What is the primary material used in the main shrine?", options: ['White Marble', 'Sandstone', 'Granite', 'Limestone'], correctAnswer: 'White Marble' },
  { id: '3', question: 'How many major festivals are celebrated annually?', options: ['5', '8', '12', '15'], correctAnswer: '12' }
]

function mapCustomGameWords(snap: Awaited<ReturnType<typeof getDocs>>): GameWordEntry[] {
  return snap.docs.map((item) => {
    const data = item.data()
    const answer = normalizeGameWord(String(data.answer || data.display || ''))
    return {
      id: item.id,
      answer,
      display: String(data.display || answer).trim(),
      clue: String(data.clue || '').trim(),
      category: String(data.category || 'custom').trim() || 'custom',
      source: 'Custom',
      games: gameTargetsForAnswer(answer)
    }
  }).filter(entry => entry.answer.length >= 3 && entry.answer.length <= 24 && entry.clue)
}

export function useQuizQuestions() {
  const questions = ref<QuizQuestion[]>(FALLBACK_QUIZ)
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const snap = await getDocs(collection(db, 'quizQuestions'))
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizQuestion))
        .filter(q => q.question && q.options?.length && q.correctAnswer)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      if (remote.length) questions.value = remote
    } finally {
      loading.value = false
    }
  })

  return { questions, loading }
}

export function useSpellingBeePuzzles() {
  const fallback = [...SPELLING_BEE_PUZZLES, ...WORD_BANK_SPELLING_BEE_PUZZLES]
  const puzzles = ref<(SpellingBeePuzzle & { id?: string })[]>(fallback)
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const [snap, wordSnap] = await Promise.all([
        getDocs(collection(db, 'spellingBeePuzzles')),
        getDocs(collection(db, 'gameWords'))
      ])
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as SpellingBeePuzzle & { id: string }))
        .filter(p => p.middleLetter && p.availableLetters && p.answers?.length)
      const generated = buildWordBankSpellingBeePuzzles(mergeGameWords(mapCustomGameWords(wordSnap)))
      puzzles.value = [...remote, ...SPELLING_BEE_PUZZLES, ...generated]
    } finally {
      loading.value = false
    }
  })

  return { puzzles, loading }
}

export function useCrosswordPuzzles() {
  const dailyPuzzle = createWordBankCrossword(wordleDateId())
  const puzzles = ref<CrosswordPuzzle[]>([dailyPuzzle])
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const [snap, wordSnap] = await Promise.all([
        getDocs(collection(db, 'crosswordPuzzles')),
        getDocs(collection(db, 'gameWords'))
      ])
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as CrosswordPuzzle))
        .filter(p => p.title && p.clues?.length)
      const customDaily = createWordBankCrossword(wordleDateId(), 10, mergeGameWords(mapCustomGameWords(wordSnap)))
      puzzles.value = [customDaily, ...remote]
    } finally {
      loading.value = false
    }
  })

  return { puzzles, loading }
}

export function useMiniCrosswordPuzzles() {
  const puzzles = ref<CrosswordPuzzle[]>([{ ...DEFAULT_MINI_CROSSWORD }])
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const snap = await getDocs(collection(db, 'miniCrosswordPuzzles'))
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as CrosswordPuzzle))
        .filter(p => p.title && p.clues?.length)
      if (remote.length) puzzles.value = remote
    } finally {
      loading.value = false
    }
  })

  return { puzzles, loading }
}

export function useOnePercentQuestions() {
  const questions = ref<OnePercentQuestion[]>([...DEFAULT_ONE_PERCENT])
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const snap = await getDocs(collection(db, 'onePercentQuestions'))
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as OnePercentQuestion))
        .filter(q => q.question && q.options?.length && q.correctAnswer && q.percent != null)
        .sort((a, b) => (b.percent - a.percent) || (a.order ?? 0) - (b.order ?? 0))
      if (remote.length) questions.value = remote
    } finally {
      loading.value = false
    }
  })

  return { questions, loading }
}

export async function fetchWordleRemote(date = new Date()) {
  const db = getDb()
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
  const customWords = mapCustomGameWords(gameWordsSnap)
    .filter(entry => entry.games.includes('wordle'))
    .map(entry => entry.answer)
  const extraWords = [...wordsSnap.docs
    .map(d => String((d.data() as WordleWordDoc).word || '').toUpperCase())
    .filter(w => w.length === 5), ...customWords]
  const dailyWord = dailySnap.exists() ? String(dailySnap.data().word || '').toUpperCase() : null
  return {
    extraWords,
    dailyWord: dailyWord && dailyWord.length === 5 ? dailyWord : null,
    wordEntries: customWords
  }
}
