const { onCall, HttpsError } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()

const ALLOWED_TOPICS = new Set(['all', 'announcements', 'games'])
const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered'
])
const GAME_ACHIEVEMENTS = {
  wordle: [
    { id: 'wordle-first-win', when: ({ wordleWins }) => wordleWins >= 1 },
    { id: 'wordle-wins-7', when: ({ wordleWins }) => wordleWins >= 7 },
    { id: 'wordle-wins-30', when: ({ wordleWins }) => wordleWins >= 30 },
    { id: 'wordle-wins-100', when: ({ wordleWins }) => wordleWins >= 100 },
    { id: 'wordle-wins-200', when: ({ wordleWins }) => wordleWins >= 200 },
    { id: 'wordle-wins-300', when: ({ wordleWins }) => wordleWins >= 300 },
    { id: 'wordle-three-guesses-10', when: ({ wordleThreeGuesses }) => wordleThreeGuesses >= 10 },
    { id: 'wordle-one-guess', when: ({ guesses }) => guesses <= 1 }
  ],
  crossword: [
    { id: 'crossword-first-win', when: ({ crosswordWins }) => crosswordWins >= 1 },
    { id: 'crossword-wins-7', when: ({ crosswordWins }) => crosswordWins >= 7 },
    { id: 'crossword-wins-30', when: ({ crosswordWins }) => crosswordWins >= 30 },
    { id: 'crossword-wins-100', when: ({ crosswordWins }) => crosswordWins >= 100 },
    { id: 'crossword-wins-200', when: ({ crosswordWins }) => crosswordWins >= 200 },
    { id: 'crossword-wins-300', when: ({ crosswordWins }) => crosswordWins >= 300 },
    { id: 'crossword-sub-30s', when: ({ timeMs }) => timeMs < 30_000 },
    { id: 'crossword-sub-15s', when: ({ timeMs }) => timeMs < 15_000 }
  ],
  connections: [
    { id: 'connections-first-win', when: ({ connectionsWins }) => connectionsWins >= 1 },
    { id: 'connections-wins-15', when: ({ connectionsWins }) => connectionsWins >= 15 },
    { id: 'connections-wins-100', when: ({ connectionsWins }) => connectionsWins >= 100 },
    { id: 'connections-wins-200', when: ({ connectionsWins }) => connectionsWins >= 200 },
    { id: 'connections-wins-300', when: ({ connectionsWins }) => connectionsWins >= 300 },
    { id: 'connections-perfect', when: ({ won, mistakes }) => won === true && mistakes === 0 },
    { id: 'connections-perfect-10', when: ({ connectionsPerfect }) => connectionsPerfect >= 10 }
  ],
  'one-percent': [
    { id: 'one-percent-first-play', when: ({ onePercentRuns }) => onePercentRuns >= 1 },
    { id: 'one-percent-club', when: ({ onePercentClubClears }) => onePercentClubClears >= 1 },
    { id: 'one-percent-club-clears-10', when: ({ onePercentClubClears }) => onePercentClubClears >= 10 },
    { id: 'one-percent-days-100', when: ({ onePercentRuns }) => onePercentRuns >= 100 },
    { id: 'one-percent-days-200', when: ({ onePercentRuns }) => onePercentRuns >= 200 },
    { id: 'one-percent-days-300', when: ({ onePercentRuns }) => onePercentRuns >= 300 },
    { id: 'one-percent-club-3-days', when: ({ clubStreak, onePercentClubLongestStreak }) => Math.max(clubStreak || 0, onePercentClubLongestStreak || 0) >= 3 },
    { id: 'one-percent-club-7-days', when: ({ clubStreak, onePercentClubLongestStreak }) => Math.max(clubStreak || 0, onePercentClubLongestStreak || 0) >= 7 },
    { id: 'one-percent-club-14-days', when: ({ clubStreak, onePercentClubLongestStreak }) => Math.max(clubStreak || 0, onePercentClubLongestStreak || 0) >= 14 },
    { id: 'one-percent-club-30-days', when: ({ clubStreak, onePercentClubLongestStreak }) => Math.max(clubStreak || 0, onePercentClubLongestStreak || 0) >= 30 }
  ],
  streak: [
    { id: 'streak-7', when: ({ longestStreak }) => longestStreak >= 7 },
    { id: 'streak-30', when: ({ longestStreak }) => longestStreak >= 30 },
    { id: 'streak-100', when: ({ longestStreak }) => longestStreak >= 100 },
    { id: 'streak-200', when: ({ longestStreak }) => longestStreak >= 200 },
    { id: 'streak-300', when: ({ longestStreak }) => longestStreak >= 300 }
  ]
}

