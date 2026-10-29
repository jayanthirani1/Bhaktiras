/**
 * The Haar Trail — puzzle 7 of the escape room, hidden behind four quick taps on
 * Seva in the navigation bar. The Original Haar has vanished between the
 * staging area and the Abhishek, the CCTV for the theft window is corrupted,
 * and players rebuild the Haar's route from the corridor door logs by turning
 * path tiles. The only route that holds together ends at Ankut prep.
 *
 * This file is shared by the page and by `server/api/haar-trail.post.ts`. The
 * server re-traces whatever board the browser sends, and only a board whose
 * route reaches Ankut prep gets the evidence back — the image and the chain of
 * evidence are never in the client bundle, so they cannot be found by viewing
 * the source.
 *
 * The board is hand-made, not random, so every team gets the same puzzle and
 * the same difficulty. The only route from the staging area to Ankut prep is
 * the one in `HAAR_TRAIL_SOLUTION`; the decoy route to the Security post is
 * nearly complete on the starting board, on purpose.
 */

/** Where the trick lives: the navigation link that opens the puzzle. */
export const HAAR_TRAIL_TRIGGER_HREF = '/seva'
export const HAAR_TRAIL_TRIGGER_TAPS = 4
/** Generous, because the first tap also loads the Seva page. */
export const HAAR_TRAIL_TRIGGER_WINDOW_MS = 2000
/** sessionStorage key set by the trigger; the page 404s without it. */
export const HAAR_TRAIL_UNLOCK_KEY = 'bhaktiras-haar-trail'
/**
 * sessionStorage key holding a solved board, so a team that leaves the page
 * after solving goes straight back to the evidence. The game master's reset
 * clears it.
 */
export const HAAR_TRAIL_SOLVED_KEY = 'bhaktiras-haar-trail-solved'

export const HAAR_TRAIL_SIZE = 5

// Openings as a bitmask, clockwise from north.
export const N = 1
export const E = 2
export const S = 4
export const W = 8

export type HaarTileKind = 'straight' | 'corner' | 'tee' | 'end'

/** Openings with no rotation applied. */
export const HAAR_TILE_BASE: Record<HaarTileKind, number> = {
  straight: N | S,
  corner: N | E,
  tee: N | E | S,
  end: N
}

export type HaarDoorId = 'ankut' | 'security'

export interface HaarDoor {
  id: HaarDoorId
  row: number
  col: number
  /** The side of that edge tile the door sits against. */
  side: number
  label: string
}

/** The route starts at the top of this tile, under the staging area. */
export const HAAR_TRAIL_START = { row: 0, col: 1 }

export const HAAR_TRAIL_DOORS: HaarDoor[] = [
  { id: 'ankut', row: 4, col: 3, side: S, label: 'Ankut prep' },
  { id: 'security', row: 3, col: 0, side: W, label: 'Security post' }
]

/** The door the Haar actually went through. */
export const HAAR_TRAIL_GOAL: HaarDoorId = 'ankut'

/** Row by row. */
export const HAAR_TRAIL_TILES: HaarTileKind[] = [
  'corner', 'straight', 'end', 'tee', 'corner',
  'straight', 'straight', 'corner', 'straight', 'corner',
  'corner', 'corner', 'corner', 'tee', 'straight',
  'corner', 'straight', 'end', 'corner', 'corner',
  'end', 'corner', 'tee', 'straight', 'straight'
]

/** Quarter turns clockwise on the starting board. */
export const HAAR_TRAIL_START_ROTATIONS: number[] = [
  2, 0, 1, 2, 1,
  0, 1, 3, 0, 0,
  1, 3, 1, 0, 1,
  0, 1, 3, 3, 1,
  0, 2, 1, 1, 0
]

/** The real route, staging area to Ankut prep, with the openings each tile needs. Hints walk it in order. */
export const HAAR_TRAIL_SOLUTION: Array<{ index: number; openings: number }> = [
  { index: 1, openings: N | S },
  { index: 6, openings: N | S },
  { index: 11, openings: N | E },
  { index: 12, openings: W | N },
  { index: 7, openings: S | E },
  { index: 8, openings: W | E },
  { index: 9, openings: W | S },
  { index: 14, openings: N | S },
  { index: 19, openings: N | W },
  { index: 18, openings: E | S },
  { index: 23, openings: N | S }
]

export function rotateOpenings(mask: number, turns: number): number {
  const t = ((turns % 4) + 4) % 4
  return ((mask << t) | (mask >> (4 - t))) & 15
}

export function tileOpenings(index: number, turns: number): number {
  return rotateOpenings(HAAR_TILE_BASE[HAAR_TRAIL_TILES[index]], turns)
}

/** Fewest clockwise turns from `turns` that give the tile `openings`, or null if it never can. */
export function turnsToReach(index: number, turns: number, openings: number): number | null {
  for (let extra = 0; extra < 4; extra++) {
    if (tileOpenings(index, turns + extra) === openings) return extra
  }
  return null
}

const STEPS: Array<[side: number, opposite: number, dRow: number, dCol: number]> = [
  [N, S, -1, 0],
  [E, W, 0, 1],
  [S, N, 1, 0],
  [W, E, 0, -1]
]

export interface HaarTrace {
  /** Tile indexes joined to the staging area. */
  lit: Set<number>
  /** Doors the joined route opens onto. */
  reached: Set<HaarDoorId>
}

/** Follows the route from the staging area through every pair of facing openings. */
export function traceHaarTrail(rotations: number[]): HaarTrace {
  const size = HAAR_TRAIL_SIZE
  const lit = new Set<number>()
  const reached = new Set<HaarDoorId>()
  const startIndex = HAAR_TRAIL_START.row * size + HAAR_TRAIL_START.col
  if (!(tileOpenings(startIndex, rotations[startIndex]) & N)) return { lit, reached }

  const queue = [startIndex]
  lit.add(startIndex)
  while (queue.length) {
    const index = queue.shift()!
    const row = Math.floor(index / size)
    const col = index % size
    const open = tileOpenings(index, rotations[index])

    for (const door of HAAR_TRAIL_DOORS) {
      if (door.row === row && door.col === col && (open & door.side)) reached.add(door.id)
    }

    for (const [side, opposite, dRow, dCol] of STEPS) {
      if (!(open & side)) continue
      const r = row + dRow
      const c = col + dCol
      if (r < 0 || r >= size || c < 0 || c >= size) continue
      const next = r * size + c
      if (lit.has(next) || !(tileOpenings(next, rotations[next]) & opposite)) continue
      lit.add(next)
      queue.push(next)
    }
  }
  return { lit, reached }
}

/** Strict shape check for a board posted to the server. */
export function isHaarBoard(value: unknown): value is number[] {
  return Array.isArray(value)
    && value.length === HAAR_TRAIL_SIZE * HAAR_TRAIL_SIZE
    && value.every(turns => Number.isInteger(turns) && turns >= 0 && turns <= 3)
}

/** Room 2, puzzle 5's chain of evidence, handed over with the image once the route is rebuilt. */
export interface HaarChainOfEvidence {
  /** True while the content is a stand-in; the page marks it as such. */
  placeholder: boolean
  title: string
  intro: string
  entries: Array<{ time: string; text: string }>
}

/** What `/api/haar-trail` returns for a solved board. */
export interface HaarEvidence {
  /** A data: URL, so the image never has a public address of its own. */
  image: string
  chain: HaarChainOfEvidence
}
