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
  query,
  where,
  writeBatch,
  type DocumentReference,
  type Firestore
} from 'firebase/firestore'

const DELETE_BATCH_SIZE = 400

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
    const [profile, admin, scores, legacyWordleScores, streak, niyams, completions] = await Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDoc(doc(db, 'admins', uid)),
      getDocs(query(collection(db, 'gameScores'), where('userId', '==', uid))),
      getDocs(query(collection(db, 'wordleScores'), where('userId', '==', uid))),
      getDoc(doc(db, 'playStreaks', uid)),
      getDoc(doc(db, 'niyamProgress', uid)),
      getDocs(collection(db, 'playCompletions', uid, 'days'))
    ])

    return { profile, admin, scores, legacyWordleScores, streak, niyams, completions }
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
        adminRecord: data.admin.exists() ? data.admin.data() : null,
        gameScores: data.scores.docs.map(item => ({ id: item.id, ...item.data() })),
        legacyWordleScores: data.legacyWordleScores.docs.map(item => ({ id: item.id, ...item.data() })),
        playStreak: data.streak.exists() ? data.streak.data() : null,
        niyamProgress: data.niyams.exists() ? data.niyams.data() : null,
        playCompletions: data.completions.docs.map(item => ({ id: item.id, ...item.data() })),
        notes: [
          'Anonymous community posts and bug reports are not linked to your account.',
          'Anonymous aggregate niyam totals do not contain your user ID.'
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
        ...data.completions.docs.map(item => item.ref)
      ]
      if (data.profile.exists()) refs.push(data.profile.ref)
      if (data.streak.exists()) refs.push(data.streak.ref)
      if (data.niyams.exists()) refs.push(data.niyams.ref)
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
