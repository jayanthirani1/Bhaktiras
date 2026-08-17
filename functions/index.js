const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')

initializeApp()

const ALLOWED_TOPICS = new Set(['all', 'patotsav', 'games', 'events'])
const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered'
])

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

async function deliverNotification({ title, body, topic, url, sentBy }) {
  const db = getFirestore()
  const subscriptions = await db.collection('pushSubscriptions')
    .where('enabled', '==', true)
    .get()
  const recipients = subscriptions.docs
    .filter(item => {
      const data = item.data()
      return topic === 'all' || (Array.isArray(data.topics) && data.topics.includes(topic))
    })
    .map(item => ({ ref: item.ref, token: item.data().token }))
    .filter(item => typeof item.token === 'string' && item.token)

  let successCount = 0
  let failureCount = 0
  const staleRefs = []

  for (const batch of chunks(recipients, 500)) {
    const response = await getMessaging().sendEachForMulticast({
      tokens: batch.map(item => item.token),
      notification: { title, body },
      data: { title, body, url, topic, tag: `bhaktiras-${topic}` },
      webpush: {
        fcmOptions: { link: url },
        notification: {
          icon: '/Bhaktiras%20-%20Main.svg',
          badge: '/Bhaktiras%20-%20Main.svg'
        }
      }
    })
    successCount += response.successCount
    failureCount += response.failureCount
    response.responses.forEach((result, index) => {
      if (!result.success && INVALID_TOKEN_CODES.has(result.error?.code)) {
        staleRefs.push(batch[index].ref)
      }
    })
  }

  for (const staleBatch of chunks(staleRefs, 400)) {
    const write = db.batch()
    staleBatch.forEach(ref => write.delete(ref))
    await write.commit()
  }

  await db.collection('pushMessages').add({
    title,
    body,
    topic,
    url,
    sentBy,
    recipientCount: recipients.length,
    successCount,
    failureCount,
    createdAt: FieldValue.serverTimestamp()
  })

  return { recipientCount: recipients.length, successCount, failureCount }
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
      topic: 'events',
      url: '/events',
      sentBy: 'system:new-event'
    })
  }
)
