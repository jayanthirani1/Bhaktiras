/**
 * Trim mandir check-ins to a target sabha count for named devotees.
 * Keeps the earliest valid submissions; deletes the rest.
 * Deleting submissions triggers syncNiyamChallengeTotals to fix contributor stats.
 *
 * Usage (from repo root, with Firebase admin credentials):
 *   node functions/scripts/fix-mandir-checkins.mjs [--dry-run]
 *
 * After running, recompute totals:
 *   node functions/scripts/recompute-niyam-stats.mjs --challenge=mandir-darshan
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CHALLENGE_ID = 'mandir-darshan'
const TARGETS = [
  { name: 'Kerai123', keepSabhas: 5 },
  { name: 'Roshan Kerai', keepSabhas: 5 },
  { name: 'Venika Hirani', keepSabhas: 3 },
  { name: 'Vinay Kerai', keepSabhas: 5 },
  { name: 'Rashika Halai', keepSabhas: 2 },
  { name: 'Suraj Varsani', keepSabhas: 4 },
  { name: 'P_halai', keepSabhas: 3 }
]
const dryRun = process.argv.includes('--dry-run')

const adcCandidates = [
  join(homedir(), '.config/firebase/hareshvekriya_gmail_com_application_default_credentials.json'),
  process.env.GOOGLE_APPLICATION_CREDENTIALS
].filter(value => typeof value === 'string' && value.length > 0)

const adcPath = adcCandidates.find(path => existsSync(path))
if (adcPath) process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath

initializeApp({
  credential: adcPath ? applicationDefault() : undefined,
  projectId: 'skssw-bhaktiras'
})
const db = getFirestore()

function createdMs(data) {
  const ts = data?.createdAt
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (ts instanceof Date) return ts.getTime()
  if (typeof ts === 'object' && ts.seconds != null) {
    return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6)
  }
  return 0
}

function sabhasOf(data) {
  const n = Math.floor(Number(data?.amount) || 0)
  return Number.isFinite(n) && n > 0 ? n : 0
}

async function submissionsForName(name) {
  const snap = await db.collection('niyamSubmissions')
    .where('challengeId', '==', CHALLENGE_ID)
    .where('userName', '==', name)
    .get()
  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(row => row.status !== 'rejected')
    .sort((a, b) => createdMs(a) - createdMs(b))
}

async function trimUser({ name, keepSabhas }) {
  const rows = await submissionsForName(name)
  const totalSabhas = rows.reduce((sum, row) => sum + sabhasOf(row), 0)
  console.log(`\n${name}: ${rows.length} submission(s), ${totalSabhas} sabha(s) total`)

  if (!rows.length) {
    console.log('  No submissions found.')
    return { name, deleted: 0, kept: 0, keptSabhas: 0 }
  }

  if (totalSabhas <= keepSabhas) {
    console.log(`  Already at or below ${keepSabhas} — nothing to delete.`)
    return { name, deleted: 0, kept: rows.length, keptSabhas: totalSabhas }
  }

  const keep = []
  const remove = []
  let keptSabhas = 0

  for (const row of rows) {
    const amount = sabhasOf(row)
    if (keptSabhas + amount <= keepSabhas) {
      keep.push(row)
      keptSabhas += amount
    } else {
      remove.push(row)
    }
  }

  console.log(`  Keeping ${keep.length} submission(s) (${keptSabhas} sabha(s))`)
  console.log(`  Deleting ${remove.length} submission(s) (${totalSabhas - keptSabhas} sabha(s))`)
  for (const row of remove) {
    console.log(`    - ${row.id} · ${sabhasOf(row)} sabha · ${row.dayKey || '?'} · status=${row.status}`)
  }

  if (!dryRun && remove.length) {
    for (const batch of chunk(remove, 400)) {
      const write = db.batch()
      batch.forEach(row => write.delete(db.doc(`niyamSubmissions/${row.id}`)))
      await write.commit()
    }
    console.log('  Deleted.')
  } else if (dryRun && remove.length) {
    console.log('  Dry run — no deletes.')
  }

  return { name, deleted: remove.length, kept: keep.length, keptSabhas }
}

function chunk(items, size) {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

async function main() {
  console.log(dryRun ? 'DRY RUN' : 'LIVE — trimming mandir check-ins')
  const results = []
  for (const target of TARGETS) {
    results.push(await trimUser(target))
  }
  console.log('\nSummary:', JSON.stringify(results, null, 2))
  if (!dryRun) {
    console.log('\nRecompute totals with:')
    console.log('  node functions/scripts/recompute-niyam-stats.mjs --challenge=mandir-darshan')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
