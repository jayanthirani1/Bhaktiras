import { ukDateId } from '~/utils/gameDay'

export type PlayGameSlug =
  | 'wordle'
  | 'mini-crossword'
  | 'one-percent'
  | 'crossword'
  | 'quiz'
  | 'spelling-bee'

function doneKey(slug: PlayGameSlug, dateId = ukDateId()) {
  return `play-done:${slug}:${dateId}`
}

/** Explicit day marker used by games that do not already persist completion. */
export function markPlayDone(slug: PlayGameSlug) {
  if (import.meta.server || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(doneKey(slug), '1')
  } catch {}
}

export function isPlayDone(slug: PlayGameSlug, dateId = ukDateId()): boolean {
  if (import.meta.server || typeof localStorage === 'undefined') return false
  try {
    if (localStorage.getItem(doneKey(slug, dateId)) === '1') return true

    if (slug === 'wordle') {
      const raw = localStorage.getItem('wordle-daily')
      if (!raw) return false
      const data = JSON.parse(raw) as { date?: string; isComplete?: boolean }
      return data.date === dateId && !!data.isComplete
    }

    if (slug === 'mini-crossword') {
      const raw = localStorage.getItem(`mini-crossword:${dateId}`)
      if (!raw) return false
      return !!JSON.parse(raw).solved
    }

    if (slug === 'one-percent') {
      const raw = localStorage.getItem(`one-percent-run:${dateId}`)
      if (!raw) return false
      return !!JSON.parse(raw).finished
    }

    return false
  } catch {
    return false
  }
}

export function readPlayCompletion(slugs: PlayGameSlug[]): Record<PlayGameSlug, boolean> {
  const out = {} as Record<PlayGameSlug, boolean>
  for (const slug of slugs) out[slug] = isPlayDone(slug)
  return out
}
