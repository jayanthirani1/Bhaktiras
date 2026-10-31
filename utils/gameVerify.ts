/**
 * The daily puzzle for each game, and a replay of what a player did with it.
 *
 * The pages use the pickers to choose today's puzzle. The Cloud Functions use
 * the same code, bundled into `functions/shared/gameVerify.mjs` at deploy time
 * by `scripts/buildFunctionsShared.mjs`, so the server rebuilds exactly the
 * puzzle the player saw and scores the play itself instead of trusting the
 * browser's numbers. Keep this file free of Vue, Nuxt and Firebase: plain data
 * in, plain data out.
 *
 * What a replay can prove is what was solved: the guesses, groups, answers or
 * filled grid. A clock reading cannot be replayed, since timers pause while the
 * app is in the background, so times stay the browser's, bounded by `MIN_PLAY_MS`.
 */
import type { ConnectionsPuzzle, CrosswordPuzzle, GameWordEntry, OnePercentQuestion } from '~/types'
import { DEFAULT_CONNECTIONS_PUZZLES } from '~/data/connectionsPuzzles'
import { DEFAULT_MINI_CROSSWORD } from '~/data/miniCrossword'
import { onePercentPackForDate, withShuffledOptions, type OnePercentPack } from '~/data/onePercentClub'
import { getRasRaniPuzzleForDate, inferRasRaniDifficulty, type RasRaniDifficulty, type RasRaniPuzzle } from '~/data/rasRaniPuzzles'
import { cellKey, layoutAnyCrossword } from '~/utils/crosswordLayout'
import { createFittedDailyCrossword, gameTargetsForAnswer, mergeGameWords, normalizeGameWord } from '~/utils/gameWordBank'
import { isPuzzleSolved, type CellState } from '~/utils/rasRani'
import { boardIsSolved, generateSuryaChandraPuzzle, parseTangoPuzzle, type TangoCell, type TangoPuzzle } from '~/utils/tango'
import { resolveWordleWord } from '~/utils/wordleDaily'

/** Raised when a play does not stand up against the day's puzzle. The message is shown to the player. */
export class PlayRejected extends Error {}

/** A Firestore document reduced to its id and fields, so this file needs no Firebase types. */
export type PlainDoc = { id: string; data: Record<string, unknown> }

export const MIN_PLAY_MS = { wordle: 3_000, connections: 5_000, 'mini-crossword': 5_000, 'one-percent': 3_000, 'ras-rani': 5_000, 'surya-chandra': 5_000 } as const

// ---------------------------------------------------------------------------
// Pickers: today's puzzle from the built-in banks and any admin overrides.
// ---------------------------------------------------------------------------

export function mapCustomGameWords(docs: PlainDoc[]): GameWordEntry[] {
  return docs.map(({ id, data }) => {
    const answer = normalizeGameWord(String(data.answer || data.display || ''))
    const replaces = normalizeGameWord(String(data.replaces || ''))
    return {
      id,
      answer,
      display: String(data.display || answer).trim(),
      clue: String(data.clue || '').trim(),
      category: String(data.category || 'custom').trim() || 'custom',
      source: replaces ? 'Edited' : 'Custom',
      games: gameTargetsForAnswer(answer),
      ...(replaces ? { replaces } : {})
    } as GameWordEntry
  }).filter(entry => entry.answer.length >= 3 && entry.answer.length <= 24 && entry.clue)
}

/** The scheduled word in `wordleDaily/{dateId}`, or the built-in rotation on a blank day. */
export function pickWordleAnswer(dateId: string, scheduled?: Record<string, unknown> | null) {
  return resolveWordleWord(dateId, scheduled ? String(scheduled.word || '') : null)
}

function dateSeed(dateId: string) {
  return [...dateId].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
}

export function pickConnectionsPuzzle(dateId: string, docs: PlainDoc[] = []): ConnectionsPuzzle {
  const seed = dateSeed(dateId)
  const remote = docs
    .map(({ id, data }) => ({ id, ...data } as ConnectionsPuzzle))
    .filter(item =>
      item.published !== false
      && item.groups?.length === 4
      && item.groups.every(group => group.title && group.words?.length === 4)
    )
  const exact = remote.find(item => item.id === `daily-${dateId}` || item.dateId === dateId)
  if (exact) return exact
  if (remote.length) return remote[seed % remote.length]!
  return DEFAULT_CONNECTIONS_PUZZLES[seed % DEFAULT_CONNECTIONS_PUZZLES.length]!
}

