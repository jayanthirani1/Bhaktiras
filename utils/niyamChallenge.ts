import type {
  FirestoreTimestampLike,
  NiyamChallenge,
  NiyamIconKey,
  NiyamInputMode,
  NiyamSubmission,
  NiyamSubmissionStatus
} from '~/types'
import { DEFAULT_NIYAM_CHALLENGES } from '~/data/niyamChallenges'
import { addUkDays, ukDateId } from '~/utils/gameDay'

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

/**
 * "10 Lakh" for 1,000,000 — how the sangat says these targets out loud, and far
 * easier to hold in the head than seven digits. Returns null when the number is
 * not a clean lakh or crore, so the caller falls back to `formatCount`.
 */
export function indianScaleLabel(value: number): string | null {
  const n = Math.round(Number(value) || 0)
  if (n >= 10_000_000 && n % 10_000_000 === 0) {
    const crore = n / 10_000_000
    return `${crore} ${crore === 1 ? 'Crore' : 'Crore'}`
  }
  if (n >= 100_000 && n % 100_000 === 0) return `${n / 100_000} Lakh`
  return null
}

/** The target as a devotee would read it: "10 Lakh", or the digits if it is not round. */
export function formatTarget(value: number): string {
  return indianScaleLabel(value) || formatCount(value)
}

export function percentOf(total: number, target: number): number {
  if (!target || target <= 0) return 0
  return Math.min(100, Math.round((total / target) * 100))
}

/**
 * Percent with enough precision to be worth reading. Against a ten lakh target
 * the first months all round to "0%", which reads as "nothing is happening" when
 * thousands of malas have in fact been turned — so keep a decimal until 10%.
 */
export function percentLabel(total: number, target: number): string {
  if (!target || target <= 0) return '0%'
  const raw = Math.min(100, (total / target) * 100)
  if (raw === 0) return '0%'
  if (raw < 1) return `${raw.toFixed(2)}%`
  if (raw < 10) return `${raw.toFixed(1)}%`
  return `${Math.round(raw)}%`
}

/**
 * Bar width. A real total should never render as an invisible bar, so anything
 * above zero keeps a sliver — otherwise the first ten thousand malas of a ten
 * lakh goal look identical to none at all.
 */
export function barPercent(total: number, target: number): number {
  if (!target || target <= 0 || total <= 0) return 0
  return Math.min(100, Math.max(0.75, (total / target) * 100))
}

export interface NiyamMilestone {
  /** The next round number the sangat is heading for. */
  value: number
  remaining: number
  /** Every marker on the bar, as a fraction of the target, for the tick marks. */
  ticks: number[]
  reached: boolean
}

/**
 * Ten lakh is too far away to pull anybody along, so the bar is read against
 * the *next* marker instead — a tenth of the target at a time. "12,520 to go"
 * is a number a person can act on this week; "987,520 to go" is not.
 */
export function milestoneFor(total: number, target: number): NiyamMilestone {
  const step = Math.max(1, Math.round(target / 10))
  const ticks = Array.from({ length: 9 }, (_, i) => ((i + 1) * step) / target).filter(t => t < 1)
  const next = Math.min(target, (Math.floor(total / step) + 1) * step)
  return {
    value: next,
    remaining: Math.max(0, next - total),
    ticks,
    reached: total >= target
  }
}

/** Approved amounts for the last `days` UK days, newest day first. */
export function recentDailyTotals(
  stats: { dailyTotals?: Record<string, number> } | null | undefined,
  days: number,
  today: string = ukDateId()
): number[] {
  const map = stats?.dailyTotals
  if (!map) return []
  const out: number[] = []
  for (let i = 0; i < days; i++) {
    out.push(Math.max(0, Number(map[addUkDays(today, -i)]) || 0))
  }
  return out
}

export function addedToday(
  stats: { dailyTotals?: Record<string, number> } | null | undefined,
  today: string = ukDateId()
): number {
  return recentDailyTotals(stats, 1, today)[0] || 0
}

export function addedThisWeek(
  stats: { dailyTotals?: Record<string, number> } | null | undefined,
  today: string = ukDateId()
): number {
  return recentDailyTotals(stats, 7, today).reduce((sum, n) => sum + n, 0)
}

const FALLBACK_PRESETS = [1, 5, 11, 21, 51, 108]

/**
 * The one-tap amounts on a card. Anything above the hard per-entry limit is
 * dropped rather than offered and then refused.
 */
