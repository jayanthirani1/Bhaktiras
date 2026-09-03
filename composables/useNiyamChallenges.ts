import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
  type Unsubscribe
} from 'firebase/firestore'
import type {
  MandirCheckinSlot,
  NiyamChallenge,
  NiyamChallengeStats,
  NiyamContributor,
  NiyamSubmission,
  NiyamSubmissionStatus
} from '~/types'
import { defaultNiyamChallenge } from '~/data/niyamChallenges'
import {
  buildSubmissionId,
  challengeLimits,
  inputModeFor,
  isChallengeOpen,
  isPublished,
  validateMandirCheckinSubmission,
  niyamDoubleTapMessage,
  niyamSubmitCooldown,
  NIYAM_DOUBLE_TAP_MS,
  mergeChallenges,
  GLOSS_MAX,
  RESOURCE_LABEL_MAX,
  safeMemberName,
  safeResourceUrl,
  sortSubmissionsNewestFirst,
  statusForAmount,
  statusKey,
  SUBMISSION_NOTE_MAX,
  toMillis,
  userChallengeKey
} from '~/utils/niyamChallenge'

/** Last board paint — return visits show titles + totals before Firestore answers. */
const BOARD_CACHE_KEY = 'bhaktiras:niyam-board-v1'

interface NiyamBoardCache {
  challenges: Array<{ id: string, data: Record<string, unknown> }>
  stats: Record<string, NiyamChallengeStats>
  savedAt: number
}

function stampForCache(value: NiyamChallenge['startAt']): { seconds: number, nanoseconds: number } | null {
  const ms = toMillis(value)
  if (!ms) return null
  return { seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6 }
}

function challengeForCache(challenge: NiyamChallenge): { id: string, data: Record<string, unknown> } {
  return {
    id: challenge.id,
    data: {
      title: challenge.title,
      detail: challenge.detail,
      unit: challenge.unit,
      unitSingular: challenge.unitSingular,
      target: challenge.target,
      startAt: stampForCache(challenge.startAt),
      endAt: stampForCache(challenge.endAt),
      active: challenge.active,
      order: challenge.order,
      autoApproveMax: challenge.autoApproveMax,
      maxPerSubmission: challenge.maxPerSubmission,
      inputMode: challenge.inputMode,
      presets: challenge.presets,
      hint: challenge.hint,
      gloss: challenge.gloss,
      resourceUrl: challenge.resourceUrl,
      resourceLabel: challenge.resourceLabel,
      resourceDocumentId: challenge.resourceDocumentId,
      icon: challenge.icon
    }
  }
}

