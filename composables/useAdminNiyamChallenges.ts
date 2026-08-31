import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore
} from 'firebase/firestore'
import type {
  NiyamChallenge,
  NiyamChallengeStats,
  NiyamContributor,
  NiyamIconKey,
  NiyamSubmission,
  NiyamSubmissionStatus
} from '~/types'
import { DEFAULT_NIYAM_CHALLENGES } from '~/data/niyamChallenges'
import {
  buildSubmissionId,
  challengeWindow,
  DEFAULT_AUTO_APPROVE_MAX,
  formatCount,
  DEFAULT_MAX_PER_SUBMISSION,
  isChallengeOpen,
  isPublished,
  mergeChallenges,
  percentOf,
  safeMemberName,
  sortChallenges,
  sortSubmissionsNewestFirst,
  statusForAmount,
  statusKey,
  SUBMISSION_NOTE_MAX,
  userChallengeKey
} from '~/utils/niyamChallenge'

/** Newest-first because submission ids embed an inverted timestamp. */
const SUBMISSION_PAGE = 300
const CONTRIBUTOR_PAGE = 500
/** Held entries pulled per niyam for the combined queue. */
const PENDING_PAGE = 100
/** One person's history on one niyam, for the judgement context in the queue. */
const HISTORY_PAGE = 100
/**
 * How many distinct (devotee, niyam) histories the queue loads without being
 * asked. Each is one more query, so the rest load on demand behind a button.
 */
const CONTEXT_AUTO_LIMIT = 30

/** The glyphs an admin can pick from, in the order the select offers them. */
export const NIYAM_ICON_NAMES: NiyamIconKey[] = ['mala', 'stotra', 'mandir', 'path', 'dandvat', 'niyam']

/**
 * 1,284 · 12.4K · 1.2M. A million malas written out in full stops being a
 * number you can read at a glance, so anything past ten thousand is shortened
 * and the exact figure goes in the line underneath.
 */
export function formatBigCount(value: number): string {
  const n = Math.max(0, Math.round(Number(value) || 0))
  if (n < 10_000) return n.toLocaleString('en-GB')
  const trim = (s: string) => s.replace(/\.0+$/, '')
  if (n < 1_000_000) return `${trim((n / 1000).toFixed(n < 100_000 ? 1 : 0))}K`
  return `${trim((n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1))}M`
}

export type NiyamOverviewStatus = 'unpublished' | 'open' | 'scheduled' | 'paused' | 'closed'

export interface NiyamOverviewRow {
  challenge: NiyamChallenge
  published: boolean
  status: NiyamOverviewStatus
  statusLabel: string
  approvedTotal: number
  pendingTotal: number
  percent: number
  participants: number
  /** Held entries loaded for this niyam; `awaitingCapped` when the page filled. */
  awaiting: number
  awaitingCapped: boolean
}

export interface NiyamReviewContext {
  approvedTotal: number
  entryCount: number
  sameDayCount: number
  sameDayTotal: number
  pendingCount: number
  /** False when only the held entries were available to judge against. */
  complete: boolean
}

function getDb(): Firestore | null {
  if (import.meta.server) return null
  return (useNuxtApp().$firebaseDb as Firestore | null) ?? null
}

function requireDb() {
  const db = getDb()
  if (!db) throw new Error('Firebase not configured')
  return db
}

function mapContributor(id: string, data: Record<string, unknown>): NiyamContributor {
  return {
    id,
    userId: String(data.userId || id),
    userName: String(data.userName || 'Devotee'),
    approvedTotal: Math.max(0, Number(data.approvedTotal) || 0),
    pendingTotal: Math.max(0, Number(data.pendingTotal) || 0),
    submissionCount: Math.max(0, Number(data.submissionCount) || 0),
    lastSubmittedAt: data.lastSubmittedAt as NiyamContributor['lastSubmittedAt'],
    updatedAt: data.updatedAt as NiyamContributor['updatedAt']
  }
}

function emptyStats(challengeId: string): NiyamChallengeStats {
  return {
    challengeId,
    approvedTotal: 0,
    pendingTotal: 0,
    approvedCount: 0,
    pendingCount: 0,
    participants: 0
  }
}

/**
 * Admin view of the niyams: what needs attention across all of them, the
 * combined review queue, and the per-challenge entries, rollups and controls.
 *
 * Nothing here writes a total. Flipping `status` is enough — the
 * `syncNiyamChallengeTotals` trigger recomputes `niyamChallengeStats` and the
 * contributor rollups from the change.
 *
 * Every query is a single equality filter (`challengeId`, `statusKey` or
 * `userChallengeKey`) plus a `limit()`. Nothing here needs a composite index,
 * which matters because the deploy service account cannot create them.
 */
