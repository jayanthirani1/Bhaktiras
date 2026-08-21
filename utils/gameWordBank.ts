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

export function mergeGameWords(customEntries: GameWordEntry[] = []): GameWordEntry[] {
  return uniqueByAnswer([...customEntries, ...SATSANG_WORD_BANK])
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
