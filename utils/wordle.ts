import type { LetterStatus } from '~/types/wordle'
import { WORD_LEN } from '~/utils/wordleWords'

/**
 * Wordle feedback: green = correct, yellow = present, gray = absent.
 */
export function getFeedback(guess: string, solution: string): LetterStatus[] {
  const result: LetterStatus[] = Array(WORD_LEN).fill('absent')
  const sol = solution.toUpperCase()
  const g = guess.toUpperCase().padEnd(WORD_LEN).slice(0, WORD_LEN)
  const remaining: Record<string, number> = {}
  for (let i = 0; i < WORD_LEN; i++) {
    const c = sol[i]
    remaining[c] = (remaining[c] ?? 0) + 1
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (g[i] === sol[i]) {
      result[i] = 'correct'
      remaining[g[i]]--
    }
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (result[i] === 'correct') continue
    const c = g[i]
    if (c && remaining[c] > 0) {
      result[i] = 'present'
      remaining[c]--
    }
  }
  return result
}