export function useAdminNiyamChallenges() {
  const { user, userName } = useAuth()

  const challenges = useAdminCollection<NiyamChallenge>('niyamChallenges')

  const submissions = ref<NiyamSubmission[]>([])
  const contributors = ref<NiyamContributor[]>([])
  const stats = ref<NiyamChallengeStats | null>(null)
  const loadingSubmissions = ref(false)
  const reviewingId = ref<string | null>(null)
  const submissionError = ref('')
  const activeChallengeId = ref<string | null>(null)

  const statsById = ref<Record<string, NiyamChallengeStats>>({})
  const queue = ref<NiyamSubmission[]>([])
  const queueCapped = ref<Record<string, boolean>>({})
  const overviewLoading = ref(false)
  const overviewError = ref('')

  const historyByKey = ref<Record<string, NiyamSubmission[]>>({})
  const historyLoading = ref<string | null>(null)

  const mandirSaving = ref(false)
  const mandirError = ref('')

  const pending = computed(() => submissions.value.filter(s => s.status === 'pending'))
  const reviewed = computed(() => submissions.value.filter(s => s.status !== 'pending'))

  /** Defaults plus stored documents; a stored document always wins. */
  const allChallenges = computed(() => mergeChallenges(challenges.items.value))
  const publishedChallenges = computed(() => allChallenges.value.filter(isPublished))
  const unpublishedDefaults = computed(() => allChallenges.value.filter(c => !isPublished(c)))

  function statsFor(challengeId: string): NiyamChallengeStats {
    return statsById.value[challengeId] || emptyStats(challengeId)
  }

  function challengeById(challengeId: string): NiyamChallenge | null {
    return allChallenges.value.find(c => c.id === challengeId) || null
  }

  function overviewStatus(challenge: NiyamChallenge): NiyamOverviewStatus {
    if (!isPublished(challenge)) return 'unpublished'
    if (!challenge.active) return 'paused'
    const range = challengeWindow(challenge)
    if (!range.hasStarted) return 'scheduled'
    if (range.hasEnded) return 'closed'
    return 'open'
  }

  const overview = computed<NiyamOverviewRow[]>(() =>
    allChallenges.value.map((challenge) => {
      const s = statsFor(challenge.id)
      const status = overviewStatus(challenge)
      return {
        challenge,
        published: isPublished(challenge),
        status,
        statusLabel: {
          unpublished: 'Not published',
          open: 'Open',
          scheduled: 'Scheduled',
          paused: 'Paused',
          closed: 'Closed'
        }[status],
        approvedTotal: s.approvedTotal,
        pendingTotal: s.pendingTotal,
        percent: percentOf(s.approvedTotal, challenge.target),
        participants: s.participants,
        awaiting: queue.value.filter(q => q.challengeId === challenge.id).length,
        awaitingCapped: !!queueCapped.value[challenge.id]
      }
    })
  )

  const awaitingTotal = computed(() => queue.value.length)

  /**
   * Everything the admin needs to judge one held submission: how much this
   * person has already had approved, how many entries they have made, and how
   * many they made on the same day. A big number from someone with a steady
   * history reads very differently from a big number on a brand-new account.
   */
  function buildContext(
    submission: NiyamSubmission,
    pool: NiyamSubmission[],
    complete: boolean
  ): NiyamReviewContext {
    const mine = pool.filter(s => s.userId === submission.userId && s.challengeId === submission.challengeId)
    const approvedTotal = mine
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.amount, 0)
    const sameDay = mine.filter(s => s.dayKey && s.dayKey === submission.dayKey)
    return {
      approvedTotal,
      entryCount: mine.length,
      sameDayCount: sameDay.length,
      sameDayTotal: sameDay.reduce((sum, s) => sum + s.amount, 0),
      pendingCount: mine.filter(s => s.status === 'pending').length,
      complete
    }
  }

  /** Context inside one challenge's fully loaded entry list. */
  function contextFor(submission: NiyamSubmission): NiyamReviewContext {
    return buildContext(submission, submissions.value, true)
  }

  /**
   * Context for a row in the combined queue. The queue itself only holds held
   * entries, so the person's real history comes from one extra
   * `userChallengeKey` query, cached per key.
   */
  function queueContextFor(submission: NiyamSubmission): NiyamReviewContext {
    const history = historyByKey.value[submission.userChallengeKey]
    return history
      ? buildContext(submission, history, true)
      : buildContext(submission, queue.value, false)
  }

  /** One person's entries on one niyam — single equality filter, no index. */
  async function loadHistory(key: string) {
    if (!key || historyByKey.value[key]) return
    historyLoading.value = key
    try {
      const db = requireDb()
      const snap = await getDocs(query(
        collection(db, 'niyamSubmissions'),
        where('userChallengeKey', '==', key),
        limit(HISTORY_PAGE)
      ))
      historyByKey.value = {
        ...historyByKey.value,
        [key]: snap.docs.map(d => mapSubmission(d.id, d.data()))
      }
    } catch {
      /* the row falls back to queue-only context and offers the button again */
    } finally {
      if (historyLoading.value === key) historyLoading.value = null
    }
  }

  /** Held entries across every published niyam, plus the totals behind them. */
  async function loadOverview() {
    overviewLoading.value = true
    overviewError.value = ''
    try {
      await challenges.fetchAll()
      const db = requireDb()
      const list = publishedChallenges.value

      const [statsEntries, queues] = await Promise.all([
        Promise.all(list.map(async (c) => {
          try {
            const snap = await getDoc(doc(db, 'niyamChallengeStats', c.id))
            const data = snap.data() as Record<string, unknown> | undefined
            return [c.id, mapStats(c.id, data)] as const
          } catch {
            return [c.id, emptyStats(c.id)] as const
          }
        })),
        // One equality filter on `statusKey` per niyam — `{challengeId}__pending`
        // is exactly this query, so no composite index is involved.
        Promise.all(list.filter(c => c.inputMode !== 'checkin').map(async (c) => {
          try {
            const snap = await getDocs(query(
              collection(db, 'niyamSubmissions'),
              where('statusKey', '==', statusKey(c.id, 'pending')),
              limit(PENDING_PAGE)
            ))
            return {
              id: c.id,
              rows: snap.docs.map(d => mapSubmission(d.id, d.data())),
              capped: snap.size >= PENDING_PAGE
            }
          } catch {
            return { id: c.id, rows: [] as NiyamSubmission[], capped: false }
          }
        }))
      ])

      statsById.value = Object.fromEntries(statsEntries)
      queue.value = sortSubmissionsNewestFirst(queues.flatMap(q => q.rows))
      queueCapped.value = Object.fromEntries(queues.map(q => [q.id, q.capped]))

      // Judgement context for the rows an admin will actually read first.
      const keys = [...new Set(queue.value.map(s => s.userChallengeKey).filter(Boolean))]
      await Promise.all(keys.slice(0, CONTEXT_AUTO_LIMIT).map(loadHistory))
    } catch (e) {
      overviewError.value = (e as Error).message
    } finally {
      overviewLoading.value = false
    }
  }

  async function loadChallengeDetail(challengeId: string) {
    activeChallengeId.value = challengeId
    submissions.value = []
    contributors.value = []
    stats.value = null
    if (!challengeId) return

    loadingSubmissions.value = true
    submissionError.value = ''
    try {
      const db = requireDb()
      const [submissionSnap, contributorSnap, statsSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'niyamSubmissions'),
          where('challengeId', '==', challengeId),
          limit(SUBMISSION_PAGE)
        )),
        getDocs(query(
          collection(db, 'niyamChallenges', challengeId, 'contributors'),
          limit(CONTRIBUTOR_PAGE)
        )),
        getDoc(doc(db, 'niyamChallengeStats', challengeId))
      ])

      submissions.value = sortSubmissionsNewestFirst(
        submissionSnap.docs.map(d => mapSubmission(d.id, d.data()))
      )
      contributors.value = contributorSnap.docs
        .map(d => mapContributor(d.id, d.data()))
        .sort((a, b) => b.approvedTotal - a.approvedTotal || a.userName.localeCompare(b.userName))
      stats.value = mapStats(challengeId, statsSnap.data() as Record<string, unknown> | undefined)
    } catch (e) {
      submissionError.value = (e as Error).message
    } finally {
      loadingSubmissions.value = false
    }
  }

  async function refreshStatsFor(challengeId: string) {
    try {
      const db = requireDb()
      const snap = await getDoc(doc(db, 'niyamChallengeStats', challengeId))
      statsById.value = {
        ...statsById.value,
        [challengeId]: mapStats(challengeId, snap.data() as Record<string, unknown> | undefined)
      }
    } catch {
      /* the overview keeps the figures it already has */
    }
  }

  async function refreshQueueFor(challengeId: string) {
    try {
      const db = requireDb()
      const snap = await getDocs(query(
        collection(db, 'niyamSubmissions'),
        where('statusKey', '==', statusKey(challengeId, 'pending')),
        limit(PENDING_PAGE)
      ))
      queue.value = sortSubmissionsNewestFirst([
        ...queue.value.filter(q => q.challengeId !== challengeId),
        ...snap.docs.map(d => mapSubmission(d.id, d.data()))
      ])
      queueCapped.value = { ...queueCapped.value, [challengeId]: snap.size >= PENDING_PAGE }
    } catch {
      /* leave the queue as it is rather than emptying it on a transient failure */
    }
  }

  /**
   * A verdict changes one niyam's totals and its held entries — and one
   * person's history. Re-read exactly those rather than the whole page, so
   * clearing a queue of twenty entries is twenty small reads, not twenty
   * full refreshes.
   */
  async function refreshChallenge(challengeId: string, historyKey = '') {
    if (historyKey) {
      const next = { ...historyByKey.value }
      delete next[historyKey]
      historyByKey.value = next
    }
    await Promise.all([
      refreshStatsFor(challengeId),
      refreshQueueFor(challengeId),
      historyKey ? loadHistory(historyKey) : Promise.resolve(),
      activeChallengeId.value === challengeId ? loadChallengeDetail(challengeId) : Promise.resolve()
    ])
  }

  async function setStatus(
    submission: NiyamSubmission,
    status: NiyamSubmissionStatus,
    reviewNote = ''
  ) {
    if (reviewingId.value) return
    reviewingId.value = submission.id
    submissionError.value = ''
    try {
      const db = requireDb()
      await updateDoc(doc(db, 'niyamSubmissions', submission.id), {
        status,
        statusKey: statusKey(submission.challengeId, status),
        reviewedAt: serverTimestamp(),
        reviewedBy: user.value?.uid || null,
        reviewNote: reviewNote.trim().slice(0, SUBMISSION_NOTE_MAX) || null
      })
      await refreshChallenge(submission.challengeId, submission.userChallengeKey)
    } catch (e) {
      submissionError.value = (e as Error).message
    } finally {
      reviewingId.value = null
    }
  }

  const approve = (s: NiyamSubmission, note = '') => setStatus(s, 'approved', note)
  const reject = (s: NiyamSubmission, note = '') => setStatus(s, 'rejected', note)
  /** Pull an already-counted entry back into the queue after a second look. */
  const hold = (s: NiyamSubmission, note = '') => setStatus(s, 'pending', note)

  async function removeSubmission(submission: NiyamSubmission) {
    if (reviewingId.value) return
    reviewingId.value = submission.id
    submissionError.value = ''
    try {
      const db = requireDb()
      await deleteDoc(doc(db, 'niyamSubmissions', submission.id))
      await refreshChallenge(submission.challengeId, submission.userChallengeKey)
    } catch (e) {
      submissionError.value = (e as Error).message
    } finally {
      reviewingId.value = null
    }
  }

  /** Everything a `niyamChallenges` document holds, defaults included. */
  function challengeWritePayload(challenge: NiyamChallenge) {
    return {
      title: challenge.title,
      detail: challenge.detail,
      unit: challenge.unit,
      unitSingular: challenge.unitSingular,
      target: challenge.target,
      startAt: challenge.startAt ?? null,
      endAt: challenge.endAt ?? null,
      active: challenge.active !== false,
      order: challenge.order ?? 0,
      autoApproveMax: challenge.autoApproveMax ?? DEFAULT_AUTO_APPROVE_MAX,
      maxPerSubmission: challenge.maxPerSubmission ?? DEFAULT_MAX_PER_SUBMISSION,
      inputMode: challenge.inputMode || 'count',
      presets: challenge.presets || [],
      hint: challenge.hint || '',
      icon: challenge.icon || 'niyam'
    }
  }

  /**
   * Write a default out at its own slug id. `setItem` and not `create` — a
   * generated id would not match the default and `mergeChallenges` would then
   * show the niyam twice.
   */
  async function publishDefault(challengeId: string) {
    const challenge = DEFAULT_NIYAM_CHALLENGES.find(c => c.id === challengeId)
    if (!challenge) throw new Error('No default with that id')
    await challenges.setItem(challenge.id, challengeWritePayload(challenge))
  }

  /** Sequential so one failure does not leave the rest half-written silently. */
  async function publishAllDefaults() {
    for (const challenge of unpublishedDefaults.value) {
      await publishDefault(challenge.id)
    }
    await loadOverview()
  }

  /**
   * Record a count the mandir gathered on paper.
   *
   * The rules only let a signed-in user create a submission under their own
   * `userId`, so this is written under the admin's uid with an attributed
   * `userName` and a note saying where the count came from. It gets no special
   * treatment: `maxPerSubmission` still refuses anything larger, and
   * `statusForAmount` still decides whether it counts at once or waits in the
   * queue — which is why the caller is handed the status back.
   */
  async function logMandirEntry(
    challenge: NiyamChallenge,
    input: { amount: number; name: string; note: string; dayKey?: string }
  ): Promise<{ status: NiyamSubmissionStatus; amount: number; id: string }> {
    mandirError.value = ''
    const uid = user.value?.uid
    const db = getDb()
    const amount = Math.floor(Number(input.amount) || 0)

    // Every refusal surfaces in the form, not only in a thrown error.
    function refusalReason(): string {
      if (mandirSaving.value) return 'Still saving the last entry.'
      if (!db) return 'Firebase is not configured.'
      if (!uid) return 'Sign in again — an entry has to sit under an account.'
      if (!isPublished(challenge)) return 'Publish this niyam before adding to it.'
      if (!isChallengeOpen(challenge)) return 'This niyam is not open for entries.'
      if (amount < 1) return 'Enter how many to add.'
      if (amount > challenge.maxPerSubmission) {
        return `The hard limit for one entry on this niyam is ${formatCount(challenge.maxPerSubmission)}. Split it across entries.`
      }
      return ''
    }

    const refusal = refusalReason()
    if (refusal || !db || !uid) {
      mandirError.value = refusal || 'Could not add the entry.'
      throw new Error(mandirError.value)
    }

    const dayKey = input.dayKey || ukDateId()
    const status = statusForAmount(challenge, amount)
    const id = buildSubmissionId(challenge.id)
    const note = input.note.trim().slice(0, SUBMISSION_NOTE_MAX)

    mandirSaving.value = true
    try {
      await setDoc(doc(db, 'niyamSubmissions', id), {
        challengeId: challenge.id,
        userId: uid,
        userName: input.name.trim() ? safeMemberName(input.name) : safeMemberName(userName.value),
        amount,
        note: note || null,
        status,
        statusKey: statusKey(challenge.id, status),
        userChallengeKey: userChallengeKey(uid, challenge.id),
        dayKey,
        createdAt: serverTimestamp()
      })
      await refreshChallenge(challenge.id)
      return { status, amount, id }
    } catch (e) {
      mandirError.value = (e as Error).message
      throw e
    } finally {
      mandirSaving.value = false
    }
  }

  /**
   * Deleting a challenge on its own would leave its submissions and its totals
   * behind, so clear the entries first and let the trigger unwind the rollups,
   * then drop the stats document.
   */
  async function purgeChallenge(challengeId: string) {
    const db = requireDb()
    // Loop because a challenge can hold more entries than one page.
    for (;;) {
      const snap = await getDocs(query(
        collection(db, 'niyamSubmissions'),
        where('challengeId', '==', challengeId),
        limit(400)
      ))
      if (snap.empty) break
      const batch = writeBatch(db)
      snap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
      if (snap.size < 400) break
    }
    await deleteDoc(doc(db, 'niyamChallengeStats', challengeId)).catch(() => {})
    await challenges.remove(challengeId)
    if (activeChallengeId.value === challengeId) {
      activeChallengeId.value = null
      submissions.value = []
      contributors.value = []
      stats.value = null
    }
    await loadOverview()
  }

  return {
    ...challenges,
    allChallenges,
    publishedChallenges,
    unpublishedDefaults,
    overview,
    awaitingTotal,
    overviewLoading,
    overviewError,
    statsById,
    statsFor,
    challengeById,
    queue,
    queueCapped,
    historyByKey,
    historyLoading,
    loadHistory,
    loadOverview,
    refreshChallenge,
    submissions,
    contributors,
    stats,
    pending,
    reviewed,
    loadingSubmissions,
    reviewingId,
    submissionError,
    activeChallengeId,
    contextFor,
    queueContextFor,
    loadChallengeDetail,
    approve,
    reject,
    hold,
    removeSubmission,
    publishDefault,
    publishAllDefaults,
    logMandirEntry,
    mandirSaving,
    mandirError,
    purgeChallenge
  }
}
