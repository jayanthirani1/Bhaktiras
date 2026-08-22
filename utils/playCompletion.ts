import { ukDateId } from '~/utils/gameDay'

export type PlayGameSlug =
  | 'wordle'
  | 'mini-crossword'
  | 'one-percent'
  | 'connections'
  | 'bracket-city'
  | 'bhakti-marg'
  | 'ras-rani'

export interface PlayCompletionEntry {
  /** Game-specific headline number (guesses, cleared rungs, words found). */
  score?: number
  timeMs?: number
  /** Short human summary, e.g. "4/6" or "12/20 correct". */
  detail?: string
}

function doneKey(slug: PlayGameSlug, dateId = ukDateId()) {
  return `play-done:${slug}:${dateId}`
}

/** Records today's completion on this device. */
export function markPlayDoneLocally(slug: PlayGameSlug, meta: PlayCompletionEntry = {}) {
  if (import.meta.server || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(doneKey(slug), JSON.stringify(meta))
  } catch {}
}

export function readLocalPlayCompletion(
  slug: PlayGameSlug,
  dateId = ukDateId()
): PlayCompletionEntry | null {
  if (import.meta.server || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(doneKey(slug, dateId))
    if (raw) {
      // Older builds stored a bare "1".
      return raw === '1' ? {} : (JSON.parse(raw) as PlayCompletionEntry)
    }

    if (slug === 'wordle') {
      const state = localStorage.getItem('wordle-daily')
      if (!state) return null
      const data = JSON.parse(state) as { date?: string; isComplete?: boolean; guesses?: string[] }
      if (data.date !== dateId || !data.isComplete) return null
      return { score: data.guesses?.length }
    }

    if (slug === 'mini-crossword') {
      const state = localStorage.getItem(`mini-crossword:${dateId}`)
      if (!state) return null
      return JSON.parse(state).solved ? {} : null
    }

    if (slug === 'one-percent') {
      const state = localStorage.getItem(`one-percent-run:${dateId}`)
      if (!state) return null
      const data = JSON.parse(state)
      return data.finished ? { score: Number(data.cleared) || 0 } : null
    }

    if (slug === 'bracket-city') {
      const state = localStorage.getItem(`bracket-city:${dateId}`)
      if (!state) return null
      const data = JSON.parse(state)
      return data.finished ? { score: Number(data.peekedIds?.length) || 0 } : null
    }

    if (slug === 'bhakti-marg') {
      const state = localStorage.getItem(`bhakti-marg:${dateId}`)
      if (!state) return null
      const data = JSON.parse(state)
      return data.finished ? { score: Number(data.moves) || 0 } : null
    }

    if (slug === 'ras-rani') {
      const state = localStorage.getItem(`ras-rani-v3:${dateId}`) || localStorage.getItem(`ras-rani:${dateId}`)
      if (!state) return null
      const data = JSON.parse(state)
      return data.finished ? { score: Number(data.moves) || 0 } : null
    }

    return null
  } catch {
    return null
  }
}

export function isPlayDoneLocally(slug: PlayGameSlug, dateId = ukDateId()): boolean {
  return !!readLocalPlayCompletion(slug, dateId)
}
