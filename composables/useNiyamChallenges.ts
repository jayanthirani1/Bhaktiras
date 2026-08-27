import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore
} from 'firebase/firestore'
import type {
  NiyamChallenge,
  NiyamChallengeStats,
  NiyamSubmission,
  NiyamSubmissionStatus
} from '~/types'
import {
  buildSubmissionId,
  isChallengeOpen,
  isPublished,
  mergeChallenges,
  safeMemberName,
  sortSubmissionsNewestFirst,
  statusForAmount,
  statusKey,
  SUBMISSION_NOTE_MAX,
  userChallengeKey
} from '~/utils/niyamChallenge'

const MY_SUBMISSION_LIMIT = 100

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
  return {
    challengeId: id,
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
  const { user, isLoggedIn, userName } = useAuth()

  const challenges = ref<NiyamChallenge[]>([])
  const stats = ref<Record<string, NiyamChallengeStats>>({})
  const mySubmissions = ref<NiyamSubmission[]>([])
  const loading = ref(true)
  const submitting = ref(false)
  const error = ref('')

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
      await Promise.all([fetchStats(), fetchMySubmissions()])
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

    const status = statusForAmount(challenge, amount)
    const note = noteInput.trim().slice(0, SUBMISSION_NOTE_MAX)
    const id = buildSubmissionId(challenge.id)

    submitting.value = true
    error.value = ''
    try {
      await setDoc(doc(db, 'niyamSubmissions', id), {
        challengeId: challenge.id,
        userId: uid,
        userName: safeMemberName(userName.value),
        amount,
        note: note || null,
        status,
        statusKey: statusKey(challenge.id, status),
        userChallengeKey: userChallengeKey(uid, challenge.id),
        dayKey: ukDateId(),
        createdAt: serverTimestamp()
      })
      // The trigger owns the totals, so re-read them rather than guessing here.
      await Promise.all([fetchStats(), fetchMySubmissions()])
      return status
    } catch (e) {
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
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  onMounted(refresh)

  watch(() => user.value?.uid, async (uid, prev) => {
    if (uid === prev) return
    await fetchMySubmissions()
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
    myApprovedTotal,
    myPendingTotal,
    submit,
    withdraw,
    refresh
  }
}
