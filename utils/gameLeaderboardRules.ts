import type { GameLeaderboardId } from '~/types'

/** How each daily board is ranked — shown under the leaderboard heading. */
export const GAME_LEADERBOARD_RULES: Record<GameLeaderboardId, string> = {
  wordle: 'Ranked by fewest guesses. Faster time breaks ties.',
  'mini-crossword': 'Ranked by fastest finish time.',
  connections: 'Ranked by fewest mistakes. Faster time breaks ties.',
  'bracket-city': 'Ranked by fewest peeks. Faster time breaks ties.',
  'one-percent': 'Ranked by most questions cleared. Faster time breaks ties.',
  'surya-chandra': 'Ranked by fastest time. Fewer moves breaks ties.',
  'bhakti-marg': 'Ranked by fastest time. Fewer moves breaks ties.',
  'ras-rani': 'Ranked by fastest time. Fewer moves breaks ties.'
}

export const LEADERBOARD_SUBMIT_HINT =
  'Sign in to submit. Only your best result for the day is kept.'

export function leaderboardRulesText(game: GameLeaderboardId): string {
  const ranking = GAME_LEADERBOARD_RULES[game]
  return ranking ? `${ranking} ${LEADERBOARD_SUBMIT_HINT}` : LEADERBOARD_SUBMIT_HINT
}
