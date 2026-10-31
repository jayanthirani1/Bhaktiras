/**
 * Lists the Ras Rani puzzle for each of the next 60 UK days and fails unless
 * every difficulty tier varies. Also checks that days before
 * `RAS_RANI_ROTATION_FROM` still get the old string-hash pick, so past and
 * in-progress days rebuild the same puzzle on the server.
 *
 *   node scripts/checkRasRaniRotation.mjs
 *
 * Needs Node 22.18+ (imports the .ts data file with built-in type stripping).
 */
import {
  RAS_RANI_PUZZLES,
  RAS_RANI_ROTATION_FROM,
  getRasRaniPuzzleForDate,
  inferRasRaniDifficulty,
  rasRaniDifficultyForDate
} from '../data/rasRaniPuzzles.ts'

const ukDateId = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)

function addDays(id, days) {
  const [y, m, d] = id.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

function legacyPick(dateId) {
  const published = RAS_RANI_PUZZLES.filter(p => p.published !== false && !p.dateId)
  const difficulty = rasRaniDifficultyForDate(dateId)
  const pool = published.filter(p => (p.difficulty || inferRasRaniDifficulty(p.gridSize)) === difficulty)
  const choices = pool.length ? pool : published
  const seed = [...dateId].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 2166136261)
  return choices[seed % choices.length]
}

let failed = false
const today = ukDateId()

const bankByTier = {}
for (const p of RAS_RANI_PUZZLES.filter(p => p.published !== false && !p.dateId)) {
  const tier = p.difficulty || inferRasRaniDifficulty(p.gridSize)
  bankByTier[tier] = (bankByTier[tier] || 0) + 1
}
console.log('Published bank by tier:', bankByTier)
console.log(`Today ${today}: ${getRasRaniPuzzleForDate(today).id} (rotation from ${RAS_RANI_ROTATION_FROM})\n`)

const seen = {}
for (let i = 1; i <= 60; i++) {
  const dateId = addDays(today, i)
  const tier = rasRaniDifficultyForDate(dateId)
  const { id } = getRasRaniPuzzleForDate(dateId)
  ;(seen[tier] ||= new Set()).add(id)
  console.log(`${dateId}  ${tier.padEnd(6)}  ${id}`)
}

console.log('')
for (const [tier, ids] of Object.entries(seen)) {
  const ok = ids.size > 1
  if (!ok) failed = true
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${tier}: ${ids.size} distinct (${[...ids].join(', ')})`)
}

let changed = 0
for (let i = 0; i < 730; i++) {
  const dateId = addDays(RAS_RANI_ROTATION_FROM, -1 - i)
  if (getRasRaniPuzzleForDate(dateId).id !== legacyPick(dateId).id) changed++
}
if (changed) failed = true
console.log(`${changed ? 'FAIL' : 'ok  '} ${changed} of 730 days before ${RAS_RANI_ROTATION_FROM} changed puzzle`)

process.exit(failed ? 1 : 0)
