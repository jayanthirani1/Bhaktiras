import type { LetterStatus } from '~/types/wordle'

const LEN = 5

/**
 * Wordle feedback: green = correct, yellow = present, gray = absent.
 */
export function getFeedback(guess: string, solution: string): LetterStatus[] {
  if (!guess || !solution) return Array(LEN).fill('empty')
  const result: LetterStatus[] = Array(LEN).fill('absent')
  const sol = solution.toUpperCase()
  const g = guess.toUpperCase().padEnd(LEN).slice(0, LEN)
  const remaining: Record<string, number> = {}
  for (let i = 0; i < LEN; i++) {
    const c = sol[i]
    remaining[c] = (remaining[c] ?? 0) + 1
  }
  for (let i = 0; i < LEN; i++) {
    if (g[i] === sol[i]) {
      result[i] = 'correct'
      remaining[g[i]]--
    }
  }
  for (let i = 0; i < LEN; i++) {
    if (result[i] === 'correct') continue
    const c = g[i]
    if (c && remaining[c] > 0) {
      result[i] = 'present'
      remaining[c]--
    }
  }
  return result
}
