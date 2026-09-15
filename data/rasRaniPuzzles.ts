export interface RasRegion {
  id: string
  name: string
  color: string
  meaning?: string
}

export type RasRaniDifficulty = 'easy' | 'medium' | 'hard'

export interface RasRaniPuzzle {
  id: string
  dateId?: string | null
  title: string
  gridSize: number
  /** Player-facing tier used for the daily Easy → Medium → Difficult rotation. */
  difficulty: RasRaniDifficulty
  /** Grid of region IDs - each cell belongs to a region */
  regionGrid: string[][]
  /** Region definitions with colors and meanings */
  regions: RasRegion[]
  /** Solution: array of [row, col] for each queen/droplet position */
  solution: [number, number][]
  published?: boolean
}

export const RAS_RANI_DIFFICULTY_LABEL: Record<RasRaniDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Difficult'
}

export const RAS_RANI_DIFFICULTY_ORDER: RasRaniDifficulty[] = ['easy', 'medium', 'hard']

export const RAS_REGIONS: RasRegion[] = [
  { id: 'shanti', name: 'Shanti', color: 'bg-sky-200', meaning: 'Peace' },
  { id: 'vatsalya', name: 'Vatsalya', color: 'bg-pink-200', meaning: 'Parental love' },
  { id: 'madhurya', name: 'Madhurya', color: 'bg-amber-200', meaning: 'Sweetness' },
  { id: 'dasya', name: 'Dasya', color: 'bg-emerald-200', meaning: 'Servitude' },
  { id: 'sakhya', name: 'Sakhya', color: 'bg-violet-200', meaning: 'Friendship' },
  { id: 'aishwarya', name: 'Aishwarya', color: 'bg-orange-200', meaning: 'Majesty' },
  { id: 'karuna', name: 'Karuna', color: 'bg-cyan-200', meaning: 'Compassion' },
  { id: 'bhakti', name: 'Bhakti', color: 'bg-rose-200', meaning: 'Devotion' },
  { id: 'prema', name: 'Prema', color: 'bg-red-200', meaning: 'Divine love' },
  { id: 'ananda', name: 'Ananda', color: 'bg-yellow-200', meaning: 'Bliss' },
  { id: 'shraddha', name: 'Shraddha', color: 'bg-lime-200', meaning: 'Faith' },
  { id: 'seva', name: 'Seva', color: 'bg-teal-200', meaning: 'Service' }
]

export const RAS_REGION_FILLS: Record<string, string> = {
  shanti: '#bae6fd',
  vatsalya: '#fbcfe8',
  madhurya: '#fde68a',
  dasya: '#a7f3d0',
  sakhya: '#ddd6fe',
  aishwarya: '#fed7aa',
  karuna: '#a5f3fc',
  bhakti: '#fecdd3',
  prema: '#fecaca',
  ananda: '#fef08a',
  shraddha: '#d9f99d',
  seva: '#99f6e4'
}

function regionsFor(ids: string[]) {
  return RAS_REGIONS.filter(r => ids.includes(r.id))
}

/** Smallest colour region on the board — used to reject giveaway 1-cell shapes. */
export function rasRaniMinRegionSize(regionGrid: string[][]): number {
  const sizes = new Map<string, number>()
  for (const row of regionGrid) {
    for (const id of row) sizes.set(id, (sizes.get(id) || 0) + 1)
  }
  const counts = [...sizes.values()]
  return counts.length ? Math.min(...counts) : 0
}

export function inferRasRaniDifficulty(gridSize: number): RasRaniDifficulty {
  if (gridSize <= 7) return 'easy'
  if (gridSize <= 9) return 'medium'
  return 'hard'
}

