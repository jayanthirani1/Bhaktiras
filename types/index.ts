/** Plain snapshot of Firebase user (avoids storing Firebase User object which can trigger cross-origin errors in Vue reactivity). */
export interface AuthUserSnapshot {
  uid: string
  email: string | null
  displayName: string | null
}

export interface AdminRecord {
  /** Document ID = Firebase Auth UID (userRef) */
  id: string
  name: string
  role: 'admin' | 'guest'
  active: boolean
}

export interface TimelineMedia {
  type: 'image' | 'video'
  url: string
  caption?: string
}

export interface TimelineItem {
  id: string
  year: string
  date?: string
  title: string
  description: string
  imageUrl?: string | null
  videoUrl?: string | null
  media?: TimelineMedia[]
}

export interface Event {
  id: string
  title: string
  date: string
  description: string
  posterUrl?: string | null
  time?: string
  isLive?: boolean
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  order?: number
}

export interface CrosswordClue {
  number: number
  direction: 'across' | 'down'
  clue: string
  answer: string
}

export interface CrosswordPuzzle {
  id: string
  title: string
  clues: CrosswordClue[]
  published?: boolean
}

export interface WordleWordDoc {
  id: string
  word: string
}

export interface WordleDailyDoc {
  id: string
  word: string
}

export interface GratitudeMessage {
  id: string
  name: string
  message: string
  prompt?: string | null
  anonymous?: boolean
  createdAt?: { seconds: number; nanoseconds: number } | Date
}

export interface SevaHourLog {
  id: string
  hours: number
  createdAt?: { seconds: number; nanoseconds: number } | Date
}

export interface VolunteerRole {
  id: string
  role: string
  timeSlot: string
  isFilled: boolean
}

export interface TimeCapsuleMessage {
  id: string
  message: string
  submittedAt?: { seconds: number; nanoseconds: number } | Date
}

export type GameLeaderboardId = 'wordle' | 'quiz' | 'crossword' | 'spelling-bee'

export interface GameScoreEntry {
  id: string
  game: GameLeaderboardId
  dateId: string
  userId: string
  userName: string
  userEmail?: string
  score: number
  detail?: string
  completedAt?: { seconds?: number; nanoseconds?: number } | Date
}
