import { ukDateId } from '~/utils/gameDay'
import { WORD_BANK_WORDLE_WORDS } from '~/utils/gameWordBank'

/**
 * Lightweight Wordle daily puzzle: solution words + date-based word.
 * Import this for the daily solution. Guess validation lives in data/wordleGuessList.ts.
 */
export const WORD_LEN = 5

const ORIGINAL_WORDLE_WORDS: string[] = [
  'AARTI', 'AMRUT', 'ATMAA', 'BHAKT', 'BHUMI', 'BRAHM', 'DHOTI', 'DHVAJ', 'DHYAN', 'DIVYA',
  'GOPIS', 'KARMA', 'KATHA', 'KUTCH', 'LEELA', 'MOKSH', 'MUKTA', 'MUKTI', 'MUNIS', 'MURTI',
  'NITYA', 'PADMA', 'POOJA', 'RAJAS', 'SABHA', 'SADHU', 'SANTS', 'SATYA', 'SHIVA', 'SHLOK',
  'SURYA', 'SWAMI', 'TAMAS', 'THAAL', 'TILAK', 'TIRTH', 'TYAGI', 'VARNA', 'VIDYA', 'VIVEK',
  'YOGIS',
]

export const WORDLE_WORDS = [...new Set([...ORIGINAL_WORDLE_WORDS, ...WORD_BANK_WORDLE_WORDS])]

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
  return ukDateId(date)
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

function plannedWordleWord(raw: string | null | undefined): string | null {
  const word = String(raw || '').trim().toUpperCase()
  return word.length === WORD_LEN && /^[A-Z]+$/.test(word) ? word : null
}

/**
 * Rotation word for a UK calendar day.
 *
 * Extra Firestore words used to be mixed into this list, which shifted every
 * day's hash and made the admin calendar disagree with the live puzzle. The
 * rotation is the built-in bank only; scheduled words override via
 * `resolveWordleWord`.
 */
export function getWordForDate(date: Date, _extraWords: string[] = []): string {
  const dateString = wordleDateId(date)
  const index = hashString(dateString) % Math.max(WORDS_LIST.length, 1)
  return WORDS_LIST[index] ?? 'BHAKT'
}

export function getWordForDateId(id: string, extraWords: string[] = []): string {
  return getWordForDate(new Date(`${id}T12:00:00Z`), extraWords)
}

/** What players actually get: the admin schedule, or the rotation on a blank day. */
export function resolveWordleWord(dateId: string, dailyWord?: string | null): string {
  return plannedWordleWord(dailyWord) ?? getWordForDateId(dateId)
}
