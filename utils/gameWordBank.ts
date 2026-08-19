import rawWordBank from '~/data/satsangWordBank.json'
import type { CrosswordPuzzle, GameWordEntry, GameWordTarget } from '~/types'

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

function hash(value: string): number {
  let result = 2166136261
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function seededOrder<T>(items: T[], seed: string): T[] {
  return [...items].sort((a, b) => hash(`${seed}:${JSON.stringify(a)}`) - hash(`${seed}:${JSON.stringify(b)}`))
}

/**
 * Builds a compact deterministic crossword for the UK calendar day.
 * Short answers keep the grid suitable for phones; changing the date changes
 * both the selected words and their order.
 */
export function createWordBankMiniCrossword(
  dateId: string,
  entries: GameWordEntry[] = SATSANG_WORD_BANK
): CrosswordPuzzle {
  const candidates = seededOrder(
    gameWordsFor('crossword', entries).filter(entry =>
      entry.answer.length >= 4
      && entry.answer.length <= 7
    ),
    `mini-crossword:${dateId}`
  ).sort((a, b) => Number(b.source === 'Custom') - Number(a.source === 'Custom'))

  const selected: GameWordEntry[] = []
  for (const candidate of candidates) {
    if (!selected.length || selected.some(entry =>
      [...candidate.answer].some(letter => entry.answer.includes(letter))
    )) {
      selected.push(candidate)
    }
    if (selected.length === 5) break
  }

  return {
    id: `daily-mini-${dateId}`,
    title: 'Today’s Crossword',
    published: true,
    clues: selected.map((entry, index) => ({
      number: index + 1,
      direction: index % 2 === 0 ? 'across' : 'down',
      clue: entry.clue,
      answer: entry.answer
    }))
  }
}

