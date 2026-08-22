import rawWordBank from '~/data/satsangWordBank.json'
import type { CrosswordPuzzle, GameWordEntry, GameWordTarget } from '~/types'
import { buildDailyCrossword } from '~/utils/crosswordGenerator'

export const SATSANG_WORD_BANK = rawWordBank as GameWordEntry[]

export function findGameWord(answer: string, entries: GameWordEntry[] = SATSANG_WORD_BANK): GameWordEntry | undefined {
  const clean = normalizeGameWord(answer)
  return entries.find(entry => entry.answer === clean)
}

export function normalizeGameWord(value: string): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
}

export function gameTargetsForAnswer(answer: string): GameWordTarget[] {
  const clean = normalizeGameWord(answer)
  const games: GameWordTarget[] = []
  if (clean.length === 5) games.push('wordle')
  if (clean.length >= 3 && clean.length <= 15) games.push('crossword')
  return games
}

/**
 * Built-in words overlaid with the admin-managed ones.
 *
 * A custom entry wins over a built-in with the same answer. An entry that also
 * carries `replaces` supersedes the built-in of that answer even when its own
 * answer differs, which is what lets an admin correct a spelling (Bhagwan to
 * Bhagvan) without the old spelling lingering in the games alongside it.
 */
export function mergeGameWords(customEntries: GameWordEntry[] = []): GameWordEntry[] {
  const replaced = new Set(
    customEntries
      .map(entry => normalizeGameWord(entry.replaces || ''))
      .filter(Boolean)
  )
  const builtIn = replaced.size
    ? SATSANG_WORD_BANK.filter(entry => !replaced.has(entry.answer))
    : SATSANG_WORD_BANK
  return uniqueByAnswer([...customEntries, ...builtIn])
}

/** The built-in entry an admin edit supersedes, if it is still in the bank. */
export function replacedBuiltIn(entry: GameWordEntry): GameWordEntry | undefined {
  if (!entry.replaces) return undefined
  const answer = normalizeGameWord(entry.replaces)
  return SATSANG_WORD_BANK.find(item => item.answer === answer)
}

function uniqueByAnswer(entries: GameWordEntry[]): GameWordEntry[] {
  const seen = new Set<string>()
  return entries.filter((entry) => {
    if (seen.has(entry.answer)) return false
    seen.add(entry.answer)
    return true
  })
}

export function gameWordsFor(target: GameWordTarget, entries: GameWordEntry[] = SATSANG_WORD_BANK): GameWordEntry[] {
  return uniqueByAnswer(entries.filter(entry => entry.games.includes(target)))
}

export const WORD_BANK_WORDLE_WORDS = gameWordsFor('wordle').map(entry => entry.answer)

/**
 * The daily crossword.
 *
 * Delegates to the fixed-grid generator: the board is always CROSSWORD_SIZE
 * cells square, so it fits every phone without the layout being measured or
 * re-rolled. Returns null if no grid could be filled, so the caller can fall
 * back to a curated puzzle rather than publishing an unplayable board.
 */
export function createFittedDailyCrossword(
  dateId: string,
  entries: GameWordEntry[] = SATSANG_WORD_BANK
): CrosswordPuzzle | null {
  return buildDailyCrossword(dateId, entries)
}
