export const SURYA_CHANDRA_SIZE = 6

export type SuryaSymbol = 'surya' | 'chandra'
export type SuryaCell = SuryaSymbol | null
export type SuryaConstraintType = 'same' | 'diff'

export type SuryaConstraint = {
  r1: number
  c1: number
  r2: number
  c2: number
  type: SuryaConstraintType
}

export type SuryaGiven = {
  r: number
  c: number
  value: SuryaSymbol
}

export type SuryaChandraPuzzle = {
  id: string
  title: string
  dateId?: string | null
  givens: SuryaGiven[]
  constraints: SuryaConstraint[]
  solution: SuryaSymbol[][]
  published?: boolean
}

export type SuryaViolations = {
  cells: Set<string>
  rows: Set<number>
  cols: Set<number>
}

export function oppositeSymbol(value: SuryaSymbol): SuryaSymbol {
  return value === 'surya' ? 'chandra' : 'surya'
}

export function createPlayGrid(puzzle: SuryaChandraPuzzle): SuryaCell[][] {
  const grid: SuryaCell[][] = Array.from({ length: SURYA_CHANDRA_SIZE }, () =>
    Array.from({ length: SURYA_CHANDRA_SIZE }, () => null)
  )
  for (const given of puzzle.givens) {
    grid[given.r][given.c] = given.value
  }
  return grid
}

export function givenKeySet(puzzle: SuryaChandraPuzzle): Set<string> {
  return new Set(puzzle.givens.map(item => `${item.r},${item.c}`))
}

export function cyclePlayCell(current: SuryaCell): SuryaCell {
  if (current == null) return 'surya'
  if (current === 'surya') return 'chandra'
  return null
}

function threeInARow(line: SuryaCell[]): number[] {
  const hits: number[] = []
  for (let i = 0; i < line.length - 2; i++) {
    const a = line[i]
    if (!a || a !== line[i + 1] || a !== line[i + 2]) continue
    hits.push(i, i + 1, i + 2)
  }
  return hits
}

export function checkSuryaViolations(grid: SuryaCell[][], puzzle: SuryaChandraPuzzle): SuryaViolations {
  const cells = new Set<string>()
  const rows = new Set<number>()
  const cols = new Set<number>()
  const n = SURYA_CHANDRA_SIZE

  for (let r = 0; r < n; r++) {
    const hits = threeInARow(grid[r])
    if (hits.length) {
      rows.add(r)
      for (const c of hits) cells.add(`${r},${c}`)
    }
    const filled = grid[r].filter(Boolean) as SuryaSymbol[]
    const surya = filled.filter(item => item === 'surya').length
    const chandra = filled.length - surya
    if (surya > 3 || chandra > 3) {
      rows.add(r)
      for (let c = 0; c < n; c++) if (grid[r][c]) cells.add(`${r},${c}`)
    }
  }

  for (let c = 0; c < n; c++) {
    const col = grid.map(row => row[c])
    const hits = threeInARow(col)
    if (hits.length) {
      cols.add(c)
      for (const r of hits) cells.add(`${r},${c}`)
    }
    const filled = col.filter(Boolean) as SuryaSymbol[]
    const surya = filled.filter(item => item === 'surya').length
    const chandra = filled.length - surya
    if (surya > 3 || chandra > 3) {
      cols.add(c)
      for (let r = 0; r < n; r++) if (grid[r][c]) cells.add(`${r},${c}`)
    }
  }

  for (const link of puzzle.constraints) {
    const a = grid[link.r1][link.c1]
    const b = grid[link.r2][link.c2]
    if (!a || !b) continue
    const broken = link.type === 'same' ? a !== b : a === b
    if (!broken) continue
    cells.add(`${link.r1},${link.c1}`)
    cells.add(`${link.r2},${link.c2}`)
  }

  return { cells, rows, cols }
}

export function hasSuryaViolations(grid: SuryaCell[][], puzzle: SuryaChandraPuzzle) {
  const v = checkSuryaViolations(grid, puzzle)
  return v.cells.size > 0
}

export function isSuryaSolved(grid: SuryaCell[][], puzzle: SuryaChandraPuzzle) {
  for (const row of grid) {
    if (row.some(cell => !cell)) return false
  }
  return !hasSuryaViolations(grid, puzzle)
}

export function constraintBetween(
  puzzle: SuryaChandraPuzzle,
  r1: number,
  c1: number,
  r2: number,
  c2: number
) {
  return puzzle.constraints.find(item =>
    (item.r1 === r1 && item.c1 === c1 && item.r2 === r2 && item.c2 === c2)
    || (item.r1 === r2 && item.c1 === c2 && item.r2 === r1 && item.c2 === c1)
  ) || null
}

export function markerStyle(link: SuryaConstraint) {
  const size = SURYA_CHANDRA_SIZE
  const horizontal = link.r1 === link.r2
  const midR = (link.r1 + link.r2 + 1) / 2
  const midC = (link.c1 + link.c2 + 1) / 2
  return {
    top: `${(midR / size) * 100}%`,
    left: `${(midC / size) * 100}%`,
    transform: 'translate(-50%, -50%)',
    width: horizontal ? '18px' : '16px',
    height: horizontal ? '16px' : '18px'
  }
}
