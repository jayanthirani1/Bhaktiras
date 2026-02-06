import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  const projectId = config.firebaseProjectId || (import.meta.env?.NUXT_PUBLIC_FIREBASE_PROJECT_ID as string) || ''
  const apiKey = config.firebaseApiKey || (import.meta.env?.NUXT_PUBLIC_FIREBASE_API_KEY as string) || ''

  if (!projectId || !apiKey) {
    if (import.meta.dev) {
      console.warn(
        '[Firebase] Config missing. Check .env has NUXT_PUBLIC_FIREBASE_PROJECT_ID and NUXT_PUBLIC_FIREBASE_API_KEY (no quotes). Restart dev server after editing .env.'
      )
    }
    return { provide: { firebaseDb: null, firebaseAuth: null } }
  }

  const firebaseConfig = {
    apiKey: apiKey,
    authDomain: config.firebaseAuthDomain || (import.meta.env?.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string) || `${projectId}.firebaseapp.com`,
    projectId: projectId,
    storageBucket: config.firebaseStorageBucket || (import.meta.env?.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string) || `${projectId}.appspot.com`,
    messagingSenderId: config.firebaseMessagingSenderId || (import.meta.env?.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string) || '',
    appId: config.firebaseAppId || (import.meta.env?.NUXT_PUBLIC_FIREBASE_APP_ID as string) || ''
  }
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  const auth = getAuth(app)
  if (import.meta.dev) {
    console.log('[Firebase] Connected to project:', projectId)
  }
  return {
    provide: {
      firebaseDb: db,
      firebaseAuth: auth
    }
  }
})
