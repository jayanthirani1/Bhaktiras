import { ukDateId } from '~/utils/gameDay'
import type { PlayGameSlug } from '~/utils/playCompletion'

/**
 * When the shared word bank changes, bump WORD_BANK_VERSION so browsers
 * drop cached daily progress that still points at old answers/puzzles.
 */
export const WORD_BANK_VERSION = 7

const VERSION_KEY = 'bhaktiras-word-bank-version'

const GAME_STORAGE_EXACT = ['wordle-daily'] as const

const GAME_STORAGE_PREFIXES = [
  'wordle-timer:',
  'connections:',
  'connections-timer:',
  'mini-crossword:',
  'mini-crossword-timer:',
  'one-percent-run:',
  'one-percent-timer:',
  'bracket-city:',
  'bracket-city-timer:',
  'bhakti-marg:',
  'bhakti-marg-timer:',
  'ras-rani:',
  'ras-rani-timer:',
  'leaderboard-submitted:',
  'play-done:',
] as const

function shouldClearKey(key: string): boolean {
  if ((GAME_STORAGE_EXACT as readonly string[]).includes(key)) return true
  return GAME_STORAGE_PREFIXES.some(prefix => key.startsWith(prefix))
}

/**
 * Where each game keeps one day's progress. Wordle is the odd one out — its
 * board lives under a single key that carries the date inside the payload.
 */
const GAME_DAY_KEYS: Record<PlayGameSlug, (dateId: string) => string[]> = {
  'wordle': dateId => ['wordle-daily', `wordle-timer:${dateId}`],
  'mini-crossword': dateId => [`mini-crossword:${dateId}`, `mini-crossword-timer:${dateId}`],
  'one-percent': dateId => [`one-percent-run:${dateId}`, `one-percent-timer:${dateId}`],
  'connections': dateId => [`connections:${dateId}`, `connections-timer:${dateId}`],
  'bracket-city': dateId => [`bracket-city:${dateId}`, `bracket-city-timer:${dateId}`],
  'bhakti-marg': dateId => [
    `bhakti-marg:${dateId}`,
    `bhakti-marg-timer:${dateId}`,
    `leaderboard-submitted:surya-chandra:${dateId}`
  ],
  'ras-rani': dateId => [`ras-rani-v3:${dateId}`, `ras-rani:${dateId}`, `ras-rani-timer:${dateId}`]
}

/** Every local key holding this device's play of one game on one day. */
export function gameDayStorageKeys(slug: PlayGameSlug, dateId = ukDateId()): string[] {
  return [
    ...GAME_DAY_KEYS[slug](dateId),
    `play-done:${slug}:${dateId}`,
    `leaderboard-submitted:${slug}:${dateId}`
  ]
}

/** Drops one game's progress for one day, leaving the other games alone. */
export function resetGameDayLocally(slug: PlayGameSlug, dateId = ukDateId()): void {
  if (import.meta.server || typeof localStorage === 'undefined') return
  for (const key of gameDayStorageKeys(slug, dateId)) {
    try {
      localStorage.removeItem(key)
    } catch {}
  }
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
