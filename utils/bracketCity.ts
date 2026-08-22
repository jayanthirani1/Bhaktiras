import { normalizeGameWord } from '~/utils/gameWordBank'

/**
 * Bracket City puzzle format.
 *
 * A puzzle is one sentence written as a single string. Each `[...]` is a clue;
 * the last top-level `::` inside a bracket separates the clue text from its
 * answer, and `|` lists alternate accepted spellings. Brackets nest freely:
 *
 *   Every morning we do [the lamp ritual before the
 *   [image of God installed in a mandir::murti]::aarti|arti] in the mandir.
 *
 * The player solves innermost-first. Each answer substitutes into its parent
 * clue, which is what makes the next layer readable.
 */

export interface BracketNode {
  /** Stable path id, e.g. "1.0". Used as the solved/peeked key in storage. */
  id: string
  /** Clue text interleaved with child clues. */
  parts: BracketPart[]
  /** Display spelling, shown once solved. */
  answer: string
  /** Extra accepted spellings beyond the normalised answer. */
  alts: string[]
  /** 0 for a top-level clue. */
  depth: number
}

export type BracketPart = string | BracketNode

export class BracketParseError extends Error {}

/**
 * Parses the inline source into a tree. Throws BracketParseError on unbalanced
 * brackets or a clue with no answer, so callers can fall back to another puzzle
 * rather than render an unplayable board.
 */
export function parseBracketSource(source: string): BracketPart[] {
  const text = String(source || '')
  if (!text.trim()) throw new BracketParseError('Puzzle is empty.')

  let index = 0

  function parseParts(path: string, depth: number, insideBracket: boolean): BracketPart[] {
    const parts: BracketPart[] = []
    let buffer = ''
    let childCount = 0

    const flush = () => {
      if (buffer) {
        parts.push(buffer)
        buffer = ''
      }
    }

    while (index < text.length) {
      const char = text[index]

      if (char === '[') {
        index += 1
        flush()
        const childPath = path ? `${path}.${childCount}` : String(childCount)
        parts.push(parseNode(childPath, depth))
        childCount += 1
        continue
      }

      if (char === ']') {
        if (!insideBracket) throw new BracketParseError('Unexpected "]" — one bracket too many.')
        flush()
        return parts
      }

      buffer += char
      index += 1
    }

    if (insideBracket) throw new BracketParseError('Unclosed "[" — one bracket is missing its "]".')
    flush()
    return parts
  }

  function parseNode(path: string, parentDepth: number): BracketNode {
    const depth = parentDepth + 1
    const parts = parseParts(path, depth, true)
    if (text[index] !== ']') throw new BracketParseError('Unclosed "[" — one bracket is missing its "]".')
    index += 1

    // The answer sits after the last `::` in this bracket's own text, so a
    // nested clue that contains `::` cannot be mistaken for the separator.
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i]
      if (typeof part !== 'string') continue
      const at = part.lastIndexOf('::')
      if (at < 0) continue
      if (parts.slice(i + 1).some(rest => typeof rest !== 'string')) {
        throw new BracketParseError('"::answer" must come last in its clue, after any nested clues.')
      }
      const cluePart = part.slice(0, at)
      const answerPart = part.slice(at + 2)
      const clueParts = parts.slice(0, i)
      if (cluePart) clueParts.push(cluePart)
      const spellings = answerPart.split('|').map(spelling => spelling.trim()).filter(Boolean)
      return {
        id: path,
        parts: tidyParts(clueParts),
        answer: spellings[0] || '',
        alts: spellings.slice(1),
        depth: depth - 1
      }
    }

    throw new BracketParseError('A clue has no "::answer" — every bracket needs one.')
  }

  const parsed = parseParts('', 0, false)
  const nodes = flattenNodes(parsed)
  if (!nodes.length) throw new BracketParseError('No clues found — wrap each clue in [square brackets].')
  for (const node of nodes) {
    if (!node.answer) throw new BracketParseError('A clue has an empty answer.')
    if (!clueText(node).trim()) throw new BracketParseError(`"${node.answer}" has no clue text.`)
  }
  return parsed
}

/** Collapses runs of whitespace at the seams left by splitting on `::`. */
function tidyParts(parts: BracketPart[]): BracketPart[] {
  return parts
    .map((part, i) => {
      if (typeof part !== 'string') return part
      let out = part.replace(/\s+/g, ' ')
      if (i === 0) out = out.replace(/^\s+/, '')
      if (i === parts.length - 1) out = out.replace(/\s+$/, '')
      return out
    })
    .filter(part => typeof part !== 'string' || part !== '')
}

