import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'

export function useAuth() {
  const user = ref<User | null>(null)
  const loading = ref(true)

  function getAuth() {
    if (import.meta.server) return null
    return useNuxtApp().$firebaseAuth as ReturnType<typeof import('firebase/auth')['getAuth']> | null
  }

  onMounted(() => {
    const auth = getAuth()
    if (!auth) {
      loading.value = false
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      user.value = u
      loading.value = false
    })
    // Fallback: if Firebase doesn't fire within 2s, stop loading so nav still shows Sign in
    const fallback = setTimeout(() => { loading.value = false }, 2000)
    onUnmounted(() => {
      clearTimeout(fallback)
      unsubscribe()
    })
  })

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

  async function signOut() {
    const auth = getAuth()
    if (!auth) return
    await firebaseSignOut(auth)
  }

  const isLoggedIn = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email ?? null)
  /** Display name: Google displayName, or first part of email (before @), capitalized */
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
    signOut
  }
}
