/**
 * Wordle: 5 letters, uppercase.
 * SOLUTION_WORDS = winning words only. Same word for everyone per day via getWordForDate().
 */
export const WORDLE_WORDS: string[] = [
  'AARTI', 'AMRUT', 'ATMAA', 'BHAKT', 'BHUMI', 'BRAHM', 'DHOTI', 'DHVAJ', 'DHYAN', 'DIVYA',
  'GOPIS', 'KARMA', 'KATHA', 'KUTCH', 'LEELA', 'MOKSH', 'MUKTA', 'MUKTI', 'MUNIS', 'MURTI',
  'NITYA', 'PADMA', 'POOJA', 'RAJAS', 'SABHA', 'SADHU', 'SANTS', 'SATYA', 'SHIVA', 'SHLOK',
  'SURYA', 'SWAMI', 'TAMAS', 'THAAL', 'TILAK', 'TIRTH', 'TYAGI', 'VARNA', 'VIDYA', 'VIVEK',
  'YOGIS',
]

const WORD_LENGTH = 5
const VALID_WORDS = WORDLE_WORDS.filter((w) => w.length === WORD_LENGTH).map((w) =>
  w.toUpperCase().slice(0, WORD_LENGTH)
)
const WORD_SET = new Set(VALID_WORDS)
export const WORDS = Array.from(WORD_SET)
export const WORD_LEN = WORD_LENGTH

/** Simple numeric hash of a string so the same date always gives the same index. */
function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

/**
 * Returns the same word for everyone for the given calendar day (UTC).
 * Use this for the daily puzzle so all users get the same target word.
 */
export function getWordForDate(date: Date): string {
  const dateString = date.toISOString().slice(0, 10) // YYYY-MM-DD UTC
  const index = hashString(dateString) % WORDS.length
  return WORDS[index] ?? WORDS[0] ?? 'BHAKT'
}

export function getRandomWord(): string {
  if (WORDS.length === 0) return 'BHAKT'
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

export function isValidWord(word: string): boolean {
  return word.length === WORD_LEN && WORD_SET.has(word.toUpperCase())
}
