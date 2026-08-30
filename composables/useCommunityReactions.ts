import {
  collection,
  doc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Firestore
} from 'firebase/firestore'
import type { Auth } from 'firebase/auth'
import { isCommunityReactionKey } from '~/data/communityReactions'
import type { CommunityReactionKey, GratitudeMessage } from '~/types'

/**
 * A devotee who has reacted to more posts than this loses the highlight on the
 * oldest of them — the tally is still right, only "you picked this" goes. The
 * wall itself only ever shows 60 posts, so in practice nothing is lost.
 */
const MY_VOTES_PAGE_SIZE = 500

/**
 * Reactions on the community wall: one per person per post, counts public,
 * names never.
 *
 * The split is the point. The tally lives on the post in `reactions`, which is
 * world readable; who chose what lives in `gratitudeReactionVotes`, which only
 * its owner can read. `playStreaks` is a public uid-to-name map, so a readable
 * uid beside a post would be a name beside a post — the same trap anonymous
 * posting already had to sidestep.
 *
 * The two documents move together in one batch, and the security rules check
 * the count against the vote using `getAfter`, so a browser cannot add to a
 * tally without also spending its own single vote. That is what makes the
 * number honest without a Cloud Function in the middle of it.
 */
export function useCommunityReactions() {
  const nuxtApp = useNuxtApp()
  const { isLoggedIn } = useAuth()

  /** postId -> the reaction this device's user has on it. */
  const myVotes = ref<Record<string, CommunityReactionKey>>({})
  /** The post currently mid-write, so its bar can be disabled without freezing the wall. */
  const savingPostId = ref<string | null>(null)
  const error = ref<string | null>(null)

  function db(): Firestore | null {
    if (import.meta.server) return null
    return (nuxtApp.$firebaseDb as Firestore | null) ?? null
  }

  function uid(): string | null {
    if (import.meta.server) return null
    const auth = nuxtApp.$firebaseAuth as Auth | null
    return auth?.currentUser?.uid ?? null
  }

  async function loadMyVotes() {
    const database = db()
    const userId = uid()
    if (!database || !userId) {
      myVotes.value = {}
      return
    }
    try {
      const snap = await getDocs(query(
        collection(database, 'gratitudeReactionVotes'),
        where('userId', '==', userId),
        limit(MY_VOTES_PAGE_SIZE)
      ))
      const next: Record<string, CommunityReactionKey> = {}
      for (const item of snap.docs) {
        const data = item.data()
        if (typeof data.postId === 'string' && isCommunityReactionKey(data.key)) {
          next[data.postId] = data.key
        }
      }
      myVotes.value = next
    } catch (_) {
      // A reaction that cannot be read back is a missing highlight, not a
      // broken wall — the counts come from the posts and are already rendered.
      myVotes.value = {}
    }
  }

  /**
   * Toggle: tapping your own reaction takes it back, tapping another moves it.
   * Nobody holds two reactions on one post, so a post's counts add up to the
   * number of people who reacted.
   */
  async function react(post: GratitudeMessage, key: CommunityReactionKey) {
    error.value = null
    const database = db()
    const userId = uid()
    if (!userId) {
      error.value = 'Please sign in to react.'
      return
    }
    if (!database) {
      error.value = 'Firebase is not configured, so reactions cannot save yet.'
      return
    }
    if (savingPostId.value) return

    const previous = myVotes.value[post.id]
    const next = previous === key ? undefined : key
    const counts = { ...(post.reactions ?? {}) }

    // Optimistic: the tap has to feel instant, and the batch below either
    // lands whole or is rolled back whole.
    const optimistic = { ...counts }
    if (previous) optimistic[previous] = Math.max(0, (optimistic[previous] ?? 0) - 1)
    if (next) optimistic[next] = (optimistic[next] ?? 0) + 1
    post.reactions = optimistic
    const votes = { ...myVotes.value }
    if (next) votes[post.id] = next
    else delete votes[post.id]
    myVotes.value = votes

    savingPostId.value = post.id
    try {
      const batch = writeBatch(database)
      const voteRef = doc(database, 'gratitudeReactionVotes', `${post.id}_${userId}`)
      const postRef = doc(database, 'gratitude', post.id)

      const tally: Record<string, unknown> = {}
      // Server-side increments, not the numbers this device happens to hold —
      // two people reacting at once must both count, and a stale read here
      // would otherwise overwrite one of them (and be refused by the rules).
      if (previous) tally[`reactions.${previous}`] = increment(-1)
      if (next) tally[`reactions.${next}`] = increment(1)
      batch.update(postRef, tally)

      if (next) {
        batch.set(voteRef, {
          postId: post.id,
          userId,
          key: next,
          createdAt: serverTimestamp()
        })
      } else {
        batch.delete(voteRef)
      }
      await batch.commit()
    } catch (e) {
      post.reactions = counts
      const restored = { ...myVotes.value }
      if (previous) restored[post.id] = previous
      else delete restored[post.id]
      myVotes.value = restored
      error.value = (e as Error).message || 'That reaction did not save. Please try again.'
    } finally {
      savingPostId.value = null
    }
  }

  function myVote(postId: string) {
    return myVotes.value[postId]
  }

  onMounted(() => { loadMyVotes() })
  // Signing in mid-visit should light up the reactions already made from this
  // account, and signing out should stop claiming them.
  watch(isLoggedIn, () => { loadMyVotes() })

  return { myVotes, myVote, react, savingPostId, error, refetch: loadMyVotes }
}