function cleanText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

function chunks(items, size) {
  const result = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

function subscriptionMatches(topics, topic) {
  if (topic === 'all') return true
  if (!Array.isArray(topics)) return false
  if (topic === 'announcements') {
    return topics.includes('announcements')
      || topics.includes('patotsav')
      || topics.includes('events')
  }
  return topics.includes(topic)
}

function intInRange(value, min, max) {
  const parsed = Math.trunc(Number(value))
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null
  return parsed
}

function isBetterFastestWordle(current, candidate) {
  if (!current) return true
  if (candidate.timeMs !== Number(current.timeMs)) return candidate.timeMs < Number(current.timeMs)
  if (candidate.guesses !== Number(current.guesses)) return candidate.guesses < Number(current.guesses)
  return false
}

function isBetterFewestGuessWordle(current, candidate) {
  if (!current) return true
  if (candidate.guesses !== Number(current.guesses)) return candidate.guesses < Number(current.guesses)
  if (candidate.timeMs !== Number(current.timeMs)) return candidate.timeMs < Number(current.timeMs)
  return false
}

function isBetterFastestTime(current, candidate) {
  if (!current) return true
  return candidate.timeMs < Number(current.timeMs)
}

function isBetterHighScore(current, candidate) {
  if (!current) return true
  if (candidate.score !== Number(current.score || current.value)) return candidate.score > Number(current.score || current.value)
  if (candidate.words !== Number(current.words || 0)) return candidate.words > Number(current.words || 0)
  return false
}

function ukDateIdNow() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function previousUkDate(id) {
  const [year, month, day] = String(id || '').split('-').map(Number)
  if (!year || !month || !day) return ''
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

function readStats(data) {
  const stats = { ...(data?.stats || {}) }
  if (stats.onePercentClubCurrentStreak == null && data?.onePercentClubCurrentStreak != null) {
    stats.onePercentClubCurrentStreak = data.onePercentClubCurrentStreak
    stats.onePercentClubLongestStreak = data.onePercentClubLongestStreak
    stats.onePercentClubLastDate = data.onePercentClubLastDate
  }
  return stats
}

function bumpOncePerDay(stats, countKey, dateKey, today) {
  if (stats[dateKey] === today) return
  stats[countKey] = (Number(stats[countKey]) || 0) + 1
  stats[dateKey] = today
}

function applyGameStats(game, candidate, stats, today) {
  if (game === 'wordle') {
    bumpOncePerDay(stats, 'wordleWins', 'wordleWinsDate', today)
    if (candidate.guesses <= 3) bumpOncePerDay(stats, 'wordleThreeGuesses', 'wordleThreeGuessesDate', today)
  } else if (game === 'crossword') {
    bumpOncePerDay(stats, 'crosswordWins', 'crosswordWinsDate', today)
  } else if (game === 'connections' && candidate.won) {
    bumpOncePerDay(stats, 'connectionsWins', 'connectionsWinsDate', today)
    if (candidate.mistakes === 0) bumpOncePerDay(stats, 'connectionsPerfect', 'connectionsPerfectDate', today)
  } else if (game === 'one-percent') {
    bumpOncePerDay(stats, 'onePercentRuns', 'onePercentRunsDate', today)
    const streak = nextOnePercentClubStreak(stats, candidate.clearedAll === true)
    stats.onePercentClubCurrentStreak = streak.current
    stats.onePercentClubLongestStreak = streak.longest
    stats.onePercentClubLastDate = streak.last
    candidate.clubStreak = streak.current
    if (candidate.clearedAll) bumpOncePerDay(stats, 'onePercentClubClears', 'onePercentClubClearsDate', today)
  }
  Object.assign(candidate, stats)
}

function nextOnePercentClubStreak(data, clearedAll) {
  const today = ukDateIdNow()
  const last = String(data?.onePercentClubLastDate || '')
  let current = Math.max(0, Number(data?.onePercentClubCurrentStreak) || 0)
  const longest = Math.max(0, Number(data?.onePercentClubLongestStreak) || 0)
  if (clearedAll) {
    if (last === today) {
      return { current, longest: Math.max(longest, current), last: today, changed: false }
    }
    current = last && last === previousUkDate(today) ? current + 1 : 1
    return { current, longest: Math.max(longest, current), last: today, changed: true }
  }
  if (last === today) {
    return { current, longest, last, changed: false }
  }
  return { current: 0, longest, last: today, changed: current !== 0 || last !== today }
}

function isBetterOnePercentScore(current, candidate) {
  if (!current) return true
  const currentScore = Number(current.score || current.value)
  if (candidate.score !== currentScore) return candidate.score > currentScore
  return candidate.timeMs < Number(current.timeMs || Infinity)
}

function isBetterLongestStreak(current, candidate) {
  if (!current) return true
  return candidate.longestStreak > Number(current.longestStreak || current.value)
}

const SITE_ORIGIN = process.env.BHAKTRAS_SITE_ORIGIN || 'https://skssw-bhaktiras.web.app'

// Older builds saved `patotsav` / `events`; both mean announcements today.
const TOPIC_ALIASES = {
  announcements: ['announcements', 'patotsav', 'events'],
  games: ['games']
}

/** At most one automatic new-event push per window, so a bulk import cannot storm. */
const NEW_EVENT_THROTTLE_MS = 15 * 60 * 1000

async function requireAdmin(request) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in as an admin.')
  const db = getFirestore()
  const admin = await db.doc(`admins/${request.auth.uid}`).get()
  if (!admin.exists || admin.data().active === false) {
    throw new HttpsError('permission-denied', 'Admin access required.')
  }
  return request.auth.uid
}

function toRecipient(doc) {
  const data = doc.data()
  return { ref: doc.ref, token: data.token, updatedAt: data.updatedAt }
}

function hasToken(item) {
  return typeof item.token === 'string' && item.token.length > 0
}

/**
 * Subscriptions for one audience. Narrowed in the query rather than by reading
 * the whole collection, so cost stays proportional to the audience.
 *
 * A topic query filters `enabled` in memory on purpose: pairing it with
 * array-contains-any would need a composite index, and the deploy service
 * account cannot create those. Turning notifications off deletes the document,
 * so the flag only ever excludes a handful of legacy records.
 */
async function loadRecipients(db, topic) {
  const collection = db.collection('pushSubscriptions')
  const snap = topic === 'all'
    ? await collection.where('enabled', '==', true).get()
    : await collection.where('topics', 'array-contains-any', TOPIC_ALIASES[topic] || [topic]).get()
  return snap.docs
    .filter(doc => doc.data().enabled === true)
    .map(toRecipient)
    .filter(hasToken)
}

/** Every enabled subscription belonging to one account, for test sends. */
async function loadOwnRecipients(db, uid) {
  const snap = await db.collection('pushSubscriptions').where('userId', '==', uid).get()
  return snap.docs.filter(doc => doc.data().enabled === true).map(toRecipient).filter(hasToken)
}

/**
 * Fans a message out to already-resolved recipients.
 * Data-only so the client SW / foreground listener always owns display.
 * A notification payload would auto-show in background and skip onMessage while focused.
 */
async function pushToRecipients({ recipients, title, body, topic, url }) {
  const link = new URL(url || '/', SITE_ORIGIN).href
  let successCount = 0
  let failureCount = 0
  const staleRefs = []
  const errorCodes = []

  for (const batch of chunks(recipients, 500)) {
    const response = await getMessaging().sendEachForMulticast({
      tokens: batch.map(item => item.token),
      data: {
        title,
        body,
        url: url || '/',
        topic,
        tag: `bhaktiras-${topic}`
      },
      webpush: {
        fcmOptions: { link },
        headers: { Urgency: 'high' }
      }
    })
    successCount += response.successCount
    failureCount += response.failureCount
    response.responses.forEach((result, index) => {
      if (result.success) return
      const code = result.error?.code || 'unknown'
      errorCodes.push(code)
      const savedAt = batch[index].updatedAt
      logger.error('Push delivery failed', {
        code,
        message: result.error?.message,
        subscription: batch[index].ref.id,
        tokenSavedAt: savedAt?.toDate?.().toISOString() || null,
        tokenAgeSeconds: savedAt?.toDate
          ? Math.round((Date.now() - savedAt.toDate().getTime()) / 1000)
          : null
      })
      if (INVALID_TOKEN_CODES.has(code)) staleRefs.push(batch[index].ref)
    })
  }

  return { successCount, failureCount, errorCodes, staleRefs }
}

/** How many test sends are kept per admin before the oldest are dropped. */
const TEST_INBOX_KEEP = 10

/**
 * Keeps a private copy of a test send so the sender can see the inbox row.
 *
 * These cannot go in `notifications`: every signed-in user reads that, so a
 * test would surface in the whole community's bell. This subcollection is
 * readable only by the admin who triggered it.
 */
async function recordTestNotification(db, uid, { title, body, topic, url }) {
  const messages = db.collection('testNotifications').doc(uid).collection('messages')
  await messages.add({
    title,
    body,
    topic,
    url: url || '/',
    test: true,
    createdAt: FieldValue.serverTimestamp()
  })
  const stale = await messages.orderBy('createdAt', 'desc').offset(TEST_INBOX_KEEP).get()
  if (stale.empty) return
  const write = db.batch()
  stale.docs.forEach(doc => write.delete(doc.ref))
  await write.commit()
}

async function pruneStaleSubscriptions(db, staleRefs) {
  for (const staleBatch of chunks(staleRefs, 400)) {
    const write = db.batch()
    staleBatch.forEach(ref => write.delete(ref))
    await write.commit()
  }
}

/**
 * Sends to a topic, records the delivery audit, and — unless `inbox` is false —
 * keeps a copy readable in the app so a missed OS notification is not lost.
 */
async function deliverNotification({ title, body, topic, url, sentBy, inbox = topic !== 'games' }) {
  const db = getFirestore()
  const recipients = await loadRecipients(db, topic)
  const outcome = await pushToRecipients({ recipients, title, body, topic, url })
  await pruneStaleSubscriptions(db, outcome.staleRefs)

  const uniqueErrorCodes = Array.from(new Set(outcome.errorCodes))
  const writes = [
    db.collection('pushMessages').add({
      title,
      body,
      topic,
      url,
      sentBy,
      inbox,
      recipientCount: recipients.length,
      successCount: outcome.successCount,
      failureCount: outcome.failureCount,
      errorCodes: uniqueErrorCodes,
      createdAt: FieldValue.serverTimestamp()
    })
  ]
  if (inbox) {
    writes.push(db.collection('notifications').add({
      title,
      body,
      topic,
      url: url || '/',
      createdAt: FieldValue.serverTimestamp()
    }))
  }
  await Promise.all(writes)

  return {
    recipientCount: recipients.length,
    successCount: outcome.successCount,
    failureCount: outcome.failureCount,
    errorCodes: uniqueErrorCodes
  }
}

/** Shared validation for both the live send and the admin-only test send. */
function readNotificationInput(data) {
  const title = cleanText(data?.title, 80)
  const body = cleanText(data?.body, 240)
  const topic = cleanText(data?.topic, 20) || 'all'
  const url = String(data?.url || '/').trim().slice(0, 300)
  if (title.length < 3 || body.length < 3) {
    throw new HttpsError('invalid-argument', 'Add a title and message.')
  }
  if (!ALLOWED_TOPICS.has(topic)) {
    throw new HttpsError('invalid-argument', 'Unknown audience.')
  }
  if (!url.startsWith('/')) {
    throw new HttpsError('invalid-argument', 'Notification links must start with /.')
  }
  return { title, body, topic, url }
}

exports.sendPushNotification = onCall(
  { region: 'europe-west2', timeoutSeconds: 120 },
  async (request) => {
    const uid = await requireAdmin(request)
    const input = readNotificationInput(request.data)
    const inbox = request.data?.inbox == null
      ? input.topic !== 'games'
      : request.data.inbox === true
    return deliverNotification({ ...input, inbox, sentBy: uid })
  }
)

/**
 * Sends the drafted notification to the admin's own devices only. Nothing is
 * logged and nothing reaches the inbox, so a draft can be checked for real
 * before it goes out to everyone.
 */
exports.sendTestPushNotification = onCall(
  { region: 'europe-west2', timeoutSeconds: 60 },
  async (request) => {
    const uid = await requireAdmin(request)
    const input = readNotificationInput(request.data)
    const db = getFirestore()
    const recipients = await loadOwnRecipients(db, uid)
    if (!recipients.length) {
      throw new HttpsError(
        'failed-precondition',
        'Turn notifications on for this account first, then send yourself a test.'
      )
    }
    const outcome = await pushToRecipients({ recipients, ...input })
    await pruneStaleSubscriptions(db, outcome.staleRefs)
    // Mirror the real send's inbox decision, so the test reflects what will happen.
    const inbox = request.data?.inbox == null
      ? input.topic !== 'games'
      : request.data.inbox === true
    if (inbox) await recordTestNotification(db, uid, input)
    return {
      recipientCount: recipients.length,
      successCount: outcome.successCount,
      failureCount: outcome.failureCount,
      errorCodes: Array.from(new Set(outcome.errorCodes)),
      inbox
    }
  }
)

/** How many devices each audience currently reaches, shown before sending. */
exports.getPushAudience = onCall(
  { region: 'europe-west2', timeoutSeconds: 60 },
  async (request) => {
    await requireAdmin(request)
    const db = getFirestore()
    const snap = await db.collection('pushSubscriptions').where('enabled', '==', true).get()
    const counts = { all: 0, announcements: 0, games: 0 }
    snap.docs.forEach((doc) => {
      const data = doc.data()
      if (typeof data.token !== 'string' || !data.token) return
      counts.all += 1
      if (subscriptionMatches(data.topics, 'announcements')) counts.announcements += 1
      if (subscriptionMatches(data.topics, 'games')) counts.games += 1
    })
    return counts
  }
)

async function handleGameAchievements(request) {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in to unlock achievements.')

  const game = String(request.data?.game || '')
  if (!GAME_ACHIEVEMENTS[game]) throw new HttpsError('invalid-argument', 'Unknown game.')

  const userName = cleanText(request.data?.userName, 32) || 'Player'
  const uid = request.auth.uid
  const db = getFirestore()
  const userRef = db.doc(`userAchievements/${uid}`)
  const candidate = { holderUserId: uid, holderName: userName }
  const crownSpecs = []

  if (game === 'wordle') {
    const guesses = intInRange(request.data?.guesses, 1, 6)
    const timeMs = intInRange(request.data?.timeMs, 0, 86_400_000)
    if (guesses == null) throw new HttpsError('invalid-argument', 'Invalid Wordle guess count.')
    if (timeMs == null) throw new HttpsError('invalid-argument', 'Invalid Wordle time.')
    Object.assign(candidate, { guesses, timeMs })
    crownSpecs.push(
      { id: 'wordle-fastest', metric: 'fastest-time', value: timeMs, better: isBetterFastestWordle, extra: { guesses, timeMs } },
      { id: 'wordle-fewest-guesses', metric: 'fewest-guesses', value: guesses, better: isBetterFewestGuessWordle, extra: { guesses, timeMs } }
    )
  } else if (game === 'crossword') {
    const timeMs = intInRange(request.data?.timeMs, 0, 86_400_000)
    if (timeMs == null) throw new HttpsError('invalid-argument', 'Invalid Crossword time.')
    Object.assign(candidate, { timeMs })
    crownSpecs.push({
      id: 'crossword-fastest',
      metric: 'fastest-time',
      value: timeMs,
      better: isBetterFastestTime,
      extra: { timeMs }
    })
  } else if (game === 'connections') {
    const mistakes = intInRange(request.data?.mistakes, 0, 4)
    const timeMs = intInRange(request.data?.timeMs ?? 0, 0, 86_400_000)
    if (mistakes == null) throw new HttpsError('invalid-argument', 'Invalid Connections mistakes.')
    if (timeMs == null) throw new HttpsError('invalid-argument', 'Invalid Connections time.')
    Object.assign(candidate, { won: request.data?.won === true, mistakes, timeMs })
  } else if (game === 'one-percent') {
    const score = intInRange(request.data?.score, 0, 20)
    const timeMs = intInRange(request.data?.timeMs ?? 0, 0, 86_400_000)
    if (score == null) throw new HttpsError('invalid-argument', 'Invalid 1% Club score.')
    if (timeMs == null) throw new HttpsError('invalid-argument', 'Invalid 1% Club time.')
    const clearedAll = request.data?.clearedAll === true
    Object.assign(candidate, { score, timeMs, clearedAll })
    crownSpecs.push({
      id: 'one-percent-highest',
      metric: 'high-score',
      value: score,
      better: isBetterOnePercentScore,
      extra: { score, timeMs }
    })
    if (clearedAll) {
      crownSpecs.push({
        id: 'one-percent-fastest',
        metric: 'fastest-time',
        value: timeMs,
        better: isBetterFastestTime,
        extra: { score, timeMs }
      })
    }
  } else if (game === 'streak') {
    const streakSnap = await db.doc(`playStreaks/${uid}`).get()
    if (!streakSnap.exists) return { unlockedIds: [], crowns: [] }
    const longestStreak = intInRange(streakSnap.data().longestStreak, 1, 10_000)
    if (longestStreak == null) throw new HttpsError('failed-precondition', 'Invalid streak record.')
    Object.assign(candidate, { longestStreak })
    crownSpecs.push({
      id: 'streak-longest',
      metric: 'longest-streak',
      value: longestStreak,
      better: isBetterLongestStreak,
      extra: { longestStreak }
    })
  }

  const crownRefs = crownSpecs.map(spec => db.doc(`achievementCrowns/${spec.id}`))
  const unlockedIds = []
  const claimedCrownIds = []

  await db.runTransaction(async (transaction) => {
    const snaps = await Promise.all([
      transaction.get(userRef),
      ...crownRefs.map(ref => transaction.get(ref))
    ])
    const userSnap = snaps[0]
    const existingData = userSnap.exists ? userSnap.data() : {}
    const existingAchievements = existingData.achievements || {}
    const nextAchievements = { ...existingAchievements }
    const stats = readStats(existingData)
    applyGameStats(game, candidate, stats, ukDateIdNow())

    for (const achievement of GAME_ACHIEVEMENTS[game]) {
      if (!achievement.when(candidate) || nextAchievements[achievement.id]) continue
      unlockedIds.push(achievement.id)
      nextAchievements[achievement.id] = {
        ...Object.fromEntries(Object.entries(candidate).filter(([key]) => key !== 'holderUserId' && key !== 'holderName')),
        unlockedAt: FieldValue.serverTimestamp()
      }
    }

    transaction.set(userRef, {
      userId: uid,
      achievements: nextAchievements,
      stats,
      onePercentClubCurrentStreak: stats.onePercentClubCurrentStreak || 0,
      onePercentClubLongestStreak: stats.onePercentClubLongestStreak || 0,
      onePercentClubLastDate: stats.onePercentClubLastDate || '',
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })

    crownSpecs.forEach((spec, index) => {
      const current = snaps[index + 1].exists ? snaps[index + 1].data() : null
      if (!spec.better(current, candidate)) return
      claimedCrownIds.push(spec.id)
      transaction.set(crownRefs[index], {
        holderUserId: uid,
        holderName: userName,
        game,
        metric: spec.metric,
        scope: 'all-time',
        value: spec.value,
        ...spec.extra,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true })
    })
  })

  const crownsSnap = await Promise.all(crownRefs.map(ref => ref.get()))
  const crowns = crownsSnap
    .filter(snap => snap.exists)
    .map((snap) => ({ id: snap.id, ...snap.data() }))

  return { unlockedIds, claimedCrownIds, crowns }
}

exports.processGameAchievements = onCall(
  { region: 'europe-west2', timeoutSeconds: 60 },
  handleGameAchievements
)

exports.processWordleAchievements = onCall(
  { region: 'europe-west2', timeoutSeconds: 60 },
  (request) => handleGameAchievements({
    ...request,
    data: { ...request.data, game: 'wordle' }
  })
)

/**
 * A gentle daily reminder for users who opted in after completing a game.
 * Kept out of the inbox — a daily nudge would bury real announcements.
 */
exports.sendDailyGameReminder = onSchedule(
  { region: 'europe-west2', schedule: '30 8 * * *', timeZone: 'Europe/London' },
  () => deliverNotification({
    title: 'Today’s Bhaktiras games are ready',
    body: 'Keep your streak going with today’s satsang challenges.',
    topic: 'games',
    url: '/play',
    inbox: false,
    sentBy: 'system:daily-games'
  })
)

/**
 * Claims the right to send an automatic new-event push, at most once per
 * window. A seed or bulk import creates many event documents at once; without
 * this every one of them would become its own notification.
 */
async function claimNewEventSlot(db) {
  const ref = db.doc('systemState/eventNotifications')
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref)
    const last = snap.exists ? snap.data().lastNotifiedAt?.toMillis?.() ?? 0 : 0
    if (Date.now() - last < NEW_EVENT_THROTTLE_MS) return false
    transaction.set(ref, { lastNotifiedAt: FieldValue.serverTimestamp() }, { merge: true })
    return true
  })
}

/** Creating an event in Admin publishes it immediately, so notify event subscribers. */
exports.notifyNewEvent = onDocumentCreated(
  { document: 'events/{eventId}', region: 'europe-west2' },
  async (event) => {
    const data = event.data?.data() || {}
    if (data.notifyOnPublish === false) return
    if (!await claimNewEventSlot(getFirestore())) {
      logger.info('Skipped new-event push', {
        reason: 'throttled',
        eventId: event.params.eventId
      })
      return
    }
    const eventTitle = cleanText(data.title, 80) || 'A new event'
    const date = cleanText(data.date, 40)
    return deliverNotification({
      title: 'New Bhaktiras event',
      body: date ? `${eventTitle} · ${date}` : `${eventTitle} has just been added.`,
      topic: 'announcements',
      url: '/events',
      sentBy: 'system:new-event'
    })
  }
)
