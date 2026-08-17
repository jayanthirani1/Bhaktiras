import { initializeApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, onAuthStateChanged, type Auth } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import type { AuthUserSnapshot } from '~/types'

function toSnapshot(u: import('firebase/auth').User | null): AuthUserSnapshot | null {
  if (!u) return null
  return {
    uid: u.uid,
    email: u.email ?? null,
    displayName: u.displayName ?? null,
    providerIds: u.providerData.map(provider => provider.providerId)
  }
}

type FirebaseInjection = {
  firebaseDb: Firestore | null
  firebaseAuth: Auth | null
  firebaseStorage: FirebaseStorage | null
}

export default defineNuxtPlugin<FirebaseInjection>((nuxtApp) => {
  const config = useRuntimeConfig().public
  const projectId = config.firebaseProjectId || (import.meta.env?.NUXT_PUBLIC_FIREBASE_PROJECT_ID as string) || ''
  const apiKey = config.firebaseApiKey || (import.meta.env?.NUXT_PUBLIC_FIREBASE_API_KEY as string) || ''

  const user = useState<AuthUserSnapshot | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)

  if (!projectId || !apiKey) {
    if (import.meta.dev) {
      console.warn(
        '[Firebase] Config missing. Check .env has NUXT_PUBLIC_FIREBASE_PROJECT_ID and NUXT_PUBLIC_FIREBASE_API_KEY (no quotes). Restart dev server after editing .env.'
      )
    }
    user.value = null
    loading.value = false
    return { provide: { firebaseDb: null, firebaseAuth: null, firebaseStorage: null } }
  }

  const storageBucket =
    config.firebaseStorageBucket
    || (import.meta.env?.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string)
    || `${projectId}.firebasestorage.app`

  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: config.firebaseAuthDomain || (import.meta.env?.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string) || `${projectId}.firebaseapp.com`,
    projectId: projectId,
    storageBucket,
    messagingSenderId: config.firebaseMessagingSenderId || (import.meta.env?.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string) || '',
    appId: config.firebaseAppId || (import.meta.env?.NUXT_PUBLIC_FIREBASE_APP_ID as string) || ''
  }
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  const auth = getAuth(app)
  const storage = getStorage(app, `gs://${storageBucket}`)
  if (import.meta.dev) {
    console.log('[Firebase] Connected to project:', projectId, 'storage:', storageBucket)
  }

  const unsubscribe = onAuthStateChanged(auth, (u) => {
    user.value = toSnapshot(u)
    loading.value = false
  })
  const fallback = setTimeout(() => { loading.value = false }, 2000)

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        user.value = toSnapshot(auth.currentUser)
      }
    })
  }

  return {
    provide: { firebaseDb: db, firebaseAuth: auth, firebaseStorage: storage },
    close: () => {
      clearTimeout(fallback)
      unsubscribe()
    }
  }
})
