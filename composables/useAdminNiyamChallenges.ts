import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
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
import { sortSubmissionsNewestFirst, statusKey } from '~/utils/niyamChallenge'

/** Newest-first because submission ids embed an inverted timestamp. */
const SUBMISSION_PAGE = 300
const CONTRIBUTOR_PAGE = 500

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

/**
 * Admin view of one challenge: every submission, the per-person rollups, and
 * the approve / reject controls for anything held back for review.
 *
 * Nothing here writes a total. Flipping `status` is enough — the
 * `syncNiyamChallengeTotals` trigger recomputes `niyamChallengeStats` and the
 * contributor rollups from the change.
 */
export function useAdminNiyamChallenges() {
  const { user } = useAuth()

  const challenges = useAdminCollection<NiyamChallenge>('niyamChallenges')

  const submissions = ref<NiyamSubmission[]>([])
  const contributors = ref<NiyamContributor[]>([])
  const stats = ref<NiyamChallengeStats | null>(null)
  const loadingSubmissions = ref(false)
  const reviewingId = ref<string | null>(null)
  const submissionError = ref('')
  const activeChallengeId = ref<string | null>(null)

  const pending = computed(() => submissions.value.filter(s => s.status === 'pending'))
  const reviewed = computed(() => submissions.value.filter(s => s.status !== 'pending'))

  /**
   * Everything the admin needs to judge one held submission: how much this
   * person has already had approved, how many entries they have made, and how
   * many they made on the same day. A big number from someone with a steady
   * history reads very differently from a big number on a brand-new account.
   */
  function contextFor(submission: NiyamSubmission) {
    const mine = submissions.value.filter(s => s.userId === submission.userId)
    const approvedTotal = mine
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.amount, 0)
    const sameDay = mine.filter(s => s.dayKey && s.dayKey === submission.dayKey)
    return {
      approvedTotal,
      entryCount: mine.length,
      sameDayCount: sameDay.length,
      sameDayTotal: sameDay.reduce((sum, s) => sum + s.amount, 0),
      pendingCount: mine.filter(s => s.status === 'pending').length
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
        reviewNote: reviewNote.trim().slice(0, 240) || null
      })
      if (activeChallengeId.value) await loadChallengeDetail(activeChallengeId.value)
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
      if (activeChallengeId.value) await loadChallengeDetail(activeChallengeId.value)
    } catch (e) {
      submissionError.value = (e as Error).message
    } finally {
      reviewingId.value = null
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
  }

  return {
    ...challenges,
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
    loadChallengeDetail,
    approve,
    reject,
    hold,
    removeSubmission,
    purgeChallenge
  }
}