function byLadder(a: OnePercentQuestion, b: OnePercentQuestion) {
  return (b.percent - a.percent) || (a.order ?? 0) - (b.order ?? 0)
}

/** Today's 1% Club questions as the player sees them: chosen, cleaned and with options shuffled. */
export function pickOnePercent(dateId: string, docs: PlainDoc[] = []): { pack: OnePercentPack; questions: OnePercentQuestion[] } {
  const fallback = onePercentPackForDate(dateId)
  const remote = docs
    .map(({ id, data }) => ({ id, ...data } as OnePercentQuestion))
    .filter(q => q.question && q.options?.length && q.correctAnswer && q.percent != null)
  const todayExact = remote.filter(q => q.dateId === dateId || q.packId === `daily-${dateId}`).sort(byLadder)
  const packOverride = remote.filter(q => q.packId === fallback.id).sort(byLadder)
  const chosen = todayExact.length >= 4 ? todayExact : packOverride.length >= 4 ? packOverride : fallback.questions
  const pack = todayExact.length >= 4
    ? { ...fallback, id: `daily-${dateId}`, title: 'Today’s Vachnamrut ladder', questions: todayExact }
    : fallback
  return { pack, questions: chosen.map(q => withShuffledOptions(q, dateId)) }
}

/** The day's crossword: an admin override, else the generated grid, else an authored or built-in one. */
export function pickDailyCrossword(dateId: string, puzzleDocs: PlainDoc[] = [], wordDocs: PlainDoc[] = []): CrosswordPuzzle {
  const fallback = createFittedDailyCrossword(dateId) || { ...DEFAULT_MINI_CROSSWORD }
  const remote = puzzleDocs
    .map(({ id, data }) => ({ id, ...data } as CrosswordPuzzle))
    .filter(p => p.title && p.clues?.length)
  const customDaily = createFittedDailyCrossword(dateId, mergeGameWords(mapCustomGameWords(wordDocs)))
  return remote.find(p => p.id === `daily-${dateId}`) || customDaily || remote[0] || fallback
}

export function pickRasRani(dateId: string): RasRaniPuzzle {
  return getRasRaniPuzzleForDate(dateId)
}

export function rasRaniDifficulty(puzzle: RasRaniPuzzle): RasRaniDifficulty {
  return puzzle.difficulty || inferRasRaniDifficulty(puzzle.gridSize)
}

/** A published `suryaChandraPuzzles` document for the day, else the generated board. */
export function pickSuryaChandra(dateId: string, scheduled?: PlainDoc | null): TangoPuzzle {
  if (scheduled) {
    const parsed = parseTangoPuzzle(scheduled.id, scheduled.data)
    if (parsed) return parsed
  }
  return generateSuryaChandraPuzzle(dateId)
}

// ---------------------------------------------------------------------------
// Replays: what the play proves.
// ---------------------------------------------------------------------------

function list(value: unknown, what: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new PlayRejected(`Invalid ${what}.`)
  return value
}

/** Guesses in order. Only a winning row reaches the leaderboard, so the last guess must be the answer. */
export function replayWordle(answer: string, guesses: unknown) {
  const words = list(guesses, 'guesses', 6).map(word => String(word || '').trim().toUpperCase())
  if (!words.length || words.some(word => !/^[A-Z]{5}$/.test(word))) throw new PlayRejected('Invalid guesses.')
  const hit = words.indexOf(answer)
  if (hit !== words.length - 1) throw new PlayRejected('That is not today’s word.')
  return { guesses: words.length }
}

