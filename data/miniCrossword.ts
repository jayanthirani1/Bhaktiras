import type { CrosswordPuzzle } from '~/types'

/**
 * Compact mini crossword with fixed placements:
 *   S W A M I
 *   A . . . .
 *   B H A K T
 *   H . . . .
 *   A A R T I
 */
export const DEFAULT_MINI_CROSSWORD: CrosswordPuzzle = {
  id: 'default-mini',
  title: 'Today’s Mini',
  published: true,
  clues: [
    { number: 1, direction: 'across', clue: 'Spiritual teacher / devotee title', answer: 'SWAMI', row: 0, col: 0 },
    { number: 4, direction: 'across', clue: 'Loving devotee', answer: 'BHAKT', row: 2, col: 0 },
    { number: 6, direction: 'across', clue: 'Hymn of praise with lamps', answer: 'AARTI', row: 4, col: 0 },
    { number: 1, direction: 'down', clue: 'Holy assembly', answer: 'SABHA', row: 0, col: 0 }
  ]
}
