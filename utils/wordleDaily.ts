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

/**
 * Same word for everyone for the given calendar day (UTC).
 */
export function getWordForDate(date: Date): string {
  const dateString = date.toISOString().slice(0, 10)
  const index = hashString(dateString) % WORDS_LIST.length
  return WORDS_LIST[index] ?? WORDS_LIST[0] ?? 'BHAKT'
}
