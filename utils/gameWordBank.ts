import rawWordBank from '~/data/satsangWordBank.json'
import type { CrosswordPuzzle, GameWordEntry, GameWordTarget } from '~/types'
import { layoutCrossword, type CrosswordLayout } from '~/utils/crosswordLayout'

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
  entries: GameWordEntry[] = SATSANG_WORD_BANK,
  attempt = 0
): CrosswordPuzzle {
  const candidates = seededOrder(
    gameWordsFor('crossword', entries).filter(entry =>
      entry.answer.length >= 4
      && entry.answer.length <= 7
    ),
    `mini-crossword:${dateId}${attempt ? `#${attempt}` : ''}`
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

/**
 * Grid bounds that render without any scrolling.
 *
 * Derived from the sizing rules in pages/play/crossword.vue against the
 * smallest phone we care about (iPhone SE, 375x667): at the 1.45rem cell floor,
 * 13 columns is the widest that still fits the viewport and 9 rows the tallest
 * that fits the height left after the page chrome. Anything larger forces a
 * scrollbar no matter how the CSS is tuned.
 */
export const MAX_CROSSWORD_COLS = 13
export const MAX_CROSSWORD_ROWS = 9

/** Enough re-rolls to succeed every day; measured mean is ~3.5. */
const MAX_LAYOUT_ATTEMPTS = 30

/** Every filled cell reachable from every other, so no answer floats unconnected. */
function layoutIsConnected(layout: CrosswordLayout): boolean {
  const open: string[] = []
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      if (layout.letters[r][c]) open.push(`${r},${c}`)
    }
  }
  if (!open.length) return false

  const remaining = new Set(open)
  const seen = new Set<string>()
  const stack = [open[0]]
  while (stack.length) {
    const key = stack.pop()
    if (!key || seen.has(key)) continue
    seen.add(key)
    const [r, c] = key.split(',').map(Number)
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = `${r + dr},${c + dc}`
      if (remaining.has(next) && !seen.has(next)) stack.push(next)
    }
  }
  return seen.size === open.length
}

/**
 * The daily crossword, re-rolled until the grid actually fits on a phone.
 *
 * Word selection alone cannot predict the finished grid — the layout engine
 * places greedily, so the same five words can produce a tidy block or a 23-column
 * sprawl. Rather than guess, generate, lay it out, and check the real result;
 * a rejected roll costs one cheap layout pass.
 *
 * Requiring connectivity in the same check also removes the floating-word case,
 * where an answer landed with no crossings and was unsolvable.
 *
 * Returns null if nothing fits, so the caller can fall back to a curated puzzle
 * rather than publishing an unplayable grid.
 */
export function createFittedDailyCrossword(
  dateId: string,
  entries: GameWordEntry[] = SATSANG_WORD_BANK
): CrosswordPuzzle | null {
  for (let attempt = 0; attempt < MAX_LAYOUT_ATTEMPTS; attempt++) {
    const puzzle = createWordBankMiniCrossword(dateId, entries, attempt)
    const layout = layoutCrossword(puzzle.clues)
    if (!layout) continue
    if (layout.cols > MAX_CROSSWORD_COLS || layout.rows > MAX_CROSSWORD_ROWS) continue
    if (!layoutIsConnected(layout)) continue
    return puzzle
  }
  return null
}
