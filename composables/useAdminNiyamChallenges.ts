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
  NiyamSubmission,
  NiyamSubmissionStatus
} from '~/types'
import { SITE } from '~/data/site'
import {
  buildSubmissionId,
  challengeWindow,
  DEFAULT_AUTO_APPROVE_MAX,
  formatCount,
  DEFAULT_MAX_PER_SUBMISSION,
  isChallengeOpen,
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

/* ────────────────────────────────────────────────────────────────────────────
 * The five running niyams.
 *
 * These belong in `data/niyamChallenges.ts` with `mergeChallenges` / `isPublished`
 * in `utils/niyamChallenge.ts`; neither exists in this branch yet and both are
 * owned by another engineer, so the admin portal carries its own copy for now.
 * When theirs lands, delete this block and import from there — the shapes and
 * the slug ids are deliberately the same.
 * ──────────────────────────────────────────────────────────────────────────── */

export type NiyamInputMode = 'count' | 'checkin'
export type NiyamIconName = 'mala' | 'stotra' | 'mandir' | 'path' | 'dandvat' | 'niyam'

export const NIYAM_ICON_NAMES: NiyamIconName[] = ['mala', 'stotra', 'mandir', 'path', 'dandvat', 'niyam']

/** The fields `NiyamChallenge` is gaining. Intersected, never re-declared, so
 *  this stays compatible whether or not `types/index.ts` has them yet. */
export interface NiyamChallengeExtras {
  /** `count` asks for a number; `checkin` is a single "I was there" tap. */
  inputMode?: NiyamInputMode
  /** One-tap amounts on the devotee card. */
  presets?: number[]
  /** What counts as one, in the devotee's words. */
  hint?: string
  icon?: NiyamIconName
  /** Whether this is a code default or a real Firestore document. */
  origin?: 'default' | 'stored'
}

export type AdminNiyamChallenge = NiyamChallenge & NiyamChallengeExtras

/** `dailyTotals` is written by a Cloud Function — read only, never written here. */
export type AdminNiyamChallengeStats = NiyamChallengeStats & {
  dailyTotals?: Record<string, number>
}

/** Every default runs to the end of the utsav unless an admin narrows it. */
const DEFAULT_END = new Date(SITE.patotsavEnd)

export const NIYAM_CHALLENGE_DEFAULTS: AdminNiyamChallenge[] = [
  {
    id: 'janmangal-stotra',
    title: 'Janmangal Stotra',
    detail: 'Every path of the Janmangal Namavali the sangat recites, counting towards one million together.',
    unit: 'paths',
    unitSingular: 'path',
    target: 1_000_000,
    startAt: null,
    endAt: DEFAULT_END,
    active: true,
    order: 1,
    autoApproveMax: 108,
    maxPerSubmission: 5000,
    inputMode: 'count',
    presets: [1, 5, 11, 51],
    hint: 'One complete recital of the Janmangal Stotra counts as one path.',
    icon: 'stotra'
  },
  {
    id: 'mala',
    title: 'Mala',
    detail: 'Malas turned at home, at sabha, on the way to work — all of them ladder up to one million.',
    unit: 'malas',
    unitSingular: 'mala',
    target: 1_000_000,
    startAt: null,
    endAt: DEFAULT_END,
    active: true,
    order: 2,
    autoApproveMax: 108,
    maxPerSubmission: 5000,
    inputMode: 'count',
    presets: [1, 5, 11, 51],
    hint: 'One full mala of 108 counts as one mala.',
    icon: 'mala'
  },
  {
    id: 'sabha-attendance',
    title: 'Aarti, Chesta & Katha',
    detail: 'Ten thousand sabhas attended — every aarti, chesta and katha you come to.',
    unit: 'sabhas',
    unitSingular: 'sabha',
    target: 10_000,
    startAt: null,
    endAt: DEFAULT_END,
    active: true,
    order: 3,
    autoApproveMax: 3,
    maxPerSubmission: 30,
    inputMode: 'checkin',
    presets: [1],
    hint: 'One sabha you attended — aarti, chesta or katha — counts as one.',
    icon: 'mandir'
  },
  {
    id: 'shanti-path',
    title: 'Shanti Path',
    detail: 'Ten thousand complete Shanti Paths for the peace of the sangat and the world.',
    unit: 'paths',
    unitSingular: 'path',
    target: 10_000,
    startAt: null,
    endAt: DEFAULT_END,
    active: true,
    order: 4,
    autoApproveMax: 21,
    maxPerSubmission: 500,
    inputMode: 'count',
    presets: [1, 5, 11],
    hint: 'One complete Shanti Path counts as one.',
    icon: 'path'
  },
  {
    id: 'dandvat-panchang-pranaam',
    title: 'Dandvat & Panchang Pranaam',
    detail: 'One million pranaams offered at the charnarvind of Ghanshyam Maharaj.',
    unit: 'pranaams',
    unitSingular: 'pranaam',
    target: 1_000_000,
    startAt: null,
    endAt: DEFAULT_END,
    active: true,
    order: 5,
    autoApproveMax: 108,
    maxPerSubmission: 5000,
    inputMode: 'count',
    presets: [11, 51, 108],
    hint: 'Each dandvat or panchang pranaam counts as one.',
    icon: 'dandvat'
  }
]

/** A default only renders; it cannot take entries until its document exists. */
export function isPublished(challenge: AdminNiyamChallenge): boolean {
  return challenge.origin !== 'default'
}

/** Defaults merged with what Firestore holds — a stored document always wins. */
export function mergeChallenges(stored: AdminNiyamChallenge[]): AdminNiyamChallenge[] {
  const byId = new Map<string, AdminNiyamChallenge>()
  for (const challenge of NIYAM_CHALLENGE_DEFAULTS) {
    byId.set(challenge.id, { ...challenge, origin: 'default' })
  }
  for (const challenge of stored) {
    const id = String(challenge.id || '').trim()
    if (!id) continue
    const base = byId.get(id)
    byId.set(id, { ...(base || {}), ...challenge, id, origin: 'stored' })
  }
  return sortChallenges([...byId.values()]) as AdminNiyamChallenge[]
}

/* ──────────────────────────────────────────────────────────────────────────── */

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
  challenge: AdminNiyamChallenge
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

function emptyStats(challengeId: string): AdminNiyamChallengeStats {
  return {
    challengeId,
    approvedTotal: 0,
    pendingTotal: 0,
    approvedCount: 0,
    pendingCount: 0,
    participants: 0
  }
}

/** `dailyTotals` is a plain map of UK day → approved amount when the function has written one. */
function mapDailyTotals(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const out: Record<string, number> = {}
  for (const [day, amount] of Object.entries(value as Record<string, unknown>)) {
    const n = Number(amount)
    if (Number.isFinite(n)) out[day] = Math.max(0, Math.round(n))
  }
  return Object.keys(out).length ? out : undefined
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

  const challenges = useAdminCollection<AdminNiyamChallenge>('niyamChallenges')

  const submissions = ref<NiyamSubmission[]>([])
  const contributors = ref<NiyamContributor[]>([])
  const stats = ref<AdminNiyamChallengeStats | null>(null)
  const loadingSubmissions = ref(false)
  const reviewingId = ref<string | null>(null)
  const submissionError = ref('')
  const activeChallengeId = ref<string | null>(null)

  const statsById = ref<Record<string, AdminNiyamChallengeStats>>({})
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

  function statsFor(challengeId: string): AdminNiyamChallengeStats {
    return statsById.value[challengeId] || emptyStats(challengeId)
  }

  function challengeById(challengeId: string): AdminNiyamChallenge | null {
    return allChallenges.value.find(c => c.id === challengeId) || null
  }

  function overviewStatus(challenge: AdminNiyamChallenge): NiyamOverviewStatus {
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
            const mapped = mapStats(c.id, data) as AdminNiyamChallengeStats
            const dailyTotals = mapDailyTotals(data?.dailyTotals)
            return [c.id, dailyTotals ? { ...mapped, dailyTotals } : mapped] as const
          } catch {
            return [c.id, emptyStats(c.id)] as const
          }
        })),
        // One equality filter on `statusKey` per niyam — `{challengeId}__pending`
        // is exactly this query, so no composite index is involved.
        Promise.all(list.map(async (c) => {
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
      const data = statsSnap.data() as Record<string, unknown> | undefined
      const mapped = mapStats(challengeId, data) as AdminNiyamChallengeStats
      const dailyTotals = mapDailyTotals(data?.dailyTotals)
      stats.value = dailyTotals ? { ...mapped, dailyTotals } : mapped
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
      const data = snap.data() as Record<string, unknown> | undefined
      const mapped = mapStats(challengeId, data) as AdminNiyamChallengeStats
      const dailyTotals = mapDailyTotals(data?.dailyTotals)
      statsById.value = {
        ...statsById.value,
        [challengeId]: dailyTotals ? { ...mapped, dailyTotals } : mapped
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
  function challengeWritePayload(challenge: AdminNiyamChallenge) {
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
    const challenge = NIYAM_CHALLENGE_DEFAULTS.find(c => c.id === challengeId)
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
    challenge: AdminNiyamChallenge,
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
