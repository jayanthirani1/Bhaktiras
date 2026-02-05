/**
 * Word list for the devotional Wordle game.
 * All words must be the same length (5 letters). Uppercase for consistent comparison.
 *
 * Replace this array with your own list—e.g. import from a file or paste your words here.
 */
export const WORDLE_WORDS: string[] = [
  "BHAKT",
  "KARMA",
  "DHARM",
  "RISHI",
  "NAMAH",
  "ARATI",
  "VEDIC",
  "PUJAS",
  "BHAJI",
  "LOTUS",
  "FLAME",
  "BELLS",
  "CHANT",
  "BLESS",
  "PEACE",
  "FAITH",
  "DEVAS",
  "STOTR",
  "PRASA",
  "SHRAD",
  "AGNIH",
  "OMKAR",
  "GODLY",
  "PIOUS",
  "SACRE",
];

// Normalize to 5-letter words only for classic Wordle; adjust WORD_LENGTH if you use different length
const WORD_LENGTH = 5;
const VALID_WORDS = WORDLE_WORDS.filter((w) => w.length === WORD_LENGTH).map((w) =>
  w.toUpperCase().slice(0, WORD_LENGTH)
);

// Dedupe and ensure we have words
const WORD_SET = new Set(VALID_WORDS);
export const WORDS = Array.from(WORD_SET);

if (WORDS.length === 0) {
  console.warn("wordleWords: No 5-letter words in list. Add words of length", WORD_LENGTH);
}

export const WORD_LEN = WORD_LENGTH;

export function getRandomWord(): string {
  if (WORDS.length === 0) return "BLESS"; // fallback
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function isValidWord(word: string): boolean {
  return word.length === WORD_LEN && WORD_SET.has(word.toUpperCase());
}
