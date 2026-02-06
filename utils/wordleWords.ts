/**
 * Word list for the devotional Wordle game. 5 letters, uppercase.
 */
export const WORDLE_WORDS: string[] = [
  'BHAKT', 'KARMA', 'DHARM', 'RISHI', 'NAMAH', 'ARATI', 'VEDIC', 'PUJAS', 'BHAJI',
  'LOTUS', 'FLAME', 'BELLS', 'CHANT', 'BLESS', 'PEACE', 'FAITH', 'DEVAS', 'STOTR',
  'PRASA', 'SHRAD', 'AGNIH', 'OMKAR', 'GODLY', 'PIOUS', 'SACRE'
]

const WORD_LENGTH = 5
const VALID_WORDS = WORDLE_WORDS.filter((w) => w.length === WORD_LENGTH).map((w) =>
  w.toUpperCase().slice(0, WORD_LENGTH)
)
const WORD_SET = new Set(VALID_WORDS)
export const WORDS = Array.from(WORD_SET)
export const WORD_LEN = WORD_LENGTH

export function getRandomWord(): string {
  if (WORDS.length === 0) return 'BLESS'
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

export function isValidWord(word: string): boolean {
  return word.length === WORD_LEN && WORD_SET.has(word.toUpperCase())
}