export function presetsFor(challenge: NiyamChallenge): number[] {
  const cap = Math.max(1, Number(challenge.maxPerSubmission) || 1)
  const source = challenge.presets?.length ? challenge.presets : FALLBACK_PRESETS
  return [...new Set(source.map(n => Math.floor(Number(n) || 0)))]
    .filter(n => n >= 1 && n <= cap)
    .sort((a, b) => a - b)
    .slice(0, 6)
}

export function inputModeFor(challenge: NiyamChallenge): NiyamInputMode {
  return challenge.inputMode === 'checkin' ? 'checkin' : 'count'
}

/** Falls back to the diya for a missing or unrecognised icon. */
export function iconFor(challenge: NiyamChallenge | null | undefined): NiyamIconKey {
  const keys: NiyamIconKey[] = ['mala', 'stotra', 'mandir', 'path', 'dandvat', 'niyam']
  const icon = challenge?.icon as NiyamIconKey | undefined
  return icon && keys.includes(icon) ? icon : 'niyam'
}

/**
 * A niyam that only exists as a default in `data/niyamChallenges.ts`. It shows
 * on the page so the section is never empty, but the security rules will refuse
 * a submission until an admin publishes it, so the form has to say so.
 */
export function isPublished(challenge: NiyamChallenge): boolean {
  return challenge.origin !== 'default'
}

/** A default seed read as a full challenge — runtime only, never written back. */
export function defaultChallengeAsChallenge(
  seed: (typeof DEFAULT_NIYAM_CHALLENGES)[number]
): NiyamChallenge {
  return { ...seed, origin: 'default' }
}

/**
 * The five niyams plus whatever the admins have added, with a published
 * document always winning over its default. Ids are stable slugs, so a
 * published `mala` collapses onto the default `mala` rather than doubling it.
 */
export function mergeChallenges(stored: NiyamChallenge[]): NiyamChallenge[] {
  const byId = new Map<string, NiyamChallenge>()
  for (const seed of DEFAULT_NIYAM_CHALLENGES) {
    byId.set(seed.id, defaultChallengeAsChallenge(seed))
  }
  for (const challenge of stored) {
    if (!challenge.id) continue
    byId.set(challenge.id, { ...challenge, origin: 'stored' })
  }
  return sortChallenges([...byId.values()])
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

/** Short gap so a double-tap or auto + manual check-in does not count twice. */
export const MANDIR_CHECKIN_DOUBLE_TAP_MS = 2 * 60 * 1000

export interface MandirCheckinCooldown {
  blocked: boolean
  nextAt: number
  remainingMs: number
  reason?: 'double-tap' | 'daily'
}

export function mandirCheckinsToday(
  submissions: NiyamSubmission[],
  todayId = ukDateId()
): number {
  return submissions
    .filter(s => s.status !== 'rejected' && s.dayKey === todayId)
    .reduce((sum, s) => sum + Math.max(0, s.amount), 0)
}

export function mandirCheckinCooldown(
  submissions: NiyamSubmission[],
  maxPerDay = 3,
  now: number = Date.now(),
  todayId = ukDateId()
): MandirCheckinCooldown {
  const active = submissions.filter(s => s.status !== 'rejected')
  const todayTotal = mandirCheckinsToday(active, todayId)

  if (todayTotal >= maxPerDay) {
    return { blocked: true, nextAt: 0, remainingMs: 0, reason: 'daily' }
  }

  const latest = sortSubmissionsNewestFirst(active)[0]
  const lastMs = toMillis(latest?.createdAt)
  if (lastMs) {
    const nextAt = lastMs + MANDIR_CHECKIN_DOUBLE_TAP_MS
    const remainingMs = Math.max(0, nextAt - now)
    if (remainingMs > 0) {
      return { blocked: true, nextAt, remainingMs, reason: 'double-tap' }
    }
  }

  return { blocked: false, nextAt: 0, remainingMs: 0 }
}

export function formatCheckinCooldownRemaining(remainingMs: number): string {
  const totalMinutes = Math.ceil(remainingMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}

export function mandirCheckinBlockedMessage(cooldown: MandirCheckinCooldown | number): string {
  if (typeof cooldown === 'number') {
    return `You checked in recently. You can check in again in ${formatCheckinCooldownRemaining(cooldown)}.`
  }
  if (cooldown.reason === 'daily') {
    return 'You have logged the maximum sabhas for today (Aarti, Chesta or Katha). You can check in again tomorrow.'
  }
  return `You just checked in. You can log the next sabha in ${formatCheckinCooldownRemaining(cooldown.remainingMs)}.`
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
