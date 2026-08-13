import quotesCsv from '~/data/quotes.csv?raw'

export interface WeeklyQuote {
  quote: string
  source: string
  week: number
  year: number
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

/** ISO week number (1–53). */
export function isoWeek(date = new Date()): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}

export function getQuoteOfTheWeek(date = new Date()): WeeklyQuote {
  const quotes = parseCsv(quotesCsv)
  const { week, year } = isoWeek(date)
  if (!quotes.length) {
    return { quote: 'In the joy of others lies our own.', source: 'Pramukh Swami Maharaj', week, year }
  }
  const row = quotes[(week - 1) % quotes.length]!
  return { ...row, week, year }
}
