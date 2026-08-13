import type { WordleScoreEntry } from '~/types/wordle'
import { useGameLeaderboard } from '~/composables/useGameLeaderboard'

const WORD_LEN = 5

function validateScore(guesses: number, word: string): void {
  if (!Number.isInteger(guesses) || guesses < 1 || guesses > 6) {
    throw new Error('Invalid guesses (must be 1–6).')
  }
  const w = (word || '').toUpperCase().trim()
  if (w.length !== WORD_LEN || !/^[A-Z]+$/.test(w)) {
    throw new Error('Invalid word.')
  }
}

export function useWordleLeaderboard() {
  const board = useGameLeaderboard('wordle', { sort: 'asc' })

  const entries = computed(() =>
    board.entries.value.map(e => ({
      id: e.id,
      userId: e.userId,
      userName: e.userName,
      userEmail: e.userEmail,
      guesses: e.score,
      score: e.score,
      timeMs: e.timeMs,
      word: e.detail || '',
      completedAt: e.completedAt as WordleScoreEntry['completedAt']
    }))
  )

  async function submitScore(
    guesses: number,
    word: string,
    userName: string,
    userId: string,
    userEmail?: string,
    timeMs?: number
  ) {
    if (!userId) throw new Error('Sign in to submit your score.')
    validateScore(guesses, word)
    await board.submitScore({
      score: guesses,
      userName,
      userId,
      userEmail,
      detail: (word || '').toUpperCase().trim(),
      timeMs
    })
  }

  return {
    entries,
    loading: board.loading,
    dateId: board.dateId,
    refetch: board.refetch,
    submitScore
  }
}
