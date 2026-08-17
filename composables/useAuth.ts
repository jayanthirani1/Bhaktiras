import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'
import type { AuthUserSnapshot } from '~/types'
import { PRIVACY_POLICY_VERSION, SITE_POLICY_VERSION } from '~/utils/privacy'

export function useAuth() {
  const nuxtApp = useNuxtApp()
  const user = useState<AuthUserSnapshot | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)

  function getAuth() {
    if (import.meta.server) return null
    return nuxtApp.$firebaseAuth as ReturnType<typeof import('firebase/auth')['getAuth']> | null
  }

  async function signIn(email: string, password: string) {
    const auth = getAuth()
    if (!auth) throw new Error('Firebase Auth not configured')
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signInWithGoogle() {
    const auth = getAuth()
    if (!auth) throw new Error('Firebase Auth not configured')
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  async function signUp(email: string, password: string) {
    const auth = getAuth()
    if (!auth) throw new Error('Firebase Auth not configured')
    await createUserWithEmailAndPassword(auth, email, password)
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
  /** Greeting text: "Jai Swaminarayan, X" */
  const greeting = computed(() => {
    const name = userName.value
    return name ? `Jai Swaminarayan, ${name}` : null
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
    signUp,
    recordPolicyAcceptance,
    signOut
  }
}
