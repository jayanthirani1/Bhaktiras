import { rngForSeed, shuffle } from '~/utils/seededRandom'

export const TANGO_SIZE = 6
export const SURYA = 1 as const
export const CHANDRA = 0 as const

export type TangoSymbol = 0 | 1
export type TangoCell = TangoSymbol | null

export type TangoLink = {
  ar: number
  ac: number
  br: number
  bc: number
  kind: 'same' | 'opp'
}

export type TangoPuzzle = {
  id: string
  dateId?: string | null
  title: string
  size: number
  given: TangoCell[][]
  links: TangoLink[]
  solution: TangoSymbol[][]
  published?: boolean
}

export function emptyBoard(size = TANGO_SIZE): TangoCell[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null))
}

export function cloneBoard<T>(board: T[][]): T[][] {
  return board.map(row => [...row])
}

function lineOk(values: TangoCell[]): boolean {
  let zeros = 0
  let ones = 0
  let empty = 0
  for (const value of values) {
    if (value === 0) zeros += 1
    else if (value === 1) ones += 1
    else empty += 1
  }
  if (zeros > 3 || ones > 3) return false
  if (empty === 0 && (zeros !== 3 || ones !== 3)) return false
  for (let i = 0; i < values.length - 2; i++) {
    const a = values[i]
    const b = values[i + 1]
    const c = values[i + 2]
    if (a != null && a === b && b === c) return false
  }
  return true
}

export function linksForCell(links: TangoLink[], row: number, col: number) {
  return links.filter(link =>
    (link.ar === row && link.ac === col) || (link.br === row && link.bc === col)
  )
}

export function otherEnd(link: TangoLink, row: number, col: number): [number, number] {
  if (link.ar === row && link.ac === col) return [link.br, link.bc]
  return [link.ar, link.ac]
}

export function boardRespectsLinks(board: TangoCell[][], links: TangoLink[]): boolean {
  for (const link of links) {
    const a = board[link.ar][link.ac]
    const b = board[link.br][link.bc]
    if (a == null || b == null) continue
    if (link.kind === 'same' && a !== b) return false
    if (link.kind === 'opp' && a === b) return false
  }
  return true
}

export function boardIsLegal(board: TangoCell[][], links: TangoLink[]): boolean {
  const size = board.length
  if (!boardRespectsLinks(board, links)) return false
  for (let i = 0; i < size; i++) {
    if (!lineOk(board[i])) return false
    if (!lineOk(board.map(row => row[i]))) return false
  }
  return true
}

export function boardIsSolved(board: TangoCell[][], links: TangoLink[]): boolean {
  if (board.some(row => row.some(cell => cell == null))) return false
  return boardIsLegal(board, links)
}

export function cellViolations(board: TangoCell[][], links: TangoLink[]): Set<string> {
  const bad = new Set<string>()
  const size = board.length
  const markLine = (cells: Array<{ r: number, c: number, v: TangoCell }>) => {
    const values = cells.map(cell => cell.v)
    if (!lineOk(values)) {
      for (const cell of cells) {
        if (cell.v != null) bad.add(`${cell.r},${cell.c}`)
      }
    }
  }
  for (let r = 0; r < size; r++) {
    markLine(board[r].map((v, c) => ({ r, c, v })))
  }
  for (let c = 0; c < size; c++) {
    markLine(board.map((row, r) => ({ r, c, v: row[c] })))
  }
  for (const link of links) {
    const a = board[link.ar][link.ac]
    const b = board[link.br][link.bc]
    if (a == null || b == null) continue
    const broken = (link.kind === 'same' && a !== b) || (link.kind === 'opp' && a === b)
    if (broken) {
      bad.add(`${link.ar},${link.ac}`)
      bad.add(`${link.br},${link.bc}`)
    }
  }
  return bad
}

function canPlace(board: TangoCell[][], links: TangoLink[], row: number, col: number, value: TangoSymbol) {
  if (board[row][col] != null) return false
  board[row][col] = value
  const ok = boardIsLegal(board, links)
  board[row][col] = null
  return ok
}

export function countSolutions(given: TangoCell[][], links: TangoLink[], limit = 2): number {
  const board = cloneBoard(given)
  const size = board.length
  const cells: Array<[number, number]> = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] == null) cells.push([r, c])
    }
  }
  let found = 0
  function search(index: number): boolean {
    if (found >= limit) return true
    if (index >= cells.length) {
      if (boardIsSolved(board, links)) found += 1
      return found >= limit
    }
    const [r, c] = cells[index]
    for (const value of [0, 1] as TangoSymbol[]) {
      if (!canPlace(board, links, r, c, value)) continue
      board[r][c] = value
      if (search(index + 1)) {
        board[r][c] = null
        return true
      }
      board[r][c] = null
    }
    return false
  }
  search(0)
  return found
}

