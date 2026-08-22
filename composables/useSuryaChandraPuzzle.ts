import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { ukDateId } from '~/utils/gameDay'
import { generateSuryaChandraPuzzle, parseTangoPuzzle, type TangoPuzzle } from '~/utils/tango'

function getDb() {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as import('firebase/firestore').Firestore | null) ?? null
}

export function useSuryaChandraPuzzle() {
  const puzzle = ref<TangoPuzzle>(generateSuryaChandraPuzzle(ukDateId()))
  const loading = ref(true)

  async function fetchPuzzle() {
    const dateId = ukDateId()
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
        if (!snap.empty) {
          const doc = snap.docs[0]
          const parsed = parseTangoPuzzle(doc.id, doc.data() as Record<string, unknown>)
          if (parsed) {
            puzzle.value = parsed
            loading.value = false
            return
          }
        }
      }
    } catch {
      // Fall back to the generated daily board.
    }
    puzzle.value = generateSuryaChandraPuzzle(dateId)
    loading.value = false
  }

  onMounted(() => { void fetchPuzzle() })

  return { puzzle, loading }
}
