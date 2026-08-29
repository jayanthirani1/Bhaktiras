import { SITE } from '~/data/site'

/** Year picker is journeyStartYear through journeyEndYear (Patotsav). */
export function journeyYears(): number[] {
  const end = SITE.journeyEndYear
  const start = SITE.journeyStartYear
  const years: number[] = []
  for (let y = start; y <= end; y++) years.push(y)
  return years
}

const MONTH_INDEX: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
}

function parseYearField(year: unknown): number | null {
  const n = Number(String(year ?? '').trim())
  return Number.isFinite(n) && n >= 1000 && n <= 9999 ? n : null
}

/** First month name/abbrev in a free-form label, or null. */
function findMonth(label: string): number | null {
  const tokens = label.toLowerCase().match(/[a-z]+/g) || []
  for (const token of tokens) {
    const month = MONTH_INDEX[token]
    if (month) return month
  }
  return null
}

/** Day of month if the label starts with one, else 1. */
function findDay(label: string): number {
  const match = label.match(/(?:^|[^\d])(\d{1,2})(?:\s|[^\d]|$)/)
  if (!match) return 1
  const day = Number(match[1])
  return day >= 1 && day <= 31 ? day : 1
}

/** Four-digit year embedded in the label, if any. */
function findYearInLabel(label: string): number | null {
  const match = label.match(/\b(20[1-9]\d)\b/)
  return match ? Number(match[1]) : null
}

/**
 * Chronological sort key for a timeline moment.
 *
 * Date labels are free-form — often just a month ("August") with the year on
 * the separate `year` field, or "14 Aug 2027". String compare puts August
 * before January; this returns YYYYMMDD so year → month → day order correctly.
 */
export function timelineSortKey(item: { year?: string | number; date?: string; title?: string }): number {
  const yearFromField = parseYearField(item.year)
  const label = String(item.date ?? '').trim()

  if (!label) {
    return yearFromField != null ? yearFromField * 10_000 : Number.POSITIVE_INFINITY
  }

  // ISO-ish: 2027-08-14 or 2027/08/14
  const iso = label.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?$/)
  if (iso) {
    return Number(iso[1]) * 10_000 + Number(iso[2]) * 100 + Number(iso[3] || 1)
  }

  // Year only (same as the year field, or a year typed into the date label)
  if (/^\d{4}$/.test(label)) {
    return Number(label) * 10_000
  }

  const month = findMonth(label)
  if (month) {
    // "August", "Aug 2024", "14 August 2027" — year may live only on `item.year`
    const year = findYearInLabel(label) ?? yearFromField
    if (year != null) {
      return year * 10_000 + month * 100 + findDay(label)
    }
  }

  // Fall back: year field, undated last within that year
  if (yearFromField != null) return yearFromField * 10_000 + 12_31
  return Number.POSITIVE_INFINITY
}

/** Compare two timeline moments chronologically (year, then month, then day). */
export function compareTimelineItems(
  a: { year?: string | number; date?: string; title?: string },
  b: { year?: string | number; date?: string; title?: string }
): number {
  const diff = timelineSortKey(a) - timelineSortKey(b)
  if (diff) return diff
  return String(a.title || '').localeCompare(String(b.title || ''))
}
