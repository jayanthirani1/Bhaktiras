import type { GameReleaseContent, GameReleaseStatus, GameReleaseStored } from '~/types'
import type { PlayGameSlug } from '~/utils/playCompletion'
import { pathMatchesPrefix } from '~/data/siteSections'
import { gameUnlockDateId, londonMidnightMs } from '~/utils/gameRelease'

export interface GameCatalogEntry {
  slug: PlayGameSlug
  title: string
  href: string
  /** Every route that reaches this game, redirect aliases included. */
  paths: string[]
}

/**
 * The games this build ships. Like the section catalogue, it is code: a stored
 * document only carries whether each game is out yet and when it is due.
 */
export const GAME_CATALOG: GameCatalogEntry[] = [
  { slug: 'wordle', title: 'Wordle', href: '/play/wordle', paths: ['/play/wordle'] },
  { slug: 'mini-crossword', title: 'Crossword', href: '/play/crossword', paths: ['/play/crossword', '/play/mini-crossword'] },
  { slug: 'one-percent', title: '1% Club', href: '/play/one-percent', paths: ['/play/one-percent'] },
  { slug: 'connections', title: 'Connections', href: '/play/connections', paths: ['/play/connections'] },
  { slug: 'bracket-city', title: 'Bracket City', href: '/play/bracket-city', paths: ['/play/bracket-city'] },
  { slug: 'bhakti-marg', title: 'Surya Chandra', href: '/play/surya-chandra', paths: ['/play/surya-chandra', '/play/bhakti-marg'] },
  { slug: 'ras-rani', title: 'Ras Rani', href: '/play/ras-rani', paths: ['/play/ras-rani'] }
]

export const GAME_RELEASE_STATUSES: Array<{ value: GameReleaseStatus, label: string, hint: string }> = [
  { value: 'live', label: 'Live', hint: 'Playable now.' },
  { value: 'scheduled', label: 'Scheduled', hint: 'Shows as “Coming soon” and unlocks itself on the date below.' },
  { value: 'hidden', label: 'Hidden', hint: 'Not listed at all, and the game’s page sends devotees back to Games.' }
]

/**
 * The launch plan the app ships with: Wordle and Crossword live, the rest
 * unlocking one a month from `GAME_UNLOCK_START`, each at London midnight.
 *
 * It is the same schedule `utils/gameRelease.ts` describes, read from there so
 * the two can never drift. Storing it as ordinary release entries means the
 * admin page opens pre-filled with the plan already in force: nothing changes
 * on the site until someone edits it, and editing it needs no deploy.
 */
export const DEFAULT_GAME_RELEASES: GameReleaseContent[] = GAME_CATALOG.map((game, index) => {
  const unlockDateId = gameUnlockDateId(game.slug)
  return {
    ...game,
    paths: [...game.paths],
    status: unlockDateId ? 'scheduled' : 'live',
    releaseAt: unlockDateId ? new Date(londonMidnightMs(unlockDateId)).toISOString() : null,
    order: index + 1
  }
})

function parseStatus(raw: unknown): GameReleaseStatus {
  const value = String(raw ?? '')
  return value === 'scheduled' || value === 'hidden' ? value : 'live'
}

/** Normalises anything date-like to an ISO instant, or null if it will not parse. */
export function parseReleaseAt(raw: unknown): string | null {
  if (!raw) return null
  const value = raw instanceof Date ? raw : new Date(String(raw))
  const time = value.getTime()
  return Number.isFinite(time) ? value.toISOString() : null
}

export function gameReleasesFromSource(raw: unknown): GameReleaseContent[] {
  const stored = new Map<string, { status: GameReleaseStatus, releaseAt: string | null }>()
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const value = item as Partial<GameReleaseStored> | null
      if (!value?.slug) continue
      stored.set(String(value.slug), {
        status: parseStatus(value.status),
        releaseAt: parseReleaseAt(value.releaseAt)
      })
    }
  }
  // A game with nothing stored against it keeps its place in the shipped plan,
  // so a game added after the document was written arrives on schedule rather
  // than appearing the moment it deploys.
  return DEFAULT_GAME_RELEASES.map(game => ({
    ...game,
    paths: [...game.paths],
    ...(stored.get(game.slug) ?? {})
  }))
}

export function gameReleasesWritePayload(entries: GameReleaseContent[]): GameReleaseStored[] {
  const chosen = new Map(entries.map(entry => [entry.slug, entry]))
  return GAME_CATALOG.map((game) => {
    const entry = chosen.get(game.slug)
    const status = parseStatus(entry?.status)
    return {
      slug: game.slug,
      status,
      // A date is only meaningful on a scheduled game; dropping it elsewhere
      // keeps a stale date from unlocking something an admin has hidden.
      releaseAt: status === 'scheduled' ? parseReleaseAt(entry?.releaseAt) : null
    }
  })
}

/**
 * Playable right now. A scheduled game with no date set stays locked: an empty
 * date is an unfinished plan, not a release.
 */
export function isGameReleased(entry: GameReleaseContent, now: number = Date.now()): boolean {
  if (entry.status === 'hidden') return false
  if (entry.status === 'live') return true
  if (!entry.releaseAt) return false
  const time = new Date(entry.releaseAt).getTime()
  return Number.isFinite(time) && time <= now
}

/** Scheduled but not out yet — listed on Games as a locked "Coming soon" row. */
export function isGameComingSoon(entry: GameReleaseContent, now: number = Date.now()): boolean {
  return entry.status === 'scheduled' && !isGameReleased(entry, now)
}

export function gameForPath(entries: GameReleaseContent[], path: string): GameReleaseContent | null {
  return entries.find(entry => entry.paths.some(prefix => pathMatchesPrefix(prefix, path))) ?? null
}

export function releasedGameSlugs(entries: GameReleaseContent[], now: number = Date.now()): PlayGameSlug[] {
  return entries.filter(entry => isGameReleased(entry, now)).map(entry => entry.slug)
}

/** "30 Sept" in London terms — what a locked row shows beside its countdown. */
export function formatReleaseDay(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })
}

/** "Sat 5 Sep, 9:00" — the whole promise, for the admin page and the locked game page. */
export function formatReleaseAt(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London' })
  // h23 so a midnight release reads "00:00" and is dropped, rather than "0:00".
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/London' })
  return time === '00:00' ? day : `${day}, ${time}`
}