/** Every group submitted, in order. Four found wins; four wrong ends the puzzle. */
export function replayConnections(puzzle: ConnectionsPuzzle, attempts: unknown) {
  const rows = list(attempts, 'attempts', 7)
  const groupOf = new Map<string, number>()
  for (const group of puzzle.groups) for (const word of group.words) groupOf.set(word.toLocaleLowerCase(), group.difficulty)
  const found = new Set<number>()
  let mistakes = 0
  for (const row of rows) {
    if (found.size === 4 || mistakes >= 4) throw new PlayRejected('Moves after the puzzle ended.')
    const words = list(row, 'group', 4).map(word => String(word || '').toLocaleLowerCase())
    if (words.length !== 4 || new Set(words).size !== 4 || words.some(word => !groupOf.has(word))) {
      throw new PlayRejected('That group is not from today’s puzzle.')
    }
    const groups = new Set(words.map(word => groupOf.get(word)!))
    const group = groups.size === 1 ? [...groups][0]! : null
    if (group != null && !found.has(group)) found.add(group)
    else mistakes++
  }
  if (found.size < 4 && mistakes < 4) throw new PlayRejected('The puzzle is not finished.')
  return { won: found.size === 4, mistakes, groupsFound: found.size }
}

/** The option chosen on each rung, from the top. A wrong answer ends the climb. */
export function replayOnePercent(questions: OnePercentQuestion[], answers: unknown) {
  const ladder = [...questions].sort(byLadder)
  const picks = list(answers, 'answers', ladder.length).map(answer => String(answer ?? '').trim())
  let cleared = 0
  let failPercent: number | null = null
  for (const [i, pick] of picks.entries()) {
    const rung = ladder[i]!
    if (pick === rung.correctAnswer.trim()) {
      cleared++
      continue
    }
    if (i !== picks.length - 1) throw new PlayRejected('Answers after the climb ended.')
    failPercent = rung.percent
  }
  if (failPercent == null && cleared < ladder.length) throw new PlayRejected('The climb is not finished.')
  const clearedAll = cleared === ladder.length && ladder.some(q => q.percent === 1)
  return { cleared, clearedAll, failPercent, rungs: ladder.length }
}

/** Every open square of the grid, keyed as the page keys them (`row,col`). */
export function replayCrossword(puzzle: CrosswordPuzzle, letters: unknown) {
  const layout = layoutAnyCrossword(puzzle)
  if (!layout || !letters || typeof letters !== 'object') throw new PlayRejected('Invalid grid.')
  const filled = letters as Record<string, unknown>
  for (const [row, line] of layout.letters.entries()) {
    for (const [col, letter] of line.entries()) {
      if (!letter) continue
      if (String(filled[cellKey(row, col)] || '').toUpperCase() !== letter.toUpperCase()) {
        throw new PlayRejected('The grid does not match today’s crossword.')
      }
    }
  }
  return { title: puzzle.title || 'crossword' }
}

/** The squares holding a nectar drop, as `[row, col]`. */
export function replayRasRani(puzzle: RasRaniPuzzle, drops: unknown) {
  const cells = list(drops, 'grid', puzzle.gridSize * puzzle.gridSize)
  const grid: CellState[][] = Array.from({ length: puzzle.gridSize }, () => Array<CellState>(puzzle.gridSize).fill('empty'))
  for (const cell of cells) {
    const [row, col] = Array.isArray(cell) ? cell.map(Number) : [NaN, NaN]
    if (!Number.isInteger(row) || !Number.isInteger(col) || !grid[row!]?.[col!]) throw new PlayRejected('Invalid grid.')
    grid[row!]![col!] = 'queen'
  }
  if (!isPuzzleSolved(grid, puzzle)) throw new PlayRejected('The garden is not solved.')
  return { difficulty: rasRaniDifficulty(puzzle) }
}

/** The finished board, 1 for a sun and 0 for a moon. The given squares must be untouched. */
export function replaySuryaChandra(puzzle: TangoPuzzle, board: unknown) {
  const rows = list(board, 'board', puzzle.size)
  const grid: TangoCell[][] = rows.map(row => list(row, 'board', puzzle.size).map(cell => (cell === 0 || cell === 1 ? cell : null)))
  if (grid.length !== puzzle.size || grid.some(row => row.length !== puzzle.size)) throw new PlayRejected('Invalid board.')
  for (const [r, row] of puzzle.given.entries()) {
    for (const [c, given] of row.entries()) {
      if (given != null && grid[r]![c] !== given) throw new PlayRejected('The board does not match today’s puzzle.')
    }
  }
  if (!boardIsSolved(grid, puzzle.links)) throw new PlayRejected('The board is not solved.')
  return {}
}
