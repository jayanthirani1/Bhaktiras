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
  NiyamChallenge,
  NiyamChallengeStats,
  NiyamContributor,
  NiyamSubmission,
  NiyamSubmissionStatus
} from '~/types'
import {
  buildSubmissionId,
  inputModeFor,
  isChallengeOpen,
  isPublished,
  mandirCheckinBlockedMessage,
  mandirCheckinCooldown,
  mergeChallenges,
  safeMemberName,
  sortSubmissionsNewestFirst,
  statusForAmount,
  statusKey,
  SUBMISSION_NOTE_MAX,
  userChallengeKey
} from '~/utils/niyamChallenge'

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
  const presets = Array.isArray(data.presets)
    ? (data.presets as unknown[]).map(n => Math.floor(Number(n) || 0)).filter(n => n >= 1)
    : undefined
  return {
    id,
    title: String(data.title || ''),
    detail: String(data.detail || ''),
    unit: String(data.unit || 'entries'),
    unitSingular: String(data.unitSingular || data.unit || 'entry'),
    target: Math.max(0, Number(data.target) || 0),
    startAt: (data.startAt as NiyamChallenge['startAt']) ?? null,
    endAt: (data.endAt as NiyamChallenge['endAt']) ?? null,
    active: data.active !== false,
    order: Number(data.order) || 0,
    autoApproveMax: Math.max(0, Number(data.autoApproveMax) || 0),
    maxPerSubmission: Math.max(1, Number(data.maxPerSubmission) || 1),
    inputMode: data.inputMode === 'checkin' ? 'checkin' : 'count',
    presets: presets?.length ? presets : undefined,
    hint: data.hint ? String(data.hint) : undefined,
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

  const challenges = ref<NiyamChallenge[]>([])
  const stats = ref<Record<string, NiyamChallengeStats>>({})
  const mySubmissions = ref<NiyamSubmission[]>([])
  const topContributors = ref<Record<string, NiyamContributor[]>>({})
  const loadingLeaders = ref<Record<string, boolean>>({})
  const loading = ref(true)
  const submitting = ref(false)
  const error = ref('')
  let statsUnsubs: Unsubscribe[] = []

  function getDb(): Firestore | null {
    if (import.meta.server) return null
    return ($firebaseDb as Firestore | null) ?? null
  }

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

  /** Your own approved total for a challenge — what you have added to the goal. */
  function myApprovedTotal(challengeId: string): number {
    return submissionsFor(challengeId)
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.amount, 0)
  }

  /** Submitted but waiting on an admin, so not in the shared total yet. */
  function myPendingTotal(challengeId: string): number {
    return submissionsFor(challengeId)
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + s.amount, 0)
  }

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

  async function fetchStats() {
    const db = getDb()
    if (!db || !publishedChallenges.value.length) return
    const entries = await Promise.all(
      publishedChallenges.value.map(async (c) => {
        try {
          const snap = await getDoc(doc(db, 'niyamChallengeStats', c.id))
          return [c.id, mapStats(c.id, snap.data() as Record<string, unknown> | undefined)] as const
        } catch {
          return [c.id, emptyStats(c.id)] as const
        }
      })
    )
    stats.value = Object.fromEntries(entries)
  }

  async function fetchMySubmissions() {
    const db = getDb()
    const uid = user.value?.uid
    if (!db || !uid || !publishedChallenges.value.length) {
      mySubmissions.value = []
      return
    }
    // One equality filter per challenge on the composite `userChallengeKey`.
    // Filtering on userId and challengeId separately would need a composite
    // index, and the deploy service account is not allowed to create those.
    const results = await Promise.all(
      publishedChallenges.value.map(async (c) => {
        try {
          const snap = await getDocs(query(
            collection(db, 'niyamSubmissions'),
            where('userChallengeKey', '==', userChallengeKey(uid, c.id)),
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

  async function refresh() {
    loading.value = true
    error.value = ''
    try {
      await fetchChallenges()
      await fetchStats()
      setupStatsListeners()
      if (!authLoading.value) {
        await fetchMySubmissions()
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  /**
   * Add to a challenge. Returns the status the entry landed in, so the page can
   * say either "counted" or "waiting for an admin" without guessing.
   */
  async function submit(
    challenge: NiyamChallenge,
    amountInput: number,
    noteInput = ''
  ): Promise<NiyamSubmissionStatus> {
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
      const cooldown = mandirCheckinCooldown(
        submissionsFor(challenge.id),
        challenge.maxPerSubmission
      )
      if (cooldown.blocked) {
        throw new Error(mandirCheckinBlockedMessage(cooldown))
      }
    }

    const status = statusForAmount(challenge, amount)
    const note = noteInput.trim().slice(0, SUBMISSION_NOTE_MAX)
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
        createdAt: serverTimestamp()
      })
      await fetchMySubmissions()

      const saved = mySubmissions.value.find(s => s.id === id)
      if (!saved) {
        throw new Error(
          inputModeFor(challenge) === 'checkin'
            ? 'This check-in could not be recorded. Please wait before trying again.'
            : 'Your entry could not be saved. Please try again.'
        )
      }

      if (status === 'approved') {
        await waitForStatsUpdate(challenge.id, {
          minApproved: beforeStats.approvedTotal + amount
        })
      } else if (status === 'pending') {
        await waitForStatsUpdate(challenge.id, {
          minPending: beforeStats.pendingTotal + amount
        })
      } else {
        await refreshStatsForChallenge(challenge.id)
      }
      void fetchTopContributors(challenge.id)
      return status
    } catch (e) {
      mySubmissions.value = mySubmissions.value.filter(s => s.id !== id)
      error.value = (e as Error).message
      throw e
    } finally {
      submitting.value = false
    }
  }

  /** Withdraw one of your own entries — a mistyped count, usually. */
  async function withdraw(submission: NiyamSubmission) {
    const db = getDb()
    if (!db || !user.value?.uid) return
    const { deleteDoc } = await import('firebase/firestore')
    error.value = ''
    try {
      await deleteDoc(doc(db, 'niyamSubmissions', submission.id))
      await Promise.all([fetchStats(), fetchMySubmissions()])
      void fetchTopContributors(submission.challengeId)
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  onMounted(refresh)

  watch(
    () => authLoading.value,
    async (loadingAuth) => {
      if (loadingAuth) return
      await fetchMySubmissions()
    }
  )

  watch(() => user.value?.uid, async (uid, prev) => {
    if (uid === prev) return
    await fetchMySubmissions()
  })

  watch(publishedChallenges, () => {
    setupStatsListeners()
  })

  onBeforeUnmount(() => {
    teardownStatsListeners()
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
    submit,
    withdraw,
    refresh
  }
}
