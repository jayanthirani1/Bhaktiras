import type { CrosswordClue, CrosswordPuzzle, GameWordEntry } from '~/types'
import { CROSSWORD_SIZE } from '~/utils/crosswordLayout'
import { hashString, mulberry32, shuffle } from '~/utils/seededRandom'

/**
 * Daily crossword generator for a fixed CROSSWORD_SIZE grid.
 *
 * The grid is deliberately sparse: words cross at one or two letters and the
 * rest of the square is blacked out. A fully-checked grid — every letter in both
 * an across and a down answer — is not reachable from a satsang-only vocabulary;
 * measured against the real bank, no fully-checked layout fills at any density.
 * A sparse skeleton fills all 365 days of the year, median ~110ms, worst ~280ms.
 *
 * Two stages:
 *   1. build a skeleton — slot positions only, no letters
 *   2. fill it by backtracking search over the word bank
 *
 * The grid size never varies, so the board always fits the screen without
 * measuring anything.
 */

const MIN_ANSWER_LENGTH = 4
/** Answer counts to attempt, best first. 14 fills on ~2% of days, so it is not worth the attempts. */
const TARGET_LADDER = [13, 12, 11, 10, 9]
const SKELETON_ATTEMPTS = 20
const SKELETON_GUARD = 800
/**
 * A fill that succeeds does so in very few nodes; a high budget only makes
 * hopeless skeletons expensive. 5000 keeps every day filling while holding the
 * worst case to roughly a third of what an unbounded search costs.
 */
const FILL_NODE_BUDGET = 5000
/** Each day draws from a slice of the bank so the same easy words do not recur. */
const DAILY_POOL_FRACTION = 0.55
const MIN_POOL_PER_LENGTH = 12

interface Slot {
  dir: 'across' | 'down'
  row: number
  col: number
  len: number
}

/** Consonant skeleton — keeps near-duplicates like ARTI and AARTI out of one grid. */
function stemOf(answer: string) {
  return answer.replace(/[AEIOU]/g, '')
}

function slotCells(slot: Slot): number[] {
  const cells: number[] = []
  for (let i = 0; i < slot.len; i++) {
    cells.push(slot.dir === 'across'
      ? slot.row * CROSSWORD_SIZE + slot.col + i
      : (slot.row + i) * CROSSWORD_SIZE + slot.col)
  }
  return cells
}

function slotKey(slot: Slot) {
  return slot.dir + ':' + slot.row + ',' + slot.col + ',' + slot.len
}

/**
 * Every maximal run of two or more filled cells must be a declared slot.
 * This is what stops a new word from running alongside an existing one and
 * creating an unintended two-letter answer.
 */
function runsMatchSlots(grid: Uint8Array, slots: Slot[]) {
  const declared = new Set(slots.map(slotKey))
  const found: Slot[] = []

  for (let row = 0; row < CROSSWORD_SIZE; row++) {
    let start = -1
    for (let col = 0; col <= CROSSWORD_SIZE; col++) {
      const filled = col < CROSSWORD_SIZE && grid[row * CROSSWORD_SIZE + col] === 1
      if (!filled) {
        if (start >= 0 && col - start >= 2) found.push({ dir: 'across', row, col: start, len: col - start })
        start = -1
      } else if (start < 0) start = col
    }
  }
  for (let col = 0; col < CROSSWORD_SIZE; col++) {
    let start = -1
    for (let row = 0; row <= CROSSWORD_SIZE; row++) {
      const filled = row < CROSSWORD_SIZE && grid[row * CROSSWORD_SIZE + col] === 1
      if (!filled) {
        if (start >= 0 && row - start >= 2) found.push({ dir: 'down', row: start, col, len: row - start })
        start = -1
      } else if (start < 0) start = row
    }
  }

  if (found.length !== declared.size) return false
  return found.every(run => declared.has(slotKey(run)))
}

