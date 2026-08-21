import quotesCsv from '~/data/quotes.csv?raw'
import { ukDateId } from '~/utils/gameDay'

export interface DailyQuote {
  quote: string
  source: string
  dateId: string
}

function parseCsv(raw: string): { quote: string; source: string }[] {
  const lines = raw.trim().split(/\r?\n/).slice(1)
  const rows: { quote: string; source: string }[] = []
  for (const line of lines) {
    const match = line.match(/^"((?:[^"]|"")*)",(.*)$/) || line.match(/^([^,]*),(.*)$/)
    if (!match) continue
    const quote = match[1].replace(/""/g, '"').trim()
    const source = match[2].replace(/^"|"$/g, '').trim()
    if (quote) rows.push({ quote, source: source || 'Satsang' })
  }
  return rows
}

function dayIndex(dateId: string, length: number) {
  const [year, month, day] = dateId.split('-').map(Number)
  if (!year || !month || !day || length < 1) return 0
  const utc = Date.UTC(year, month - 1, day)
  const days = Math.floor(utc / 86_400_000)
  return ((days % length) + length) % length
}

export function getDailyQuote(date: Date = new Date()): DailyQuote {
  const quotes = parseCsv(quotesCsv)
  const dateId = ukDateId(date)
  if (!quotes.length) {
    return { quote: 'You have a right to action, but never to its fruits.', source: 'Bhagavad Gita 2.47', dateId }
  }
  const row = quotes[dayIndex(dateId, quotes.length)]!
  return { ...row, dateId }
}

/** @deprecated Use getDailyQuote — kept for older imports. */
export function getQuoteOfTheWeek(date = new Date()) {
  const daily = getDailyQuote(date)
  return { quote: daily.quote, source: daily.source, week: 0, year: 0 }
}
