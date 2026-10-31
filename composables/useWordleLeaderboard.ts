import type { WordleScoreEntry } from '~/types/wordle'
import { useGameLeaderboard } from '~/composables/useGameLeaderboard'


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

  /** The guesses themselves go to the server, which checks the last one is today's word. */
  async function submitScore(guesses: string[], userName: string, userId: string, timeMs: number) {
    if (!userId) throw new Error('Sign in to submit your score.')
    await board.submitScore({ userName, userId, timeMs, proof: { guesses } })
  }

  return {
    entries,
    loading: board.loading,
    dateId: board.dateId,
    refetch: board.refetch,
    submitScore
  }
}
