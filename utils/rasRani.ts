import type { RasRaniPuzzle } from '~/data/rasRaniPuzzles'
import { getRegionFill } from '~/data/rasRaniPuzzles'

export type CellState = 'empty' | 'marked' | 'queen'

export interface RasRaniCell {
  row: number
  col: number
  regionId: string
  state: CellState
}

export function createEmptyGrid(puzzle: RasRaniPuzzle): CellState[][] {
  return Array.from({ length: puzzle.gridSize }, () =>
    Array.from({ length: puzzle.gridSize }, () => 'empty' as CellState)
  )
}

export function getQueenPositions(grid: CellState[][]): [number, number][] {
  const positions: [number, number][] = []
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 'queen') {
        positions.push([r, c])
      }
    }
  }
  return positions
}

export function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  const rowDiff = Math.abs(r1 - r2)
  const colDiff = Math.abs(c1 - c2)
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)
}

export function checkViolations(
  grid: CellState[][],
  puzzle: RasRaniPuzzle
): { row: Set<number>; col: Set<number>; region: Set<string>; adjacent: Set<string> } {
  const violations = {
    row: new Set<number>(),
    col: new Set<number>(),
    region: new Set<string>(),
    adjacent: new Set<string>()
  }

  const queens = getQueenPositions(grid)

  const rowCounts = new Map<number, number>()
  const colCounts = new Map<number, number>()
  const regionCounts = new Map<string, number>()

  for (const [r, c] of queens) {
    rowCounts.set(r, (rowCounts.get(r) ?? 0) + 1)
    colCounts.set(c, (colCounts.get(c) ?? 0) + 1)
    const regionId = puzzle.regionGrid[r][c]
    regionCounts.set(regionId, (regionCounts.get(regionId) ?? 0) + 1)
  }

  for (const [r, count] of rowCounts) {
    if (count > 1) violations.row.add(r)
  }
  for (const [c, count] of colCounts) {
    if (count > 1) violations.col.add(c)
  }
  for (const [region, count] of regionCounts) {
    if (count > 1) violations.region.add(region)
  }

  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const [r1, c1] = queens[i]
      const [r2, c2] = queens[j]
      if (isAdjacent(r1, c1, r2, c2)) {
        violations.adjacent.add(`${r1},${c1}`)
        violations.adjacent.add(`${r2},${c2}`)
      }
    }
  }

  return violations
}

export function hasViolations(
  grid: CellState[][],
  puzzle: RasRaniPuzzle
): boolean {
  const v = checkViolations(grid, puzzle)
  return v.row.size > 0 || v.col.size > 0 || v.region.size > 0 || v.adjacent.size > 0
}

export function uniqueRegionIds(puzzle: RasRaniPuzzle): string[] {
  const ids = new Set<string>()
  for (const row of puzzle.regionGrid) {
    for (const regionId of row) ids.add(regionId)
  }
  return [...ids]
}

export function isPuzzleSolved(
  grid: CellState[][],
  puzzle: RasRaniPuzzle
): boolean {
  const queens = getQueenPositions(grid)

  if (queens.length !== puzzle.gridSize) return false
  if (hasViolations(grid, puzzle)) return false

  const rowsWithQueens = new Set(queens.map(([r]) => r))
  const colsWithQueens = new Set(queens.map(([, c]) => c))
  if (rowsWithQueens.size !== puzzle.gridSize) return false
  if (colsWithQueens.size !== puzzle.gridSize) return false

  const uniqueRegions = uniqueRegionIds(puzzle)
  if (uniqueRegions.length !== puzzle.gridSize) return false

  const regionsWithQueens = new Set(queens.map(([r, c]) => puzzle.regionGrid[r][c]))
  return uniqueRegions.every(region => regionsWithQueens.has(region))
}

/** Thick outline between colour regions, thin lines inside a region. Drawn on top/left so edges are not doubled. */
export function regionBorderStyle(puzzle: RasRaniPuzzle, row: number, col: number) {
  const id = puzzle.regionGrid[row]?.[col]
  const n = puzzle.gridSize
  const different = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= n || c >= n) return true
    return puzzle.regionGrid[r][c] !== id
  }
  const width = (edge: boolean) => edge ? '4px' : '1px'
  return {
    backgroundColor: getRegionFill(id || ''),
    borderStyle: 'solid' as const,
    borderColor: '#1f2937',
    borderTopWidth: width(different(row - 1, col)),
    borderLeftWidth: width(different(row, col - 1)),
    borderRightWidth: col === n - 1 ? width(true) : '0px',
    borderBottomWidth: row === n - 1 ? width(true) : '0px'
  }
}

