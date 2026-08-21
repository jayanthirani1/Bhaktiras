/**
 * Game pages run in an immersive mode: the app chrome scrolls away so each game
 * can keep its own Back / Check bar pinned instead.
 */
export const GAME_PAGE_PATHS = [
  '/play/wordle',
  '/play/crossword',
  '/play/mini-crossword',
  '/play/one-percent',
  '/play/connections',
  '/play/bracket-city'
]

export function isGamePagePath(path: string): boolean {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path
  return GAME_PAGE_PATHS.includes(clean)
}
