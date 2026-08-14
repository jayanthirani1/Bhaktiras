import rawWordBank from '~/data/satsangWordBank.json'
import type { SpellingBeePuzzle } from '~/data/spellingBeePuzzles'
import type { CrosswordClue, CrosswordPuzzle, GameWordEntry, GameWordTarget } from '~/types'

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
  if (clean.length >= 4 && new Set(clean).size <= 7) games.push('spelling-bee')
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
 * Builds a deterministic crossword from clue-bearing entries. Firestore
 * puzzles still take priority; this is the always-available shared-bank puzzle.
 */
export function createWordBankCrossword(
  dateId: string,
  size = 10,
  entries: GameWordEntry[] = SATSANG_WORD_BANK
): CrosswordPuzzle {
  const candidates = seededOrder(
    gameWordsFor('crossword', entries).filter(entry =>
      entry.answer.length >= 4
      && entry.answer.length <= 10
      && (entry.source === 'Custom' || !entry.category.endsWith('-name'))
    ),
    `crossword:${dateId}`
  ).sort((a, b) => Number(b.source === 'Custom') - Number(a.source === 'Custom'))

  const selected: GameWordEntry[] = []
  for (const candidate of candidates) {
    if (!selected.length || selected.some(entry =>
      [...candidate.answer].some(letter => entry.answer.includes(letter))
    )) {
      selected.push(candidate)
    }
    if (selected.length === size) break
  }

  const clues: CrosswordClue[] = selected.map((entry, index) => ({
    number: index + 1,
    direction: index % 2 === 0 ? 'across' : 'down',
    clue: entry.clue,
    answer: entry.answer
  }))

  return {
    id: `word-bank-${dateId}`,
    title: 'Daily Satsang Crossword',
    clues,
    published: true
  }
}

/**
 * Builds a compact deterministic puzzle for the UK calendar day.
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
    title: 'Today’s Mini',
    published: true,
    clues: selected.map((entry, index) => ({
      number: index + 1,
      direction: index % 2 === 0 ? 'across' : 'down',
      clue: entry.clue,
      answer: entry.answer
    }))
  }
}

function letterSet(word: string): string {
  return [...new Set(word)].sort().join('')
}

export function buildWordBankSpellingBeePuzzles(
  entries: GameWordEntry[] = SATSANG_WORD_BANK,
  limit = 18
): SpellingBeePuzzle[] {
  const words = gameWordsFor('spelling-bee', entries)
    .map(entry => entry.answer)
    .filter(answer => answer.length <= 14)
  const seeds = [...new Set(words.map(letterSet).filter(letters => letters.length === 7))]
  const puzzles: SpellingBeePuzzle[] = []

  for (const availableLetters of seeds) {
    const allowed = new Set(availableLetters)
    const matching = words.filter(word => [...word].every(letter => allowed.has(letter)))
    if (matching.length < 7) continue

    const rankedCentres = [...availableLetters]
      .map(letter => ({
        letter,
        answers: matching.filter(word => word.includes(letter))
      }))
      .filter(option => option.answers.length >= 7)
      .sort((a, b) => b.answers.length - a.answers.length)

    const best = rankedCentres[0]
    if (!best) continue
    puzzles.push({
      middleLetter: best.letter,
      availableLetters,
      answers: [...new Set(best.answers)].sort()
    })
    if (puzzles.length === limit) break
  }

  return puzzles
}

export const WORD_BANK_SPELLING_BEE_PUZZLES = buildWordBankSpellingBeePuzzles()

