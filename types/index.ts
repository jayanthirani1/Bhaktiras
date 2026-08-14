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
  /** Optional fixed start cell for mini / curated grids. */
  row?: number
  col?: number
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

export type GameWordTarget = 'wordle' | 'crossword' | 'spelling-bee'

export interface GameWordEntry {
  id: string
  /** ASCII A–Z answer used by the game engines. */
  answer: string
  /** Human-friendly spelling, which may contain spaces or diacritics. */
  display: string
  clue: string
  category: string
  source: string
  games: GameWordTarget[]
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

export interface Niyam {
  id: string
  title: string
  detail: string
  order?: number
}

export interface NiyamStats {
  participants: number
  counts: Record<string, number>
}

export type LegalSlug = 'privacy' | 'policy'

export interface SitePage {
  id: LegalSlug | string
  title: string
  body: string
  updatedAt?: { seconds: number; nanoseconds: number } | Date
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

export type GameLeaderboardId =
  | 'wordle'
  | 'quiz'
  | 'crossword'
  | 'spelling-bee'
  | 'one-percent'
  | 'mini-crossword'

export interface GameScoreEntry {
  id: string
  game: GameLeaderboardId
  dateId: string
  userId: string
  userName: string
  userEmail?: string
  score: number
  /** Elapsed time in milliseconds when relevant (Wordle, Mini Crossword, 1% Club). */
  timeMs?: number
  detail?: string
  completedAt?: { seconds?: number; nanoseconds?: number } | Date
}

export interface OnePercentQuestion {
  id: string
  /** Hardness label shown on the show ladder, e.g. 90 → 1. */
  percent: number
  question: string
  options: string[]
  correctAnswer: string
  order?: number
}

export interface PlayStreakRecord {
  id: string
  userId: string
  userName: string
  currentStreak: number
  longestStreak: number
  lastVisitDate: string
  updatedAt?: { seconds?: number; nanoseconds?: number } | Date
}
