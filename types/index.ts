/** Plain snapshot of Firebase user (avoids storing Firebase User object which can trigger cross-origin errors in Vue reactivity). */
export interface AuthUserSnapshot {
  uid: string
  email: string | null
  displayName: string | null
  providerIds: string[]
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
  flickrAlbumId?: string | null
  time?: string
  isLive?: boolean
}

export type BugReportStatus = 'open' | 'resolved' | 'closed'

export interface BugReport {
  id: string
  title: string
  description: string
  pageUrl?: string | null
  contactEmail?: string | null
  status: BugReportStatus
  createdAt?: { seconds?: number; nanoseconds?: number } | Date
  resolvedAt?: { seconds?: number; nanoseconds?: number } | Date | null
  closedAt?: { seconds?: number; nanoseconds?: number } | Date | null
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
  /**
   * Fixed grid size, in cells, for generated puzzles. Set only when every clue
   * carries a position and the board is meant to render at that exact size.
   * Absent for admin-authored puzzles, which crop to their own bounding box.
   */
  size?: number
}

export interface WordleWordDoc {
  id: string
  word: string
}

export interface WordleDailyDoc {
  id: string
  word: string
}

export type GameWordTarget = 'wordle' | 'crossword'

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

export interface Niyam {
  id: string
  title: string
  detail: string
  order?: number
}

export interface YajmanOpportunity {
  id: string
  title: string
  detail: string
  amount?: string | null
  contactUrl?: string | null
  active?: boolean
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

export type SiteIconKey =
  | 'journey'
  | 'events'
  | 'community'
  | 'seva'
  | 'niyams'
  | 'games'
  | 'yajman'
  | 'donate'
  | 'home'

export interface HomeTileContent {
  id: string
  title: string
  desc: string
  href: string
  icon: SiteIconKey
  external?: boolean
  active?: boolean
  order?: number
}

export interface NavItemContent {
  id: string
  label: string
  href: string
  icon: SiteIconKey
  external?: boolean
  active?: boolean
  order?: number
  showInDesktopNav?: boolean
  showInMobileNav?: boolean
  mobilePrimary?: boolean
}

export interface CommunityPromptContent {
  id: string
  text: string
  active?: boolean
  order?: number
}

export interface SevaTeamContent {
  id: string
  name: string
  summary: string
  description: string
  active?: boolean
  order?: number
}

export interface SiteContentSettings {
  id: string
  homeTiles: HomeTileContent[]
  navItems: NavItemContent[]
  communityPrompts: CommunityPromptContent[]
  sevaHeading: string
  sevaIntro: string
  sevaTeams: SevaTeamContent[]
  updatedAt?: { seconds?: number; nanoseconds?: number } | Date
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
  | 'one-percent'
  | 'mini-crossword'
  | 'connections'
  | 'bracket-city'

export interface GameScoreEntry {
  id: string
  game: GameLeaderboardId
  dateId: string
  userId: string
  userName: string
  userEmail?: string
  score: number
  /** Elapsed time in milliseconds when relevant (Wordle, Crossword, 1% Club). */
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
  /** Vachnamrut prakaran, e.g. gadhada-i. */
  section?: string
  /** Daily pack id, e.g. sarangpur-a. */
  packId?: string
  /** Reference such as “Gadhada I – 1”. */
  source?: string
  dateId?: string | null
}

export interface ConnectionsGroup {
  title: string
  words: string[]
  /** 0 (yellow/easiest) through 3 (purple/hardest). */
  difficulty: 0 | 1 | 2 | 3
}

export interface ConnectionsPuzzle {
  id: string
  title: string
  dateId?: string | null
  groups: ConnectionsGroup[]
  published?: boolean
}

export interface BracketCityPuzzle {
  id: string
  title: string
  dateId?: string | null
  published?: boolean
  /** Inline nested source, e.g. "[outer clue [inner clue::murti]::aarti]". */
  source: string
  /** Where the episode comes from, shown once the puzzle is solved. */
  credit?: string
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

export interface UserAchievementUnlock {
  unlockedAt?: { seconds?: number; nanoseconds?: number } | Date
  guesses?: number
  timeMs?: number
  score?: number
  words?: number
  mistakes?: number
  longestStreak?: number
  clubStreak?: number
}

export interface UserAchievementsRecord {
  id: string
  userId: string
  achievements: Record<string, UserAchievementUnlock>
  onePercentClubCurrentStreak?: number
  onePercentClubLongestStreak?: number
  onePercentClubLastDate?: string
  stats?: Record<string, number | string>
  updatedAt?: { seconds?: number; nanoseconds?: number } | Date
}

export interface AchievementCrownRecord {
  id: string
  holderUserId: string
  holderName: string
  game: GameLeaderboardId | string
  metric: string
  value: number
  guesses?: number
  timeMs?: number
  score?: number
  words?: number
  longestStreak?: number
  updatedAt?: { seconds?: number; nanoseconds?: number } | Date
}
