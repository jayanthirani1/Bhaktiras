import { addUkDays, ukDateId } from '~/utils/gameDay'

/** How far back a missed puzzle can still be played. */
export const MISSED_DAY_COUNT = 7

/** The days before today that can be replayed, newest first. */
export function missedDayIds(today = ukDateId()): string[] {
  return Array.from({ length: MISSED_DAY_COUNT }, (_, i) => addUkDays(today, -(i + 1)))
}

/** "Thursday 29 October" for a `YYYY-MM-DD` day. */
export function playDayLabel(dateId: string): string {
  const [y, m, d] = dateId.split('-').map(Number)
  if (!y || !m || !d) return dateId
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d)))
}

/**
 * The day a game page is playing: today, or a missed day from `?day=YYYY-MM-DD`
 * within the last week. A missed day is practice: its progress is kept apart
 * from today's, and it never reaches the leaderboard, crowns or streaks. Read
 * once at setup, so each page keys itself on the full path to remount when the
 * day changes.
 */
export function usePlayDay() {
  const route = useRoute()
  const today = ukDateId()
  const asked = typeof route.query.day === 'string' ? route.query.day : ''
  const isArchive = missedDayIds(today).includes(asked)
  const dateId = isArchive ? asked : today
  return { dateId, today, isArchive, label: playDayLabel(dateId) }
}
