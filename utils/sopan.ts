import type { SopanPuzzle, SopanRung } from '~/types'
import { rngForSeed, shuffle } from '~/utils/seededRandom'

export const SOPAN_WORD_LENGTH = 4
export const SOPAN_RUNG_COUNT = 5

export function normalizeSopanWord(value: string): string {
  return String(value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, SOPAN_WORD_LENGTH)
}

/** Index of the single letter that changes between two words, or -1 when they are not one step apart. */
export function changedLetterIndex(a: string, b: string): number {
  if (a.length !== b.length) return -1
  let index = -1
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue
    if (index !== -1) return -1
    index = i
  }
  return index
}

export function oneLetterApart(a: string, b: string): boolean {
  return changedLetterIndex(a, b) !== -1
}

export function isLadder(words: string[]): boolean {
  return words.every((word, i) => i === 0 || oneLetterApart(words[i - 1], word))
}

/** The full ladder top to bottom, as authored. */
export function sopanLadder(puzzle: Pick<SopanPuzzle, 'top' | 'bottom' | 'rungs'>): string[] {
  return [puzzle.top, ...puzzle.rungs.map(rung => rung.word), puzzle.bottom]
}

/**
 * Everything wrong with a puzzle, in words an admin can act on. Empty means playable.
 * Steps are checked in authored order — that is the order the player is solving towards.
 */
export function validateSopanPuzzle(puzzle: Pick<SopanPuzzle, 'top' | 'bottom' | 'endsClue' | 'rungs'>): string[] {
  const errors: string[] = []
  if (puzzle.rungs.length !== SOPAN_RUNG_COUNT) errors.push(`A ladder needs exactly ${SOPAN_RUNG_COUNT} middle rungs.`)
  const ladder = sopanLadder(puzzle)
  ladder.forEach((word, i) => {
    const label = i === 0 ? 'Top word' : i === ladder.length - 1 ? 'Bottom word' : `Rung ${i}`
    if (!/^[A-Z]{4}$/.test(word)) errors.push(`${label} must be ${SOPAN_WORD_LENGTH} letters A–Z.`)
  })
  if (new Set(ladder).size !== ladder.length) errors.push('Every word in the ladder must be different.')
  for (let i = 1; i < ladder.length; i++) {
    if (ladder[i - 1].length === SOPAN_WORD_LENGTH && ladder[i].length === SOPAN_WORD_LENGTH && !oneLetterApart(ladder[i - 1], ladder[i])) {
      errors.push(`${ladder[i - 1] || '?'} → ${ladder[i] || '?'} must change exactly one letter.`)
    }
  }
  puzzle.rungs.forEach((rung, i) => {
    if (!rung.clue.trim()) errors.push(`Rung ${i + 1} needs a clue.`)
  })
  if (!puzzle.endsClue.trim()) errors.push('The top and bottom words need a shared clue.')
  return errors
}

export function parseSopanPuzzle(id: string, data: Record<string, unknown>): SopanPuzzle | null {
  const rungs = Array.isArray(data.rungs)
    ? (data.rungs as Array<Record<string, unknown>>).map(rung => ({
        word: normalizeSopanWord(String(rung?.word || '')),
        clue: String(rung?.clue || '').trim()
      }))
    : []
  const puzzle: SopanPuzzle = {
    id,
    title: String(data.title || '').trim() || undefined,
    dateId: typeof data.dateId === 'string' && data.dateId ? data.dateId : null,
    top: normalizeSopanWord(String(data.top || '')),
    bottom: normalizeSopanWord(String(data.bottom || '')),
    endsClue: String(data.endsClue || '').trim(),
    rungs,
    published: data.published !== false
  }
  return validateSopanPuzzle(puzzle).length ? null : puzzle
}

/**
 * Given the middle words in the player's order, which end goes on top.
 * Either direction of a ladder counts, and so does any other order that still
 * links up — the player is never marked wrong for a ladder that works.
 */
export function resolveSopanEnds(
  puzzle: Pick<SopanPuzzle, 'top' | 'bottom'>,
  middle: string[]
): { top: string, bottom: string } | null {
  if (!middle.length || !isLadder(middle)) return null
  const first = middle[0]
  const last = middle[middle.length - 1]
  if (oneLetterApart(puzzle.top, first) && oneLetterApart(puzzle.bottom, last)) return { top: puzzle.top, bottom: puzzle.bottom }
  if (oneLetterApart(puzzle.bottom, first) && oneLetterApart(puzzle.top, last)) return { top: puzzle.bottom, bottom: puzzle.top }
  return null
}

/** A scrambled starting order that is never already a working ladder. */
export function scrambledSopanOrder(rungs: SopanRung[], seed: string): number[] {
  const indices = rungs.map((_, i) => i)
  const rnd = rngForSeed(`sopan-order:${seed}`)
  for (let attempt = 0; attempt < 20; attempt++) {
    const order = shuffle(indices, rnd)
    if (!isLadder(order.map(i => rungs[i].word))) return order
  }
  return [...indices.slice(1), indices[0]]
}

function dayNumber(dateId: string): number {
  const [year, month, day] = dateId.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

/** Each puzzle once per pass through the pool, reshuffled every pass. */
export function pooledSopanPuzzle(pool: SopanPuzzle[], dateId: string): SopanPuzzle | null {
  if (!pool.length) return null
  const day = dayNumber(dateId)
  const size = pool.length
  const cycle = Math.floor(day / size)
  const order = shuffle(pool, rngForSeed(`sopan-pool:${size}:${cycle}`))
  return order[((day % size) + size) % size] ?? null
}