function readBoardCache(): NiyamBoardCache | null {
  if (import.meta.server || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(BOARD_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as NiyamBoardCache
    if (!parsed || !Array.isArray(parsed.challenges) || typeof parsed.stats !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeBoardCache(challenges: NiyamChallenge[], stats: Record<string, NiyamChallengeStats>) {
  if (import.meta.server || typeof localStorage === 'undefined') return
  try {
    const payload: NiyamBoardCache = {
      challenges: challenges.filter(isPublished).map(challengeForCache),
      stats,
      savedAt: Date.now()
    }
    localStorage.setItem(BOARD_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Full or blocked storage — next visit waits on the network.
  }
}

function niyamSubmitError(e: unknown, challenge: NiyamChallenge): string {
  const code = (e as { code?: string })?.code
  if (code === 'permission-denied') {
    return inputModeFor(challenge) === 'checkin'
      ? 'This check-in could not be recorded. Sign in again or ask the mandir to republish this niyam.'
      : 'This entry could not be saved. Sign in again or ask the mandir to republish this niyam.'
  }
  const message = (e as Error).message
  if (message) return message
  return inputModeFor(challenge) === 'checkin'
    ? 'This check-in could not be recorded. Please try again.'
    : 'Your entry could not be saved. Please try again.'
}
const MY_SUBMISSION_LIMIT = 100
const TOP_CONTRIBUTORS_LIMIT = 5

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

export function mapChallenge(id: string, data: Record<string, unknown>): NiyamChallenge {
  const seed = defaultNiyamChallenge(id)
  const limits = challengeLimits(id, data)
  const presets = Array.isArray(data.presets)
    ? (data.presets as unknown[]).map(n => Math.floor(Number(n) || 0)).filter(n => n >= 1)
    : undefined
  return {
    id,
    title: String(data.title || seed?.title || ''),
    detail: String(data.detail || seed?.detail || ''),
    unit: String(data.unit || seed?.unit || 'entries'),
    unitSingular: String(data.unitSingular || seed?.unitSingular || data.unit || 'entry'),
    target: Math.max(0, Number(data.target ?? seed?.target) || 0),
    startAt: (data.startAt as NiyamChallenge['startAt']) ?? seed?.startAt ?? null,
    endAt: (data.endAt as NiyamChallenge['endAt']) ?? seed?.endAt ?? null,
    active: data.active !== false,
    order: Number(data.order ?? seed?.order) || 0,
    autoApproveMax: limits.autoApproveMax,
    maxPerSubmission: limits.maxPerSubmission,
    inputMode: data.inputMode === 'checkin' ? 'checkin' : 'count',
    presets: presets?.length ? presets : undefined,
    hint: data.hint ? String(data.hint) : undefined,
    gloss: data.gloss ? String(data.gloss).trim().slice(0, GLOSS_MAX) : undefined,
    // Absent means the document predates the field, so the seed's link still
    // applies; present-but-empty means an admin cleared it, and it stays clear.
    resourceUrl: 'resourceUrl' in data
      ? safeResourceUrl(data.resourceUrl) || undefined
      : safeResourceUrl(seed?.resourceUrl) || undefined,
    resourceLabel: 'resourceLabel' in data
      ? String(data.resourceLabel || '').trim().slice(0, RESOURCE_LABEL_MAX) || undefined
      : seed?.resourceLabel,
    resourceDocumentId: 'resourceDocumentId' in data
      ? String(data.resourceDocumentId || '').trim() || undefined
      : undefined,
    icon: (data.icon as NiyamChallenge['icon']) || undefined,
    origin: 'stored',
    createdAt: data.createdAt as NiyamChallenge['createdAt'],
    updatedAt: data.updatedAt as NiyamChallenge['updatedAt']
  }
}

export function mapStats(id: string, data: Record<string, unknown> | undefined): NiyamChallengeStats {
  if (!data) return emptyStats(id)
  const daily = data.dailyTotals && typeof data.dailyTotals === 'object'
    ? Object.fromEntries(
        Object.entries(data.dailyTotals as Record<string, unknown>)
          .map(([day, value]) => [day, Math.max(0, Number(value) || 0)])
      )
    : undefined
  return {
    challengeId: id,
    dailyTotals: daily,
    approvedTotal: Math.max(0, Number(data.approvedTotal) || 0),
    pendingTotal: Math.max(0, Number(data.pendingTotal) || 0),
    approvedCount: Math.max(0, Number(data.approvedCount) || 0),
    pendingCount: Math.max(0, Number(data.pendingCount) || 0),
    participants: Math.max(0, Number(data.participants) || 0),
    updatedAt: data.updatedAt as NiyamChallengeStats['updatedAt']
  }
}

export function mapSubmission(id: string, data: Record<string, unknown>): NiyamSubmission {
  const status = String(data.status || 'pending') as NiyamSubmissionStatus
  const rawSlot = data.checkinSlot
  const checkinSlot = rawSlot === 'morning' || rawSlot === 'evening' ? rawSlot : null
  return {
    id,
    challengeId: String(data.challengeId || ''),
    userId: String(data.userId || ''),
    userName: String(data.userName || 'Devotee'),
    amount: Math.max(0, Number(data.amount) || 0),
    note: (data.note as string | null) ?? null,
    status: status === 'approved' || status === 'rejected' ? status : 'pending',
    statusKey: String(data.statusKey || ''),
    userChallengeKey: String(data.userChallengeKey || ''),
    dayKey: String(data.dayKey || ''),
    checkinSlot,
    createdAt: data.createdAt as NiyamSubmission['createdAt'],
    reviewedAt: (data.reviewedAt as NiyamSubmission['reviewedAt']) ?? null,
    reviewedBy: (data.reviewedBy as string | null) ?? null,
    reviewNote: (data.reviewNote as string | null) ?? null
  }
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

/**
 * The devotee side of the niyam challenges: read the goals, read the community
 * totals, and add your own count.
 *
 * Community totals come from `niyamChallengeStats`, which only the
 * `syncNiyamChallengeTotals` Cloud Function writes. Nothing in the browser can
 * move the shared number directly — a submission is created, and the trigger
 * folds it in only once its status is `approved`.
 */
export function useNiyamChallenges() {
  const { $firebaseDb } = useNuxtApp()
  const { user, isLoggedIn, userName, loading: authLoading } = useAuth()

  // Defaults paint immediately; a local cache (if any) upgrades titles + totals
  // before the first Firestore round-trip finishes.
  const challenges = ref<NiyamChallenge[]>(mergeChallenges([]))
  const stats = ref<Record<string, NiyamChallengeStats>>({})
  const mySubmissions = ref<NiyamSubmission[]>([])
  const myContributors = ref<Record<string, NiyamContributor>>({})
  const topContributors = ref<Record<string, NiyamContributor[]>>({})
  const loadingLeaders = ref<Record<string, boolean>>({})
  const loading = ref(false)
  const submitting = ref(false)
  const withdrawingId = ref('')
  /** Kept apart from `error` so a failed removal is reported inside the sheet
   *  the tap came from, not only in the page banner behind it. */
  const withdrawError = ref('')
  const error = ref('')
  let statsUnsubs: Unsubscribe[] = []
  let contributorUnsubs: Unsubscribe[] = []
  let boardCacheTimer: ReturnType<typeof setTimeout> | null = null

  function getDb(): Firestore | null {
    if (import.meta.server) return null
    return ($firebaseDb as Firestore | null) ?? null
  }

  function persistBoardCacheSoon() {
    if (import.meta.server) return
    if (boardCacheTimer) clearTimeout(boardCacheTimer)
    boardCacheTimer = setTimeout(() => {
      boardCacheTimer = null
      writeBoardCache(challenges.value, stats.value)
    }, 200)
  }

  function applyBoardCache() {
    const cache = readBoardCache()
    if (!cache) return
    if (cache.challenges.length) {
      challenges.value = mergeChallenges(
        cache.challenges
          .map(row => mapChallenge(row.id, row.data))
          .filter(c => c.title)
      )
    }
    if (cache.stats && Object.keys(cache.stats).length) {
      stats.value = cache.stats
    }
  }

  if (import.meta.client) applyBoardCache()

  const openChallenges = computed(() => challenges.value.filter(c => isChallengeOpen(c)))
  const closedChallenges = computed(() => challenges.value.filter(c => !isChallengeOpen(c)))

  function statsFor(challengeId: string): NiyamChallengeStats {
    return stats.value[challengeId] || emptyStats(challengeId)
  }

  function submissionsFor(challengeId: string): NiyamSubmission[] {
    return mySubmissions.value.filter(s => s.challengeId === challengeId)
  }

  function leadersFor(challengeId: string): NiyamContributor[] {
    return topContributors.value[challengeId] || []
  }

  function leadersLoading(challengeId: string): boolean {
    return !!loadingLeaders.value[challengeId]
  }

  /** Top five by approved total — public leaderboard rows only. */
  async function fetchTopContributors(challengeId: string) {
    const db = getDb()
    if (!db || !challengeId) return
    loadingLeaders.value = { ...loadingLeaders.value, [challengeId]: true }
    try {
      const snap = await getDocs(query(
        collection(db, 'niyamChallenges', challengeId, 'contributors'),
        orderBy('approvedTotal', 'desc'),
        limit(TOP_CONTRIBUTORS_LIMIT)
      ))
      topContributors.value = {
        ...topContributors.value,
        [challengeId]: snap.docs
          .map(d => mapContributor(d.id, d.data()))
          .filter(row => row.approvedTotal > 0)
      }
    } catch {
      topContributors.value = { ...topContributors.value, [challengeId]: [] }
    } finally {
      loadingLeaders.value = { ...loadingLeaders.value, [challengeId]: false }
    }
  }

  function contributorFor(challengeId: string): NiyamContributor | null {
    return myContributors.value[challengeId] ?? null
  }

  function approvedFromSubmissions(challengeId: string): number {
    return submissionsFor(challengeId)
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.amount, 0)
  }

  function pendingFromSubmissions(challengeId: string): number {
    return submissionsFor(challengeId)
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + s.amount, 0)
  }

  /** Your own approved total — contributor rollup matches the public leaderboard. */
  function myApprovedTotal(challengeId: string): number {
    const rolled = contributorFor(challengeId)?.approvedTotal
    const fromSubs = approvedFromSubmissions(challengeId)
    if (rolled == null) return fromSubs
    return Math.max(rolled, fromSubs)
  }

  /** Submitted but waiting on an admin, so not in the shared total yet. */
  function myPendingTotal(challengeId: string): number {
    const rolled = contributorFor(challengeId)?.pendingTotal
    const fromSubs = pendingFromSubmissions(challengeId)
    if (rolled == null) return fromSubs
    return Math.max(rolled, fromSubs)
  }

  /** Reactive map so board rows re-render when contributor rollups change. */
  const myApprovedByChallenge = computed(() => {
    const totals: Record<string, number> = {}
    for (const challenge of publishedChallenges.value) {
      totals[challenge.id] = myApprovedTotal(challenge.id)
    }
    return totals
  })

  const myPendingByChallenge = computed(() => {
    const totals: Record<string, number> = {}
    for (const challenge of publishedChallenges.value) {
      totals[challenge.id] = myPendingTotal(challenge.id)
    }
    return totals
  })

  /** Approved plus pending — the personal total shown on check-in and detail sheets. */
  function myPersonalTotal(challengeId: string): number {
    return myApprovedTotal(challengeId) + myPendingTotal(challengeId)
  }

  /**
   * The five defaults merged with whatever is published. Without Firebase — a
   * dev server with no credentials — the defaults alone still render, so the
   * page can be looked at end to end; they just cannot take entries.
   */
  async function fetchChallenges() {
    const db = getDb()
    if (!db) {
      challenges.value = mergeChallenges([])
      return
    }
    const snap = await getDocs(collection(db, 'niyamChallenges'))
    challenges.value = mergeChallenges(
      snap.docs.map(d => mapChallenge(d.id, d.data())).filter(c => c.title)
    )
  }

  /** Only published niyams have totals or entries to read. */
  const publishedChallenges = computed(() => challenges.value.filter(isPublished))

  function teardownStatsListeners() {
    for (const unsub of statsUnsubs) unsub()
    statsUnsubs = []
  }

  function teardownContributorListeners() {
    for (const unsub of contributorUnsubs) unsub()
    contributorUnsubs = []
  }

  /** Live contributor rollups — same source as the public leaderboard. */
  function setupContributorListeners() {
    teardownContributorListeners()
    const db = getDb()
    const uid = user.value?.uid
    if (!db || !uid || !publishedChallenges.value.length) return

    for (const challenge of publishedChallenges.value) {
      const unsub = onSnapshot(
        doc(db, 'niyamChallenges', challenge.id, 'contributors', uid),
        (snap) => {
          if (!snap.exists()) {
            const next = { ...myContributors.value }
            delete next[challenge.id]
            myContributors.value = next
            return
          }
          myContributors.value = {
            ...myContributors.value,
            [challenge.id]: mapContributor(uid, snap.data() as Record<string, unknown>)
          }
        },
        () => {
          // Keep the last known rollup on transient listener errors.
        }
      )
      contributorUnsubs.push(unsub)
    }
  }

  /** Live totals — the trigger updates stats after each submission. */
  function setupStatsListeners() {
    teardownStatsListeners()
    const db = getDb()
    if (!db || !publishedChallenges.value.length) return
    for (const challenge of publishedChallenges.value) {
      const unsub = onSnapshot(
        doc(db, 'niyamChallengeStats', challenge.id),
        (snap) => {
          stats.value = {
            ...stats.value,
            [challenge.id]: mapStats(challenge.id, snap.data() as Record<string, unknown> | undefined)
          }
          persistBoardCacheSoon()
        },
        () => {
          stats.value = { ...stats.value, [challenge.id]: emptyStats(challenge.id) }
        }
      )
      statsUnsubs.push(unsub)
    }
  }

  async function refreshStatsForChallenge(challengeId: string) {
    const db = getDb()
    if (!db) return
    try {
      const snap = await getDoc(doc(db, 'niyamChallengeStats', challengeId))
      stats.value = {
        ...stats.value,
        [challengeId]: mapStats(challengeId, snap.data() as Record<string, unknown> | undefined)
      }
    } catch {
      stats.value = { ...stats.value, [challengeId]: emptyStats(challengeId) }
    }
  }

  /** Poll until the Cloud Function has folded a write into the shared total. */
  async function waitForStatsUpdate(
    challengeId: string,
    options: { minApproved?: number; minPending?: number; attempts?: number } = {}
  ) {
    const { minApproved, minPending, attempts = 10 } = options
    for (let i = 0; i < attempts; i++) {
      await refreshStatsForChallenge(challengeId)
      const current = statsFor(challengeId)
      const approvedOk = minApproved == null || current.approvedTotal >= minApproved
      const pendingOk = minPending == null || current.pendingTotal >= minPending
      if (approvedOk && pendingOk) return
      await new Promise(resolve => setTimeout(resolve, 250 * (i + 1)))
    }
  }

  /** One collection read instead of one getDoc per niyam. */
  async function fetchStats() {
    const db = getDb()
    if (!db || !publishedChallenges.value.length) return
    const publishedIds = new Set(publishedChallenges.value.map(c => c.id))
    try {
      const snap = await getDocs(collection(db, 'niyamChallengeStats'))
      const next: Record<string, NiyamChallengeStats> = { ...stats.value }
      for (const d of snap.docs) {
        if (!publishedIds.has(d.id)) continue
        next[d.id] = mapStats(d.id, d.data() as Record<string, unknown>)
      }
      for (const id of publishedIds) {
        if (!(id in next)) next[id] = emptyStats(id)
      }
      stats.value = next
      persistBoardCacheSoon()
    } catch {
      // Keep cached or empty totals; live listeners still try.
    }
  }

  /** Poll until the Cloud Function has folded a write into your contributor row. */
  async function waitForContributorUpdate(
    challengeId: string,
    options: { minApproved?: number; minPending?: number; attempts?: number } = {}
  ) {
    const db = getDb()
    const uid = user.value?.uid
    if (!db || !uid) return
    const { minApproved, minPending, attempts = 10 } = options
    for (let i = 0; i < attempts; i++) {
      try {
        const snap = await getDoc(doc(db, 'niyamChallenges', challengeId, 'contributors', uid))
        if (snap.exists()) {
          const row = mapContributor(uid, snap.data() as Record<string, unknown>)
          myContributors.value = { ...myContributors.value, [challengeId]: row }
          const approvedOk = minApproved == null || row.approvedTotal >= minApproved
          const pendingOk = minPending == null || row.pendingTotal >= minPending
          if (approvedOk && pendingOk) return
        }
      } catch {
        // Retry until attempts are exhausted.
      }
      await new Promise(resolve => setTimeout(resolve, 250 * (i + 1)))
    }
  }

  async function fetchMyContributors() {
    const db = getDb()
    const uid = user.value?.uid
    if (!db || !uid) {
      myContributors.value = {}
      return
    }
    if (!publishedChallenges.value.length) return
    const entries = await Promise.all(
      publishedChallenges.value.map(async (c) => {
        try {
          const snap = await getDoc(doc(db, 'niyamChallenges', c.id, 'contributors', uid))
          if (!snap.exists()) return null
          return [c.id, mapContributor(uid, snap.data() as Record<string, unknown>)] as const
        } catch {
          return null
        }
      })
    )
    myContributors.value = Object.fromEntries(
      entries.filter((entry): entry is readonly [string, NiyamContributor] => entry != null)
    )
  }

  async function fetchMySubmissions() {
    const db = getDb()
    const uid = user.value?.uid
    if (!db || !uid) {
      mySubmissions.value = []
      return
    }
    if (!publishedChallenges.value.length) return
    // One equality filter per challenge on the composite `userChallengeKey`.
    // Filtering on userId and challengeId separately would need a composite
    // index, and the deploy service account is not allowed to create those.
    // Newest-first via inverted ids in the document key (see buildSubmissionId).
    const results = await Promise.all(
      publishedChallenges.value.map(async (c) => {
        try {
          const snap = await getDocs(query(
            collection(db, 'niyamSubmissions'),
            where('userChallengeKey', '==', userChallengeKey(uid, c.id)),
            // Document ids embed an inverted timestamp, so default id order is newest-first.
            limit(MY_SUBMISSION_LIMIT)
          ))
          return snap.docs.map(d => mapSubmission(d.id, d.data()))
        } catch {
          return [] as NiyamSubmission[]
        }
      })
    )
    mySubmissions.value = sortSubmissionsNewestFirst(results.flat())
  }

  /**
   * Board first, personal data in the background.
   *
   * Waiting on stats + every per-niyam submission query made the whole page
   * feel stuck behind a spinner even though the five titles are known from
   * defaults (and usually from last visit's cache). Listeners + stats kick
   * off from the published-id watch as soon as cache or Firestore supplies ids.
   */
  async function refresh() {
    error.value = ''
    try {
      await fetchChallenges()
      persistBoardCacheSoon()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function waitForSubmissionSettled(
    id: string,
    challenge: NiyamChallenge
  ): Promise<NiyamSubmission> {
    const db = getDb()
    if (!db) throw new Error('Firebase is not configured')
    const checkin = inputModeFor(challenge) === 'checkin'
    const attempts = 12
    for (let i = 0; i < attempts; i++) {
      const snap = await getDoc(doc(db, 'niyamSubmissions', id))
      if (!snap.exists()) {
        throw new Error(
          checkin
            ? 'This check-in could not be recorded. Please wait before trying again.'
            : 'Your entry could not be saved. Please try again.'
        )
      }
      const saved = mapSubmission(id, snap.data() as Record<string, unknown>)
      if (saved.status === 'rejected') {
        throw new Error(
          saved.reviewNote?.trim()
            || (checkin
              ? 'This check-in was not counted — you may have already logged today\'s sabhas or tapped too soon.'
              : 'This entry was not counted — you may have tapped too soon. Wait a minute and try again.')
        )
      }
      // Give the spam trigger a moment to mark accidental double-taps.
      if (i >= 3) return saved
      await new Promise(resolve => setTimeout(resolve, 250 * (i + 1)))
    }
    throw new Error('Your entry could not be confirmed. Please try again.')
  }

  /**
   * Add to a challenge. Returns the status the entry landed in, so the page can
   * say either "counted" or "waiting for an admin" without guessing.
   */
  async function submit(
    challenge: NiyamChallenge,
    amountInput: number,
    noteInput = '',
    checkinSlotInput?: MandirCheckinSlot | null
  ): Promise<{ status: NiyamSubmissionStatus; submission: NiyamSubmission }> {
    if (submitting.value) throw new Error('Already saving')
    const db = getDb()
    const uid = user.value?.uid
    if (!db) throw new Error('Firebase is not configured')
    if (!uid) throw new Error('Sign in to add to this challenge')
    if (!isPublished(challenge)) {
      throw new Error('This niyam has not been opened by the mandir yet')
    }
    if (!isChallengeOpen(challenge)) throw new Error('This challenge is closed')

    const amount = Math.floor(Number(amountInput) || 0)
    if (amount < 1) throw new Error('Enter how many you have done')
    if (amount > challenge.maxPerSubmission) {
      throw new Error(`The most you can add in one entry is ${challenge.maxPerSubmission}`)
    }

    if (inputModeFor(challenge) === 'checkin') {
      const verdict = validateMandirCheckinSubmission(
        submissionsFor(challenge.id),
        { amount, checkinSlot: checkinSlotInput ?? null }
      )
      if (!verdict.ok) throw new Error(verdict.error || 'This check-in could not be recorded.')
    } else {
      const cooldown = niyamSubmitCooldown(submissionsFor(challenge.id), NIYAM_DOUBLE_TAP_MS)
      if (cooldown.blocked) {
        throw new Error(niyamDoubleTapMessage(cooldown.remainingMs))
      }
    }

    const status = statusForAmount(challenge, amount)
    const note = noteInput.trim().slice(0, SUBMISSION_NOTE_MAX)
    const checkinSlot = amount === 1 && checkinSlotInput ? checkinSlotInput : null
    const id = buildSubmissionId(challenge.id)
    const beforeStats = statsFor(challenge.id)

    submitting.value = true
    error.value = ''
    const dayKey = ukDateId()
    const optimistic: NiyamSubmission = {
      id,
      challengeId: challenge.id,
      userId: uid,
      userName: safeMemberName(userName.value),
      amount,
      note: note || null,
      status,
      statusKey: statusKey(challenge.id, status),
      userChallengeKey: userChallengeKey(uid, challenge.id),
      dayKey,
      checkinSlot,
      createdAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: null
    }
    try {
      // Optimistic row so cooldown and "Yours" update before the round-trip finishes.
      mySubmissions.value = sortSubmissionsNewestFirst([
        optimistic,
        ...mySubmissions.value.filter(s => s.id !== id)
      ])
      await setDoc(doc(db, 'niyamSubmissions', id), {
        challengeId: challenge.id,
        userId: uid,
        userName: optimistic.userName,
        amount,
        note: note || null,
        status,
        statusKey: statusKey(challenge.id, status),
        userChallengeKey: userChallengeKey(uid, challenge.id),
        dayKey,
        ...(checkinSlot ? { checkinSlot } : {}),
        createdAt: serverTimestamp()
      })

      const savedSnap = await getDoc(doc(db, 'niyamSubmissions', id))
      if (!savedSnap.exists()) {
        throw new Error(
          inputModeFor(challenge) === 'checkin'
            ? 'This check-in could not be recorded. Please wait before trying again.'
            : 'Your entry could not be saved. Please try again.'
        )
      }
      const saved = await waitForSubmissionSettled(id, challenge)
      mySubmissions.value = sortSubmissionsNewestFirst([
        saved,
        ...mySubmissions.value.filter(s => s.id !== id)
      ])
      void fetchMySubmissions()

      if (status === 'approved') {
        await Promise.all([
          waitForStatsUpdate(challenge.id, {
            minApproved: beforeStats.approvedTotal + amount
          }),
          waitForContributorUpdate(challenge.id, {
            minApproved: myApprovedTotal(challenge.id)
          })
        ])
      } else if (status === 'pending') {
        await Promise.all([
          waitForStatsUpdate(challenge.id, {
            minPending: beforeStats.pendingTotal + amount
          }),
          waitForContributorUpdate(challenge.id, {
            minPending: myPendingTotal(challenge.id)
          })
        ])
      } else {
        await Promise.all([
          refreshStatsForChallenge(challenge.id),
          fetchMyContributors()
        ])
      }
      void fetchTopContributors(challenge.id)
      return { status, submission: saved }
    } catch (e) {
      mySubmissions.value = mySubmissions.value.filter(s => s.id !== id)
      const message = niyamSubmitError(e, challenge)
      error.value = message
      throw new Error(message)
    } finally {
      submitting.value = false
    }
  }

  /**
   * Withdraw one of your own entries — a mistyped count, usually.
   *
   * The row is dropped the moment the delete is acknowledged, not before and
   * not after the re-reads: dropping it up front leaves nothing on screen to
   * carry the "Removing…" state or to put an error against, and waiting for
   * the three re-reads that follow makes a fast delete feel slow. A refused
   * delete therefore leaves the entry exactly where it was, with the reason
   * beside it.
   *
   * The shared total is unwound by `syncNiyamChallengeTotals` rather than here;
   * the stats and contributor listeners pick that up when it lands.
   */
  async function withdraw(submission: NiyamSubmission) {
    const db = getDb()
    if (!db || !user.value?.uid) return
    if (withdrawingId.value) return
    const { deleteDoc } = await import('firebase/firestore')
    withdrawError.value = ''
    withdrawingId.value = submission.id
    try {
      await deleteDoc(doc(db, 'niyamSubmissions', submission.id))
      mySubmissions.value = mySubmissions.value.filter(s => s.id !== submission.id)
      await Promise.all([fetchStats(), fetchMySubmissions(), fetchMyContributors()])
      void fetchTopContributors(submission.challengeId)
    } catch (e) {
      withdrawError.value = (e as Error).message || 'That entry could not be removed. Please try again.'
    } finally {
      withdrawingId.value = ''
    }
  }

  onMounted(refresh)

  watch(
    () => authLoading.value,
    (loadingAuth) => {
      if (loadingAuth) return
      setupContributorListeners()
      void fetchMySubmissions()
    }
  )

  watch(() => user.value?.uid, (uid, prev) => {
    if (uid === prev) return
    setupContributorListeners()
    void fetchMySubmissions()
  })

  // Keyed on ids so a re-fetch of the same board does not tear down live
  // listeners; `immediate` starts stats from the cache before challenges reload.
  watch(
    () => publishedChallenges.value.map(c => c.id).join(','),
    () => {
      setupStatsListeners()
      setupContributorListeners()
      void fetchStats()
      if (user.value?.uid && !authLoading.value) {
        void fetchMySubmissions()
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    if (boardCacheTimer) clearTimeout(boardCacheTimer)
    teardownStatsListeners()
    teardownContributorListeners()
  })

  return {
    challenges,
    publishedChallenges,
    openChallenges,
    closedChallenges,
    stats,
    mySubmissions,
    loading,
    submitting,
    withdrawingId,
    withdrawError,
    error,
    isLoggedIn,
    statsFor,
    submissionsFor,
    leadersFor,
    leadersLoading,
    fetchTopContributors,
    myApprovedTotal,
    myPendingTotal,
    myPersonalTotal,
    myApprovedByChallenge,
    myPendingByChallenge,
    submit,
    withdraw,
    refresh
  }
}