/** Every clue in the puzzle, innermost clues before their parents. */
export function flattenNodes(parts: BracketPart[]): BracketNode[] {
  const out: BracketNode[] = []
  for (const part of parts) {
    if (typeof part === 'string') continue
    out.push(...flattenNodes(part.parts))
    out.push(part)
  }
  return out
}

export function childNodes(node: BracketNode): BracketNode[] {
  return node.parts.filter((part): part is BracketNode => typeof part !== 'string')
}

/** A clue can be answered once every clue nested inside it is solved. */
export function isActive(node: BracketNode, solved: Set<string>): boolean {
  if (solved.has(node.id)) return false
  return childNodes(node).every(child => solved.has(child.id))
}

/** Clue text with solved children substituted, as the player currently reads it. */
export function clueText(node: BracketNode, solved: Set<string> = new Set()): string {
  return node.parts
    .map(part => (typeof part === 'string'
      ? part
      : solved.has(part.id) ? part.answer : `[${clueText(part, solved)}]`))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The whole sentence as plain text — used for the puzzle title and previews. */
export function sentenceText(parts: BracketPart[], solved: Set<string> = new Set()): string {
  return parts
    .map(part => (typeof part === 'string'
      ? part
      : solved.has(part.id) ? part.answer : `[${clueText(part, solved)}]`))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * How many single-character slips to forgive in an answer of this length.
 *
 * These answers are transliterations — Chhapaiya, Bhaktimata, Vachnamrut — and
 * there is no one true English spelling of any of them, so a player who knows
 * the answer should not lose to a doubled consonant. Short answers get no
 * latitude, because at three letters almost every other word is one edit away.
 */
export function editsAllowed(answer: string): number {
  if (answer.length <= 3) return 0
  if (answer.length <= 7) return 1
  return 2
}

/** Trailing plural, so "sants" answers a clue whose answer is "sant". */
function singular(value: string): string {
  return value.length >= 4 && value.endsWith('S') ? value.slice(0, -1) : value
}

/**
 * Levenshtein distance, abandoned as soon as it passes `max` — the caller only
 * ever cares whether the guess is within tolerance.
 */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost)
      best = Math.min(best, row[j])
    }
    if (best > max) return max + 1
    prev = row
  }
  return prev[b.length]
}

export interface AnswerMatch {
  ok: boolean
  /** False when the guess only got there on the spelling tolerance. */
  exact: boolean
  /** The canonical spelling the guess matched. */
  spelling: string
}

/**
 * Checks a guess against the answer and its alternates. Normalising through
 * normalizeGameWord() drops spaces, punctuation and diacritics, so "Mangla
 * Aarti", "mangla-aarti" and "MANGLAAARTI" are all exact; beyond that a guess
 * within editsAllowed() of a spelling is accepted as correct.
 */
export function matchAnswer(guess: string, node: BracketNode): AnswerMatch {
  const clean = normalizeGameWord(guess)
  const spellings = [node.answer, ...node.alts]
  if (!clean) return { ok: false, exact: false, spelling: node.answer }

  for (const spelling of spellings) {
    if (normalizeGameWord(spelling) === clean) return { ok: true, exact: true, spelling }
  }
  for (const spelling of spellings) {
    const target = normalizeGameWord(spelling)
    if (!target) continue
    const allowed = editsAllowed(target)
    if (!allowed) continue
    if (singular(clean) === singular(target)) return { ok: true, exact: false, spelling }
    if (editDistance(clean, target, allowed) <= allowed) return { ok: true, exact: false, spelling }
  }
  return { ok: false, exact: false, spelling: node.answer }
}

export function answerMatches(guess: string, node: BracketNode): boolean {
  return matchAnswer(guess, node).ok
}

/**
 * True when two answers are close enough that one would be accepted for the
 * other — "Satsang" and "Satsangi". Two such answers must never appear in the
 * same puzzle, or a correct guess could solve the wrong clue.
 */
export function spellingsCollide(a: string, b: string): boolean {
  const x = normalizeGameWord(a)
  const y = normalizeGameWord(b)
  if (!x || !y) return false
  if (x === y || singular(x) === singular(y)) return true
  const allowed = Math.max(editsAllowed(x), editsAllowed(y))
  return allowed > 0 && editDistance(x, y, allowed) <= allowed
}

/** Builds the source string back from a tree — used by the admin generator button. */
export function serializeParts(parts: BracketPart[]): string {
  return parts
    .map(part => (typeof part === 'string'
      ? part
      : `[${serializeParts(part.parts)}::${[part.answer, ...part.alts].join('|')}]`))
    .join('')
}