export const RAS_RANI_PUZZLES: RasRaniPuzzle[] = [
{
    id: 'ras-rani-1',
    dateId: null,
    title: 'Seven Rasas',
    gridSize: 7,
    difficulty: 'easy',
    regionGrid: [
      ['shanti', 'shanti', 'shanti', 'shanti', 'shanti', 'shanti', 'shanti'],
      ['shanti', 'vatsalya', 'vatsalya', 'vatsalya', 'shanti', 'shanti', 'madhurya'],
      ['vatsalya', 'vatsalya', 'vatsalya', 'vatsalya', 'madhurya', 'shanti', 'madhurya'],
      ['sakhya', 'dasya', 'dasya', 'vatsalya', 'madhurya', 'madhurya', 'madhurya'],
      ['sakhya', 'sakhya', 'karuna', 'vatsalya', 'madhurya', 'madhurya', 'madhurya'],
      ['sakhya', 'sakhya', 'karuna', 'vatsalya', 'aishwarya', 'madhurya', 'madhurya'],
      ['karuna', 'karuna', 'karuna', 'vatsalya', 'aishwarya', 'aishwarya', 'aishwarya']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna']),
    solution: [[0, 5], [1, 3], [2, 6], [3, 2], [4, 0], [5, 4], [6, 1]],
    published: true
  },
  {
    id: 'ras-rani-2',
    dateId: null,
    title: 'Nectar Garden',
    gridSize: 7,
    difficulty: 'easy',
    regionGrid: [
      ['madhurya', 'madhurya', 'shanti', 'shanti', 'shanti', 'shanti', 'vatsalya'],
      ['madhurya', 'madhurya', 'madhurya', 'shanti', 'shanti', 'shanti', 'vatsalya'],
      ['sakhya', 'madhurya', 'madhurya', 'madhurya', 'dasya', 'dasya', 'dasya'],
      ['sakhya', 'sakhya', 'madhurya', 'madhurya', 'dasya', 'aishwarya', 'aishwarya'],
      ['sakhya', 'sakhya', 'karuna', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya'],
      ['sakhya', 'sakhya', 'karuna', 'aishwarya', 'aishwarya', 'karuna', 'karuna'],
      ['sakhya', 'sakhya', 'karuna', 'karuna', 'karuna', 'karuna', 'karuna']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna']),
    solution: [[0, 2], [1, 6], [2, 1], [3, 4], [4, 0], [5, 3], [6, 5]],
    published: true
  },
  {
    id: 'ras-rani-3',
    dateId: null,
    title: 'Morning Collection',
    gridSize: 7,
    difficulty: 'easy',
    regionGrid: [
      ['madhurya', 'shanti', 'shanti', 'sakhya', 'sakhya', 'vatsalya', 'vatsalya'],
      ['madhurya', 'madhurya', 'shanti', 'sakhya', 'sakhya', 'vatsalya', 'dasya'],
      ['madhurya', 'madhurya', 'madhurya', 'sakhya', 'dasya', 'dasya', 'dasya'],
      ['madhurya', 'madhurya', 'sakhya', 'sakhya', 'dasya', 'aishwarya', 'aishwarya'],
      ['madhurya', 'karuna', 'sakhya', 'sakhya', 'sakhya', 'aishwarya', 'aishwarya'],
      ['madhurya', 'karuna', 'karuna', 'karuna', 'karuna', 'aishwarya', 'aishwarya'],
      ['madhurya', 'madhurya', 'karuna', 'karuna', 'karuna', 'karuna', 'karuna']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna']),
    solution: [[0, 1], [1, 5], [2, 0], [3, 4], [4, 2], [5, 6], [6, 3]],
    published: true
  },

  {
    id: 'ras-rani-4',
    dateId: null,
    title: 'Deepening Essence',
    gridSize: 8,
    difficulty: 'medium',
    regionGrid: [
      ['shanti', 'shanti', 'shanti', 'shanti', 'vatsalya', 'vatsalya', 'dasya', 'dasya'],
      ['shanti', 'shanti', 'shanti', 'shanti', 'vatsalya', 'vatsalya', 'vatsalya', 'dasya'],
      ['shanti', 'shanti', 'madhurya', 'shanti', 'vatsalya', 'vatsalya', 'dasya', 'dasya'],
      ['madhurya', 'madhurya', 'madhurya', 'madhurya', 'vatsalya', 'vatsalya', 'vatsalya', 'dasya'],
      ['aishwarya', 'madhurya', 'madhurya', 'madhurya', 'vatsalya', 'sakhya', 'dasya', 'dasya'],
      ['aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'sakhya', 'sakhya', 'sakhya', 'dasya'],
      ['karuna', 'aishwarya', 'aishwarya', 'bhakti', 'sakhya', 'bhakti', 'sakhya', 'dasya'],
      ['karuna', 'karuna', 'karuna', 'bhakti', 'bhakti', 'bhakti', 'sakhya', 'dasya']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna', 'bhakti']),
    solution: [[0, 1], [1, 6], [2, 2], [3, 7], [4, 5], [5, 3], [6, 0], [7, 4]],
    published: true
  },
  {
    id: 'ras-rani-5',
    dateId: null,
    title: 'Ocean of Bliss',
    gridSize: 8,
    difficulty: 'medium',
    regionGrid: [
      ['madhurya', 'madhurya', 'madhurya', 'madhurya', 'vatsalya', 'vatsalya', 'vatsalya', 'shanti'],
      ['madhurya', 'madhurya', 'madhurya', 'vatsalya', 'vatsalya', 'vatsalya', 'shanti', 'shanti'],
      ['madhurya', 'madhurya', 'madhurya', 'vatsalya', 'vatsalya', 'sakhya', 'sakhya', 'sakhya'],
      ['madhurya', 'aishwarya', 'dasya', 'vatsalya', 'dasya', 'dasya', 'sakhya', 'sakhya'],
      ['madhurya', 'aishwarya', 'dasya', 'dasya', 'dasya', 'sakhya', 'sakhya', 'sakhya'],
      ['aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'dasya', 'sakhya', 'sakhya', 'bhakti'],
      ['aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'karuna', 'karuna', 'bhakti', 'bhakti'],
      ['aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'karuna', 'bhakti', 'bhakti']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna', 'bhakti']),
    solution: [[0, 7], [1, 3], [2, 0], [3, 2], [4, 5], [5, 1], [6, 4], [7, 6]],
    published: true
  },

  {
    id: 'ras-rani-6',
    dateId: null,
    title: 'Sacred Journey',
    gridSize: 9,
    difficulty: 'medium',
    regionGrid: [
      ['shanti', 'shanti', 'shanti', 'madhurya', 'madhurya', 'vatsalya', 'vatsalya', 'vatsalya', 'vatsalya'],
      ['madhurya', 'shanti', 'shanti', 'madhurya', 'madhurya', 'vatsalya', 'dasya', 'vatsalya', 'vatsalya'],
      ['madhurya', 'madhurya', 'madhurya', 'madhurya', 'dasya', 'dasya', 'dasya', 'vatsalya', 'dasya'],
      ['madhurya', 'madhurya', 'madhurya', 'madhurya', 'madhurya', 'dasya', 'dasya', 'dasya', 'dasya'],
      ['madhurya', 'sakhya', 'sakhya', 'madhurya', 'madhurya', 'dasya', 'dasya', 'dasya', 'dasya'],
      ['sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'aishwarya', 'dasya', 'dasya', 'dasya'],
      ['sakhya', 'sakhya', 'karuna', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'dasya', 'dasya'],
      ['karuna', 'karuna', 'karuna', 'prema', 'aishwarya', 'prema', 'aishwarya', 'aishwarya', 'bhakti'],
      ['karuna', 'karuna', 'karuna', 'prema', 'prema', 'prema', 'prema', 'bhakti', 'bhakti']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna', 'bhakti', 'prema']),
    solution: [[0, 0], [1, 7], [2, 3], [3, 6], [4, 1], [5, 5], [6, 2], [7, 8], [8, 4]],
    published: true
  },
  {
    id: 'ras-rani-7',
    dateId: null,
    title: 'Colour of Bhakti',
    gridSize: 9,
    difficulty: 'medium',
    regionGrid: [
      ['madhurya', 'madhurya', 'madhurya', 'madhurya', 'shanti', 'shanti', 'shanti', 'shanti', 'vatsalya'],
      ['madhurya', 'madhurya', 'madhurya', 'shanti', 'shanti', 'shanti', 'shanti', 'vatsalya', 'vatsalya'],
      ['karuna', 'madhurya', 'dasya', 'dasya', 'dasya', 'dasya', 'dasya', 'sakhya', 'sakhya'],
      ['karuna', 'aishwarya', 'aishwarya', 'aishwarya', 'dasya', 'aishwarya', 'sakhya', 'sakhya', 'sakhya'],
      ['karuna', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'sakhya'],
      ['karuna', 'karuna', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'prema', 'prema'],
      ['karuna', 'bhakti', 'bhakti', 'bhakti', 'bhakti', 'aishwarya', 'aishwarya', 'prema', 'prema'],
      ['karuna', 'karuna', 'karuna', 'bhakti', 'bhakti', 'bhakti', 'bhakti', 'prema', 'prema'],
      ['karuna', 'karuna', 'bhakti', 'bhakti', 'prema', 'prema', 'prema', 'prema', 'prema']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna', 'bhakti', 'prema']),
    solution: [[0, 5], [1, 7], [2, 1], [3, 4], [4, 8], [5, 2], [6, 0], [7, 3], [8, 6]],
    published: true
  },

  {
    id: 'ras-rani-8',
    dateId: null,
    title: 'Intense Collection',
    gridSize: 10,
    difficulty: 'hard',
    regionGrid: [
      ['vatsalya', 'vatsalya', 'vatsalya', 'shanti', 'shanti', 'shanti', 'madhurya', 'madhurya', 'madhurya', 'madhurya'],
      ['vatsalya', 'vatsalya', 'dasya', 'shanti', 'shanti', 'dasya', 'madhurya', 'madhurya', 'madhurya', 'sakhya'],
      ['vatsalya', 'vatsalya', 'dasya', 'dasya', 'dasya', 'dasya', 'madhurya', 'madhurya', 'sakhya', 'sakhya'],
      ['vatsalya', 'dasya', 'dasya', 'karuna', 'karuna', 'madhurya', 'madhurya', 'sakhya', 'sakhya', 'sakhya'],
      ['vatsalya', 'dasya', 'karuna', 'karuna', 'aishwarya', 'aishwarya', 'madhurya', 'sakhya', 'ananda', 'sakhya'],
      ['vatsalya', 'dasya', 'karuna', 'karuna', 'aishwarya', 'aishwarya', 'aishwarya', 'sakhya', 'ananda', 'sakhya'],
      ['bhakti', 'karuna', 'karuna', 'karuna', 'karuna', 'aishwarya', 'ananda', 'ananda', 'ananda', 'ananda'],
      ['bhakti', 'karuna', 'karuna', 'karuna', 'aishwarya', 'aishwarya', 'ananda', 'ananda', 'ananda', 'ananda'],
      ['bhakti', 'karuna', 'prema', 'prema', 'aishwarya', 'aishwarya', 'ananda', 'ananda', 'ananda', 'ananda'],
      ['prema', 'prema', 'prema', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'ananda', 'ananda', 'ananda']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna', 'bhakti', 'prema', 'ananda']),
    solution: [[0, 5], [1, 1], [2, 7], [3, 2], [4, 9], [5, 6], [6, 4], [7, 0], [8, 3], [9, 8]],
    published: true
  },
  {
    id: 'ras-rani-9',
    dateId: null,
    title: 'Majestic Path',
    gridSize: 10,
    difficulty: 'hard',
    regionGrid: [
      ['dasya', 'dasya', 'dasya', 'dasya', 'madhurya', 'madhurya', 'shanti', 'shanti', 'shanti', 'vatsalya'],
      ['dasya', 'dasya', 'dasya', 'dasya', 'madhurya', 'madhurya', 'shanti', 'shanti', 'vatsalya', 'vatsalya'],
      ['dasya', 'dasya', 'madhurya', 'madhurya', 'madhurya', 'madhurya', 'shanti', 'shanti', 'shanti', 'vatsalya'],
      ['dasya', 'dasya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'karuna', 'karuna', 'shanti', 'shanti'],
      ['dasya', 'dasya', 'dasya', 'sakhya', 'sakhya', 'sakhya', 'karuna', 'karuna', 'karuna', 'shanti'],
      ['aishwarya', 'aishwarya', 'aishwarya', 'sakhya', 'sakhya', 'sakhya', 'karuna', 'karuna', 'karuna', 'bhakti'],
      ['aishwarya', 'aishwarya', 'sakhya', 'sakhya', 'sakhya', 'karuna', 'karuna', 'karuna', 'karuna', 'bhakti'],
      ['aishwarya', 'sakhya', 'sakhya', 'sakhya', 'karuna', 'karuna', 'karuna', 'karuna', 'ananda', 'bhakti'],
      ['aishwarya', 'aishwarya', 'sakhya', 'sakhya', 'prema', 'prema', 'karuna', 'karuna', 'ananda', 'bhakti'],
      ['prema', 'prema', 'prema', 'prema', 'prema', 'ananda', 'ananda', 'ananda', 'ananda', 'bhakti']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna', 'bhakti', 'prema', 'ananda']),
    solution: [[0, 6], [1, 8], [2, 2], [3, 0], [4, 3], [5, 1], [6, 5], [7, 9], [8, 4], [9, 7]],
    published: true
  },

  {
    id: 'ras-rani-10',
    dateId: null,
    title: 'Hard Nectar Path',
    gridSize: 11,
    difficulty: 'hard',
    regionGrid: [
      ['vatsalya', 'vatsalya', 'vatsalya', 'vatsalya', 'vatsalya', 'shanti', 'shanti', 'shanti', 'shanti', 'shanti', 'dasya'],
      ['vatsalya', 'vatsalya', 'vatsalya', 'vatsalya', 'vatsalya', 'vatsalya', 'shanti', 'madhurya', 'madhurya', 'dasya', 'dasya'],
      ['vatsalya', 'vatsalya', 'vatsalya', 'vatsalya', 'shanti', 'shanti', 'shanti', 'madhurya', 'madhurya', 'madhurya', 'dasya'],
      ['vatsalya', 'vatsalya', 'sakhya', 'vatsalya', 'vatsalya', 'madhurya', 'madhurya', 'madhurya', 'dasya', 'dasya', 'dasya'],
      ['vatsalya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'madhurya', 'madhurya', 'madhurya', 'dasya'],
      ['aishwarya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'dasya', 'dasya', 'dasya', 'dasya'],
      ['aishwarya', 'aishwarya', 'aishwarya', 'sakhya', 'sakhya', 'karuna', 'karuna', 'bhakti', 'dasya', 'dasya', 'dasya'],
      ['aishwarya', 'aishwarya', 'prema', 'sakhya', 'sakhya', 'karuna', 'karuna', 'bhakti', 'dasya', 'dasya', 'dasya'],
      ['ananda', 'aishwarya', 'prema', 'prema', 'prema', 'prema', 'karuna', 'bhakti', 'bhakti', 'dasya', 'dasya'],
      ['ananda', 'aishwarya', 'ananda', 'prema', 'prema', 'prema', 'karuna', 'karuna', 'bhakti', 'bhakti', 'bhakti'],
      ['ananda', 'ananda', 'ananda', 'shraddha', 'shraddha', 'shraddha', 'shraddha', 'bhakti', 'bhakti', 'bhakti', 'bhakti']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna', 'bhakti', 'prema', 'ananda', 'shraddha']),
    solution: [[0, 9], [1, 1], [2, 8], [3, 10], [4, 3], [5, 0], [6, 5], [7, 7], [8, 4], [9, 2], [10, 6]],
    published: true
  },
  {
    id: 'ras-rani-11',
    dateId: null,
    title: 'Difficult Ras',
    gridSize: 11,
    difficulty: 'hard',
    regionGrid: [
      ['madhurya', 'madhurya', 'shanti', 'shanti', 'shanti', 'shanti', 'vatsalya', 'vatsalya', 'vatsalya', 'vatsalya', 'vatsalya'],
      ['madhurya', 'madhurya', 'dasya', 'dasya', 'aishwarya', 'shanti', 'vatsalya', 'vatsalya', 'vatsalya', 'vatsalya', 'vatsalya'],
      ['madhurya', 'madhurya', 'dasya', 'dasya', 'aishwarya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya'],
      ['dasya', 'dasya', 'dasya', 'aishwarya', 'aishwarya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya'],
      ['dasya', 'dasya', 'aishwarya', 'aishwarya', 'aishwarya', 'sakhya', 'prema', 'prema', 'prema', 'prema', 'prema'],
      ['karuna', 'karuna', 'aishwarya', 'aishwarya', 'aishwarya', 'prema', 'prema', 'prema', 'prema', 'prema', 'prema'],
      ['karuna', 'karuna', 'aishwarya', 'bhakti', 'bhakti', 'bhakti', 'prema', 'prema', 'prema', 'prema', 'prema'],
      ['karuna', 'karuna', 'aishwarya', 'bhakti', 'bhakti', 'bhakti', 'bhakti', 'prema', 'prema', 'prema', 'prema'],
      ['karuna', 'bhakti', 'bhakti', 'bhakti', 'bhakti', 'shraddha', 'shraddha', 'shraddha', 'prema', 'ananda', 'prema'],
      ['karuna', 'shraddha', 'bhakti', 'bhakti', 'bhakti', 'shraddha', 'shraddha', 'shraddha', 'shraddha', 'ananda', 'ananda'],
      ['karuna', 'shraddha', 'shraddha', 'shraddha', 'shraddha', 'shraddha', 'shraddha', 'shraddha', 'shraddha', 'shraddha', 'ananda']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna', 'bhakti', 'prema', 'ananda', 'shraddha']),
    solution: [[0, 4], [1, 9], [2, 0], [3, 2], [4, 5], [5, 3], [6, 1], [7, 6], [8, 8], [9, 10], [10, 7]],
    published: true
  }
]

/** Cycles Easy → Medium → Difficult by UK calendar day. */
export function rasRaniDifficultyForDate(dateId: string): RasRaniDifficulty {
  const [year, month, day] = dateId.split('-').map(Number)
  if (!year || !month || !day) return 'easy'
  const ordinal = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
  return RAS_RANI_DIFFICULTY_ORDER[((ordinal % 3) + 3) % 3]
}

export function getRasRaniPuzzleForDate(dateId: string, bank: RasRaniPuzzle[] = RAS_RANI_PUZZLES): RasRaniPuzzle {
  const scheduled = bank.find(p => p.dateId === dateId && p.published !== false)
  if (scheduled) return scheduled

  const published = bank.filter(p => p.published !== false && !p.dateId)
  if (!published.length) return bank[0] || RAS_RANI_PUZZLES[0]

  const difficulty = rasRaniDifficultyForDate(dateId)
  const pool = published.filter(p => (p.difficulty || inferRasRaniDifficulty(p.gridSize)) === difficulty)
  const choices = pool.length ? pool : published

  const seed = [...dateId].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 2166136261)
  return choices[seed % choices.length]
}

export function getRegionColor(regionId: string): string {
  const region = RAS_REGIONS.find(r => r.id === regionId)
  return region?.color ?? 'bg-stone-200'
}

export function getRegionFill(regionId: string): string {
  return RAS_REGION_FILLS[regionId] || '#e7e5e4'
}

export function getRegionName(regionId: string): string {
  const region = RAS_REGIONS.find(r => r.id === regionId)
  return region?.name ?? regionId
}

export function getRegionMeaning(regionId: string): string {
  const region = RAS_REGIONS.find(r => r.id === regionId)
  return region?.meaning ?? ''
}
