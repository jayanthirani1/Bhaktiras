import type { PlayGameSlug } from '~/utils/playCompletion'
import { ukDateId } from '~/utils/gameDay'

/** Wordle and Crossword are live now. Other games unlock on the 30th, one a month. */
export const GAME_UNLOCK_START = '2026-08-30'

export const ALWAYS_LIVE_GAMES: PlayGameSlug[] = ['wordle', 'mini-crossword']

/** Order of monthly releases starting GAME_UNLOCK_START. */
export const MONTHLY_GAMES: PlayGameSlug[] = [
  'one-percent',
  'connections',
  'bracket-city',
  'bhakti-marg',
  'ras-rani'
]

const PATH_SLUG: Record<string, PlayGameSlug> = {
  '/play/wordle': 'wordle',
  '/play/crossword': 'mini-crossword',
  '/play/mini-crossword': 'mini-crossword',
  '/play/one-percent': 'one-percent',
  '/play/connections': 'connections',
  '/play/bracket-city': 'bracket-city',
  '/play/bhakti-marg': 'bhakti-marg',
  '/play/surya-chandra': 'bhakti-marg',
  '/play/ras-rani': 'ras-rani'
}

function addUtcMonths(dateId: string, months: number): string {
  const [year, month, day] = dateId.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + months, day))
  return date.toISOString().slice(0, 10)
}

export function playSlugFromPath(path: string): PlayGameSlug | null {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path
  return PATH_SLUG[clean] ?? null
}

export function gameUnlockDateId(slug: PlayGameSlug): string | null {
  if (ALWAYS_LIVE_GAMES.includes(slug)) return null
  const index = MONTHLY_GAMES.indexOf(slug)
  if (index < 0) return GAME_UNLOCK_START
  return addUtcMonths(GAME_UNLOCK_START, index)
}

export function isGameLive(_slug: PlayGameSlug, _today = ukDateId()): boolean {
  return true
}

/** Instant London clocks read 00:00 on `dateId`. */
export function londonMidnightMs(dateId: string): number {
  const [year, month, day] = dateId.split('-').map(Number)
  const noonUtc = Date.UTC(year, month - 1, day, 12, 0, 0)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23'
  }).formatToParts(new Date(noonUtc))
  const hour = Number(parts.find(part => part.type === 'hour')?.value || 0)
  const minute = Number(parts.find(part => part.type === 'minute')?.value || 0)
  const second = Number(parts.find(part => part.type === 'second')?.value || 0)
  return noonUtc - (((hour * 60 + minute) * 60 + second) * 1000)
}

export function formatUnlockLabel(dateId: string): string {
  const [year, month, day] = dateId.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export function formatUnlockCountdown(ms: number): string {
  const total = Math.max(0, ms)
  const days = Math.floor(total / 86400000)
  const hours = Math.floor((total % 86400000) / 3600000)
  const minutes = Math.floor((total % 3600000) / 60000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
