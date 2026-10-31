import { ukDateId } from '~/utils/gameDay'
import {
  getRasRaniPuzzleForDate,
  RAS_RANI_DIFFICULTY_LABEL,
  inferRasRaniDifficulty,
  type RasRaniPuzzle
} from '~/data/rasRaniPuzzles'

export function useRasRaniPuzzle(dateId = ukDateId()) {
  const puzzle = ref<RasRaniPuzzle>(getRasRaniPuzzleForDate(dateId))
  const loading = ref(false)

  function refresh() {
    puzzle.value = getRasRaniPuzzleForDate(dateId)
  }

  onMounted(refresh)

  return {
    puzzle,
    loading,
    difficultyLabel: computed(() =>
      RAS_RANI_DIFFICULTY_LABEL[puzzle.value.difficulty || inferRasRaniDifficulty(puzzle.value.gridSize)]
    )
  }
}
