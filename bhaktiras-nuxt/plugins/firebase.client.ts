import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public
  if (!config.firebaseProjectId || !config.firebaseApiKey) {
    console.warn('Firebase config missing. Set NUXT_PUBLIC_FIREBASE_* env vars. Data will be empty.')
    return { provide: { firebaseDb: null } }
  }
  const firebaseConfig = {
    apiKey: config.firebaseApiKey,
    authDomain: config.firebaseAuthDomain,
    projectId: config.firebaseProjectId,
    storageBucket: config.firebaseStorageBucket,
    messagingSenderId: config.firebaseMessagingSenderId,
    appId: config.firebaseAppId
  }
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  return {
    provide: {
      firebaseDb: db
    }
  }
})
