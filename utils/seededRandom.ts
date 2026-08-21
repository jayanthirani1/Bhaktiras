/**
 * Deterministic randomness for daily puzzles.
 *
 * Every generated game seeds from its date id, so each device builds the same
 * puzzle for the same UK day without a server round trip.
 */

export function mulberry32(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function shuffle<T>(items: T[], rnd: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

/**
 * Seeded generator for a named daily puzzle, e.g. rngForSeed('bracket-city:2026-08-21').
 *
 * The first few outputs of mulberry32 are correlated across nearby seeds, and
 * consecutive dates hash to nearby seeds — without the warm-up, a generator
 * that picks from a list on its first roll lands on the same entry for days on
 * end.
 */
export function rngForSeed(seed: string) {
  const rnd = mulberry32(hashString(seed))
  for (let i = 0; i < 8; i++) rnd()
  return rnd
}
