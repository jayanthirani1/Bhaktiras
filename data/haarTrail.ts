/**
 * The Haar Trail — the escape-room puzzle hidden behind the Decoration Team card
 * on /seva (four quick taps). Ghanshyam Maharaj's haar has been stolen; petals
 * fell from it as the thief ran. Players turn path tiles to rebuild the petal
 * trail from the sinhasan, and the trail that holds together ends at the door
 * the thief used.
 *
 * This file is shared by the page and by `server/api/haar-trail.post.ts`. The
 * server re-traces whatever board the browser sends, and only a board whose
 * trail reaches the kitchen door gets the evidence image back — the image is
 * never in the client bundle, so it cannot be found by viewing the source.
 *
 * The board is hand-made, not random, so every team gets the same puzzle and
 * the same difficulty. The only route from the sinhasan to the kitchen is the
 * one in `HAAR_TRAIL_SOLUTION`; the decoy route to the Decoration store is
 * nearly complete on the starting board, on purpose.
 */

/** Where the trick lives: the seva team card that opens the puzzle. */
export const HAAR_TRAIL_TRIGGER_TEAM = 'decoration'
export const HAAR_TRAIL_TRIGGER_TAPS = 4
export const HAAR_TRAIL_TRIGGER_WINDOW_MS = 1500
/** sessionStorage key set by the trigger; the page 404s without it. */
export const HAAR_TRAIL_UNLOCK_KEY = 'bhaktiras-haar-trail'

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

export type HaarDoorId = 'kitchen' | 'decoration'

export interface HaarDoor {
  id: HaarDoorId
  row: number
  col: number
  /** The side of that edge tile the door sits against. */
  side: number
  label: string
}

/** The trail starts at the top of this tile, under the sinhasan. */
export const HAAR_TRAIL_START = { row: 0, col: 1 }

export const HAAR_TRAIL_DOORS: HaarDoor[] = [
  { id: 'kitchen', row: 4, col: 3, side: S, label: 'Kitchen' },
  { id: 'decoration', row: 3, col: 0, side: W, label: 'Decoration store' }
]

/** The door the haar actually went through. */
export const HAAR_TRAIL_GOAL: HaarDoorId = 'kitchen'

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

/** The real trail, sinhasan to kitchen, with the openings each tile needs. Hints walk it in order. */
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
  /** Tile indexes joined to the sinhasan. */
  lit: Set<number>
  /** Doors the joined trail opens onto. */
  reached: Set<HaarDoorId>
}

/** Follows the petals from the sinhasan through every pair of facing openings. */
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
