import type { CrosswordClue } from '~/types'

export interface LaidWord {
  key: string
  number: number
  direction: 'across' | 'down'
  clue: string
  answer: string
  row: number
  col: number
  cells: { row: number; col: number }[]
}

export interface CrosswordLayout {
  rows: number
  cols: number
  letters: (string | null)[][]
  numbers: (number | null)[][]
  words: LaidWord[]
}

function cleanAnswer(answer: string) {
  return (answer || '').replace(/\s+/g, '').toUpperCase()
}

function keyRC(row: number, col: number) {
  return `${row},${col}`
}

function canPlace(
  word: string,
  row: number,
  col: number,
  dir: 'across' | 'down',
  grid: Map<string, string>,
  opts: { relaxAdjacency?: boolean } = {}
) {
  const dr = dir === 'down' ? 1 : 0
  const dc = dir === 'across' ? 1 : 0
  const before = grid.get(keyRC(row - dr, col - dc))
  const after = grid.get(keyRC(row + dr * word.length, col + dc * word.length))
  if (before || after) return false

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i
    const c = col + dc * i
    const existing = grid.get(keyRC(r, c))
    if (existing && existing !== word[i]) return false
    if (!existing && !opts.relaxAdjacency) {
      if (dir === 'across') {
        if (grid.get(keyRC(r - 1, c)) || grid.get(keyRC(r + 1, c))) return false
      } else if (grid.get(keyRC(r, c - 1)) || grid.get(keyRC(r, c + 1))) return false
    }
  }
  return true
}

function writeWord(
  word: string,
  row: number,
  col: number,
  dir: 'across' | 'down',
  grid: Map<string, string>
) {
  const dr = dir === 'down' ? 1 : 0
  const dc = dir === 'across' ? 1 : 0
  for (let i = 0; i < word.length; i++) {
    grid.set(keyRC(row + dr * i, col + dc * i), word[i])
  }
}

function tryPlace(
  clue: CrosswordClue,
  grid: Map<string, string>,
  placed: LaidWord[]
): LaidWord | null {
  const answer = cleanAnswer(clue.answer)
  if (!answer) return null
  const dir = clue.direction === 'down' ? 'down' : 'across'

  const makeWord = (row: number, col: number): LaidWord => {
    const dr = dir === 'down' ? 1 : 0
    const dc = dir === 'across' ? 1 : 0
    writeWord(answer, row, col, dir, grid)
    return {
      key: `${dir}-${clue.number}`,
      number: clue.number,
      direction: dir,
      clue: clue.clue,
      answer,
      row,
      col,
      cells: answer.split('').map((_, i) => ({ row: row + dr * i, col: col + dc * i }))
    }
  }

  if (clue.row != null && clue.col != null && Number.isFinite(clue.row) && Number.isFinite(clue.col)) {
    if (canPlace(answer, Number(clue.row), Number(clue.col), dir, grid, { relaxAdjacency: true })) {
      return makeWord(Number(clue.row), Number(clue.col))
    }
    return null
  }

  const candidates: { row: number; col: number; score: number }[] = []

  const sameNumber = placed.find(p => p.number === clue.number && p.direction !== dir)
  if (sameNumber && canPlace(answer, sameNumber.row, sameNumber.col, dir, grid)) {
    candidates.push({ row: sameNumber.row, col: sameNumber.col, score: 1000 })
  }

  if (!placed.length) {
    candidates.push({ row: 0, col: 0, score: 1 })
  } else {
    for (const [cellKey, letter] of grid) {
      const [pr, pc] = cellKey.split(',').map(Number)
      for (let i = 0; i < answer.length; i++) {
        if (answer[i] !== letter) continue
        const row = dir === 'across' ? pr : pr - i
        const col = dir === 'across' ? pc - i : pc
        if (!canPlace(answer, row, col, dir, grid)) continue
        candidates.push({ row, col, score: 10 + i })
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  const spot = candidates[0]
  if (!spot) return null
  return makeWord(spot.row, spot.col)
}

export function layoutCrossword(clues: CrosswordClue[]): CrosswordLayout | null {
  const usable = (clues || [])
    .map(c => ({
      ...c,
      number: Number(c.number) || 1,
      direction: (c.direction === 'down' ? 'down' : 'across') as 'across' | 'down',
      answer: cleanAnswer(c.answer),
      clue: (c.clue || '').trim()
    }))
    .filter(c => c.answer && c.clue)

  if (!usable.length) return null

  const ordered = [...usable].sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number
    if (a.direction !== b.direction) return a.direction === 'across' ? -1 : 1
    return b.answer.length - a.answer.length
  })

  const grid = new Map<string, string>()
  const placed: LaidWord[] = []

  for (const clue of ordered) {
    const word = tryPlace(clue, grid, placed)
    if (word) {
      placed.push(word)
      continue
    }
    let minRow = Infinity
    let maxCol = -Infinity
    for (const key of grid.keys()) {
      const [r, c] = key.split(',').map(Number)
      minRow = Math.min(minRow, r)
      maxCol = Math.max(maxCol, c)
    }
    const row = Number.isFinite(minRow) ? minRow : 0
    const col = (Number.isFinite(maxCol) ? maxCol : -2) + 2
    if (canPlace(clue.answer, row, col, clue.direction, grid) || !grid.size) {
      writeWord(clue.answer, row, col, clue.direction, grid)
      const dr = clue.direction === 'down' ? 1 : 0
      const dc = clue.direction === 'across' ? 1 : 0
      placed.push({
        key: `${clue.direction}-${clue.number}`,
        number: clue.number,
        direction: clue.direction,
        clue: clue.clue,
        answer: clue.answer,
        row,
        col,
        cells: clue.answer.split('').map((_, i) => ({ row: row + dr * i, col: col + dc * i }))
      })
    }
  }

  if (!placed.length) return null

  let minR = Infinity
  let minC = Infinity
  let maxR = -Infinity
  let maxC = -Infinity
  for (const key of grid.keys()) {
    const [r, c] = key.split(',').map(Number)
    minR = Math.min(minR, r)
    minC = Math.min(minC, c)
    maxR = Math.max(maxR, r)
    maxC = Math.max(maxC, c)
  }

  const rows = maxR - minR + 1
  const cols = maxC - minC + 1
  const letters: (string | null)[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))
  const numbers: (number | null)[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))

  for (const [cellKey, letter] of grid) {
    const [r, c] = cellKey.split(',').map(Number)
    letters[r - minR][c - minC] = letter
  }

  const words = placed.map((w) => {
    const row = w.row - minR
    const col = w.col - minC
    if (numbers[row][col] == null || w.number < numbers[row][col]!) numbers[row][col] = w.number
    return {
      ...w,
      row,
      col,
      cells: w.cells.map(cell => ({ row: cell.row - minR, col: cell.col - minC }))
    }
  })

  return { rows, cols, letters, numbers, words }
}

export function cellKey(row: number, col: number) {
  return `${row}-${col}`
}