/** Grows a connected skeleton by hanging each new slot off a cell of an existing one. */
function buildSkeleton(rnd: () => number, target: number): Slot[] {
  const grid = new Uint8Array(CROSSWORD_SIZE * CROSSWORD_SIZE)
  const slots: Slot[] = []
  const randomLength = () =>
    MIN_ANSWER_LENGTH + Math.floor(rnd() * (CROSSWORD_SIZE - MIN_ANSWER_LENGTH + 1))

  const firstLength = randomLength()
  const first: Slot = rnd() < 0.5
    ? {
        dir: 'across',
        row: Math.floor(rnd() * CROSSWORD_SIZE),
        col: Math.floor(rnd() * (CROSSWORD_SIZE - firstLength + 1)),
        len: firstLength
      }
    : {
        dir: 'down',
        row: Math.floor(rnd() * (CROSSWORD_SIZE - firstLength + 1)),
        col: Math.floor(rnd() * CROSSWORD_SIZE),
        len: firstLength
      }
  for (const cell of slotCells(first)) grid[cell] = 1
  slots.push(first)

  let guard = 0
  while (slots.length < target && guard++ < SKELETON_GUARD) {
    const base = slots[Math.floor(rnd() * slots.length)]
    const anchor = slotCells(base)[Math.floor(rnd() * base.len)]
    const anchorRow = Math.floor(anchor / CROSSWORD_SIZE)
    const anchorCol = anchor % CROSSWORD_SIZE
    const dir: 'across' | 'down' = base.dir === 'across' ? 'down' : 'across'
    const len = randomLength()
    const offset = Math.floor(rnd() * len)

    const candidate: Slot = dir === 'across'
      ? { dir, row: anchorRow, col: anchorCol - offset, len }
      : { dir, row: anchorRow - offset, col: anchorCol, len }

    if (candidate.row < 0 || candidate.col < 0) continue
    if (candidate.dir === 'across' && candidate.col + candidate.len > CROSSWORD_SIZE) continue
    if (candidate.dir === 'down' && candidate.row + candidate.len > CROSSWORD_SIZE) continue

    const cells = slotCells(candidate)
    // The anchor is the single crossing; every other cell must be empty.
    if (cells.some(cell => grid[cell] === 1 && cell !== anchor)) continue

    for (const cell of cells) grid[cell] = 1
    slots.push(candidate)
    if (!runsMatchSlots(grid, slots)) {
      slots.pop()
      for (const cell of cells) if (cell !== anchor) grid[cell] = 0
    }
  }

  return slots
}

/** Shifts the skeleton so its bounding box sits centred in the square. */
function centreSkeleton(slots: Slot[]): Slot[] {
  let minRow = CROSSWORD_SIZE
  let maxRow = -1
  let minCol = CROSSWORD_SIZE
  let maxCol = -1
  for (const slot of slots) {
    for (const cell of slotCells(slot)) {
      const row = Math.floor(cell / CROSSWORD_SIZE)
      const col = cell % CROSSWORD_SIZE
      if (row < minRow) minRow = row
      if (row > maxRow) maxRow = row
      if (col < minCol) minCol = col
      if (col > maxCol) maxCol = col
    }
  }
  const rowShift = Math.floor((CROSSWORD_SIZE - 1 - maxRow - minRow) / 2)
  const colShift = Math.floor((CROSSWORD_SIZE - 1 - maxCol - minCol) / 2)
  if (!rowShift && !colShift) return slots
  return slots.map(slot => ({ ...slot, row: slot.row + rowShift, col: slot.col + colShift }))
}

/**
 * Backtracking search. Always expands the slot with the fewest remaining
 * candidates, which collapses hopeless branches early.
 */
function fillSkeleton(
  slots: Slot[],
  byLength: Map<number, string[]>,
  rnd: () => number
): string[] | null {
  const letters: (string | null)[] = new Array(CROSSWORD_SIZE * CROSSWORD_SIZE).fill(null)
  const cellsBySlot = slots.map(slotCells)
  const candidates = slots.map(slot => shuffle(byLength.get(slot.len) || [], rnd))
  if (candidates.some(list => !list.length)) return null

  const usedAnswers = new Set<string>()
  const usedStems = new Set<string>()
  const assigned = new Array(slots.length).fill(false)
  let nodes = 0

  const fits = (index: number, answer: string) => {
    const cells = cellsBySlot[index]
    for (let i = 0; i < cells.length; i++) {
      const letter = letters[cells[i]]
      if (letter && letter !== answer[i]) return false
    }
    return true
  }

  const search = (placed: number): boolean => {
    if (placed === slots.length) return true
    if (++nodes > FILL_NODE_BUDGET) return false

    let bestIndex = -1
    let bestOptions: string[] = []
    let bestCount = Infinity
    for (let i = 0; i < slots.length; i++) {
      if (assigned[i]) continue
      const options = candidates[i].filter(answer =>
        !usedAnswers.has(answer) && !usedStems.has(stemOf(answer)) && fits(i, answer))
      if (options.length < bestCount) {
        bestCount = options.length
        bestIndex = i
        bestOptions = options
        if (!bestCount) break
      }
    }
    if (bestCount === 0 || bestIndex < 0) return false

    const cells = cellsBySlot[bestIndex]
    assigned[bestIndex] = true
    for (const answer of bestOptions) {
      const previous = cells.map(cell => letters[cell])
      for (let i = 0; i < cells.length; i++) letters[cells[i]] = answer[i]
      usedAnswers.add(answer)
      usedStems.add(stemOf(answer))

      if (search(placed + 1)) return true

      usedAnswers.delete(answer)
      usedStems.delete(stemOf(answer))
      for (let i = 0; i < cells.length; i++) letters[cells[i]] = previous[i]
      if (nodes > FILL_NODE_BUDGET) break
    }
    assigned[bestIndex] = false
    return false
  }

  if (!search(0)) return null
  return slots.map((slot, index) => cellsBySlot[index].map(cell => letters[cell] as string).join(''))
}

