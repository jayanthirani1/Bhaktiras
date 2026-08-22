export interface RasRegion {
  id: string
  name: string
  color: string
  meaning?: string
}

export interface RasRaniPuzzle {
  id: string
  dateId?: string | null
  title: string
  gridSize: number
  /** Grid of region IDs - each cell belongs to a region */
  regionGrid: string[][]
  /** Region definitions with colors and meanings */
  regions: RasRegion[]
  /** Solution: array of [row, col] for each queen/droplet position */
  solution: [number, number][]
  published?: boolean
}

export const RAS_REGIONS: RasRegion[] = [
  { id: 'shanti', name: 'Shanti', color: 'bg-blue-200 border-blue-400', meaning: 'Peace' },
  { id: 'vatsalya', name: 'Vatsalya', color: 'bg-pink-200 border-pink-400', meaning: 'Parental love' },
  { id: 'madhurya', name: 'Madhurya', color: 'bg-amber-200 border-amber-400', meaning: 'Sweetness' },
  { id: 'dasya', name: 'Dasya', color: 'bg-green-200 border-green-400', meaning: 'Servitude' },
  { id: 'sakhya', name: 'Sakhya', color: 'bg-purple-200 border-purple-400', meaning: 'Friendship' },
  { id: 'aishwarya', name: 'Aishwarya', color: 'bg-orange-200 border-orange-400', meaning: 'Majesty' },
  { id: 'karuna', name: 'Karuna', color: 'bg-cyan-200 border-cyan-400', meaning: 'Compassion' },
  { id: 'bhakti', name: 'Bhakti', color: 'bg-rose-200 border-rose-400', meaning: 'Devotion' },
  { id: 'prema', name: 'Prema', color: 'bg-red-200 border-red-400', meaning: 'Divine love' },
  { id: 'ananda', name: 'Ananda', color: 'bg-yellow-200 border-yellow-400', meaning: 'Bliss' }
]

export const RAS_RANI_PUZZLES: RasRaniPuzzle[] = [
  {
    id: 'ras-rani-1',
    dateId: null,
    title: 'Five Rasas',
    gridSize: 5,
    regionGrid: [
      ['shanti', 'shanti', 'vatsalya', 'vatsalya', 'madhurya'],
      ['shanti', 'dasya', 'dasya', 'vatsalya', 'madhurya'],
      ['sakhya', 'dasya', 'dasya', 'madhurya', 'madhurya'],
      ['sakhya', 'sakhya', 'dasya', 'aishwarya', 'aishwarya'],
      ['sakhya', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya']
    ],
    regions: RAS_REGIONS.filter(r => ['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya'].includes(r.id)),
    solution: [[0, 0], [1, 3], [2, 1], [3, 4], [4, 2]],
    published: true
  },
  {
    id: 'ras-rani-2',
    dateId: null,
    title: 'Nectar Garden',
    gridSize: 5,
    regionGrid: [
      ['prema', 'prema', 'ananda', 'ananda', 'ananda'],
      ['prema', 'karuna', 'karuna', 'ananda', 'bhakti'],
      ['karuna', 'karuna', 'shanti', 'shanti', 'bhakti'],
      ['karuna', 'shanti', 'shanti', 'bhakti', 'bhakti'],
      ['dasya', 'dasya', 'dasya', 'dasya', 'bhakti']
    ],
    regions: RAS_REGIONS.filter(r => ['prema', 'ananda', 'karuna', 'bhakti', 'shanti', 'dasya'].includes(r.id)),
    solution: [[0, 1], [1, 4], [2, 2], [3, 0], [4, 3]],
    published: true
  },
  {
    id: 'ras-rani-3',
    dateId: null,
    title: 'Divine Essence',
    gridSize: 6,
    regionGrid: [
      ['shanti', 'shanti', 'vatsalya', 'vatsalya', 'vatsalya', 'madhurya'],
      ['shanti', 'dasya', 'dasya', 'vatsalya', 'madhurya', 'madhurya'],
      ['sakhya', 'dasya', 'dasya', 'karuna', 'karuna', 'madhurya'],
      ['sakhya', 'sakhya', 'karuna', 'karuna', 'prema', 'prema'],
      ['sakhya', 'ananda', 'ananda', 'prema', 'prema', 'prema'],
      ['ananda', 'ananda', 'ananda', 'ananda', 'prema', 'bhakti']
    ],
    regions: RAS_REGIONS.filter(r => ['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'karuna', 'prema', 'ananda', 'bhakti'].includes(r.id)),
    solution: [[0, 0], [1, 2], [2, 4], [3, 1], [4, 5], [5, 3]],
    published: true
  },
  {
    id: 'ras-rani-4',
    dateId: null,
    title: 'Ocean of Bliss',
    gridSize: 5,
    regionGrid: [
      ['ananda', 'ananda', 'bhakti', 'bhakti', 'prema'],
      ['ananda', 'madhurya', 'madhurya', 'bhakti', 'prema'],
      ['shanti', 'madhurya', 'dasya', 'dasya', 'prema'],
      ['shanti', 'shanti', 'dasya', 'karuna', 'karuna'],
      ['shanti', 'vatsalya', 'vatsalya', 'vatsalya', 'karuna']
    ],
    regions: RAS_REGIONS.filter(r => ['ananda', 'bhakti', 'prema', 'madhurya', 'shanti', 'dasya', 'karuna', 'vatsalya'].includes(r.id)),
    solution: [[0, 2], [1, 0], [2, 4], [3, 2], [4, 1]],
    published: true
  },
  {
    id: 'ras-rani-5',
    dateId: null,
    title: 'Sacred Journey',
    gridSize: 5,
    regionGrid: [
      ['vatsalya', 'vatsalya', 'sakhya', 'sakhya', 'sakhya'],
      ['vatsalya', 'shanti', 'shanti', 'dasya', 'sakhya'],
      ['prema', 'shanti', 'ananda', 'dasya', 'dasya'],
      ['prema', 'prema', 'ananda', 'ananda', 'madhurya'],
      ['prema', 'ananda', 'ananda', 'madhurya', 'madhurya']
    ],
    regions: RAS_REGIONS.filter(r => ['vatsalya', 'sakhya', 'shanti', 'dasya', 'prema', 'ananda', 'madhurya'].includes(r.id)),
    solution: [[0, 1], [1, 3], [2, 0], [3, 4], [4, 2]],
    published: true
  }
]

export function getRasRaniPuzzleForDate(dateId: string): RasRaniPuzzle {
  const scheduled = RAS_RANI_PUZZLES.find(p => p.dateId === dateId && p.published !== false)
  if (scheduled) return scheduled

  const published = RAS_RANI_PUZZLES.filter(p => p.published !== false)
  if (!published.length) return RAS_RANI_PUZZLES[0]

  const seed = [...dateId].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 2166136261)
  return published[seed % published.length]
}

export function getRegionColor(regionId: string): string {
  const region = RAS_REGIONS.find(r => r.id === regionId)
  return region?.color ?? 'bg-gray-200 border-gray-400'
}

export function getRegionName(regionId: string): string {
  const region = RAS_REGIONS.find(r => r.id === regionId)
  return region?.name ?? regionId
}

export function getRegionMeaning(regionId: string): string {
  const region = RAS_REGIONS.find(r => r.id === regionId)
  return region?.meaning ?? ''
}
