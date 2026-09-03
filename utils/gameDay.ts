/** UK calendar day (Europe/London) as YYYY-MM-DD. Used for daily puzzles and leaderboards. */
export function ukDateId(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

/** UK calendar month (Europe/London) as YYYY-MM. Used for monthly game crowns. */
export function ukMonthId(date: Date = new Date()): string {
  return ukDateId(date).slice(0, 7)
}

/**
 * Next monthly-crown reset as "1st of October".
 * Crowns switch when the UK calendar month changes, so during September that
 * is October; on 1 October itself the board has already rolled and the next
 * reset is November.
 */
export function nextUkMonthCrownResetLabel(date: Date = new Date()): string {
  const [year, month] = ukMonthId(date).split('-').map(Number)
  if (!year || !month) return '1st of next month'
  // `month` is 1–12; Date.UTC's month index is 0–11, so `month` lands on the 1st of the following month.
  const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(
    new Date(Date.UTC(year, month, 1))
  )
  return `1st of ${monthName}`
}

/** Hour of day in Europe/London (0–23). */
export function ukHour(date: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: 'numeric',
      hourCycle: 'h23'
    }).format(date)
  )
}

export function formatUkDateLabel(id: string = ukDateId()): string {
  const [y, m, d] = id.split('-')
  if (!y || !m || !d) return id
  return `${d}/${m}/${y}`
}

export function addUkDays(id: string, days: number): string {
  const [year, month, day] = id.split('-').map(Number)
  if (!year || !month || !day) return id
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * True once the UK calendar day has moved past the day something was built for.
 *
 * Every daily puzzle pins its storage keys, its timer and its leaderboard to
 * the day the page mounted. An app that is minimised overnight never mounts
 * again, so those stay pinned to yesterday while `ukDateId()` has moved on.
 */
export function isStaleGameDay(dateId: string): boolean {
  return !!dateId && dateId !== ukDateId()
}
