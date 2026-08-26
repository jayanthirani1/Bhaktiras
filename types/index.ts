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
  /**
   * For an admin edit of a built-in word: the original built-in `answer` this
   * entry supersedes. Held rather than the built-in id because regenerating
   * satsangWordBank.json renumbers ids but keeps answers stable.
   */
  replaces?: string
}

export interface GratitudeMessage {
  id: string
  name: string
  message: string
  prompt?: string | null
  anonymous?: boolean
  createdAt?: { seconds: number; nanoseconds: number } | Date
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

export type FirestoreTimestampLike = { seconds: number; nanoseconds: number } | Date

export type NiyamSubmissionStatus = 'approved' | 'pending' | 'rejected'

/**
 * An admin-set community goal — "10,000 malas between now and Patotsav".
 * Every devotee submits what they have actually done and the approved entries
 * ladder up into one shared total, so the sangat finishes the goal together.
 */
export interface NiyamChallenge {
  id: string
  title: string
  detail: string
  /** Plural noun used in totals, e.g. "malas". */
  unit: string
  /** Singular form, e.g. "mala". */
  unitSingular: string
  target: number
  startAt: FirestoreTimestampLike | null
  endAt: FirestoreTimestampLike | null
  active: boolean
  order?: number
  /**
   * A single entry at or below this counts straight away. Anything larger is
   * held as `pending` until an admin approves it, so one implausible number
   * can never move the community total on its own.
   */
  autoApproveMax: number
  /** Hard ceiling — the form and the security rules both refuse anything above it. */
  maxPerSubmission: number
  createdAt?: FirestoreTimestampLike
  updatedAt?: FirestoreTimestampLike
}

export interface NiyamSubmission {
  id: string
  challengeId: string
  userId: string
  userName: string
  amount: number
  note?: string | null
  status: NiyamSubmissionStatus
  /** `${challengeId}__${status}` — lets a single equality filter serve every queue query. */
  statusKey: string
  /** `${userId}__${challengeId}` — the same trick for "my entries". */
  userChallengeKey: string
  /** UK calendar day the entry was made, YYYY-MM-DD. */
  dayKey: string
  createdAt?: FirestoreTimestampLike
  reviewedAt?: FirestoreTimestampLike | null
  reviewedBy?: string | null
  reviewNote?: string | null
}

/**
 * Community totals for one challenge. Derived by the `syncNiyamChallengeTotals`
 * trigger from the submissions themselves — never written from a browser, so
 * the number on the progress bar is one nobody can type in directly.
 */
export interface NiyamChallengeStats {
  challengeId: string
  approvedTotal: number
  pendingTotal: number
  approvedCount: number
  pendingCount: number
  participants: number
  updatedAt?: FirestoreTimestampLike
}

/** Per-person rollup at `niyamChallenges/{challengeId}/contributors/{uid}`. */
export interface NiyamContributor {
  id: string
  userId: string
  userName: string
  approvedTotal: number
  pendingTotal: number
  submissionCount: number
  lastSubmittedAt?: FirestoreTimestampLike
  updatedAt?: FirestoreTimestampLike
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
  /** Revision of DEFAULT_HOME_TILES this document's homeTiles were saved against. */
  homeTilesRevision?: number
  navItems: NavItemContent[]
  /** Revision of DEFAULT_NAV_ITEMS this document's navItems were saved against. */
  navItemsRevision?: number
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
  | 'surya-chandra'
  | 'bhakti-marg'
  | 'ras-rani'

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

export interface BhaktiMargWord {
  word: string
  meaning: string
}

export interface BhaktiMargPuzzle {
  id: string
  title: string
  dateId?: string | null
  gridSize: number
  grid: string[][]
  walls: Array<{ row: number; col: number; direction: 'right' | 'down' }>
  words: BhaktiMargWord[]
  paths: Array<Array<[number, number]>>
  published?: boolean
}

export interface RasRaniRegion {
  id: string
  name: string
  color: string
  meaning?: string
}

export interface RasRaniPuzzle {
  id: string
  title: string
  dateId?: string | null
  gridSize: number
  regionGrid: string[][]
  regions: RasRaniRegion[]
  solution: Array<[number, number]>
  published?: boolean
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
  longestStreak?: number
  updatedAt?: { seconds?: number; nanoseconds?: number } | Date
}

/** A recorded mandir visit for the personal "Visit Mandir" niyam. */
export interface MandirVisit {
  id: string
  userId: string
  /** UK calendar day the visit was recorded, YYYY-MM-DD. */
  dateKey: string
  /** How the visit was recorded: auto (geolocation) or manual (button tap). */
  source: 'auto' | 'manual'
  createdAt?: FirestoreTimestampLike
}

/** User's location tracking preferences, stored in localStorage. */
export interface LocationPreferences {
  /** Whether the user has opted in to always-allow location for auto check-in. */
  alwaysAllowLocation: boolean
  /** Last date the permission prompt was shown (to avoid nagging). */
  lastPromptDate?: string
}
