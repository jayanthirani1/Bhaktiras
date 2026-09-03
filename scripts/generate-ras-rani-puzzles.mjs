/**
 * Author Ras Rani puzzles that are actually hard, and prove it before they ship.
 *
 *   node scripts/generate-ras-rani-puzzles.mjs [--size=8] [--count=2] [--seed=1] [--tier=hard]
 *
 * Prints TypeScript ready to paste into `data/rasRaniPuzzles.ts`.
 *
 * Every candidate has to clear three bars, because the play page trusts all
 * three: `isPuzzleSolved` accepts *any* legal arrangement (so a second solution
 * would let two players "win" different boards), and `getHint` reads the stored
 * solution (so it must be the only one).
 *
 *   1. legal    — one drop per row, column and region, none touching
 *   2. unique   — exactly one arrangement satisfies the rules
 *   3. hard     — plain singles cannot finish it unaided
 */

const RASA_IDS = [
  'shanti',
  'vatsalya',
  'madhurya',
  'dasya',
  'sakhya',
  'aishwarya',
  'karuna',
  'bhakti',
  'prema',
  'ananda'
]

function arg(name, fallback) {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : fallback
}

const SIZE = Number(arg('size', 8))
const COUNT = Number(arg('count', 2))
const TIER = String(arg('tier', 'hard'))
const SEED = Number(arg('seed', 1))

/** Seeded RNG so a regenerated bank is reproducible from the command line. */
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(SEED)

function shuffled(list) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const touching = (r1, c1, r2, c2) =>
  Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2)

/**
 * One drop per row and column with none touching. Only consecutive rows can
 * touch, so the column gap check is enough.
 */
function randomSolution(n) {
  const cols = []
  const used = new Set()
  const place = row => {
    if (row === n) return true
    for (const col of shuffled([...Array(n).keys()])) {
      if (used.has(col)) continue
      if (row > 0 && Math.abs(col - cols[row - 1]) <= 1) continue
      cols[row] = col
      used.add(col)
      if (place(row + 1)) return true
      used.delete(col)
    }
    return false
  }
  return place(0) ? cols.map((c, r) => [r, c]) : null
}

/**
 * Grow one connected region out from each drop until the board is partitioned.
 * Seeding on the solution guarantees the "one drop per region" rule is
 * satisfiable; the random frontier is what makes the shapes irregular.
 */
function growRegions(n, solution) {
  const grid = Array.from({ length: n }, () => Array(n).fill(-1))
  const frontiers = solution.map(([r, c], index) => {
    grid[r][c] = index
    return [[r, c]]
  })

  let remaining = n * n - n
  while (remaining > 0) {
    let progressed = false
    for (const index of shuffled([...Array(n).keys()])) {
      const frontier = frontiers[index]
      if (!frontier.length) continue
      // Uneven bursts stop every region becoming the same tidy blob.
      const burst = 1 + Math.floor(rand() * 3)
      for (let step = 0; step < burst && frontier.length && remaining > 0; step++) {
        const pick = Math.floor(rand() * frontier.length)
        const [r, c] = frontier[pick]
        const open = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(
          ([nr, nc]) => nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] === -1
        )
        if (!open.length) {
          frontier.splice(pick, 1)
          continue
        }
        const [nr, nc] = open[Math.floor(rand() * open.length)]
        grid[nr][nc] = index
        frontier.push([nr, nc])
        remaining--
        progressed = true
      }
    }
    if (!progressed) return null
  }
  return grid
}

/** Every arrangement the rules allow, capped so a wide-open board bails early. */
function findSolutions(n, regionGrid, cap = 2) {
  const found = []
  const chosen = []
  const cols = new Set()
  const regions = new Set()

  const walk = row => {
    if (found.length >= cap) return
    if (row === n) {
      found.push([...chosen])
      return
    }
    for (let col = 0; col < n; col++) {
      if (cols.has(col)) continue
      if (row > 0 && Math.abs(col - chosen[row - 1][1]) <= 1) continue
      const region = regionGrid[row][col]
      if (regions.has(region)) continue
      chosen.push([row, col])
      cols.add(col)
      regions.add(region)
      walk(row + 1)
      chosen.pop()
      cols.delete(col)
      regions.delete(region)
      if (found.length >= cap) return
    }
  }

  walk(0)
  return found
}

