/**
 * Spelling Bee puzzle data – devotional / temple themed.
 * Each puzzle: 7 letters (one is center), valid answers 4+ letters, must include center letter.
 * Inspired by NYT Spelling Bee and https://github.com/ConorSheehan1/spelling-bee
 */

export interface SpellingBeePuzzle {
  middleLetter: string;
  availableLetters: string;
  answers: string[];
}

/** All letters in the hive (7 unique letters). */
export function getHiveLetters(puzzle: SpellingBeePuzzle): string[] {
  return puzzle.availableLetters.toUpperCase().split("").sort();
}

/** Center letter (must appear in every word). */
export function getMiddleLetter(puzzle: SpellingBeePuzzle): string {
  return puzzle.middleLetter.toUpperCase();
}

/** Check if a word is valid: 4+ letters, only hive letters, includes center. */
export function isValidSpellingBeeWord(
  word: string,
  puzzle: SpellingBeePuzzle
): boolean {
  const w = word.toUpperCase().trim();
  if (w.length < 4) return false;
  const middle = puzzle.middleLetter.toUpperCase();
  if (!w.includes(middle)) return false;
  const allowed = new Set(puzzle.availableLetters.toUpperCase().split(""));
  for (const c of w) {
    if (!allowed.has(c)) return false;
  }
  return puzzle.answers.includes(w);
}

/** Check if word is in the answer list (already found or valid). */
export function isAnswer(word: string, puzzle: SpellingBeePuzzle): boolean {
  return puzzle.answers.includes(word.toUpperCase().trim());
}

/** Pangram: uses all 7 letters. */
export function isPangram(word: string, puzzle: SpellingBeePuzzle): boolean {
  const w = word.toUpperCase();
  const letters = new Set(puzzle.availableLetters.toUpperCase().split(""));
  return letters.size === 7 && [...letters].every((c) => w.includes(c));
}

/** Points: 4-letter = 1, else length; pangram = length + 7. */
export function spellingBeePoints(
  word: string,
  puzzle: SpellingBeePuzzle
): number {
  const w = word.toUpperCase().trim();
  if (w.length === 4) return 1;
  if (isPangram(w, puzzle)) return w.length + 7;
  return w.length;
}

/** Max possible score for the puzzle. */
export function getMaxScore(puzzle: SpellingBeePuzzle): number {
  return puzzle.answers.reduce(
    (sum, word) => sum + spellingBeePoints(word, puzzle),
    0
  );
}

// Pre-built devotional puzzles. Answers are 4+ letter words using only the hive letters and including the center letter.
export const SPELLING_BEE_PUZZLES: SpellingBeePuzzle[] = [
  {
    middleLetter: "a",
    availableLetters: "aeklmrt",
    answers: [
      "altar",
      "area",
      "armlet",
      "karma",
      "late",
      "later",
      "latter",
      "malt",
      "mare",
      "mark",
      "mart",
      "mate",
      "mater",
      "meal",
      "meat",
      "metre",
      "rake",
      "rate",
      "real",
      "ream",
      "tale",
      "talk",
      "tame",
      "teak",
      "teal",
      "team",
      "tear",
      "term",
      "tram",
      "treat",
      "tree",
      "trek",
    ],
  },
  {
    middleLetter: "i",
    availableLetters: "bdhilnt",
    answers: [
      "bind",
      "blind",
      "blint",
      "dint",
      "hilt",
      "hind",
      "hint",
      "lint",
      "ninth",
      "tilt",
      "tint",
    ],
  },
  {
    middleLetter: "e",
    availableLetters: "cehlopt",
    answers: [
      "cell",
      "chop",
      "clop",
      "cope",
      "echo",
      "elect",
      "hello",
      "help",
      "hole",
      "hope",
      "hotel",
      "lope",
      "peel",
      "peep",
      "pelt",
      "poet",
      "pole",
      "poll",
      "pope",
      "tech",
      "teeth",
      "temple",
      "topee",
    ],
  },
];

/** Get puzzle for the day (stable by date) or random for replay. */
export function getPuzzleForDate(date: Date): SpellingBeePuzzle {
  const epoch = new Date("2025-01-01").getTime();
  const dayIndex = Math.floor((date.getTime() - epoch) / 86400000);
  const index = Math.abs(dayIndex) % SPELLING_BEE_PUZZLES.length;
  return SPELLING_BEE_PUZZLES[index];
}

export function getRandomPuzzle(): SpellingBeePuzzle {
  return SPELLING_BEE_PUZZLES[
    Math.floor(Math.random() * SPELLING_BEE_PUZZLES.length)
  ];
}
