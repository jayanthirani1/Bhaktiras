import type { BhaktiMargPuzzle } from '~/data/bhaktiMargPuzzles'

export interface CellPosition {
  row: number
  col: number
}

export function posKey(pos: CellPosition): string {
  return `${pos.row},${pos.col}`
}

export function parseKey(key: string): CellPosition {
  const [row, col] = key.split(',').map(Number)
  return { row, col }
}

export function areAdjacent(a: CellPosition, b: CellPosition): boolean {
  const rowDiff = Math.abs(a.row - b.row)
  const colDiff = Math.abs(a.col - b.col)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
}

export function isWall(pos: CellPosition, walls: [number, number][]): boolean {
  return walls.some(([r, c]) => r === pos.row && c === pos.col)
}

export function getPathWord(path: CellPosition[], grid: string[][]): string {
  return path.map(p => grid[p.row]?.[p.col] ?? '').join('')
}

export function validatePath(
  path: CellPosition[],
  grid: string[][],
  walls: [number, number][],
  usedCells: Set<string>
): boolean {
  if (path.length < 2) return false

  for (let i = 0; i < path.length; i++) {
    const pos = path[i]
    const key = posKey(pos)

    if (pos.row < 0 || pos.row >= grid.length) return false
    if (pos.col < 0 || pos.col >= grid[0].length) return false
    if (isWall(pos, walls)) return false
    if (usedCells.has(key)) return false
    if (i > 0 && !areAdjacent(path[i - 1], path[i])) return false
  }

  return true
}

export function checkWordMatch(
  currentPath: CellPosition[],
  puzzle: BhaktiMargPuzzle,
  solvedWords: Set<string>
): { matched: boolean; wordIndex: number; word: string } | null {
  const pathWord = getPathWord(currentPath, puzzle.grid)

  for (let i = 0; i < puzzle.words.length; i++) {
    const word = puzzle.words[i].word
    if (solvedWords.has(word)) continue

    if (pathWord.toUpperCase() === word.toUpperCase()) {
      const expectedPath = puzzle.paths[i]
      if (expectedPath && expectedPath.length === currentPath.length) {
        const pathMatches = currentPath.every((pos, idx) =>
          expectedPath[idx][0] === pos.row && expectedPath[idx][1] === pos.col
        )
        if (pathMatches) {
          return { matched: true, wordIndex: i, word }
        }
      }
      return { matched: true, wordIndex: i, word }
    }
  }

  return null
}

export function getUsedCellsFromSolved(
  solvedIndices: number[],
  puzzle: BhaktiMargPuzzle
): Set<string> {
  const used = new Set<string>()
  for (const idx of solvedIndices) {
    const path = puzzle.paths[idx]
    if (path) {
      for (const [r, c] of path) {
        used.add(`${r},${c}`)
      }
    }
  }
  return used
}

export function isPuzzleComplete(
  solvedIndices: number[],
  puzzle: BhaktiMargPuzzle
): boolean {
  return solvedIndices.length === puzzle.words.length
}

export function shuffleGrid(grid: string[][], seed: number): string[][] {
  return grid.map(row => [...row])
}

export function getHintForWord(
  wordIndex: number,
  puzzle: BhaktiMargPuzzle,
  revealedCount: number
): { row: number; col: number; letter: string } | null {
  const path = puzzle.paths[wordIndex]
  if (!path || revealedCount >= path.length) return null

  const [row, col] = path[revealedCount]
  const letter = puzzle.grid[row][col]
  return { row, col, letter }
}