/** Cells of one region still hang together after `skip` is taken away. */
function staysConnected(regionIndexes, index, skip) {
  const n = regionIndexes.length
  const cells = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (regionIndexes[r][c] === index && !(r === skip[0] && c === skip[1])) cells.push([r, c])
    }
  }
  if (cells.length < 2) return false

  const seen = new Set([`${cells[0][0]},${cells[0][1]}`])
  const queue = [cells[0]]
  while (queue.length) {
    const [r, c] = queue.pop()
    for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
      const key = `${nr},${nc}`
      if (seen.has(key)) continue
      if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue
      if (regionIndexes[nr][nc] !== index) continue
      if (nr === skip[0] && nc === skip[1]) continue
      seen.add(key)
      queue.push([nr, nc])
    }
  }
  return seen.size === cells.length
}

/**
 * Reshape regions until the intended arrangement is the only one.
 *
 * A rival arrangement dies the moment any one of its squares changes colour:
 * that colour then holds two of its drops. So repeatedly take a rival, move one
 * of its squares (never one the real answer uses) into a touching region, and
 * look again. Random shapes almost never come out unique on their own —
 * 200k tries at 8×8 produced none — so this pass is what makes big boards work.
 */
function enforceUniqueness(n, regionIndexes, solution) {
  const isAnswerCell = (r, c) => solution.some(([sr, sc]) => sr === r && sc === c)

  for (let pass = 0; pass < 400; pass++) {
    const regionGrid = regionIndexes.map(row => row.map(index => RASA_IDS[index]))
    const solutions = findSolutions(n, regionGrid, 2)
    if (solutions.length === 0) return null
    if (solutions.length === 1) return regionIndexes

    const rival = solutions.find(candidate =>
      candidate.some(([r, c]) => !isAnswerCell(r, c))
    )
    if (!rival) return null

    const movable = shuffled(rival.filter(([r, c]) => !isAnswerCell(r, c)))
    let moved = false
    for (const [r, c] of movable) {
      const from = regionIndexes[r][c]
      if (!staysConnected(regionIndexes, from, [r, c])) continue
      const neighbours = shuffled(
        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
          .filter(([nr, nc]) => nr >= 0 && nc >= 0 && nr < n && nc < n)
          .map(([nr, nc]) => regionIndexes[nr][nc])
          .filter(index => index !== from)
      )
      if (!neighbours.length) continue
      regionIndexes[r][c] = neighbours[0]
      moved = true
      break
    }
    if (!moved) return null
  }
  return null
}

/**
 * How far a patient solver gets without ever guessing.
 *
 * `singles` is the beginner's whole toolkit: a row, column or region with one
 * square left. `lines` adds the next step up — when a region's remaining
 * squares all sit in one row, no other square in that row can hold a drop.
 */
