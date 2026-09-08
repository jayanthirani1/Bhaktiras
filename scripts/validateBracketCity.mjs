/**
 * Checks every authored Bracket City puzzle against the rules the game and the
 * play page rely on.
 *
 * Run with: node scripts/validateBracketCity.mjs [file]
 *
 * With no argument it checks data/bracketCityCharitra.ts. Pass a .json file
 * holding an array of puzzles to check a batch before it is merged in.
 *
 * The puzzles are parsed with the app's own parseBracketSource rather than a
 * copy of it, so a puzzle that passes here cannot fail to render. Node cannot
 * resolve Nuxt's `~/` aliases, so the two source files are copied to a temp
 * directory with their imports rewritten, and run through Node's type
 * stripping. Nothing in the repo is modified.
 */
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Minimum and maximum clues, matching the daily generator's own bounds. */
const MIN_CLUES = 4
const MAX_CLUES = 8

/** Words too common to count as a title spoiler when they appear as an answer. */
const TITLE_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'from',
  'with', 'his', 'her', 'their', 'is', 'are', 'was', 'were', 'be', 'it', 'its'
])

function normalize(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
}

async function loadModules() {
  const dir = await mkdtemp(join(tmpdir(), 'bracket-city-'))
  await writeFile(join(dir, 'gameWordBank.ts'), `${normalize.toString().replace('function normalize', 'export function normalizeGameWord')}\n`)

  const parser = await readFile(join(root, 'utils/bracketCity.ts'), 'utf8')
  await writeFile(join(dir, 'bracketCity.ts'), parser.replace("~/utils/gameWordBank", './gameWordBank.ts'))

  const bracket = await import(pathToFileURL(join(dir, 'bracketCity.ts')).href)

  const target = process.argv[2]
  if (target?.endsWith('.json')) {
    return { bracket, puzzles: JSON.parse(await readFile(target, 'utf8')), source: target }
  }

  const file = target || 'data/bracketCityCharitra.ts'
  const data = await readFile(join(root, file), 'utf8')
  await writeFile(join(dir, 'charitra.ts'), data.replace(/^import type .*$/m, ''))
  const loaded = await import(pathToFileURL(join(dir, 'charitra.ts')).href)
  return { bracket, puzzles: loaded.CHARITRA_BRACKET_CITY_PUZZLES, source: file }
}

/** The sentence a player is left with once every bracket is solved. */
function solvedText(parts) {
  return parts
    .map(part => (typeof part === 'string' ? part : solvedText(part.parts) && part.answer))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Clue text only, with nested clues replaced by their answers. */
function clueText(node) {
  return node.parts
    .map(part => (typeof part === 'string' ? part : part.answer))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

const { bracket, puzzles, source } = await loadModules()
const problems = []
const seenIds = new Map()

for (const puzzle of puzzles) {
  const where = puzzle.id || '(no id)'
  const fail = message => problems.push(`${where}: ${message}`)

  if (!puzzle.id) fail('has no id')
  else if (seenIds.has(puzzle.id)) fail('duplicate id')
  else seenIds.set(puzzle.id, true)

  if (!puzzle.title) fail('has no title — the play page shows it')
  if (!puzzle.credit) fail('has no credit')
  if (puzzle.published !== true) fail('is not published')

  let nodes
  try {
    const parsed = bracket.parseBracketSource(puzzle.source)
    nodes = bracket.flattenNodes(parsed)
    const solved = solvedText(parsed)
    if (!/[.!?]$/.test(solved)) fail('solved sentence does not end in punctuation')
    if (solved.split(/\s+/).length < 20) fail('solved sentence is too short to read as a summary')
  } catch (error) {
    fail(`does not parse — ${error.message}`)
    continue
  }

  if (nodes.length < MIN_CLUES) fail(`has ${nodes.length} clues, fewer than ${MIN_CLUES}`)
  if (nodes.length > MAX_CLUES) fail(`has ${nodes.length} clues, more than ${MAX_CLUES}`)

  // Every answer must be distinct, or solving one gives another away.
  const answers = nodes.map(node => normalize(node.answer))
  for (const answer of new Set(answers)) {
    if (answers.filter(item => item === answer).length > 1) fail(`answer "${answer}" is used more than once`)
  }

  // A clue must never name an answer the player has not reached yet. Its own
  // nested children are the exception — a parent clue reads through them, which
  // is the whole mechanic.
  for (const node of nodes) {
    const words = new Set(clueText(node).split(/[^A-Za-z]+/).map(normalize).filter(Boolean))
    for (const other of nodes) {
      if (other.id === node.id) continue
      if (other.id.startsWith(`${node.id}.`)) continue
      if (words.has(normalize(other.answer))) fail(`clue for "${node.answer}" names the answer "${other.answer}"`)
    }
  }

  // The title is displayed while playing, so it must not give an answer away.
  const titleWords = new Set(
    String(puzzle.title).split(/[^A-Za-z]+/).filter(word => !TITLE_STOPWORDS.has(word.toLowerCase())).map(normalize).filter(Boolean)
  )
  for (const node of nodes) {
    if (titleWords.has(normalize(node.answer))) fail(`title "${puzzle.title}" gives away the answer "${node.answer}"`)
  }
}

const byPart = new Map()
for (const puzzle of puzzles) {
  const part = /Part (\d+)/.exec(puzzle.credit || '')?.[1] ?? '?'
  byPart.set(part, (byPart.get(part) || 0) + 1)
}

console.log(`${puzzles.length} puzzles checked in ${source}`)
console.log([...byPart.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([part, n]) => `  Part ${part}: ${n}`).join('\n'))

if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}:`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}
console.log('\nAll puzzles parse and follow the authoring rules.')
