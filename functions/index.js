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
    { id: 'wordle-first-win', when: ({ guesses }) => guesses >= 1 && guesses <= 6 },
    { id: 'wordle-sub-60s', when: ({ timeMs }) => timeMs < 60_000 },
    { id: 'wordle-sub-30s', when: ({ timeMs }) => timeMs < 30_000 },
    { id: 'wordle-sub-10s', when: ({ timeMs }) => timeMs < 10_000 },
    { id: 'wordle-sub-5s', when: ({ timeMs }) => timeMs < 5_000 },
    { id: 'wordle-three-guesses', when: ({ guesses }) => guesses <= 3 },
    { id: 'wordle-two-guesses', when: ({ guesses }) => guesses <= 2 },
    { id: 'wordle-one-guess', when: ({ guesses }) => guesses <= 1 }
  ],
  crossword: [
    { id: 'crossword-first-win', when: ({ timeMs }) => timeMs >= 0 },
    { id: 'crossword-sub-60s', when: ({ timeMs }) => timeMs < 60_000 },
    { id: 'crossword-sub-30s', when: ({ timeMs }) => timeMs < 30_000 },
    { id: 'crossword-sub-15s', when: ({ timeMs }) => timeMs < 15_000 }
  ],
  'spelling-bee': [
    { id: 'spelling-bee-first-word', when: ({ words }) => words >= 1 },
    { id: 'spelling-bee-five-words', when: ({ words }) => words >= 5 },
    { id: 'spelling-bee-pangram', when: ({ pangram }) => pangram === true },
    { id: 'spelling-bee-score-50', when: ({ score }) => score >= 50 },
    { id: 'spelling-bee-score-100', when: ({ score }) => score >= 100 }
  ],
  connections: [
    { id: 'connections-first-win', when: ({ won }) => won === true },
    { id: 'connections-perfect', when: ({ won, mistakes }) => won === true && mistakes === 0 }
  ],
  'one-percent': [
    { id: 'one-percent-first-play', when: () => true },
    { id: 'one-percent-five-cleared', when: ({ score }) => score >= 5 },
    { id: 'one-percent-club', when: ({ clearedAll }) => clearedAll === true }
  ],
  streak: [
    { id: 'streak-3', when: ({ longestStreak }) => longestStreak >= 3 },
    { id: 'streak-7', when: ({ longestStreak }) => longestStreak >= 7 },
    { id: 'streak-30', when: ({ longestStreak }) => longestStreak >= 30 }
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

function isBetterLongestStreak(current, candidate) {
  if (!current) return true
  return candidate.longestStreak > Number(current.longestStreak || current.value)
}

const SITE_ORIGIN = process.env.BHAKTRAS_SITE_ORIGIN || 'https://skssw-bhaktiras.web.app'

async function deliverNotification({ title, body, topic, url, sentBy }) {
  const db = getFirestore()
  const subscriptions = await db.collection('pushSubscriptions')
    .where('enabled', '==', true)
    .get()
  const recipients = subscriptions.docs
    .filter(item => subscriptionMatches(item.data().topics, topic))
    .map(item => ({ ref: item.ref, token: item.data().token, updatedAt: item.data().updatedAt }))
    .filter(item => typeof item.token === 'string' && item.token)

  let successCount = 0
  let failureCount = 0
  const staleRefs = []
  const errorCodes = []
  // Data-only so the client SW / foreground listener always owns display.
  // A notification payload would auto-show in background and skip onMessage while focused.
  const link = new URL(url || '/', SITE_ORIGIN).href

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

  for (const staleBatch of chunks(staleRefs, 400)) {
    const write = db.batch()
    staleBatch.forEach(ref => write.delete(ref))
    await write.commit()
  }

  const uniqueErrorCodes = Array.from(new Set(errorCodes))

  await db.collection('pushMessages').add({
    title,
    body,
    topic,
    url,
    sentBy,
    recipientCount: recipients.length,
    successCount,
    failureCount,
    errorCodes: uniqueErrorCodes,
    createdAt: FieldValue.serverTimestamp()
  })

  return {
    recipientCount: recipients.length,
    successCount,
    failureCount,
    errorCodes: uniqueErrorCodes
  }
}

exports.sendPushNotification = onCall(
  { region: 'europe-west2', timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in as an admin.')

    const db = getFirestore()
    const admin = await db.doc(`admins/${request.auth.uid}`).get()
    if (!admin.exists || admin.data().active === false) {
      throw new HttpsError('permission-denied', 'Admin access required.')
    }

    const title = cleanText(request.data?.title, 80)
    const body = cleanText(request.data?.body, 240)
    const topic = cleanText(request.data?.topic, 20) || 'all'
    const url = String(request.data?.url || '/').trim().slice(0, 300)
    if (title.length < 3 || body.length < 3) {
      throw new HttpsError('invalid-argument', 'Add a title and message.')
    }
    if (!ALLOWED_TOPICS.has(topic)) {
      throw new HttpsError('invalid-argument', 'Unknown audience.')
    }
    if (!url.startsWith('/')) {
      throw new HttpsError('invalid-argument', 'Notification links must start with /.')
    }

    return deliverNotification({ title, body, topic, url, sentBy: request.auth.uid })
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
  } else if (game === 'spelling-bee') {
    const score = intInRange(request.data?.score, 1, 5_000)
    const words = intInRange(request.data?.words, 1, 500)
    if (score == null) throw new HttpsError('invalid-argument', 'Invalid Spelling Bee score.')
    if (words == null) throw new HttpsError('invalid-argument', 'Invalid Spelling Bee word count.')
    const pangram = request.data?.pangram === true
    Object.assign(candidate, { score, words, pangram })
    crownSpecs.push({
      id: 'spelling-bee-high-score',
      metric: 'high-score',
      value: score,
      better: isBetterHighScore,
      extra: { score, words }
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
    Object.assign(candidate, { score, timeMs, clearedAll: request.data?.clearedAll === true })
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

  await db.runTransaction(async (transaction) => {
    const snaps = await Promise.all([
      transaction.get(userRef),
      ...crownRefs.map(ref => transaction.get(ref))
    ])
    const userSnap = snaps[0]
    const existingAchievements = userSnap.exists ? (userSnap.data().achievements || {}) : {}
    const nextAchievements = { ...existingAchievements }
    for (const achievement of GAME_ACHIEVEMENTS[game]) {
      if (!achievement.when(candidate) || nextAchievements[achievement.id]) continue
      unlockedIds.push(achievement.id)
      nextAchievements[achievement.id] = {
        ...Object.fromEntries(Object.entries(candidate).filter(([key]) => key !== 'holderUserId' && key !== 'holderName')),
        unlockedAt: FieldValue.serverTimestamp()
      }
    }

    if (unlockedIds.length || !userSnap.exists) {
      transaction.set(userRef, {
        userId: uid,
        achievements: nextAchievements,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true })
    }

    crownSpecs.forEach((spec, index) => {
      const current = snaps[index + 1].exists ? snaps[index + 1].data() : null
      if (!spec.better(current, candidate)) return
      transaction.set(crownRefs[index], {
        holderUserId: uid,
        holderName: userName,
        game,
        metric: spec.metric,
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

  return { unlockedIds, crowns }
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

/** A gentle daily reminder for users who opted in after completing a game. */
exports.sendDailyGameReminder = onSchedule(
  { region: 'europe-west2', schedule: '30 8 * * *', timeZone: 'Europe/London' },
  () => deliverNotification({
    title: 'Today’s Bhaktiras games are ready',
    body: 'Keep your streak going with today’s satsang challenges.',
    topic: 'games',
    url: '/play',
    sentBy: 'system:daily-games'
  })
)

/** Creating an event in Admin publishes it immediately, so notify event subscribers. */
exports.notifyNewEvent = onDocumentCreated(
  { document: 'events/{eventId}', region: 'europe-west2' },
  (event) => {
    const data = event.data?.data() || {}
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
