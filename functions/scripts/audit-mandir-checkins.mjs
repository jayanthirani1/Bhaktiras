/**
 * Audit Daily Darshan check-ins against launch + daily rules.
 *
 * Rules:
 * - Launch day (2026-08-29): evening only, max 1 sabha
 * - Other days since launch: max 2 sabhas (one morning, one evening)
 * - Lifetime cap grows by day since launch (1 + 2 per full day)
 *
 * Usage:
 *   node functions/scripts/audit-mandir-checkins.mjs
 *   node functions/scripts/audit-mandir-checkins.mjs --fix --dry-run
 *   node functions/scripts/audit-mandir-checkins.mjs --fix
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CHALLENGE_ID = 'mandir-darshan'
const LAUNCH_DAY = '2026-08-29'
const DOUBLE_TAP_MS = 2 * 60 * 1000
const EVENING_HOUR = 14

const dryRun = process.argv.includes('--dry-run')
const doFix = process.argv.includes('--fix')
const nameArg = process.argv.find(a => a.startsWith('--name='))
const userArg = process.argv.find(a => a.startsWith('--user='))
const filterName = nameArg ? nameArg.split('=').slice(1).join('=').trim() : ''
const filterUserId = userArg ? userArg.split('=')[1]?.trim() : ''

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

function ukDateIdNow() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function addUkDays(id, days) {
  const [year, month, day] = id.split('-').map(Number)
  if (!year || !month || !day) return id
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function maxSabhasForDay(dayKey) {
  if (dayKey < LAUNCH_DAY) return 0
  if (dayKey === LAUNCH_DAY) return 1
  return 2
}

function maxTotalSinceLaunch(todayId = ukDateIdNow()) {
  if (todayId < LAUNCH_DAY) return 0
  let total = 0
  let day = LAUNCH_DAY
  while (day <= todayId) {
    total += maxSabhasForDay(day)
    day = addUkDays(day, 1)
  }
  return total
}

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

function amountOf(data) {
  const n = Math.floor(Number(data?.amount) || 0)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function ukHourOf(ms) {
  if (!ms) return 0
  return Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: 'numeric',
    hourCycle: 'h23'
  }).format(new Date(ms)))
}

function slotOf(row) {
  const amount = amountOf(row)
  if (amount >= 2) return { morning: true, evening: true }
  if (row.checkinSlot === 'morning' || row.checkinSlot === 'evening') {
    return {
      morning: row.checkinSlot === 'morning',
      evening: row.checkinSlot === 'evening'
    }
  }
  const slot = ukHourOf(createdMs(row)) < EVENING_HOUR ? 'morning' : 'evening'
  return { morning: slot === 'morning', evening: slot === 'evening' }
}

function reasonLabel(reason) {
  switch (reason) {
    case 'before-launch': return 'Before launch day'
    case 'launch-morning': return 'Morning sabha on launch day'
    case 'launch-both': return 'Both sabhas on launch day'
    case 'daily-cap': return 'Over daily sabha limit'
    case 'duplicate-slot': return 'Duplicate morning/evening slot'
    case 'double-tap': return 'Within 2 minutes of previous'
    case 'lifetime-cap': return 'Over lifetime limit since launch'
    default: return reason
  }
}

function partitionDayRows(dayKey, rows) {
  const sorted = [...rows].sort((a, b) => createdMs(a) - createdMs(b) || a.id.localeCompare(b.id))
  const keep = []
  const remove = []
  const dailyMax = maxSabhasForDay(dayKey)

  if (dayKey < LAUNCH_DAY) {
    return { keep: [], remove: sorted.map(row => ({ row, reason: 'before-launch' })) }
  }

  let morning = false
  let evening = false
  let total = 0
  let lastKeptMs = 0

  for (const row of sorted) {
    const amount = amountOf(row)
    const ms = createdMs(row)
    const slots = slotOf(row)
    let reason = null

    if (dayKey === LAUNCH_DAY && amount >= 2) reason = 'launch-both'
    else if (dayKey === LAUNCH_DAY && slots.morning) reason = 'launch-morning'
    else if (total + amount > dailyMax) reason = 'daily-cap'
    else if (dailyMax >= 2 && slots.morning && morning) reason = 'duplicate-slot'
    else if (dailyMax >= 2 && slots.evening && evening) reason = 'duplicate-slot'
    else if (lastKeptMs && ms && ms - lastKeptMs < DOUBLE_TAP_MS) reason = 'double-tap'

    if (reason) {
      remove.push({ row, reason })
      continue
    }

    keep.push(row)
    total += amount
    morning = morning || slots.morning
    evening = evening || slots.evening
    if (ms) lastKeptMs = ms
  }

  return { keep, remove }
}

function trimLifetime(keepRows, lifetimeMax) {
  const sorted = [...keepRows].sort((a, b) => createdMs(a) - createdMs(b) || a.id.localeCompare(b.id))
  const keep = []
  const remove = []
  let total = 0

  for (const row of sorted) {
    const amount = amountOf(row)
    if (total + amount <= lifetimeMax) {
      keep.push(row)
      total += amount
    } else {
      remove.push({ row, reason: 'lifetime-cap' })
    }
  }

  return { keep, remove }
}

async function loadSubmissions() {
  const snap = await db.collection('niyamSubmissions')
    .where('challengeId', '==', CHALLENGE_ID)
    .get()

  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(row => row.status !== 'rejected')
    .filter(row => !filterUserId || row.userId === filterUserId)
    .filter(row => !filterName || String(row.userName || '').trim() === filterName)
}

function groupByUser(rows) {
  const byUser = new Map()
  for (const row of rows) {
    const key = row.userId || 'unknown'
    if (!byUser.has(key)) {
      byUser.set(key, {
        userId: key,
        userName: String(row.userName || 'Devotee').trim() || 'Devotee',
        rows: []
      })
    }
    const entry = byUser.get(key)
    entry.rows.push(row)
    if (row.userName) entry.userName = String(row.userName).trim()
  }
  return [...byUser.values()].sort((a, b) => a.userName.localeCompare(b.userName))
}

function chunk(items, size) {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

async function deleteRows(rows) {
  for (const batch of chunk(rows, 400)) {
    const write = db.batch()
    batch.forEach(row => write.delete(db.doc(`niyamSubmissions/${row.id}`)))
    await write.commit()
  }
}

async function main() {
  const lifetimeMax = maxTotalSinceLaunch()
  console.log(`Daily Darshan audit${doFix ? (dryRun ? ' (fix dry run)' : ' (FIX LIVE)') : ''}`)
  console.log(`Launch day: ${LAUNCH_DAY} · Lifetime max through today: ${lifetimeMax}`)
  if (filterName) console.log(`Filter name: ${filterName}`)
  if (filterUserId) console.log(`Filter user: ${filterUserId}`)

  const rows = await loadSubmissions()
  const users = groupByUser(rows)
  const offenders = []
  const allToRemove = []

  for (const user of users) {
    const byDay = new Map()
    for (const row of user.rows) {
      const dayKey = String(row.dayKey || '').trim() || 'unknown-day'
      if (!byDay.has(dayKey)) byDay.set(dayKey, [])
      byDay.get(dayKey).push(row)
    }

    let keptRows = []
    const invalid = []

    for (const [dayKey, dayRows] of byDay) {
      const { keep, remove } = partitionDayRows(dayKey, dayRows)
      keptRows.push(...keep)
      invalid.push(...remove.map(item => ({ ...item, dayKey })))
    }

    const lifetimeTrim = trimLifetime(keptRows, lifetimeMax)
    keptRows = lifetimeTrim.keep
    invalid.push(...lifetimeTrim.remove.map(item => ({ ...item, dayKey: item.row.dayKey || '?' })))

    if (!invalid.length) continue

    const totalSabhas = user.rows.reduce((sum, row) => sum + amountOf(row), 0)
    const keptSabhas = keptRows.reduce((sum, row) => sum + amountOf(row), 0)
    const removedSabhas = totalSabhas - keptSabhas

    for (const item of invalid) allToRemove.push(item.row)

    offenders.push({
      userId: user.userId,
      userName: user.userName,
      submissions: user.rows.length,
      totalSabhas,
      keptSabhas,
      removedSabhas,
      invalidCount: invalid.length,
      invalid
    })
  }

  offenders.sort((a, b) => b.removedSabhas - a.removedSabhas)

  if (!offenders.length) {
    console.log('\nAll check-ins are within launch, daily, and lifetime limits.')
    return
  }

  console.log(`\nFound ${offenders.length} devotee(s) with invalid check-ins:\n`)

  for (const person of offenders) {
    console.log(`${person.userName} (${person.userId})`)
    console.log(`  Current: ${person.totalSabhas} sabhas → should be ${person.keptSabhas} (−${person.removedSabhas})`)
    for (const item of person.invalid) {
      const row = item.row
      console.log(`    - ${row.dayKey || item.dayKey} · ${amountOf(row)} sabha · ${reasonLabel(item.reason)} · ${row.id}`)
    }
    console.log('')
  }

  console.log(`Summary: ${allToRemove.length} submission(s) to delete, ${offenders.reduce((s, p) => s + p.removedSabhas, 0)} excess sabha(s)`)

  if (!doFix) {
    console.log('\nRun with --fix --dry-run to preview deletes, or --fix to delete.')
    return
  }

  if (dryRun) {
    console.log('\nDry run — no deletes.')
    return
  }

  await deleteRows(allToRemove)
  console.log('\nDeleted invalid submissions. Recompute totals with:')
  console.log('  node functions/scripts/recompute-niyam-stats.mjs --challenge=mandir-darshan')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
