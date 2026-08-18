// https://nuxt.com/docs/api/configuration/nuxt-config
import { writeFirebaseMessagingSw } from './scripts/writeFirebaseMessagingSw.mjs'

writeFirebaseMessagingSw()

export default defineNuxtConfig({
  devtools: { enabled: true },
  experimental: { appManifest: false },
  modules: ['@nuxtjs/tailwindcss'],
  app: {
    head: {
      title: 'Bhaktiras — Celebrating 10 Years with Ghanshyam Maharaj',
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || '',
      firebaseVapidKey: process.env.NUXT_PUBLIC_FIREBASE_VAPID_KEY || '',
      flickrApiKey: process.env.NUXT_PUBLIC_FLICKR_API_KEY || '',
      flickrUserId: process.env.NUXT_PUBLIC_FLICKR_USER_ID || '',
      flickrUrl: process.env.NUXT_PUBLIC_FLICKR_URL || 'https://api.flickr.com/services/rest'
    }
  },
  css: ['~/assets/app.css'],
  vite: {
    assetsInclude: ['**/*.csv']
  }
})
