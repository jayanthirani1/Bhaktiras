import type { BracketCityPuzzle, GameWordEntry } from '~/types'
import { SATSANG_WORD_BANK, normalizeGameWord } from '~/utils/gameWordBank'
import { rngForSeed, shuffle } from '~/utils/seededRandom'
import { BRACKET_CITY_FRAMES } from '~/data/bracketCityFrames'
import { parseBracketSource, flattenNodes } from '~/utils/bracketCity'

/**
 * The daily Bracket City puzzle, generated from the shared word bank.
 *
 * Roughly half the bank's clues already mention another entry by name — an
 * Abhishek is "ritual bathing of a sacred murti", and Murti is itself an entry.
 * That overlap is the whole generator: pick a word, then swap a word inside its
 * clue for a nested clue of its own, and repeat.
 */

const MIN_CLUE_LENGTH = 18
const MIN_NEST_WORD = 4
/** Levels of nesting, counting the top-level clue as level 1. */
const MAX_DEPTH = 3
const MIN_CLUES = 4
const MAX_CLUES = 8
const FRAME_ATTEMPTS = 6

/**
 * Bank entries whose display is an ordinary English word, so a clue mentioning
 * it in passing must not become a nested clue. Grow this list if a generated
 * puzzle ever reads as nonsense.
 */
const NEST_STOPLIST = new Set(['deep'])

interface NestCandidate {
  entry: GameWordEntry
  start: number
  end: number
}

interface NestIndex {
  list: GameWordEntry[]
  /** How many clues in the bank mention this display at all. */
  mentions: (display: string) => number
}

const nestIndexCache = new WeakMap<GameWordEntry[], NestIndex>()

