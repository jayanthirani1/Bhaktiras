/** UK calendar day (Europe/London) as YYYY-MM-DD. Used for daily puzzles and leaderboards. */
export function ukDateId(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
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
