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
 * Accepts a guess if it normalises to the answer or any alternate. Normalising
 * through normalizeGameWord() drops spaces, punctuation and diacritics, so
 * "Mangla Aarti", "mangla-aarti" and "MANGLAAARTI" all match.
 */
export function answerMatches(guess: string, node: BracketNode): boolean {
  const clean = normalizeGameWord(guess)
  if (!clean) return false
  return [node.answer, ...node.alts].some(candidate => normalizeGameWord(candidate) === clean)
}

/** Builds the source string back from a tree — used by the admin generator button. */
export function serializeParts(parts: BracketPart[]): string {
  return parts
    .map(part => (typeof part === 'string'
      ? part
      : `[${serializeParts(part.parts)}::${[part.answer, ...part.alts].join('|')}]`))
    .join('')
}
