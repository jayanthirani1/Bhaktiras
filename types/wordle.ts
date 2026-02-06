export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty'

export interface WordleStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  guessDistribution: Record<number, number>
  lastPlayedDate?: string
}

export interface WordleScoreEntry {
  id: string
  userId: string
  userName: string
  userEmail?: string
  guesses: number
  word: string
  completedAt: { seconds: number; nanoseconds: number } | Date
}
