import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithCredential,
  linkWithPopup,
  updateProfile,
  signOut as firebaseSignOut
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore
} from 'firebase/firestore'
import type { AuthUserSnapshot } from '~/types'
import { PRIVACY_POLICY_VERSION, SITE_POLICY_VERSION } from '~/utils/privacy'
import { markInteractiveSignIn } from '~/utils/signInSignal'
import { ukDateId } from '~/utils/gameDay'

const DISPLAY_NAME_MAX = 32

function cleanDisplayName(name: string): string {
  return name
    .replace(/[^\p{L}\p{N}\s\-_.']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, DISPLAY_NAME_MAX)
}

export function useAuth() {
  const nuxtApp = useNuxtApp()
  const user = useState<AuthUserSnapshot | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)

  function getAuth() {
    if (import.meta.server) return null
    return nuxtApp.$firebaseAuth as ReturnType<typeof import('firebase/auth')['getAuth']> | null
  }

  function syncUserSnapshot() {
    const currentUser = getAuth()?.currentUser
    user.value = currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          providerIds: currentUser.providerData.map(provider => provider.providerId)
        }
      : null
  }

  async function signIn(email: string, password: string) {
    const auth = getAuth()
    if (!auth) throw new Error('Firebase Auth not configured')
    await signInWithEmailAndPassword(auth, email, password)
    markInteractiveSignIn()
  }

  async function signInWithGoogle() {
    const auth = getAuth()
    if (!auth) throw new Error('Firebase Auth not configured')
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    markInteractiveSignIn()
  }

  /**
   * There was no way to reset a password anywhere in the app, so a devotee who
   * forgot theirs permanently lost the streak, achievements and niyam history
   * the app exists to build.
   */
  async function sendPasswordReset(email: string) {
    const auth = getAuth()
    if (!auth) throw new Error('Firebase Auth not configured')
    await sendPasswordResetEmail(auth, email.trim())
  }

  async function signUp(email: string, password: string) {
    const auth = getAuth()
    if (!auth) throw new Error('Firebase Auth not configured')
    await createUserWithEmailAndPassword(auth, email, password)
    markInteractiveSignIn()
  }

  /** Store an auditable, minimal record of the legal documents accepted at signup. */
  async function recordPolicyAcceptance() {
    const auth = getAuth()
    const db = nuxtApp.$firebaseDb as Firestore | null
    const currentUser = auth?.currentUser
    if (!currentUser || !db) throw new Error('Could not record your policy acceptance.')
    await setDoc(doc(db, 'users', currentUser.uid), {
      userId: currentUser.uid,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      sitePolicyVersion: SITE_POLICY_VERSION,
      privacyAcceptedAt: serverTimestamp(),
      sitePolicyAcceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true })
  }

  async function linkGoogle() {
    const currentUser = getAuth()?.currentUser
    if (!currentUser) throw new Error('You need to sign in again.')
    await linkWithPopup(currentUser, new GoogleAuthProvider())
    await currentUser.reload()
    syncUserSnapshot()
  }

  async function linkEmailPassword(password: string) {
    const currentUser = getAuth()?.currentUser
    if (!currentUser?.email) throw new Error('Your account does not have an email address to link.')
    if (password.length < 6) throw new Error('Password must be at least 6 characters.')
    await linkWithCredential(
      currentUser,
      EmailAuthProvider.credential(currentUser.email, password)
    )
    await currentUser.reload()
    syncUserSnapshot()
  }

  async function updateDisplayName(rawName: string): Promise<string> {
    const auth = getAuth()
    const currentUser = auth?.currentUser
    if (!currentUser) throw new Error('You need to sign in again.')
    const displayName = cleanDisplayName(rawName)
    if (displayName.length < 2) throw new Error('Enter a name of at least 2 characters.')

    await updateProfile(currentUser, { displayName })

    const applySnapshot = (authUser: NonNullable<ReturnType<typeof getAuth>>['currentUser']) => {
      if (!authUser) return
      user.value = {
        uid: authUser.uid,
        email: authUser.email,
        displayName: authUser.displayName?.trim() || displayName,
        providerIds: authUser.providerData.map(provider => provider.providerId)
      }
    }

    // Keep local state in sync immediately — a reload right after updateProfile
    // can still return the previous name while Auth propagates.
    applySnapshot(currentUser)

    try {
      await currentUser.reload()
      const reloaded = auth?.currentUser
      if (reloaded?.displayName?.trim() === displayName) applySnapshot(reloaded)
    } catch {
      // The optimistic snapshot above is enough for the UI.
    }

    const db = nuxtApp.$firebaseDb as Firestore | null
    if (db) {
      const uid = currentUser.uid
      const profileRef = doc(db, 'publicProfiles', uid)
      const profileSnap = await getDoc(profileRef)
      if (profileSnap.exists()) {
        await updateDoc(profileRef, {
          displayName,
          updatedAt: serverTimestamp()
        })
      } else {
        await setDoc(profileRef, {
          userId: uid,
          displayName,
          updatedAt: serverTimestamp()
        })
      }

      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          displayName,
          updatedAt: serverTimestamp()
        }).catch(() => {
          // Policy-only docs may refuse a bare name patch; Auth + publicProfiles still apply.
        })
      }

      const today = ukDateId()
      const scoreSnap = await getDocs(query(
        collection(db, 'gameScores'),
        where('userId', '==', uid),
        where('dateId', '==', today)
      )).catch(() => null)
      if (scoreSnap) {
        await Promise.all(
          scoreSnap.docs.map(scoreDoc =>
            updateDoc(scoreDoc.ref, { userName: displayName }).catch(() => {})
          )
        )
      }

      const streakRef = doc(db, 'playStreaks', uid)
      await updateDoc(streakRef, { userName: displayName }).catch(() => {})

      const challengeSnap = await getDocs(collection(db, 'niyamChallenges')).catch(() => null)
      if (challengeSnap) {
        await Promise.all(challengeSnap.docs.map((challengeDoc) => {
          const contributorRef = doc(db, 'niyamChallenges', challengeDoc.id, 'contributors', uid)
          return updateDoc(contributorRef, { userName: displayName }).catch(() => {})
        }))
      }
    }

    return displayName
  }

  async function signOut() {
    user.value = null
    const auth = getAuth()
    if (!auth) return
    await firebaseSignOut(auth)
  }

  const isLoggedIn = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email ?? null)
  /** Display name: displayName or first part of email (before @), capitalized */
  const userName = computed(() => {
    const u = user.value
    if (!u) return null
    if (u.displayName?.trim()) return u.displayName.trim()
    const emailPart = u.email?.split('@')[0]
    if (!emailPart) return null
    return emailPart.charAt(0).toUpperCase() + emailPart.slice(1).toLowerCase()
  })
  /** Greeting text: "Jay Swaminarayan, X" */
  const greeting = computed(() => {
    const name = userName.value
    return name ? `Jay Swaminarayan, ${name}` : null
  })

  return {
    user,
    loading,
    isLoggedIn,
    userEmail,
    userName,
    greeting,
    signIn,
    signInWithGoogle,
    sendPasswordReset,
    signUp,
    recordPolicyAcceptance,
    linkGoogle,
    linkEmailPassword,
    updateDisplayName,
    signOut
  }
}
