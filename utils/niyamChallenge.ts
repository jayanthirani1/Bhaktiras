import type {
  FirestoreTimestampLike,
  NiyamChallenge,
  NiyamSubmission,
  NiyamSubmissionStatus
} from '~/types'

export const SUBMISSION_NOTE_MAX = 240
export const SUBMISSION_NAME_MAX = 32

/** Defaults offered when an admin creates a challenge. Both are editable per challenge. */
export const DEFAULT_AUTO_APPROVE_MAX = 108
export const DEFAULT_MAX_PER_SUBMISSION = 5000

export const SUBMISSION_STATUSES: NiyamSubmissionStatus[] = ['approved', 'pending', 'rejected']

/**
 * Submission ids are `{challengeId}__{invertedTimestamp}__{random}`.
 *
 * Firestore orders an unordered query by document id, so inverting the clock
 * makes "the newest entries for this challenge" a plain equality filter plus a
 * `limit()` — no composite index, which matters here because the deploy
 * service account cannot create them (see PROJECT-MAP / deploy notes).
 */
export function buildSubmissionId(challengeId: string, now: Date = new Date()): string {
  const inverted = (9999999999999 - now.getTime()).toString().padStart(13, '0')
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, '0')
  return `${challengeId}__${inverted}__${random}`
}

export function statusKey(challengeId: string, status: NiyamSubmissionStatus): string {
  return `${challengeId}__${status}`
}

export function userChallengeKey(userId: string, challengeId: string): string {
  return `${userId}__${challengeId}`
}

/** Firestore Timestamp, JS Date or nothing → milliseconds (0 when unknown). */
export function toMillis(value: FirestoreTimestampLike | null | undefined): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && 'seconds' in value) {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6)
  }
  return 0
}

export interface ChallengeWindow {
  startMs: number
  endMs: number
  hasStarted: boolean
  hasEnded: boolean
  /** Whole days left, rounded up; 0 once the window closes. */
  daysLeft: number
  totalDays: number
}

export function challengeWindow(challenge: NiyamChallenge, now: number = Date.now()): ChallengeWindow {
  const startMs = toMillis(challenge.startAt)
  const endMs = toMillis(challenge.endAt)
  const hasStarted = !startMs || now >= startMs
  const hasEnded = !!endMs && now > endMs
  const dayMs = 24 * 60 * 60 * 1000
  return {
    startMs,
    endMs,
    hasStarted,
    hasEnded,
    daysLeft: endMs && !hasEnded ? Math.max(0, Math.ceil((endMs - now) / dayMs)) : 0,
    totalDays: startMs && endMs ? Math.max(1, Math.round((endMs - startMs) / dayMs)) : 0
  }
}

/** Open for submissions: switched on by an admin and inside its date window. */
export function isChallengeOpen(challenge: NiyamChallenge, now: number = Date.now()): boolean {
  if (!challenge.active) return false
  const { hasStarted, hasEnded } = challengeWindow(challenge, now)
  return hasStarted && !hasEnded
}

/** Anything above `autoApproveMax` waits for an admin rather than counting itself. */
export function needsReview(challenge: NiyamChallenge, amount: number): boolean {
  return amount > Math.max(0, Number(challenge.autoApproveMax) || 0)
}

export function statusForAmount(challenge: NiyamChallenge, amount: number): NiyamSubmissionStatus {
  return needsReview(challenge, amount) ? 'pending' : 'approved'
}

export function unitLabel(challenge: NiyamChallenge, amount: number): string {
  const singular = challenge.unitSingular?.trim() || challenge.unit?.trim() || 'entries'
  const plural = challenge.unit?.trim() || singular
  return Math.abs(amount) === 1 ? singular : plural
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-GB').format(Math.max(0, Math.round(Number(value) || 0)))
}

export function percentOf(total: number, target: number): number {
  if (!target || target <= 0) return 0
  return Math.min(100, Math.round((total / target) * 100))
}

/**
 * Why a submission was held back, phrased for the person who wrote it. Kept
 * here so the user page and the admin queue always give the same reason.
 */
export function reviewReason(challenge: NiyamChallenge): string {
  const cap = Math.max(0, Number(challenge.autoApproveMax) || 0)
  return `Over ${formatCount(cap)} ${unitLabel(challenge, cap)} in one entry — an admin will confirm it before it joins the total.`
}

export function sortChallenges(list: NiyamChallenge[]): NiyamChallenge[] {
  return [...list].sort((a, b) =>
    (a.order ?? 0) - (b.order ?? 0)
    || toMillis(a.endAt) - toMillis(b.endAt)
    || a.title.localeCompare(b.title)
  )
}

export function sortSubmissionsNewestFirst(list: NiyamSubmission[]): NiyamSubmission[] {
  return [...list].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt) || a.id.localeCompare(b.id))
}

/** Trim a client-supplied display name the same way the leaderboard does. */
export function safeMemberName(name: string | null | undefined): string {
  const cleaned = (name || '')
    .replace(/[^\p{L}\p{N}\s\-_.']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, SUBMISSION_NAME_MAX)
  return cleaned || 'Devotee'
}