function fillComplete(rnd: () => number): TangoSymbol[][] | null {
  const board = emptyBoard()
  const order = shuffle(
    Array.from({ length: TANGO_SIZE * TANGO_SIZE }, (_, i) => i),
    rnd
  )
  function search(step: number): boolean {
    if (step >= order.length) return true
    const i = order[step]
    const r = Math.floor(i / TANGO_SIZE)
    const c = i % TANGO_SIZE
    if (board[r][c] != null) return search(step + 1)
    for (const value of shuffle([0, 1] as TangoSymbol[], rnd)) {
      if (!canPlace(board, [], r, c, value)) continue
      board[r][c] = value
      if (search(step + 1)) return true
      board[r][c] = null
    }
    return false
  }
  if (!search(0)) return null
  return board as TangoSymbol[][]
}

function adjacentPairs(size = TANGO_SIZE): Array<[number, number, number, number]> {
  const pairs: Array<[number, number, number, number]> = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size) pairs.push([r, c, r, c + 1])
      if (r + 1 < size) pairs.push([r, c, r + 1, c])
    }
  }
  return pairs
}

export function generateSuryaChandraPuzzle(dateId: string): TangoPuzzle {
  const rnd = rngForSeed(`surya-chandra:${dateId}`)
  for (let attempt = 0; attempt < 40; attempt++) {
    const solution = fillComplete(rnd)
    if (!solution) continue
    const pairs = shuffle(adjacentPairs(), rnd)
    const linkCount = 8 + Math.floor(rnd() * 6)
    const links: TangoLink[] = pairs.slice(0, linkCount).map(([ar, ac, br, bc]) => ({
      ar,
      ac,
      br,
      bc,
      kind: solution[ar][ac] === solution[br][bc] ? 'same' : 'opp'
    }))
    const given = emptyBoard()
    const cells = shuffle(
      Array.from({ length: TANGO_SIZE * TANGO_SIZE }, (_, i) => [Math.floor(i / TANGO_SIZE), i % TANGO_SIZE] as [number, number]),
      rnd
    )
            let givens = 8
    for (let i = 0; i < givens; i++) {
      const [r, c] = cells[i]
      given[r][c] = solution[r][c]
    }
    while (countSolutions(given, links, 2) !== 1 && givens < 14) {
      const [r, c] = cells[givens]
      given[r][c] = solution[r][c]
      givens += 1
    }
    if (countSolutions(given, links, 2) === 1) {
      return {
        id: `surya-chandra-${dateId}`,
        dateId,
        title: 'Surya Chandra',
        size: TANGO_SIZE,
        given,
        links,
        solution,
        published: true
      }
    }
  }
  return fallbackPuzzle(dateId)
}

function fallbackPuzzle(dateId: string): TangoPuzzle {
  const solution: TangoSymbol[][] = [
    [1, 1, 0, 0, 1, 0],
    [0, 0, 1, 1, 0, 1],
    [1, 0, 0, 1, 1, 0],
    [0, 1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1]
  ]
  const given = emptyBoard()
  given[0][0] = 1
  given[1][2] = 1
  given[2][5] = 0
  given[4][1] = 0
  given[5][4] = 0
  const links: TangoLink[] = [
    { ar: 0, ac: 0, br: 0, bc: 1, kind: 'same' },
    { ar: 0, ac: 2, br: 0, bc: 3, kind: 'same' },
    { ar: 1, ac: 0, br: 2, bc: 0, kind: 'opp' },
    { ar: 2, ac: 2, br: 2, bc: 3, kind: 'opp' },
    { ar: 3, ac: 4, br: 3, bc: 5, kind: 'opp' },
    { ar: 4, ac: 0, br: 5, bc: 0, kind: 'opp' },
    { ar: 4, ac: 4, br: 5, bc: 4, kind: 'opp' },
    { ar: 5, ac: 1, br: 5, bc: 2, kind: 'opp' }
  ]
  return {
    id: `surya-chandra-fallback-${dateId}`,
    dateId,
    title: 'Surya Chandra',
    size: TANGO_SIZE,
    given,
    links,
    solution,
    published: true
  }
}

export function parseTangoPuzzle(id: string, data: Record<string, unknown>): TangoPuzzle | null {
  const given = Array.isArray(data.given) ? data.given as TangoCell[][] : null
  const links = Array.isArray(data.links) ? data.links as TangoLink[] : null
  const solution = Array.isArray(data.solution) ? data.solution as TangoSymbol[][] : null
  if (!given || !links || !solution) return null
  if (given.length !== TANGO_SIZE || solution.length !== TANGO_SIZE) return null
  return {
    id,
    dateId: (data.dateId as string | null) ?? null,
    title: String(data.title || 'Surya Chandra'),
    size: TANGO_SIZE,
    given,
    links,
    solution,
    published: data.published !== false
  }
}

export function cyclePlayCell(current: TangoCell, locked: boolean): TangoCell {
  if (locked) return current
  if (current == null) return SURYA
  if (current === SURYA) return CHANDRA
  return null
}

export function getTangoHint(board: TangoCell[][], puzzle: TangoPuzzle): { row: number, col: number, value: TangoSymbol } | null {
  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      if (board[r][c] == null) {
        return { row: r, col: c, value: puzzle.solution[r][c] }
      }
      if (board[r][c] !== puzzle.solution[r][c] && puzzle.given[r][c] == null) {
        return { row: r, col: c, value: puzzle.solution[r][c] }
      }
    }
  }
  return null
}