/**
 * Numbers the finished grid the way a crossword is numbered: scan row by row,
 * and every cell that begins an across or a down answer takes the next number.
 * An across and a down starting on the same cell share it.
 */
function numberSlots(slots: Slot[]): number[] {
  const startCells = slots.map(slot => slot.row * CROSSWORD_SIZE + slot.col)
  const numbers = new Array<number>(slots.length).fill(0)
  const numberByCell = new Map<number, number>()

  let next = 1
  for (let cell = 0; cell < CROSSWORD_SIZE * CROSSWORD_SIZE; cell++) {
    if (!startCells.includes(cell)) continue
    numberByCell.set(cell, next++)
  }
  for (let i = 0; i < slots.length; i++) {
    numbers[i] = numberByCell.get(startCells[i]) || i + 1
  }
  return numbers
}

/** Deterministic per-day slice of the bank, grouped by answer length. */
function dailyWordPool(entries: GameWordEntry[], seed: string) {
  const seen = new Set<string>()
  const grouped = new Map<number, GameWordEntry[]>()

  for (const entry of entries) {
    if (entry.games && !entry.games.includes('crossword')) continue
    const answer = String(entry.answer || '').toUpperCase().replace(/[^A-Z]/g, '')
    if (answer.length < MIN_ANSWER_LENGTH || answer.length > CROSSWORD_SIZE) continue
    if (seen.has(answer)) continue
    seen.add(answer)
    const normalised = { ...entry, answer }
    const list = grouped.get(answer.length)
    if (list) list.push(normalised)
    else grouped.set(answer.length, [normalised])
  }

  const rnd = mulberry32(hashString(seed))
  const byLength = new Map<number, string[]>()
  const entryByAnswer = new Map<string, GameWordEntry>()

  for (const [length, list] of grouped) {
    const keep = Math.max(
      Math.min(list.length, MIN_POOL_PER_LENGTH),
      Math.ceil(list.length * DAILY_POOL_FRACTION)
    )
    const slice = shuffle(list, rnd).slice(0, keep)
    byLength.set(length, slice.map(entry => entry.answer))
    for (const entry of slice) entryByAnswer.set(entry.answer, entry)
  }

  return { byLength, entryByAnswer }
}

/**
 * Builds the crossword for a UK calendar day. Clues carry their grid position,
 * so the layout is fixed rather than reconstructed.
 */
export function buildDailyCrossword(
  dateId: string,
  entries: GameWordEntry[]
): CrosswordPuzzle | null {
  const { byLength, entryByAnswer } = dailyWordPool(entries, `crossword-pool:${dateId}`)
  if (!byLength.size) return null

  for (const target of TARGET_LADDER) {
    for (let attempt = 0; attempt < SKELETON_ATTEMPTS; attempt++) {
      const seed = hashString(`crossword:${dateId}#${target}.${attempt}`)
      const skeleton = buildSkeleton(mulberry32(seed), target)
      if (skeleton.length < target) continue

      const slots = centreSkeleton(skeleton)
      const answers = fillSkeleton(slots, byLength, mulberry32((seed ^ 0x9e3779b9) >>> 0))
      if (!answers) continue

      const numbers = numberSlots(slots)
      const clues: CrosswordClue[] = slots.map((slot, index) => ({
        number: numbers[index],
        direction: slot.dir,
        clue: entryByAnswer.get(answers[index])?.clue || answers[index],
        answer: answers[index],
        row: slot.row,
        col: slot.col
      }))
      clues.sort((a, b) => (a.number - b.number) || (a.direction === 'across' ? -1 : 1))

      return {
        id: `daily-mini-${dateId}`,
        title: 'Today’s Crossword',
        published: true,
        size: CROSSWORD_SIZE,
        clues
      }
    }
  }

  return null
}
