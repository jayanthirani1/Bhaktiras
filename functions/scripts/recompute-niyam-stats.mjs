/**
 * Rebuild niyamChallengeStats (and contributor rollups) from submissions.
 * Use when totals drift after a wipe or bulk delete.
 *
 *   node functions/scripts/recompute-niyam-stats.mjs [--challenge=mandir-darshan] [--dry-run]
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const dryRun = process.argv.includes('--dry-run')
const challengeArg = process.argv.find(a => a.startsWith('--challenge='))
const onlyChallenge = challengeArg ? challengeArg.split('=')[1] : null

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

function counter(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

function readRow(data) {
  if (!data) return null
  const challengeId = String(data.challengeId || '').trim()
  const userId = String(data.userId || '').trim()
  if (!challengeId || !userId) return null
  const status = data.status === 'approved' ? 'approved' : data.status === 'rejected' ? 'rejected' : 'pending'
  return {
    challengeId,
    userId,
    userName: String(data.userName || 'Devotee').slice(0, 32) || 'Devotee',
    dayKey: String(data.dayKey || '').trim(),
    amount: counter(data.amount),
    status
  }
}

async function loadSubmissions(challengeId) {
  const snap = await db.collection('niyamSubmissions')
    .where('challengeId', '==', challengeId)
    .get()
  return snap.docs.map(doc => ({ id: doc.id, ...readRow(doc.data()) })).filter(Boolean)
}

function recompute(submissions) {
  const stats = {
    approvedTotal: 0,
    pendingTotal: 0,
    approvedCount: 0,
    pendingCount: 0,
    participants: 0,
    dailyTotals: {}
  }
  const contributors = new Map()

  for (const row of submissions) {
    if (row.status === 'approved') {
      stats.approvedTotal += row.amount
      stats.approvedCount += 1
      if (row.dayKey) {
        stats.dailyTotals[row.dayKey] = (stats.dailyTotals[row.dayKey] || 0) + row.amount
      }
    } else if (row.status === 'pending') {
      stats.pendingTotal += row.amount
      stats.pendingCount += 1
    } else {
      continue
    }

    const prev = contributors.get(row.userId) || {
      userId: row.userId,
      userName: row.userName,
      approvedTotal: 0,
      pendingTotal: 0,
      submissionCount: 0
    }
    if (row.status === 'approved') prev.approvedTotal += row.amount
    if (row.status === 'pending') prev.pendingTotal += row.amount
    prev.submissionCount += 1
    prev.userName = row.userName || prev.userName
    contributors.set(row.userId, prev)
  }

  stats.participants = [...contributors.values()].filter(c => c.approvedTotal > 0).length
  return { stats, contributors }
}

async function writeChallenge(challengeId, { stats, contributors }) {
  console.log(`\n${challengeId}:`)
  console.log(`  approvedTotal=${stats.approvedTotal} pendingTotal=${stats.pendingTotal} participants=${stats.participants}`)
  console.log(`  contributors=${contributors.size}`)

  if (dryRun) return

  await db.doc(`niyamChallengeStats/${challengeId}`).set({
    challengeId,
    approvedTotal: stats.approvedTotal,
    pendingTotal: stats.pendingTotal,
    approvedCount: stats.approvedCount,
    pendingCount: stats.pendingCount,
    participants: stats.participants,
    dailyTotals: stats.dailyTotals,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true })

  const existing = await db.collection(`niyamChallenges/${challengeId}/contributors`).get()
  const batch = db.batch()
  for (const doc of existing.docs) batch.delete(doc.ref)

  for (const contributor of contributors.values()) {
    if (contributor.submissionCount <= 0) continue
    batch.set(db.doc(`niyamChallenges/${challengeId}/contributors/${contributor.userId}`), {
      userId: contributor.userId,
      userName: contributor.userName,
      approvedTotal: contributor.approvedTotal,
      pendingTotal: contributor.pendingTotal,
      submissionCount: contributor.submissionCount,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })
  }
  await batch.commit()
}

async function main() {
  const challengeSnap = await db.collection('niyamChallenges').get()
  const ids = challengeSnap.docs.map(d => d.id).filter(id => !onlyChallenge || id === onlyChallenge)
  if (!ids.length) {
    console.log('No matching challenges.')
    return
  }

  for (const challengeId of ids) {
    const submissions = await loadSubmissions(challengeId)
    await writeChallenge(challengeId, recompute(submissions))
  }

  console.log(dryRun ? '\nDry run — no writes.' : '\nDone.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
