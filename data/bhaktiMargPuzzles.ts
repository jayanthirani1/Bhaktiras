export interface BhaktiMargWord {
  word: string
  meaning?: string
}

export interface BhaktiMargPuzzle {
  id: string
  dateId?: string | null
  title: string
  /** Grid size (rows x cols) */
  gridSize: number
  /** The grid of letters, row by row */
  grid: string[][]
  /** Wall positions as [row, col] that cannot be traversed */
  walls: [number, number][]
  /** The hidden words to find */
  words: BhaktiMargWord[]
  /** Path positions for each word: array of [row, col] tuples */
  paths: [number, number][][]
  published?: boolean
}

export const BHAKTI_MARG_PUZZLES: BhaktiMargPuzzle[] = [
  {
    id: 'bhakti-marg-1',
    dateId: null,
    title: 'Path of Devotion',
    gridSize: 4,
    grid: [
      ['S', 'E', 'V', 'A'],
      ['M', 'A', 'R', 'N'],
      ['U', 'R', 'T', 'I'],
      ['P', 'U', 'J', 'A']
    ],
    walls: [],
    words: [
      { word: 'SEVA', meaning: 'Selfless service' },
      { word: 'MARN', meaning: 'Remembrance' },
      { word: 'URTI', meaning: 'Sacred form' },
      { word: 'PUJA', meaning: 'Worship ritual' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3]],
      [[1, 0], [1, 1], [1, 2], [1, 3]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[3, 0], [3, 1], [3, 2], [3, 3]]
    ],
    published: true
  },
  {
    id: 'bhakti-marg-2',
    dateId: null,
    title: 'Winding Path',
    gridSize: 4,
    grid: [
      ['S', 'E', 'K', 'A'],
      ['A', 'V', 'I', 'T'],
      ['T', 'A', 'R', 'H'],
      ['S', 'N', 'G', 'A']
    ],
    walls: [],
    words: [
      { word: 'SEVA', meaning: 'Selfless service' },
      { word: 'KATHA', meaning: 'Divine discourse' },
      { word: 'SATSANG', meaning: 'Holy company' }
    ],
    paths: [
      [[0, 0], [0, 1], [1, 1], [1, 0]],
      [[0, 2], [0, 3], [1, 3], [2, 3], [2, 2]],
      [[2, 0], [3, 0], [3, 1], [1, 2], [2, 1], [3, 2], [3, 3]]
    ],
    published: true
  },
  {
    id: 'bhakti-marg-3',
    dateId: null,
    title: 'Divine Journey',
    gridSize: 4,
    grid: [
      ['D', 'A', 'R', 'S'],
      ['H', 'A', 'N', 'J'],
      ['P', 'A', 'T', 'H'],
      ['N', 'A', 'M', 'A']
    ],
    walls: [],
    words: [
      { word: 'DARSHAN', meaning: 'Divine vision' },
      { word: 'JAP', meaning: 'Chanting' },
      { word: 'NAMAH', meaning: 'Salutations' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3], [1, 2], [1, 1], [1, 0]],
      [[1, 3], [2, 2], [2, 1]],
      [[3, 0], [3, 1], [3, 2], [3, 3], [2, 3]]
    ],
    published: true
  },
  {
    id: 'bhakti-marg-4',
    dateId: null,
    title: 'Temple Path',
    gridSize: 4,
    grid: [
      ['M', 'A', 'N', 'D'],
      ['U', 'R', 'T', 'I'],
      ['P', 'R', 'A', 'S'],
      ['A', 'D', 'J', 'A']
    ],
    walls: [],
    words: [
      { word: 'MANDIR', meaning: 'Temple' },
      { word: 'MURTI', meaning: 'Sacred image' },
      { word: 'PRASAD', meaning: 'Blessed offering' },
      { word: 'JAP', meaning: 'Chanting' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [1, 2]],
      [[1, 0], [1, 1], [2, 1], [2, 2], [2, 3]],
      [[2, 0], [3, 0], [3, 1], [3, 3], [3, 2]],
      [[3, 2], [3, 3], [2, 3]]
    ],
    published: true
  },
  {
    id: 'bhakti-marg-5',
    dateId: null,
    title: 'Ocean of Love',
    gridSize: 4,
    grid: [
      ['P', 'R', 'E', 'M'],
      ['A', 'B', 'H', 'A'],
      ['K', 'T', 'I', 'V'],
      ['D', 'H', 'A', 'M']
    ],
    walls: [],
    words: [
      { word: 'PREM', meaning: 'Divine love' },
      { word: 'ABHAV', meaning: 'Absence of ego' },
      { word: 'BHAKTI', meaning: 'Devotion' },
      { word: 'DHAM', meaning: 'Divine abode' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3]],
      [[1, 0], [1, 1], [1, 2], [1, 3], [2, 3]],
      [[2, 0], [1, 1], [1, 2], [2, 2], [2, 1]],
      [[3, 0], [3, 1], [3, 2], [3, 3]]
    ],
    published: true
  },
  {
    id: 'bhakti-marg-6',
    dateId: null,
    title: 'Sacred Spiral',
    gridSize: 4,
    grid: [
      ['K', 'I', 'R', 'T'],
      ['A', 'S', 'E', 'A'],
      ['T', 'N', 'V', 'N'],
      ['H', 'A', 'G', 'S']
    ],
    walls: [],
    words: [
      { word: 'KIRTAN', meaning: 'Devotional singing' },
      { word: 'SEVA', meaning: 'Selfless service' },
      { word: 'SATSANG', meaning: 'Holy company' },
      { word: 'KATH', meaning: 'Story/discourse' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3]],
      [[1, 1], [1, 2], [2, 2], [1, 0]],
      [[3, 3], [3, 2], [2, 1], [3, 1], [3, 0], [2, 0]],
      [[0, 0], [1, 0], [2, 0], [3, 0]]
    ],
    published: true
  },
  {
    id: 'bhakti-marg-7',
    dateId: null,
    title: 'Devotional Flow',
    gridSize: 5,
    grid: [
      ['B', 'H', 'A', 'K', 'T'],
      ['I', 'S', 'E', 'V', 'A'],
      ['M', 'A', 'R', 'G', 'N'],
      ['P', 'U', 'J', 'A', 'D'],
      ['R', 'A', 'S', 'H', 'I']
    ],
    walls: [],
    words: [
      { word: 'BHAKTI', meaning: 'Devotion to God' },
      { word: 'SEVA', meaning: 'Selfless service' },
      { word: 'MARG', meaning: 'Path' },
      { word: 'PUJA', meaning: 'Worship' },
      { word: 'RASHI', meaning: 'Divine essence' },
      { word: 'ANAND', meaning: 'Bliss' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 0]],
      [[1, 1], [1, 2], [1, 3], [1, 4]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[3, 0], [3, 1], [3, 2], [3, 3]],
      [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]],
      [[2, 4], [3, 4], [3, 3], [2, 3], [2, 4]]
    ],
    published: true
  }
]

export function getBhaktiMargPuzzleForDate(dateId: string): BhaktiMargPuzzle {
  const scheduled = BHAKTI_MARG_PUZZLES.find(p => p.dateId === dateId && p.published !== false)
  if (scheduled) return scheduled

  const published = BHAKTI_MARG_PUZZLES.filter(p => p.published !== false)
  if (!published.length) return BHAKTI_MARG_PUZZLES[0]

  const seed = [...dateId].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 2166136261)
  return published[seed % published.length]
}
