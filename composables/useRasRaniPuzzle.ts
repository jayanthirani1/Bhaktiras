import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { ukDateId } from '~/utils/gameDay'
import { getRasRaniPuzzleForDate, RAS_REGIONS, type RasRaniPuzzle } from '~/data/rasRaniPuzzles'

function getDb() {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as import('firebase/firestore').Firestore | null) ?? null
}

export function useRasRaniPuzzle() {
  const puzzle = ref<RasRaniPuzzle>(getRasRaniPuzzleForDate(ukDateId()))
  const loading = ref(true)

  async function fetchPuzzle() {
    const dateId = ukDateId()
    loading.value = true

    try {
      const db = getDb()
      if (db) {
        const snap = await getDocs(query(
          collection(db, 'rasRaniPuzzles'),
          where('dateId', '==', dateId),
          where('published', '==', true),
          limit(1)
        ))

        if (!snap.empty) {
          const doc = snap.docs[0]
          const data = doc.data()
          puzzle.value = {
            id: doc.id,
            dateId: data.dateId,
            title: data.title || 'Ras Rani',
            gridSize: data.gridSize || 5,
            regionGrid: data.regionGrid || [],
            regions: data.regions || RAS_REGIONS,
            solution: data.solution || [],
            published: data.published
          }
          loading.value = false
          return
        }
      }
    } catch {
      // Fall back to static puzzles
    }

    puzzle.value = getRasRaniPuzzleForDate(dateId)
    loading.value = false
  }

  onMounted(() => { void fetchPuzzle() })

  return { puzzle, loading }
}
