export interface SpellingBeePuzzle {
  middleLetter: string
  availableLetters: string
  answers: string[]
}

export function getHiveLetters(puzzle: SpellingBeePuzzle): string[] {
  return puzzle.availableLetters.toUpperCase().split('').sort()
}

export function getMiddleLetter(puzzle: SpellingBeePuzzle): string {
  return puzzle.middleLetter.toUpperCase()
}

export function isValidSpellingBeeWord(word: string, puzzle: SpellingBeePuzzle): boolean {
  const w = word.toUpperCase().trim()
  if (w.length < 4) return false
  if (!w.includes(puzzle.middleLetter.toUpperCase())) return false
  const allowed = new Set(puzzle.availableLetters.toUpperCase().split(''))
  for (const c of w) {
    if (!allowed.has(c)) return false
  }
  return puzzle.answers.includes(w)
}

export function isPangram(word: string, puzzle: SpellingBeePuzzle): boolean {
  const w = word.toUpperCase()
  const letters = new Set(puzzle.availableLetters.toUpperCase().split(''))
  return letters.size === 7 && [...letters].every((c) => w.includes(c))
}

export function spellingBeePoints(word: string, puzzle: SpellingBeePuzzle): number {
  const w = word.toUpperCase().trim()
  if (w.length === 4) return 1
  if (isPangram(w, puzzle)) return w.length + 7
  return w.length
}

export const SPELLING_BEE_PUZZLES: SpellingBeePuzzle[] = [
  {
    middleLetter: 'a',
    availableLetters: 'aeklmrt',
    answers: ['altar', 'area', 'armlet', 'karma', 'late', 'later', 'latter', 'malt', 'mare', 'mark', 'mart', 'mate', 'mater', 'meal', 'meat', 'metre', 'rake', 'rate', 'real', 'ream', 'tale', 'talk', 'tame', 'teak', 'teal', 'team', 'tear', 'term', 'tram', 'treat', 'tree', 'trek']
  },
  {
    middleLetter: 'i',
    availableLetters: 'bdhilnt',
    answers: ['bind', 'blind', 'blint', 'dint', 'hilt', 'hind', 'hint', 'lint', 'ninth', 'tilt', 'tint']
  },
  {
    middleLetter: 'e',
    availableLetters: 'cehlopt',
    answers: ['cell', 'chop', 'clop', 'cope', 'echo', 'elect', 'hello', 'help', 'hole', 'hope', 'hotel', 'lope', 'peel', 'peep', 'pelt', 'poet', 'pole', 'poll', 'pope', 'tech', 'teeth', 'temple', 'topee']
  }
]

export function getRandomPuzzle(): SpellingBeePuzzle {
  return SPELLING_BEE_PUZZLES[Math.floor(Math.random() * SPELLING_BEE_PUZZLES.length)]
}
