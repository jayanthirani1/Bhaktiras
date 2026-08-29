const { onCall, HttpsError } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')
const { getAuth } = require('firebase-admin/auth')

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
  'bracket-city': [
    { id: 'bracket-city-first-win', when: ({ bracketCityWins }) => bracketCityWins >= 1 },
    { id: 'bracket-city-wins-7', when: ({ bracketCityWins }) => bracketCityWins >= 7 },
    { id: 'bracket-city-wins-30', when: ({ bracketCityWins }) => bracketCityWins >= 30 },
    { id: 'bracket-city-wins-100', when: ({ bracketCityWins }) => bracketCityWins >= 100 },
    { id: 'bracket-city-wins-200', when: ({ bracketCityWins }) => bracketCityWins >= 200 },
    { id: 'bracket-city-wins-300', when: ({ bracketCityWins }) => bracketCityWins >= 300 },
    { id: 'bracket-city-no-hints', when: ({ hintsUsed }) => hintsUsed === 0 },
    { id: 'bracket-city-no-hints-10', when: ({ bracketCityNoHints }) => bracketCityNoHints >= 10 },
    { id: 'bracket-city-perfect', when: ({ hintsUsed, mistakes }) => hintsUsed === 0 && mistakes === 0 },
    { id: 'bracket-city-sub-60s', when: ({ timeMs }) => timeMs < 60_000 }
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
  'bhakti-marg': [
    { id: 'bhakti-marg-first-win', when: ({ bhaktiMargWins }) => bhaktiMargWins >= 1 },
    { id: 'bhakti-marg-wins-7', when: ({ bhaktiMargWins }) => bhaktiMargWins >= 7 },
    { id: 'bhakti-marg-wins-30', when: ({ bhaktiMargWins }) => bhaktiMargWins >= 30 },
    { id: 'bhakti-marg-wins-100', when: ({ bhaktiMargWins }) => bhaktiMargWins >= 100 },
    { id: 'bhakti-marg-wins-200', when: ({ bhaktiMargWins }) => bhaktiMargWins >= 200 },
    { id: 'bhakti-marg-wins-300', when: ({ bhaktiMargWins }) => bhaktiMargWins >= 300 },
    { id: 'bhakti-marg-no-hints', when: ({ hintsUsed }) => hintsUsed === 0 },
    { id: 'bhakti-marg-no-hints-10', when: ({ bhaktiMargNoHints }) => bhaktiMargNoHints >= 10 },
    { id: 'bhakti-marg-sub-60s', when: ({ timeMs }) => timeMs < 60_000 }
  ],
  'ras-rani': [
    { id: 'ras-rani-first-win', when: ({ rasRaniWins }) => rasRaniWins >= 1 },
    { id: 'ras-rani-wins-7', when: ({ rasRaniWins }) => rasRaniWins >= 7 },
    { id: 'ras-rani-wins-30', when: ({ rasRaniWins }) => rasRaniWins >= 30 },
    { id: 'ras-rani-wins-100', when: ({ rasRaniWins }) => rasRaniWins >= 100 },
    { id: 'ras-rani-wins-200', when: ({ rasRaniWins }) => rasRaniWins >= 200 },
    { id: 'ras-rani-wins-300', when: ({ rasRaniWins }) => rasRaniWins >= 300 },
    { id: 'ras-rani-no-hints', when: ({ hintsUsed }) => hintsUsed === 0 },
    { id: 'ras-rani-no-hints-10', when: ({ rasRaniNoHints }) => rasRaniNoHints >= 10 },
    { id: 'ras-rani-sub-60s', when: ({ timeMs }) => timeMs < 60_000 }
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
  } else if (game === 'bracket-city') {
    bumpOncePerDay(stats, 'bracketCityWins', 'bracketCityWinsDate', today)
    if (candidate.hintsUsed === 0) bumpOncePerDay(stats, 'bracketCityNoHints', 'bracketCityNoHintsDate', today)
  } else if (game === 'one-percent') {
    bumpOncePerDay(stats, 'onePercentRuns', 'onePercentRunsDate', today)
    const streak = nextOnePercentClubStreak(stats, candidate.clearedAll === true)
    stats.onePercentClubCurrentStreak = streak.current
    stats.onePercentClubLongestStreak = streak.longest
    stats.onePercentClubLastDate = streak.last
    candidate.clubStreak = streak.current
    if (candidate.clearedAll) bumpOncePerDay(stats, 'onePercentClubClears', 'onePercentClubClearsDate', today)
  } else if (game === 'bhakti-marg') {
    bumpOncePerDay(stats, 'bhaktiMargWins', 'bhaktiMargWinsDate', today)
    if (candidate.hintsUsed === 0) bumpOncePerDay(stats, 'bhaktiMargNoHints', 'bhaktiMargNoHintsDate', today)
  } else if (game === 'ras-rani') {
    bumpOncePerDay(stats, 'rasRaniWins', 'rasRaniWinsDate', today)
    if (candidate.hintsUsed === 0) bumpOncePerDay(stats, 'rasRaniNoHints', 'rasRaniNoHintsDate', today)
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

function isBetterFewestMoves(current, candidate) {
  if (!current) return true
  const currentMoves = Number(current.moves || current.value)
  if (candidate.moves !== currentMoves) return candidate.moves < currentMoves
  return candidate.timeMs < Number(current.timeMs || Infinity)
}

function isBetterFewestPeeks(current, candidate) {
  if (!current) return true
  const currentPeeks = Number(current.score || current.value)
  if (candidate.score !== currentPeeks) return candidate.score < currentPeeks
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

/**
 * Record-break pushes are the most frequent automatic send, so the window is
 * wider. One an hour keeps them feeling like news rather than noise.
 */
const RECORD_THROTTLE_MS = 60 * 60 * 1000

/** How each crown reads in a notification. */
const CROWN_LABELS = {
  'wordle-fastest': 'fastest Wordle',
  'wordle-fewest-guesses': 'fewest-guess Wordle',
  'crossword-fastest': 'fastest Crossword',
  'bracket-city-fastest': 'fastest Bracket City',
  'bracket-city-fewest-peeks': 'fewest-peek Bracket City',
  'one-percent-highest': 'highest 1% Club score',
  'one-percent-fastest': 'fastest 1% Club clear',
  'bhakti-marg-fastest': 'fastest Surya Chandra',
  'bhakti-marg-fewest-moves': 'fewest-move Surya Chandra',
  'ras-rani-fastest': 'fastest Ras Rani',
  'ras-rani-fewest-moves': 'fewest-move Ras Rani',
  'streak-longest': 'longest play streak'
}

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
  return { ref: doc.ref, token: data.token, updatedAt: data.updatedAt, userId: data.userId }
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
async function deliverNotification({ title, body, topic, url, sentBy, inbox = topic !== 'games', excludeUserId = null }) {
  const db = getFirestore()
  const all = await loadRecipients(db, topic)
  // Someone who just did the thing does not need telling about it.
  const recipients = excludeUserId ? all.filter(item => item.userId !== excludeUserId) : all
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

/**
 * Tells everyone when a record actually changes hands.
 *
 * Deliberately narrow. A crown claimed on an empty board is not a record being
 * broken, and beating your own time is not news to anyone — including the
 * player, who already sees the achievement toast in the app. So this fires only
 * when a crown is taken from a different person, skips the breaker's own
 * devices, and takes at most one slot per hour however many crowns changed.
 */
async function announceRecords({ db, name, uid, claimedCrowns }) {
  const broken = claimedCrowns.filter(crown =>
    crown.id !== 'streak-longest'
    && crown.previousHolderId
    && crown.previousHolderId !== uid)
  if (!broken.length) return

  logger.info('Record broken', {
    uid,
    crowns: broken.map(crown => ({ id: crown.id, from: crown.previousHolderId }))
  })
  if (!await claimNotificationSlot(db, 'recordNotifications', RECORD_THROTTLE_MS)) {
    logger.info('Skipped record push', {
      reason: 'throttled',
      crowns: broken.map(crown => crown.id)
    })
    return
  }

  const [first] = broken
  const label = CROWN_LABELS[first.id] || 'record'
  // The previous holder is named only in the log. Their stored name came from
  // client input on an earlier claim, and this text goes to the whole community.
  const body = broken.length > 1
    ? `${name} just took ${broken.length} Bhaktiras records, including the ${label}.`
    : `${name} just beat the ${label} record.`

  await deliverNotification({
    title: 'New Bhaktiras record',
    body,
    topic: 'games',
    url: '/play/achievements',
    inbox: true,
    excludeUserId: uid,
    sentBy: 'system:record-broken'
  })
}

/**
 * Aggregate figures for the admin Insights page.
 *
 * Everything here is a count. No per-person record is returned, and no
 * third-party analytics is involved — the privacy policy promises both.
 * Niyam challenge submissions are deliberately untouched: the policy states a
 * devotee's own niyam count is personal, "not to compare individuals".
 */

const OVERVIEW_CACHE_MS = 60 * 1000
const HISTORY_DAYS = 30
let overviewCache = null

function daysAgo(days) {
  return Date.now() - days * 86_400_000
}

function ukDateId(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

function recentDateIds(days) {
  const ids = []
  for (let index = 0; index < days; index += 1) {
    ids.push(ukDateId(new Date(Date.now() - index * 86_400_000)))
  }
  return ids
}

function platformOf(userAgent) {
  const value = String(userAgent || '')
  if (/iPhone|iPad|iPod/i.test(value)) return 'iOS'
  if (/Android/i.test(value)) return 'Android'
  if (/Macintosh|Windows|Linux|CrOS/i.test(value)) return 'Desktop'
  return 'Other'
}

/**
 * Activity comes from lastRefreshTime, not lastSignInTime. A Firebase session
 * persists for months, so lastSignInTime only moves when somebody is signed out
 * and signs back in — counting it would report almost nobody as active.
 */
async function collectAccountStats() {
  const day1 = daysAgo(1)
  const day7 = daysAgo(7)
  const day30 = daysAgo(30)
  const stats = {
    total: 0,
    newLast7: 0,
    newLast30: 0,
    activeLast1: 0,
    activeLast7: 0,
    activeLast30: 0,
    neverActive: 0,
    google: 0,
    password: 0
  }

  let pageToken
  do {
    const page = await getAuth().listUsers(1000, pageToken)
    for (const user of page.users) {
      stats.total += 1
      const created = Date.parse(user.metadata?.creationTime || '') || 0
      if (created >= day7) stats.newLast7 += 1
      if (created >= day30) stats.newLast30 += 1

      const seen = Date.parse(user.metadata?.lastRefreshTime || '')
        || Date.parse(user.metadata?.lastSignInTime || '')
        || 0
      if (!seen) stats.neverActive += 1
      if (seen >= day1) stats.activeLast1 += 1
      if (seen >= day7) stats.activeLast7 += 1
      if (seen >= day30) stats.activeLast30 += 1

      const providers = (user.providerData || []).map(item => item.providerId)
      if (providers.includes('google.com')) stats.google += 1
      else if (providers.includes('password')) stats.password += 1
    }
    pageToken = page.pageToken
  } while (pageToken)

  return stats
}

async function collectPushStats(db) {
  const snap = await db.collection('pushSubscriptions').where('enabled', '==', true).get()
  const accounts = new Set()
  const platforms = { iOS: 0, Android: 0, Desktop: 0, Other: 0 }
  let devices = 0
  let announcements = 0
  let games = 0

  snap.docs.forEach((docSnap) => {
    const data = docSnap.data()
    if (typeof data.token !== 'string' || !data.token) return
    devices += 1
    if (data.userId) accounts.add(data.userId)
    platforms[platformOf(data.platform)] += 1
    if (subscriptionMatches(data.topics, 'announcements')) announcements += 1
    if (subscriptionMatches(data.topics, 'games')) games += 1
  })

  return { devices, accounts: accounts.size, announcements, games, platforms }
}

/**
 * A single 7-day range read serves today's figures and the week's.
 * dateId is a sortable YYYY-MM-DD string, so a >= range needs only the automatic
 * single-field index.
 *
 * This used to read 30 days to feed the trend chart as well, which was wasted
 * work: pruneOldGameScores clears every finished day for the daily-reset games
 * each morning, so there is no history in here to read.
 */
async function collectGameStats(db) {
  const ids = recentDateIds(7)
  const today = ids[0]
  const earliest = ids[ids.length - 1]
  const week = new Set(ids)
  const snap = await db.collection('gameScores').where('dateId', '>=', earliest).get()

  const todayPlayers = new Set()
  const weekPlayers = new Set()
  const playsPerGame = {}
  let playsThisWeek = 0

  snap.docs.forEach((docSnap) => {
    const data = docSnap.data()
    const dateId = String(data.dateId || '')
    const userId = data.userId ? String(data.userId) : null
    if (week.has(dateId)) {
      playsThisWeek += 1
      if (userId) weekPlayers.add(userId)
    }
    if (dateId !== today) return
    if (userId) todayPlayers.add(userId)
    const game = String(data.game || 'other') === 'bhakti-marg' ? 'surya-chandra' : String(data.game || 'other')
    playsPerGame[game] = (playsPerGame[game] || 0) + 1
  })

  return {
    playersToday: todayPlayers.size,
    playersThisWeek: weekPlayers.size,
    playsThisWeek,
    playsPerGame
  }
}

/**
 * The 30-day active-members trend, read from the nightly dailyStats snapshots.
 *
 * Site-wide active members cannot be reconstructed from auth records: each one
 * carries a single lastRefreshTime, so bucketing them by day would show "last
 * seen", not who was active on each day. recordDailyStats snapshots the real
 * figure nightly, and that snapshot is the only history there is.
 *
 * Two rules keep the chart honest:
 *
 * - A day with no snapshot is null, never zero. Zero says "nobody opened
 *   Bhaktiras that day"; the days before the snapshot job existed are simply
 *   unrecorded, and drawing them as zero flattened the whole chart.
 * - Today has no snapshot yet — it is written late in the evening — so it is
 *   filled from the live count this same request has already worked out.
 *   Without it the series stopped at yesterday and plunged to zero for today.
 */
async function collectHistory(db, days, activeToday) {
  const ids = recentDateIds(days).reverse()
  const today = ids[ids.length - 1]
  // Fetched by document reference, not by query. Ordering a query by document
  // id descending is not covered by Firestore's automatic single-field indexes
  // and needs a composite one — which the deploy service account has no
  // permission to create. Document ids are the dates, so they are already known.
  const snaps = await db.getAll(...ids.map(id => db.doc(`dailyStats/${id}`)))
  const snapshots = new Map(
    snaps.filter(docSnap => docSnap.exists).map(docSnap => [docSnap.id, docSnap.data()])
  )

  function recorded(dateId) {
    const value = snapshots.get(dateId)?.activeMembers
    return value == null ? null : Number(value) || 0
  }

  const points = ids.map(dateId => ({
    dateId,
    activeMembers: dateId === today && activeToday != null ? activeToday : recorded(dateId)
  }))
  return { points, measured: ids.filter(dateId => recorded(dateId) != null).length }
}

/**
 * Returns the spread of accepted policy versions rather than a single "current"
 * count, so the page can compare against its own PRIVACY_POLICY_VERSION and the
 * version string never has to be duplicated here.
 */
async function collectPolicyStats(db) {
  const snap = await db.collection('users').get()
  const versions = {}
  snap.docs.forEach((docSnap) => {
    const version = String(docSnap.data().privacyPolicyVersion || 'unknown')
    versions[version] = (versions[version] || 0) + 1
  })
  return { profiles: snap.size, versions }
}

/** Fresh objects, never shared constants — callers mutate what they get back. */
function emptyAccounts() {
  return {
    total: 0,
    newLast7: 0,
    newLast30: 0,
    activeLast1: 0,
    activeLast7: 0,
    activeLast30: 0,
    neverActive: 0,
    google: 0,
    password: 0
  }
}
function emptyPush() {
  return { devices: 0, accounts: 0, announcements: 0, games: 0, platforms: {} }
}
function emptyGames() {
  return {
    playersToday: 0,
    playersThisWeek: 0,
    playsThisWeek: 0,
    playsPerGame: {}
  }
}
function emptyPolicy() {
  return { profiles: 0, versions: {} }
}
function emptyHistory() {
  return { points: [], measured: 0 }
}

/**
 * Runs one section of the dashboard in isolation.
 *
 * A single failing query should degrade its own panel, not blank the page — and
 * an unhandled throw in a callable reaches the client as a bare "internal",
 * which tells an admin nothing. This reports the section by name instead.
 */
async function section(name, fallback, task, errors) {
  try {
    return await task()
  } catch (error) {
    logger.error('Insights section failed', {
      section: name,
      code: error?.code,
      message: error?.message
    })
    errors.push({ section: name, message: String(error?.message || error).slice(0, 300) })
    return fallback()
  }
}

exports.getAdminOverview = onCall(
  { region: 'europe-west2', timeoutSeconds: 120 },
  async (request) => {
    await requireAdmin(request)
    const fresh = request.data?.refresh === true
    if (!fresh && overviewCache && Date.now() - overviewCache.computedAt < OVERVIEW_CACHE_MS) {
      return { ...overviewCache, cached: true }
    }

    const db = getFirestore()
    const errors = []
    const [accounts, push, games, policy] = await Promise.all([
      section('Members', emptyAccounts, () => collectAccountStats(), errors),
      section('Notification reach', emptyPush, () => collectPushStats(db), errors),
      section('Games', emptyGames, () => collectGameStats(db), errors),
      section('Privacy policy', emptyPolicy, () => collectPolicyStats(db), errors)
    ])

    // Today's point comes from the live count above — but only if it was
    // actually counted. If the Members section failed, its zeroed fallback is
    // not a measurement, and charting it would invent a dead day.
    const membersFailed = errors.some(item => item.section === 'Members')
    const history = await section(
      'Activity trend',
      emptyHistory,
      () => collectHistory(db, HISTORY_DAYS, membersFailed ? null : accounts.activeLast1),
      errors
    )

    const payload = { accounts, push, games, policy, history, errors, computedAt: Date.now() }
    // A failed run is not cached, so refreshing actually retries.
    if (!errors.length) overviewCache = payload
    return { ...payload, cached: false }
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
  } else if (game === 'bracket-city') {
    const timeMs = intInRange(request.data?.timeMs, 0, 86_400_000)
    const peeks = intInRange(request.data?.hintsUsed ?? request.data?.score ?? 0, 0, 200)
    const mistakes = intInRange(request.data?.mistakes ?? 0, 0, 1000)
    if (timeMs == null) throw new HttpsError('invalid-argument', 'Invalid Bracket City time.')
    if (peeks == null) throw new HttpsError('invalid-argument', 'Invalid Bracket City peeks.')
    if (mistakes == null) throw new HttpsError('invalid-argument', 'Invalid Bracket City mistakes.')
    Object.assign(candidate, { timeMs, hintsUsed: peeks, mistakes, score: peeks })
    crownSpecs.push(
      { id: 'bracket-city-fastest', metric: 'fastest-time', value: timeMs, better: isBetterFastestTime, extra: { timeMs, score: peeks } },
      { id: 'bracket-city-fewest-peeks', metric: 'fewest-peeks', value: peeks, better: isBetterFewestPeeks, extra: { score: peeks, timeMs } }
    )
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
  } else if (game === 'bhakti-marg') {
    const moves = intInRange(request.data?.moves, 1, 1000)
    const timeMs = intInRange(request.data?.timeMs, 0, 86_400_000)
    const hintsUsed = intInRange(request.data?.hintsUsed ?? 0, 0, 100)
    if (moves == null) throw new HttpsError('invalid-argument', 'Invalid Surya Chandra move count.')
    if (timeMs == null) throw new HttpsError('invalid-argument', 'Invalid Surya Chandra time.')
    if (hintsUsed == null) throw new HttpsError('invalid-argument', 'Invalid Surya Chandra hints.')
    Object.assign(candidate, { moves, timeMs, hintsUsed })
    crownSpecs.push(
      { id: 'bhakti-marg-fastest', metric: 'fastest-time', value: timeMs, better: isBetterFastestTime, extra: { moves, timeMs } },
      { id: 'bhakti-marg-fewest-moves', metric: 'fewest-moves', value: moves, better: isBetterFewestMoves, extra: { moves, timeMs } }
    )
  } else if (game === 'ras-rani') {
    const moves = intInRange(request.data?.moves, 1, 1000)
    const timeMs = intInRange(request.data?.timeMs, 0, 86_400_000)
    const hintsUsed = intInRange(request.data?.hintsUsed ?? 0, 0, 100)
    if (moves == null) throw new HttpsError('invalid-argument', 'Invalid Ras Rani move count.')
    if (timeMs == null) throw new HttpsError('invalid-argument', 'Invalid Ras Rani time.')
    if (hintsUsed == null) throw new HttpsError('invalid-argument', 'Invalid Ras Rani hints.')
    Object.assign(candidate, { moves, timeMs, hintsUsed })
    crownSpecs.push(
      { id: 'ras-rani-fastest', metric: 'fastest-time', value: timeMs, better: isBetterFastestTime, extra: { moves, timeMs } },
      { id: 'ras-rani-fewest-moves', metric: 'fewest-moves', value: moves, better: isBetterFewestMoves, extra: { moves, timeMs } }
    )
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
  const claimedCrowns = []

  await db.runTransaction(async (transaction) => {
    // A contended transaction runs its callback more than once, so anything
    // collected here has to start empty on every attempt or it double-counts.
    unlockedIds.length = 0
    claimedCrownIds.length = 0
    claimedCrowns.length = 0
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
      // Captured here because the write below is about to overwrite it.
      claimedCrowns.push({
        id: spec.id,
        previousHolderId: current?.holderUserId || null,
        previousHolderName: current?.holderName || null
      })
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

  try {
    // Not request.data.userName: that is client-supplied, and this text is
    // broadcast to everyone. The signed-in identity is the only trustworthy
    // source for a name that leaves the account it belongs to.
    await announceRecords({
      db,
      uid,
      claimedCrowns,
      name: cleanText(request.auth?.token?.name, 32) || 'A player'
    })
  } catch (error) {
    // The player's result is already saved; a failed announcement must not
    // turn a completed game into an error on their screen.
    logger.error('Record announcement failed', { message: error?.message, uid })
  }

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

/** Games whose leaderboard resets each UK day, so yesterday's rows are dead weight. */
const DAILY_LEADERBOARD_GAMES = [
  'wordle',
  'one-percent',
  'mini-crossword',
  'connections',
  'bracket-city',
  'surya-chandra',
  'bhakti-marg',
  'ras-rani'
]

/** Firestore caps a batch at 500 writes; stay under it with room to spare. */
const PRUNE_BATCH_SIZE = 400

/** How many batches one run will delete per game before leaving the rest for tomorrow. */
const PRUNE_MAX_BATCHES = 10

/**
 * Deletes everything a query matches, in batches, keeping `shouldDelete` as an
 * in-memory guard so the query itself can stay single-field.
 *
 * Deliberately not `.where('game', '==', g).where('dateId', '<', today)`: that
 * pair needs a composite index, and the deploy service account cannot create
 * those (see the note in firestore.indexes.json). A single-field range scan
 * uses the automatic index and always works.
 */
async function deleteMatchingInBatches(db, buildQuery, shouldDelete) {
  let deleted = 0
  for (let pass = 0; pass < PRUNE_MAX_BATCHES; pass += 1) {
    const snap = await buildQuery().limit(PRUNE_BATCH_SIZE).get()
    if (snap.empty) break
    const doomed = snap.docs.filter(doc => shouldDelete(doc.data() || {}))
    if (doomed.length) {
      const batch = db.batch()
      doomed.forEach(doc => batch.delete(doc.ref))
      await batch.commit()
      deleted += doomed.length
    }
    // Nothing in this page qualified, so paging further would loop forever on
    // the same rows — the query is not ordered by anything we advance.
    if (snap.size < PRUNE_BATCH_SIZE || !doomed.length) break
  }
  return deleted
}

const SPELLING_BEE_GAMES = new Set(['spelling-bee', 'spellingBee'])
const SPELLING_BEE_COLLECTIONS = ['spellingBeeScores', 'spellingBeePuzzles', 'spellingBeeWords']
const SPELLING_BEE_CROWN_IDS = [
  'spelling-bee-fastest',
  'spelling-bee-most-words',
  'spelling-bee-pangram',
  'spelling-bee-highest'
]

/** Drops leftover Spelling Bee scores, puzzles and crowns. The game is gone. */
async function deleteSpellingBeeLeftovers(db) {
  const removed = {}
  for (const name of SPELLING_BEE_COLLECTIONS) {
    removed[name] = await deleteMatchingInBatches(db, () => db.collection(name), () => true)
  }
  for (const game of SPELLING_BEE_GAMES) {
    removed[`gameScores:${game}`] = await deleteMatchingInBatches(
      db,
      () => db.collection('gameScores').where('game', '==', game),
      () => true
    )
  }
  removed.crownsByGame = await deleteMatchingInBatches(
    db,
    () => db.collection('achievementCrowns').where('game', '==', 'spelling-bee'),
    () => true
  )
  let crownsById = 0
  for (const id of SPELLING_BEE_CROWN_IDS) {
    const ref = db.doc(`achievementCrowns/${id}`)
    const snap = await ref.get()
    if (!snap.exists) continue
    await ref.delete()
    crownsById += 1
  }
  removed.crownsById = crownsById
  return removed
}

/** Rewrite leftover Bhakti Marg score rows to Surya Chandra. */
async function migrateBhaktiMargScores(db) {
  let moved = 0
  for (let pass = 0; pass < PRUNE_MAX_BATCHES; pass += 1) {
    const snap = await db.collection('gameScores').where('game', '==', 'bhakti-marg').limit(200).get()
    if (snap.empty) break
    const batch = db.batch()
    for (const item of snap.docs) {
      const data = item.data() || {}
      const uid = data.userId
      const dateId = data.dateId
      if (uid && dateId) {
        const nextRef = db.collection('gameScores').doc(`surya-chandra_${dateId}_${uid}`)
        const existing = await nextRef.get()
        if (!existing.exists) {
          batch.set(nextRef, { ...data, game: 'surya-chandra' })
        }
      }
      batch.delete(item.ref)
      moved += 1
    }
    await batch.commit()
    if (snap.size < 200) break
  }
  return moved
}

/**
 * Clears out finished days from the daily leaderboards.
 *
 * This used to run in the browser: `cleanseOldScores` fired on every visitor's
 * every leaderboard fetch, so fifty people opening /play in the morning meant
 * fifty concurrent sweeps of the same rows — and it forced `gameScores` to
 * allow unauthenticated deletes, because the rule had to permit whatever the
 * client was doing. Moving it here is what let that rule close.
 *
 * Runs before the daily reminder so players arrive to a clean board.
 */
exports.pruneOldGameScores = onSchedule(
  { region: 'europe-west2', schedule: '10 3 * * *', timeZone: 'Europe/London', timeoutSeconds: 540 },
  async () => {
    const db = getFirestore()
    const today = ukDateIdNow()
    const daily = new Set(DAILY_LEADERBOARD_GAMES)

    const scores = await deleteMatchingInBatches(
      db,
      () => db.collection('gameScores').where('dateId', '<', today),
      data => daily.has(data.game)
    )

    // The pre-`gameScores` collection. Nothing writes to it any more; this
    // drains what is left so it can eventually be dropped. Rows predating the
    // `dateId` field are matched by the collection scan and swept too.
    const legacy = await deleteMatchingInBatches(
      db,
      () => db.collection('wordleScores'),
      data => !data.dateId || data.dateId < today
    )

    const spellingBee = await deleteSpellingBeeLeftovers(db)
    const suryaChandra = await migrateBhaktiMargScores(db)

    const removed = { gameScores: scores, wordleScores: legacy, spellingBee, suryaChandra }
    logger.info('Pruned old leaderboard scores', { today, removed })
    return removed
  }
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
 * Snapshots how many members were active today, because the figure is
 * unrecoverable afterwards — an auth record keeps only the most recent
 * lastRefreshTime, so yesterday's active count cannot be derived tomorrow.
 * Runs late in the UK evening so the day is essentially complete.
 */
exports.recordDailyStats = onSchedule(
  { region: 'europe-west2', schedule: '50 23 * * *', timeZone: 'Europe/London' },
  async () => {
    const db = getFirestore()
    const accounts = await collectAccountStats()
    const dateId = ukDateId(new Date())
    await db.doc(`dailyStats/${dateId}`).set({
      dateId,
      activeMembers: accounts.activeLast1,
      totalMembers: accounts.total,
      recordedAt: FieldValue.serverTimestamp()
    }, { merge: true })
    logger.info('Recorded daily stats', { dateId, activeMembers: accounts.activeLast1 })
  }
)

/**
 * Claims the right to send one automatic push of a given kind, at most once per
 * window. Automatic sends are triggered by data changes that can arrive in
 * bursts — a bulk event import, a player taking several records in one game —
 * and without this each one would become its own notification.
 */
async function claimNotificationSlot(db, key, windowMs) {
  const ref = db.doc(`systemState/${key}`)
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref)
    const last = snap.exists ? snap.data().lastNotifiedAt?.toMillis?.() ?? 0 : 0
    if (Date.now() - last < windowMs) return false
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
    if (!await claimNotificationSlot(getFirestore(), 'eventNotifications', NEW_EVENT_THROTTLE_MS)) {
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

/* ------------------------------------------------------------------ *
 * Niyam challenges — community goals ("10,000 malas by Patotsav")
 * ------------------------------------------------------------------ */

/**
 * Everything shown on the challenge progress bar is derived here, from the
 * submissions themselves. `niyamChallengeStats` and the per-person
 * `contributors` rollups are closed to browser writes, so the only way to move
 * a community total is to have a submission approved.
 *
 * A submission counts when its status is `approved`. Anything larger than the
 * challenge's `autoApproveMax` is written as `pending` by the security rules
 * and stays out of the total until an admin flips it.
 *
 * Contention note: every entry for a challenge touches one stats document, and
 * Firestore sustains roughly one write per second per document. That is fine at
 * sangat scale; if a challenge ever goes viral this wants sharded counters.
 */
function niyamCounters(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0
}

function readNiyamSubmission(snap) {
  if (!snap || !snap.exists) return null
  const data = snap.data() || {}
  const challengeId = typeof data.challengeId === 'string' ? data.challengeId.trim() : ''
  const userId = typeof data.userId === 'string' ? data.userId.trim() : ''
  const amount = niyamCounters(data.amount)
  if (!challengeId || !userId) return null
  const status = data.status === 'approved'
    ? 'approved'
    : data.status === 'rejected' ? 'rejected' : 'pending'
  return {
    challengeId,
    userId,
    userName: cleanText(data.userName, 32) || 'Devotee',
    dayKey: typeof data.dayKey === 'string' ? data.dayKey.trim() : '',
    amount,
    status
  }
}

/** How much of the per-day breakdown is kept. Two weeks covers "today" and "this week". */
const NIYAM_DAILY_WINDOW_DAYS = 14

/**
 * The per-day slice of a challenge's approved total.
 *
 * Against a ten lakh target the all-time number barely visibly moves, so the
 * page reads "the sangat added 1,240 today" from this instead. The day is the
 * one the devotee did the sadhana on (`dayKey`), not the day an admin got round
 * to approving it — which also means an approval, a rejection and a withdrawal
 * all unwind from the same bucket they were added to.
 *
 * Returned as a patch rather than a whole map because a merging `set` merges
 * maps key by key: days that have fallen out of the window have to be deleted
 * explicitly or they accumulate forever. An entry whose day is already outside
 * the window — approved a fortnight late — is left out of the breakdown
 * entirely; `approvedTotal` still carries it, which is the number that counts.
 */
function dailyTotalsPatch(current, dayKey, delta) {
  const window = new Set(recentDateIds(NIYAM_DAILY_WINDOW_DAYS))
  const patch = {}
  for (const day of Object.keys(current || {})) {
    if (!window.has(day)) patch[day] = FieldValue.delete()
  }
  if (delta && dayKey && window.has(dayKey)) {
    const updated = Math.max(0, niyamCounters((current || {})[dayKey]) + delta)
    patch[dayKey] = updated > 0 ? updated : FieldValue.delete()
  }
  return patch
}

function niyamDelta(before, after) {
  const approvedOf = (row) => (row && row.status === 'approved' ? row.amount : 0)
  const pendingOf = (row) => (row && row.status === 'pending' ? row.amount : 0)
  const countOf = (row, status) => (row && row.status === status ? 1 : 0)
  return {
    approvedTotal: approvedOf(after) - approvedOf(before),
    pendingTotal: pendingOf(after) - pendingOf(before),
    approvedCount: countOf(after, 'approved') - countOf(before, 'approved'),
    pendingCount: countOf(after, 'pending') - countOf(before, 'pending'),
    submissionCount: (after ? 1 : 0) - (before ? 1 : 0)
  }
}

function isEmptyNiyamDelta(delta) {
  return Object.values(delta).every(value => value === 0)
}

async function applyNiyamDelta(db, { challengeId, userId, userName, dayKey }, delta) {
  if (isEmptyNiyamDelta(delta)) return
  const statsRef = db.doc(`niyamChallengeStats/${challengeId}`)
  const contributorRef = db.doc(`niyamChallenges/${challengeId}/contributors/${userId}`)

  await db.runTransaction(async (tx) => {
    const [statsSnap, contributorSnap] = await Promise.all([tx.get(statsRef), tx.get(contributorRef)])
    const stats = statsSnap.data() || {}
    const contributor = contributorSnap.data() || {}

    const prevApproved = niyamCounters(contributor.approvedTotal)
    const nextApproved = Math.max(0, prevApproved + delta.approvedTotal)
    const nextPending = Math.max(0, niyamCounters(contributor.pendingTotal) + delta.pendingTotal)
    const nextSubmissions = Math.max(0, niyamCounters(contributor.submissionCount) + delta.submissionCount)

    // Participants counts people who have something approved, so it only moves
    // when a contributor crosses zero in either direction.
    let participantsDelta = 0
    if (prevApproved <= 0 && nextApproved > 0) participantsDelta = 1
    else if (prevApproved > 0 && nextApproved <= 0) participantsDelta = -1

    const dailyPatch = dailyTotalsPatch(stats.dailyTotals, dayKey, delta.approvedTotal)

    tx.set(statsRef, {
      challengeId,
      approvedTotal: Math.max(0, niyamCounters(stats.approvedTotal) + delta.approvedTotal),
      pendingTotal: Math.max(0, niyamCounters(stats.pendingTotal) + delta.pendingTotal),
      approvedCount: Math.max(0, niyamCounters(stats.approvedCount) + delta.approvedCount),
      pendingCount: Math.max(0, niyamCounters(stats.pendingCount) + delta.pendingCount),
      participants: Math.max(0, niyamCounters(stats.participants) + participantsDelta),
      ...(Object.keys(dailyPatch).length ? { dailyTotals: dailyPatch } : {}),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })

    if (nextSubmissions <= 0) {
      tx.delete(contributorRef)
      return
    }

    tx.set(contributorRef, {
      userId,
      userName: userName || contributor.userName || 'Devotee',
      approvedTotal: nextApproved,
      pendingTotal: nextPending,
      submissionCount: nextSubmissions,
      lastSubmittedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true })
  })
}

exports.syncNiyamChallengeTotals = onDocumentWritten(
  { document: 'niyamSubmissions/{submissionId}', region: 'europe-west2' },
  async (event) => {
    const before = readNiyamSubmission(event.data?.before)
    const after = readNiyamSubmission(event.data?.after)
    if (!before && !after) return

    const db = getFirestore()
    const sameOwner = before && after
      && before.challengeId === after.challengeId
      && before.userId === after.userId

    try {
      if (sameOwner || !before || !after) {
        const subject = after || before
        await applyNiyamDelta(db, subject, niyamDelta(before, after))
        return
      }
      // A submission should never change hands, but if it ever does, unwind it
      // from the old rollup before adding it to the new one.
      await applyNiyamDelta(db, before, niyamDelta(before, null))
      await applyNiyamDelta(db, after, niyamDelta(null, after))
    } catch (error) {
      logger.error('Failed to sync niyam challenge totals', {
        submissionId: event.params.submissionId,
        message: error.message
      })
      throw error
    }
  }
)

/**
 * One-shot wipe before public launch: clears every player's game scores,
 * streaks, completions, achievements/crowns, and every niyam submission and
 * shared total. Content (puzzles, challenges, timeline, events) is untouched.
 *
 * Requires the typed phrase so a stray admin click cannot empty the boards.
 */
const LAUNCH_RESET_PHRASE = 'RESET FOR LAUNCH'
const LAUNCH_RESET_FLAT = [
  'gameScores',
  'wordleScores',
  'playStreaks',
  'userAchievements',
  'achievementCrowns',
  'niyamSubmissions',
  'niyamChallengeStats'
]
const LAUNCH_RESET_NESTED = [
  'playCompletions',
  'mandirVisits'
]

async function deleteFlatCollection(db, name) {
  let deleted = 0
  while (true) {
    const snap = await db.collection(name).limit(PRUNE_BATCH_SIZE).get()
    if (snap.empty) break
    const batch = db.batch()
    snap.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()
    deleted += snap.size
    if (snap.size < PRUNE_BATCH_SIZE) break
  }
  return deleted
}

/** Parents that carry day/visit subcollections — recursive delete each doc. */
async function deleteNestedCollection(db, name) {
  let deleted = 0
  while (true) {
    const snap = await db.collection(name).limit(50).get()
    if (snap.empty) break
    for (const doc of snap.docs) {
      await db.recursiveDelete(doc.ref)
      deleted += 1
    }
    if (snap.size < 50) break
  }
  return deleted
}

exports.wipeLaunchPlayerData = onCall(
  { region: 'europe-west2', timeoutSeconds: 540 },
  async (request) => {
    const uid = await requireAdmin(request)
    const phrase = String(request.data?.confirm || '').trim()
    if (phrase !== LAUNCH_RESET_PHRASE) {
      throw new HttpsError(
        'invalid-argument',
        `Type ${LAUNCH_RESET_PHRASE} to confirm this irreversible wipe.`
      )
    }

    const db = getFirestore()
    const removed = {}
    for (const name of LAUNCH_RESET_FLAT) {
      removed[name] = await deleteFlatCollection(db, name)
    }
    for (const name of LAUNCH_RESET_NESTED) {
      removed[name] = await deleteNestedCollection(db, name)
    }

    logger.warn('Launch player data wiped', { by: uid, removed })
    return { ok: true, removed }
  }
)
