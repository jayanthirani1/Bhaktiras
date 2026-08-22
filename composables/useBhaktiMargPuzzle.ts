import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { ukDateId } from '~/utils/gameDay'
import { getBhaktiMargPuzzleForDate, type BhaktiMargPuzzle } from '~/data/bhaktiMargPuzzles'

function getDb() {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as import('firebase/firestore').Firestore | null) ?? null
}

export function useBhaktiMargPuzzle() {
  const puzzle = ref<BhaktiMargPuzzle>(getBhaktiMargPuzzleForDate(ukDateId()))
  const loading = ref(true)

  async function fetchPuzzle() {
    const dateId = ukDateId()
    loading.value = true

    try {
      const db = getDb()
      if (db) {
        const snap = await getDocs(query(
          collection(db, 'bhaktiMargPuzzles'),
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
            title: data.title || 'Bhakti Marg',
            gridSize: data.gridSize || 5,
            grid: data.grid || [],
            walls: data.walls || [],
            words: data.words || [],
            paths: data.paths || [],
            published: data.published
          }
          loading.value = false
          return
        }
      }
    } catch {
      // Fall back to static puzzles
    }

    puzzle.value = getBhaktiMargPuzzleForDate(dateId)
    loading.value = false
  }

  onMounted(() => { void fetchPuzzle() })

  return { puzzle, loading }
}
