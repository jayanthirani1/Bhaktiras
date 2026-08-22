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
    gridSize: 5,
    grid: [
      ['S', 'E', 'V', 'A', 'K'],
      ['A', 'T', 'H', 'A', 'I'],
      ['T', 'S', 'A', 'N', 'R'],
      ['S', 'A', 'N', 'G', 'T'],
      ['D', 'A', 'R', 'S', 'H']
    ],
    walls: [],
    words: [
      { word: 'SEVA', meaning: 'Selfless service' },
      { word: 'KATHA', meaning: 'Divine discourse' },
      { word: 'SATSANG', meaning: 'Holy company' },
      { word: 'KIRTAN', meaning: 'Devotional singing' },
      { word: 'DARSH', meaning: 'Divine vision' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3]],
      [[0, 4], [1, 4], [1, 3], [1, 2], [1, 1]],
      [[1, 0], [2, 0], [2, 1], [2, 2], [2, 3], [3, 3], [3, 2]],
      [[3, 0], [3, 1], [4, 1], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4]],
      [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]]
    ],
    published: true
  },
  {
    id: 'bhakti-marg-2',
    dateId: null,
    title: 'Sacred Journey',
    gridSize: 5,
    grid: [
      ['P', 'U', 'J', 'A', 'M'],
      ['R', 'E', 'M', 'A', 'A'],
      ['A', 'N', 'T', 'R', 'L'],
      ['Y', 'A', 'I', 'D', 'A'],
      ['A', 'N', 'K', 'H', 'Y']
    ],
    walls: [],
    words: [
      { word: 'PUJA', meaning: 'Worship ritual' },
      { word: 'PREMA', meaning: 'Divine love' },
      { word: 'MANTRA', meaning: 'Sacred chant' },
      { word: 'KIRTAN', meaning: 'Devotional singing' },
      { word: 'DHYAN', meaning: 'Meditation' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3]],
      [[1, 0], [1, 1], [1, 2], [1, 3], [0, 4]],
      [[1, 4], [2, 4], [3, 4], [4, 4], [2, 3], [2, 2]],
      [[4, 2], [2, 1], [3, 1], [4, 1], [4, 0], [3, 0], [2, 0]],
      [[3, 3], [4, 3], [3, 2], [3, 1], [4, 1]]
    ],
    published: true
  },
  {
    id: 'bhakti-marg-3',
    dateId: null,
    title: 'Divine Path',
    gridSize: 5,
    grid: [
      ['B', 'H', 'A', 'K', 'T'],
      ['R', 'A', 'S', 'I', 'I'],
      ['M', 'U', 'R', 'T', 'M'],
      ['J', 'A', 'P', 'A', 'A'],
      ['N', 'A', 'M', 'A', 'H']
    ],
    walls: [],
    words: [
      { word: 'BHAKTI', meaning: 'Devotion to God' },
      { word: 'RAS', meaning: 'Divine essence' },
      { word: 'MURTI', meaning: 'Sacred form' },
      { word: 'JAPAM', meaning: 'Repetition of divine name' },
      { word: 'NAMAH', meaning: 'Salutations' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 4]],
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2], [2, 3], [1, 3]],
      [[3, 0], [3, 1], [3, 2], [3, 3], [2, 4]],
      [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]]
    ],
    published: true
  },
  {
    id: 'bhakti-marg-4',
    dateId: null,
    title: 'Temple Path',
    gridSize: 5,
    grid: [
      ['M', 'A', 'N', 'D', 'I'],
      ['R', 'P', 'R', 'A', 'S'],
      ['A', 'A', 'D', 'H', 'A'],
      ['T', 'D', 'A', 'R', 'N'],
      ['I', 'K', 'S', 'H', 'A']
    ],
    walls: [],
    words: [
      { word: 'MANDIR', meaning: 'Temple' },
      { word: 'PRASAD', meaning: 'Blessed offering' },
      { word: 'ARATI', meaning: 'Lamp ceremony' },
      { word: 'DARSHAN', meaning: 'Divine vision' },
      { word: 'DIKSHA', meaning: 'Initiation' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 4]],
      [[1, 1], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4]],
      [[2, 0], [1, 0], [2, 1], [3, 0], [4, 0]],
      [[3, 1], [2, 2], [3, 2], [3, 3], [4, 3], [4, 4]],
      [[4, 1], [4, 2], [1, 4], [2, 3], [2, 4]]
    ],
    published: true
  },
  {
    id: 'bhakti-marg-5',
    dateId: null,
    title: 'Ocean of Love',
    gridSize: 5,
    grid: [
      ['S', 'M', 'A', 'R', 'A'],
      ['E', 'V', 'A', 'N', 'M'],
      ['R', 'I', 'T', 'K', 'R'],
      ['V', 'C', 'E', 'I', 'I'],
      ['A', 'H', 'A', 'N', 'T']
    ],
    walls: [],
    words: [
      { word: 'SMARAN', meaning: 'Divine remembrance' },
      { word: 'SEVA', meaning: 'Selfless service' },
      { word: 'KIRTAN', meaning: 'Devotional songs' },
      { word: 'AMRIT', meaning: 'Divine nectar' },
      { word: 'VICHAR', meaning: 'Contemplation' }
    ],
    paths: [
      [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 3]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[3, 3], [2, 3], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3]],
      [[2, 1], [3, 1], [4, 1], [4, 2], [2, 0]],
      [[3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2]]
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
