import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { ukDateId } from '~/utils/gameDay'
import { pickSuryaChandra } from '~/utils/gameVerify'
import type { TangoPuzzle } from '~/utils/tango'

function getDb() {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as import('firebase/firestore').Firestore | null) ?? null
}

export function useSuryaChandraPuzzle(dayId = ukDateId()) {
  const puzzle = ref<TangoPuzzle>(pickSuryaChandra(dayId))
  const loading = ref(true)

  async function fetchPuzzle() {
    const dateId = dayId
    loading.value = true
    try {
      const db = getDb()
      if (db) {
        const snap = await getDocs(query(
          collection(db, 'suryaChandraPuzzles'),
          where('dateId', '==', dateId),
          where('published', '==', true),
          limit(1)
        ))
        const doc = snap.docs[0]
        if (doc) {
          puzzle.value = pickSuryaChandra(dateId, { id: doc.id, data: doc.data() as Record<string, unknown> })
          loading.value = false
          return
        }
      }
    } catch {
      // Fall back to the generated daily board.
    }
    puzzle.value = pickSuryaChandra(dateId)
    loading.value = false
  }

  onMounted(() => { void fetchPuzzle() })

  return { puzzle, loading }
}