export function autoMarkInvalidCells(
  grid: CellState[][],
  puzzle: RasRaniPuzzle
): CellState[][] {
  const newGrid = grid.map(row => [...row])
  const queens = getQueenPositions(grid)

  for (const [qr, qc] of queens) {
    for (let r = 0; r < puzzle.gridSize; r++) {
      if (r !== qr && newGrid[r][qc] === 'empty') {
        newGrid[r][qc] = 'marked'
      }
    }

    for (let c = 0; c < puzzle.gridSize; c++) {
      if (c !== qc && newGrid[qr][c] === 'empty') {
        newGrid[qr][c] = 'marked'
      }
    }

    const qRegion = puzzle.regionGrid[qr][qc]
    for (let r = 0; r < puzzle.gridSize; r++) {
      for (let c = 0; c < puzzle.gridSize; c++) {
        if ((r !== qr || c !== qc) && puzzle.regionGrid[r][c] === qRegion && newGrid[r][c] === 'empty') {
          newGrid[r][c] = 'marked'
        }
      }
    }

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const nr = qr + dr
        const nc = qc + dc
        if (nr >= 0 && nr < puzzle.gridSize && nc >= 0 && nc < puzzle.gridSize) {
          if (newGrid[nr][nc] === 'empty') {
            newGrid[nr][nc] = 'marked'
          }
        }
      }
    }
  }

  return newGrid
}

export function getHint(
  grid: CellState[][],
  puzzle: RasRaniPuzzle
): { type: 'place' | 'error'; row: number; col: number; regionId?: string } | null {
  const violations = checkViolations(grid, puzzle)

  if (violations.adjacent.size > 0) {
    const first = [...violations.adjacent][0]
    const [r, c] = first.split(',').map(Number)
    return { type: 'error', row: r, col: c }
  }

  if (violations.row.size > 0) {
    const row = [...violations.row][0]
    return { type: 'error', row, col: 0 }
  }

  if (violations.col.size > 0) {
    const col = [...violations.col][0]
    return { type: 'error', row: 0, col }
  }

  if (violations.region.size > 0) {
    const regionId = [...violations.region][0]
    for (let r = 0; r < puzzle.gridSize; r++) {
      for (let c = 0; c < puzzle.gridSize; c++) {
        if (puzzle.regionGrid[r][c] === regionId && grid[r][c] === 'queen') {
          return { type: 'error', row: r, col: c, regionId }
        }
      }
    }
  }

  for (const [sr, sc] of puzzle.solution) {
    if (grid[sr][sc] !== 'queen') {
      return { type: 'place', row: sr, col: sc, regionId: puzzle.regionGrid[sr][sc] }
    }
  }

  return null
}

export function cycleCell(current: CellState): CellState {
  if (current === 'empty') return 'marked'
  if (current === 'marked') return 'queen'
  return 'empty'
}

export function validateRasRaniPuzzle(puzzle: Pick<RasRaniPuzzle, 'gridSize' | 'regionGrid' | 'solution'>): string {
  const { gridSize, regionGrid, solution } = puzzle
  if (regionGrid.length !== gridSize || regionGrid.some(row => row.length !== gridSize)) {
    return `Region grid must be ${gridSize}×${gridSize}.`
  }
  const regions = uniqueRegionIds(puzzle as RasRaniPuzzle)
  if (regions.length !== gridSize) {
    return `Need exactly ${gridSize} colour regions (one per nectar drop), found ${regions.length}.`
  }
  if (solution.length !== gridSize) {
    return `Solution must have exactly ${gridSize} nectar positions.`
  }

  const rows = new Set<number>()
  const cols = new Set<number>()
  const regionHits = new Set<string>()
  for (const [r, c] of solution) {
    if (r < 0 || c < 0 || r >= gridSize || c >= gridSize) return 'A solution cell is off the grid.'
    rows.add(r)
    cols.add(c)
    regionHits.add(regionGrid[r][c])
  }
  if (rows.size !== gridSize || cols.size !== gridSize) {
    return 'Solution must use each row and column once.'
  }
  if (regionHits.size !== gridSize) {
    return 'Solution must place one nectar drop in each colour region.'
  }
  for (let i = 0; i < solution.length; i++) {
    for (let j = i + 1; j < solution.length; j++) {
      const [r1, c1] = solution[i]
      const [r2, c2] = solution[j]
      if (isAdjacent(r1, c1, r2, c2)) {
        return 'Two nectar drops in the solution touch (including diagonally).'
      }
    }
  }
  return ''
}