/** Strips the characters that carry meaning in the puzzle source. */
function clean(value: string): string {
  return String(value || '').replace(/[[\]]/g, '').replace(/::/g, ':').replace(/\|/g, '/').trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function usable(entry: GameWordEntry): boolean {
  if (!entry.display || !entry.clue) return false
  const clue = clean(entry.clue)
  if (clue.length < MIN_CLUE_LENGTH) return false
  if (normalizeGameWord(entry.display).length < 3) return false
  // A clue that says its own answer — "Bhagvan Swaminarayan and his sacred
  // mantra" for Swaminarayan — gives the layer away for free.
  return !new RegExp(`\\b${escapeRegExp(clean(entry.display))}\\b`, 'i').test(clue)
}

/**
 * Bank entries that a clue might mention by name, plus how common each one is.
 *
 * Commonness matters: "Swaminarayan" and "Mantra" turn up in dozens of clues,
 * so an unweighted pick nests them on half of all days. Selection is weighted
 * against them further down.
 */
function buildNestIndex(entries: GameWordEntry[]): NestIndex {
  const cached = nestIndexCache.get(entries)
  if (cached) return cached

  const tokens = new Map<string, number>()
  for (const entry of entries) {
    for (const word of clean(entry.clue).toLowerCase().match(/[a-z']+/g) || []) {
      tokens.set(word, (tokens.get(word) ?? 0) + 1)
    }
  }

  const index: NestIndex = {
    list: entries
      .filter(entry => usable(entry)
        && entry.display.length >= MIN_NEST_WORD
        && !NEST_STOPLIST.has(entry.display.toLowerCase()))
      .sort((a, b) => b.display.length - a.display.length),
    mentions: (display: string) => {
      const words = display.toLowerCase().match(/[a-z']+/g) || []
      if (!words.length) return 0
      return Math.min(...words.map(word => tokens.get(word) ?? 0))
    }
  }

  nestIndexCache.set(entries, index)
  return index
}

/**
 * Picks a nest target from the rarest third of the candidates. Weighting alone
 * is not enough — a bank word like "Swaminarayan" appears in so many clues that
 * it still surfaced every other day — so common words only get nested when the
 * clue offers nothing rarer.
 */
function pickCandidate(candidates: NestCandidate[], index: NestIndex, rnd: () => number): NestCandidate {
  const ranked = [...candidates].sort((a, b) =>
    index.mentions(a.entry.display) - index.mentions(b.entry.display))
  const rarest = ranked.slice(0, Math.max(1, Math.ceil(ranked.length / 3)))
  return rarest[Math.floor(rnd() * rarest.length)]
}

/**
 * Places in `clue` that name another bank entry. Longer displays are checked
 * first so "Shreeji Maharaj" wins over "Maharaj".
 */
function nestCandidates(
  clue: string,
  index: NestIndex,
  blocked: Set<string>,
  ancestors: string[]
): NestCandidate[] {
  const out: NestCandidate[] = []
  for (const entry of index.list) {
    const key = normalizeGameWord(entry.display)
    if (blocked.has(key)) continue

    const match = new RegExp(`\\b${escapeRegExp(entry.display)}\\b`, 'i').exec(clue)
    if (!match) continue

    // A nested clue must not name one of the answers above it, or the puzzle
    // gives itself away before the player reaches that layer.
    const childClue = clean(entry.clue)
    if (ancestors.some(name => new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(childClue))) continue

    const start = match.index
    const end = start + match[0].length
    if (out.some(other => start < other.end && end > other.start)) continue
    out.push({ entry, start, end })
  }
  return out
}

function buildClueSource(
  entry: GameWordEntry,
  depth: number,
  index: NestIndex,
  used: Set<string>,
  ancestors: string[],
  budget: { left: number },
  rnd: () => number
): string {
  const clue = clean(entry.clue)
  const answer = clean(entry.display)
  used.add(normalizeGameWord(answer))

  if (depth >= MAX_DEPTH || budget.left <= 0) return `[${clue}::${answer}]`

  const candidates = nestCandidates(clue, index, used, [...ancestors, answer])
  if (!candidates.length) return `[${clue}::${answer}]`

  const chosen = pickCandidate(candidates, index, rnd)
  budget.left -= 1
  const child = buildClueSource(
    chosen.entry,
    depth + 1,
    index,
    used,
    [...ancestors, answer],
    budget,
    rnd
  )
  const nestedClue = `${clue.slice(0, chosen.start)}${child}${clue.slice(chosen.end)}`
  return `[${nestedClue}::${answer}]`
}

/**
 * Builds the source for one UK day. Returns null when the bank cannot produce a
 * puzzle of at least MIN_CLUES, so the caller can fall back to a seed puzzle
 * rather than publishing a thin board.
 */
export function buildDailyBracketCitySource(
  dateId: string,
  entries: GameWordEntry[] = SATSANG_WORD_BANK
): string | null {
  const pool = entries.filter(usable)
  if (pool.length < 8) return null
  const index = buildNestIndex(entries)

  for (let attempt = 0; attempt < FRAME_ATTEMPTS; attempt++) {
    const rnd = rngForSeed(`bracket-city:${dateId}#${attempt}`)
    const frame = BRACKET_CITY_FRAMES[Math.floor(rnd() * BRACKET_CITY_FRAMES.length)]
    const shuffled = shuffle(pool, rnd)
    const used = new Set<string>()
    const budget = { left: MAX_CLUES - frame.slots }
    const slots: string[] = []

    for (let slot = 0; slot < frame.slots; slot++) {
      // Prefer a word whose clue can carry a nested clue; any unused word will
      // do once the nesting budget is spent.
      const pick = shuffled.find((entry) => {
        if (used.has(normalizeGameWord(entry.display))) return false
        if (budget.left <= 0) return true
        return nestCandidates(clean(entry.clue), index, used, [clean(entry.display)]).length > 0
      }) ?? shuffled.find(entry => !used.has(normalizeGameWord(entry.display)))
      if (!pick) break
      slots.push(buildClueSource(pick, 1, index, used, [], budget, rnd))
    }

    if (slots.length < frame.slots) continue

    const source = frame.template.replace(/\{(\d)\}/g, (_, i) => slots[Number(i)] ?? '')
    try {
      const clues = flattenNodes(parseBracketSource(source)).length
      if (clues >= MIN_CLUES && clues <= MAX_CLUES) return source
    } catch {
      // Malformed roll — try the next frame rather than shipping it.
    }
  }

  return null
}

export function buildDailyBracketCity(
  dateId: string,
  entries: GameWordEntry[] = SATSANG_WORD_BANK
): BracketCityPuzzle | null {
  const source = buildDailyBracketCitySource(dateId, entries)
  if (!source) return null
  return {
    id: `generated-${dateId}`,
    title: 'Bracket City',
    dateId,
    published: true,
    source
  }
}
