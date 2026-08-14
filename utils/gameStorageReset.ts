/**
 * When the shared word bank changes, bump WORD_BANK_VERSION so browsers
 * drop cached daily progress that still points at old answers/puzzles.
 */
export const WORD_BANK_VERSION = 2

const VERSION_KEY = 'bhaktiras-word-bank-version'

const GAME_STORAGE_EXACT = ['wordle-daily'] as const

const GAME_STORAGE_PREFIXES = [
  'wordle-timer:',
  'mini-crossword:',
  'mini-crossword-timer:',
  'one-percent-run:',
  'one-percent-timer:',
  'leaderboard-submitted:',
] as const

function shouldClearKey(key: string): boolean {
  if ((GAME_STORAGE_EXACT as readonly string[]).includes(key)) return true
  return GAME_STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))
}

/** Clears local game progress when the committed word-bank version changes. */
export function ensureGameStorageMatchesWordBank(): boolean {
  if (import.meta.server || typeof localStorage === 'undefined') return false

  try {
    const current = localStorage.getItem(VERSION_KEY)
    if (current === String(WORD_BANK_VERSION)) return false

    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) keys.push(key)
    }

    for (const key of keys) {
      if (shouldClearKey(key)) localStorage.removeItem(key)
    }

    localStorage.setItem(VERSION_KEY, String(WORD_BANK_VERSION))
    return true
  } catch {
    return false
  }
}
