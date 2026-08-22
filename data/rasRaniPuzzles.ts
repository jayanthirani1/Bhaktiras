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
  { id: 'shanti', name: 'Shanti', color: 'bg-sky-200', meaning: 'Peace' },
  { id: 'vatsalya', name: 'Vatsalya', color: 'bg-pink-200', meaning: 'Parental love' },
  { id: 'madhurya', name: 'Madhurya', color: 'bg-amber-200', meaning: 'Sweetness' },
  { id: 'dasya', name: 'Dasya', color: 'bg-emerald-200', meaning: 'Servitude' },
  { id: 'sakhya', name: 'Sakhya', color: 'bg-violet-200', meaning: 'Friendship' },
  { id: 'aishwarya', name: 'Aishwarya', color: 'bg-orange-200', meaning: 'Majesty' },
  { id: 'karuna', name: 'Karuna', color: 'bg-cyan-200', meaning: 'Compassion' },
  { id: 'bhakti', name: 'Bhakti', color: 'bg-rose-200', meaning: 'Devotion' },
  { id: 'prema', name: 'Prema', color: 'bg-red-200', meaning: 'Divine love' },
  { id: 'ananda', name: 'Ananda', color: 'bg-yellow-200', meaning: 'Bliss' }
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
  ananda: '#fef08a'
}

function regionsFor(ids: string[]) {
  return RAS_REGIONS.filter(r => ids.includes(r.id))
}

export const RAS_RANI_PUZZLES: RasRaniPuzzle[] = [
  {
    id: 'ras-rani-1',
    dateId: null,
    title: 'Five Rasas',
    gridSize: 5,
    regionGrid: [
      ['shanti', 'shanti', 'shanti', 'vatsalya', 'vatsalya'],
      ['shanti', 'shanti', 'vatsalya', 'vatsalya', 'vatsalya'],
      ['madhurya', 'madhurya', 'madhurya', 'vatsalya', 'vatsalya'],
      ['sakhya', 'madhurya', 'madhurya', 'vatsalya', 'dasya'],
      ['sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya']),
    solution: [[0, 0], [1, 3], [2, 1], [3, 4], [4, 2]],
    published: true
  },
  {
    id: 'ras-rani-2',
    dateId: null,
    title: 'Nectar Garden',
    gridSize: 5,
    regionGrid: [
      ['shanti', 'shanti', 'vatsalya', 'vatsalya', 'vatsalya'],
      ['shanti', 'shanti', 'madhurya', 'vatsalya', 'vatsalya'],
      ['madhurya', 'madhurya', 'madhurya', 'vatsalya', 'vatsalya'],
      ['madhurya', 'madhurya', 'madhurya', 'vatsalya', 'dasya'],
      ['sakhya', 'sakhya', 'sakhya', 'sakhya', 'sakhya']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya']),
    solution: [[0, 0], [1, 3], [2, 1], [3, 4], [4, 2]],
    published: true
  },
  {
    id: 'ras-rani-3',
    dateId: null,
    title: 'Divine Essence',
    gridSize: 6,
    regionGrid: [
      ['shanti', 'shanti', 'vatsalya', 'vatsalya', 'vatsalya', 'madhurya'],
      ['shanti', 'dasya', 'vatsalya', 'vatsalya', 'vatsalya', 'madhurya'],
      ['dasya', 'dasya', 'dasya', 'dasya', 'madhurya', 'madhurya'],
      ['dasya', 'dasya', 'dasya', 'dasya', 'sakhya', 'madhurya'],
      ['aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'sakhya', 'sakhya'],
      ['aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'aishwarya', 'sakhya']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya']),
    solution: [[0, 0], [1, 3], [2, 5], [3, 1], [4, 4], [5, 2]],
    published: true
  },
  {
    id: 'ras-rani-4',
    dateId: null,
    title: 'Ocean of Bliss',
    gridSize: 6,
    regionGrid: [
      ['shanti', 'dasya', 'dasya', 'vatsalya', 'vatsalya', 'madhurya'],
      ['shanti', 'dasya', 'dasya', 'vatsalya', 'vatsalya', 'madhurya'],
      ['dasya', 'dasya', 'dasya', 'vatsalya', 'vatsalya', 'madhurya'],
      ['dasya', 'dasya', 'dasya', 'sakhya', 'sakhya', 'sakhya'],
      ['dasya', 'aishwarya', 'aishwarya', 'sakhya', 'sakhya', 'sakhya'],
      ['aishwarya', 'aishwarya', 'aishwarya', 'sakhya', 'sakhya', 'sakhya']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya']),
    solution: [[0, 0], [1, 3], [2, 5], [3, 1], [4, 4], [5, 2]],
    published: true
  },
  {
    id: 'ras-rani-5',
    dateId: null,
    title: 'Sacred Journey',
    gridSize: 7,
    regionGrid: [
      ['shanti', 'shanti', 'madhurya', 'madhurya', 'vatsalya', 'vatsalya', 'vatsalya'],
      ['shanti', 'madhurya', 'madhurya', 'dasya', 'vatsalya', 'vatsalya', 'vatsalya'],
      ['shanti', 'madhurya', 'madhurya', 'dasya', 'dasya', 'dasya', 'vatsalya'],
      ['sakhya', 'sakhya', 'sakhya', 'aishwarya', 'dasya', 'dasya', 'dasya'],
      ['sakhya', 'sakhya', 'sakhya', 'aishwarya', 'dasya', 'dasya', 'karuna'],
      ['sakhya', 'sakhya', 'aishwarya', 'aishwarya', 'aishwarya', 'karuna', 'karuna'],
      ['sakhya', 'aishwarya', 'aishwarya', 'karuna', 'karuna', 'karuna', 'karuna']
    ],
    regions: regionsFor(['shanti', 'vatsalya', 'madhurya', 'dasya', 'sakhya', 'aishwarya', 'karuna']),
    solution: [[0, 0], [1, 6], [2, 2], [3, 4], [4, 1], [5, 3], [6, 5]],
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
