/**
 * Lightweight Wordle daily puzzle: solution words + date-based word.
 * Import this for initial load; use wordleWords for full validation (lazy-loaded).
 */
export const WORD_LEN = 5

export const WORDLE_WORDS: string[] = [
  'AARTI', 'AMRUT', 'ATMAA', 'BHAKT', 'BHUMI', 'BRAHM', 'DHOTI', 'DHVAJ', 'DHYAN', 'DIVYA',
  'GOPIS', 'KARMA', 'KATHA', 'KUTCH', 'LEELA', 'MOKSH', 'MUKTA', 'MUKTI', 'MUNIS', 'MURTI',
  'NITYA', 'PADMA', 'POOJA', 'RAJAS', 'SABHA', 'SADHU', 'SANTS', 'SATYA', 'SHIVA', 'SHLOK',
  'SURYA', 'SWAMI', 'TAMAS', 'THAAL', 'TILAK', 'TIRTH', 'TYAGI', 'VARNA', 'VIDYA', 'VIVEK',
  'YOGIS',
]

const WORDS = WORDLE_WORDS.filter((w) => w.length === WORD_LEN).map((w) => w.toUpperCase().slice(0, WORD_LEN))
const WORD_SET = new Set(WORDS)
export const WORDS_LIST = Array.from(WORD_SET)

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/** UK calendar day (Europe/London) as YYYY-MM-DD. */
export function wordleDateId(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function addWordleDays(id: string, n: number): string {
  const [y, m, d] = id.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

export function mondayOfWordleWeek(id: string): string {
  const [y, m, d] = id.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dow = dt.getUTCDay()
  dt.setUTCDate(dt.getUTCDate() + (dow === 0 ? -6 : 1 - dow))
  return dt.toISOString().slice(0, 10)
}

/**
 * Same word for everyone for the given UK calendar day, unless admin set a daily override.
 */
export function getWordForDate(date: Date, extraWords: string[] = []): string {
  const extra = extraWords.map(w => w.toUpperCase().slice(0, WORD_LEN)).filter(w => w.length === WORD_LEN)
  const all = Array.from(new Set([...WORDS_LIST, ...extra]))
  const dateString = wordleDateId(date)
  const index = hashString(dateString) % Math.max(all.length, 1)
  return all[index] ?? WORDS_LIST[0] ?? 'BHAKT'
}

export function getWordForDateId(id: string, extraWords: string[] = []): string {
  return getWordForDate(new Date(`${id}T12:00:00Z`), extraWords)
}
