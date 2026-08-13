import { collection, doc, getDoc, getDocs, type Firestore } from 'firebase/firestore'
import type { CrosswordPuzzle, OnePercentQuestion, QuizQuestion, WordleWordDoc } from '~/types'
import type { SpellingBeePuzzle } from '~/data/spellingBeePuzzles'
import { SPELLING_BEE_PUZZLES } from '~/data/spellingBeePuzzles'
import { DEFAULT_ONE_PERCENT } from '~/data/onePercentClub'
import { DEFAULT_MINI_CROSSWORD } from '~/data/miniCrossword'
import { wordleDateId } from '~/utils/wordleDaily'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

const FALLBACK_QUIZ: QuizQuestion[] = [
  { id: '1', question: 'Which year was the temple inaugurated?', options: ['2013', '2014', '2015', '2016'], correctAnswer: '2014' },
  { id: '2', question: "What is the primary material used in the main shrine?", options: ['White Marble', 'Sandstone', 'Granite', 'Limestone'], correctAnswer: 'White Marble' },
  { id: '3', question: 'How many major festivals are celebrated annually?', options: ['5', '8', '12', '15'], correctAnswer: '12' }
]

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
  const puzzles = ref<(SpellingBeePuzzle & { id?: string })[]>(SPELLING_BEE_PUZZLES)
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const snap = await getDocs(collection(db, 'spellingBeePuzzles'))
      const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as SpellingBeePuzzle & { id: string }))
        .filter(p => p.middleLetter && p.availableLetters && p.answers?.length)
      if (remote.length) puzzles.value = remote
    } finally {
      loading.value = false
    }
  })

  return { puzzles, loading }
}

export function useCrosswordPuzzles() {
  const puzzles = ref<CrosswordPuzzle[]>([])
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const snap = await getDocs(collection(db, 'crosswordPuzzles'))
      puzzles.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as CrosswordPuzzle))
        .filter(p => p.title && p.clues?.length)
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
  if (!db) return { extraWords: [] as string[], dailyWord: null as string | null }
  const dateId = wordleDateId(date)
  const [dailySnap, wordsSnap] = await Promise.all([
    getDoc(doc(db, 'wordleDaily', dateId)),
    getDocs(collection(db, 'wordleWords'))
  ])
  const extraWords = wordsSnap.docs
    .map(d => String((d.data() as WordleWordDoc).word || '').toUpperCase())
    .filter(w => w.length === 5)
  const dailyWord = dailySnap.exists() ? String(dailySnap.data().word || '').toUpperCase() : null
  return { extraWords, dailyWord: dailyWord && dailyWord.length === 5 ? dailyWord : null }
}
