import { collection, getDocs, type Firestore } from 'firebase/firestore'
import type { SopanPuzzle } from '~/types'
import { DEFAULT_SOPAN_PUZZLES } from '~/data/sopanPuzzles'
import { ukDateId } from '~/utils/gameDay'
import { parseSopanPuzzle, pooledSopanPuzzle } from '~/utils/sopan'

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

/**
 * Today's ladder. An admin puzzle dated today wins; otherwise the day rotates
 * through the published undated admin puzzles, or the starter set while there
 * are none — so importing the starters does not count them twice.
 */
export function useSopanPuzzle() {
  const dateId = ukDateId()
  const puzzle = ref<SopanPuzzle>(pooledSopanPuzzle(DEFAULT_SOPAN_PUZZLES, dateId) ?? DEFAULT_SOPAN_PUZZLES[0])
  const loading = ref(true)

  onMounted(async () => {
    try {
      const db = getDb()
      if (!db) return
      const snap = await getDocs(collection(db, 'sopanPuzzles'))
      const remote = snap.docs
        .map(d => parseSopanPuzzle(d.id, d.data() as Record<string, unknown>))
        .filter((item): item is SopanPuzzle => !!item && item.published !== false)
      const dated = remote.find(item => item.dateId === dateId)
      const rotation = remote.filter(item => !item.dateId)
      puzzle.value = dated
        ?? pooledSopanPuzzle(rotation, dateId)
        ?? puzzle.value
    } catch {
      // Keep the starter ladder.
    } finally {
      loading.value = false
    }
  })

  return { puzzle, dateId, loading }
}
