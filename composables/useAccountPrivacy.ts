import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  type Auth
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  where,
  writeBatch,
  type DocumentReference,
  type Firestore,
  type QueryDocumentSnapshot
} from 'firebase/firestore'

const DELETE_BATCH_SIZE = 400

/** Half of DELETE_BATCH_SIZE: each reaction costs two writes, not one. */
const REACTION_DELETE_BATCH_SIZE = 200

/** Export and erase data that is directly linked to the current Firebase UID. */
export function useAccountPrivacy() {
  const nuxtApp = useNuxtApp()
  const authState = useAuth()
  const exporting = ref(false)
  const deleting = ref(false)

  function services() {
    const auth = nuxtApp.$firebaseAuth as Auth | null
    const db = nuxtApp.$firebaseDb as Firestore | null
    if (!auth?.currentUser || !db) throw new Error('You need to sign in again.')
    return { auth, db, currentUser: auth.currentUser }
  }

  const usesPassword = computed(() => authState.user.value?.providerIds?.includes('password') || false)
  const usesGoogle = computed(() => authState.user.value?.providerIds?.includes('google.com') || false)

  async function linkedData(db: Firestore, uid: string) {
    // `legacyNiyams` is the retired daily tracker. Nothing writes it any more;
    // it is read here so an export and a deletion still cover what it left
    // behind. Drop it once the collection has been cleared.
    const [profile, publicProfile, admin, scores, legacyWordleScores, streak, achievements, legacyNiyams, completions, pushSubscriptions, mandirVisits, reactionVotes] = await Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDoc(doc(db, 'publicProfiles', uid)),
      getDoc(doc(db, 'admins', uid)),
      getDocs(query(collection(db, 'gameScores'), where('userId', '==', uid))),
      getDocs(query(collection(db, 'wordleScores'), where('userId', '==', uid))),
      getDoc(doc(db, 'playStreaks', uid)),
      getDoc(doc(db, 'userAchievements', uid)),
      getDoc(doc(db, 'niyamProgress', uid)),
      getDocs(collection(db, 'playCompletions', uid, 'days')),
      getDocs(query(collection(db, 'pushSubscriptions'), where('userId', '==', uid))),
      getDocs(collection(db, 'mandirVisits', uid, 'visits')),
      getDocs(query(collection(db, 'gratitudeReactionVotes'), where('userId', '==', uid)))
    ])

    return { profile, publicProfile, admin, scores, legacyWordleScores, streak, achievements, legacyNiyams, completions, pushSubscriptions, mandirVisits, reactionVotes }
  }

  async function exportMyData() {
    exporting.value = true
    try {
      const { db, currentUser } = services()
      const data = await linkedData(db, currentUser.uid)
      const payload = {
        exportedAt: new Date().toISOString(),
        account: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          createdAt: currentUser.metadata.creationTime || null,
          lastSignInAt: currentUser.metadata.lastSignInTime || null,
          providers: currentUser.providerData.map(provider => provider.providerId)
        },
        policyAcceptance: data.profile.exists() ? data.profile.data() : null,
        publicProfile: data.publicProfile.exists() ? data.publicProfile.data() : null,
        adminRecord: data.admin.exists() ? data.admin.data() : null,
        gameScores: data.scores.docs.map(item => ({ id: item.id, ...item.data() })),
        legacyWordleScores: data.legacyWordleScores.docs.map(item => ({ id: item.id, ...item.data() })),
        playStreak: data.streak.exists() ? data.streak.data() : null,
        achievements: data.achievements.exists() ? data.achievements.data() : null,
        legacyNiyamProgress: data.legacyNiyams.exists() ? data.legacyNiyams.data() : null,
        playCompletions: data.completions.docs.map(item => ({ id: item.id, ...item.data() })),
        pushSubscriptions: data.pushSubscriptions.docs.map(item => ({
          id: item.id,
          ...item.data(),
          token: '[redacted from export]'
        })),
        mandirVisits: data.mandirVisits.docs.map(item => ({ id: item.id, ...item.data() })),
        communityReactions: data.reactionVotes.docs.map(item => ({ id: item.id, ...item.data() })),
        notes: [
          'Anonymous community wall posts carry no link to your account and are not listed here. A signed post is linked and is included above.',
          'Community niyam challenge totals are combined figures and do not contain your user ID.',
          'The reaction counts shown on the community wall are combined figures. Which reaction you chose is the record listed above, and it is visible to nobody but you.'
        ]
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bhaktiras-data-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      exporting.value = false
    }
  }

  async function reauthenticate(password: string) {
    const { currentUser } = services()
    const providers = currentUser.providerData.map(provider => provider.providerId)
    if (providers.includes('password')) {
      if (!currentUser.email || !password) throw new Error('Enter your password to confirm deletion.')
      await reauthenticateWithCredential(
        currentUser,
        EmailAuthProvider.credential(currentUser.email, password)
      )
      return
    }
    if (providers.includes('google.com')) {
      await reauthenticateWithPopup(currentUser, new GoogleAuthProvider())
      return
    }
    throw new Error('This sign-in method cannot confirm account deletion. Please contact an admin.')
  }

  async function deleteRefs(db: Firestore, refs: DocumentReference[]) {
    for (let offset = 0; offset < refs.length; offset += DELETE_BATCH_SIZE) {
      const batch = writeBatch(db)
      for (const ref of refs.slice(offset, offset + DELETE_BATCH_SIZE)) batch.delete(ref)
      await batch.commit()
    }
  }

  /**
   * Reactions come off in pairs: the vote document, and the one it added to
   * the post's public tally. The rules refuse a vote delete on its own —
   * otherwise deleting a vote and reacting again would count the same person
   * twice — so erasing an account has to do what the wall does and hand the
   * count back.
   */
  async function deleteReactionVotes(db: Firestore, votes: QueryDocumentSnapshot[]) {
    // A post deleted since the reaction leaves no tally to correct, and the
    // rules let that orphan vote go on its own.
    const posts = await Promise.all(
      votes.map(vote => getDoc(doc(db, 'gratitude', vote.data().postId as string)))
    )
    for (let offset = 0; offset < votes.length; offset += REACTION_DELETE_BATCH_SIZE) {
      const batch = writeBatch(db)
      for (let i = offset; i < Math.min(offset + REACTION_DELETE_BATCH_SIZE, votes.length); i++) {
        batch.delete(votes[i].ref)
        const post = posts[i]
        if (post.exists()) {
          batch.update(post.ref, { [`reactions.${votes[i].data().key}`]: increment(-1) })
        }
      }
      await batch.commit()
    }
  }

  async function deleteMyAccount(password: string) {
    deleting.value = true
    try {
      const before = services()
      const admin = await getDoc(doc(before.db, 'admins', before.currentUser.uid))
      if (admin.exists() && admin.data().active !== false) {
        throw new Error('An active admin account must be removed by another admin to prevent the portal being locked out.')
      }

      await reauthenticate(password)
      const { db, currentUser } = services()
      const data = await linkedData(db, currentUser.uid)
      const refs: DocumentReference[] = [
        ...data.scores.docs.map(item => item.ref),
        ...data.legacyWordleScores.docs.map(item => item.ref),
        ...data.completions.docs.map(item => item.ref),
        ...data.pushSubscriptions.docs.map(item => item.ref),
        ...data.mandirVisits.docs.map(item => item.ref)
      ]
      if (data.profile.exists()) refs.push(data.profile.ref)
      if (data.publicProfile.exists()) refs.push(data.publicProfile.ref)
      if (data.streak.exists()) refs.push(data.streak.ref)
      if (data.achievements.exists()) refs.push(data.achievements.ref)
      if (data.legacyNiyams.exists()) refs.push(data.legacyNiyams.ref)
      await deleteReactionVotes(db, data.reactionVotes.docs)
      await deleteRefs(db, refs)
      await deleteUser(currentUser)
      authState.user.value = null
    } finally {
      deleting.value = false
    }
  }

  return {
    exporting,
    deleting,
    usesPassword,
    usesGoogle,
    exportMyData,
    deleteMyAccount
  }
}