function solveByLogic(n, regionGrid, { lines }) {
  const open = Array.from({ length: n }, () => Array(n).fill(true))
  const placed = []

  const strike = (row, col) => {
    const region = regionGrid[row][col]
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (r === row && c === col) continue
        if (r === row || c === col || regionGrid[r][c] === region || touching(r, c, row, col)) {
          open[r][c] = false
        }
      }
    }
  }

  const cellsWhere = predicate => {
    const out = []
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (open[r][c] && !placed.some(([pr, pc]) => pr === r && pc === c) && predicate(r, c)) {
          out.push([r, c])
        }
      }
    }
    return out
  }

  const groups = []
  for (let r = 0; r < n; r++) groups.push(() => cellsWhere(row => row === r))
  for (let c = 0; c < n; c++) groups.push(() => cellsWhere((_, col) => col === c))
  for (const id of new Set(regionGrid.flat())) {
    groups.push(() => cellsWhere((r, c) => regionGrid[r][c] === id))
  }

  let working = true
  while (working && placed.length < n) {
    working = false

    for (const group of groups) {
      const cells = group()
      if (cells.length !== 1) continue
      const [r, c] = cells[0]
      if (placed.some(([pr, pc]) => pr === r && pc === c)) continue
      placed.push([r, c])
      strike(r, c)
      working = true
    }
    if (working) continue

    if (!lines) break

    for (const id of new Set(regionGrid.flat())) {
      const cells = cellsWhere((r, c) => regionGrid[r][c] === id)
      if (cells.length < 2) continue
      const rows = new Set(cells.map(([r]) => r))
      const cols = new Set(cells.map(([, c]) => c))
      if (rows.size === 1) {
        const row = [...rows][0]
        for (let c = 0; c < n; c++) {
          if (regionGrid[row][c] !== id && open[row][c]) {
            open[row][c] = false
            working = true
          }
        }
      }
      if (cols.size === 1) {
        const col = [...cols][0]
        for (let r = 0; r < n; r++) {
          if (regionGrid[r][col] !== id && open[r][col]) {
            open[r][col] = false
            working = true
          }
        }
      }
    }
  }

  return placed.length === n
}

function classify(n, regionGrid) {
  if (solveByLogic(n, regionGrid, { lines: false })) return 'easy'
  if (solveByLogic(n, regionGrid, { lines: true })) return 'medium'
  return 'hard'
}

const TIER_RANK = { easy: 0, medium: 1, hard: 2 }

/**
 * A board where one colour swallows half the grid and another is a single
 * square is unpleasant to look at and gives the tiny region away for free.
 */
function wellShaped(n, regionGrid) {
  const sizes = new Map()
  for (const row of regionGrid) {
    for (const id of row) sizes.set(id, (sizes.get(id) || 0) + 1)
  }
  const counts = [...sizes.values()]
  return Math.min(...counts) >= 3 && Math.max(...counts) <= n * 2
}

function generate(n, tier) {
  for (let attempt = 0; attempt < 20000; attempt++) {
    const solution = randomSolution(n)
    if (!solution) continue
    const grown = growRegions(n, solution)
    if (!grown) continue
    const regionIndexes = enforceUniqueness(n, grown, solution)
    if (!regionIndexes) continue
    const regionGrid = regionIndexes.map(row => row.map(index => RASA_IDS[index]))
    // Belt and braces: re-check against the untouched solver before shipping.
    const solutions = findSolutions(n, regionGrid, 2)
    if (solutions.length !== 1) continue
    if (new Set(regionGrid.flat()).size !== n) continue
    if (!wellShaped(n, regionGrid)) continue
    const rating = classify(n, regionGrid)
    if (TIER_RANK[rating] < TIER_RANK[tier]) continue
    return { solution, regionGrid, rating, attempt }
  }
  return null
}

function toTypeScript({ solution, regionGrid, rating }, n, index) {
  const ids = RASA_IDS.slice(0, n)
  const grid = regionGrid
    .map(row => `      [${row.map(id => `'${id}'`).join(', ')}]`)
    .join(',\n')
  const drops = solution.map(([r, c]) => `[${r}, ${c}]`).join(', ')
  return `  {
    id: 'ras-rani-${index}',
    dateId: null,
    title: 'TODO',
    gridSize: ${n},
    // ${rating}: verified single solution
    regionGrid: [
${grid}
    ],
    regions: regionsFor([${ids.map(id => `'${id}'`).join(', ')}]),
    solution: [${drops}],
    published: true
  },`
}

const results = []
for (let i = 0; i < COUNT; i++) {
  const puzzle = generate(SIZE, TIER)
  if (!puzzle) {
    console.error(`Could not find a ${TIER} ${SIZE}×${SIZE} puzzle — try another --seed.`)
    process.exit(1)
  }
  results.push(puzzle)
}

console.log(`// ${SIZE}×${SIZE} · tier ${TIER} · seed ${SEED}\n`)
results.forEach((puzzle, i) => console.log(toTypeScript(puzzle, SIZE, i + 1)))
