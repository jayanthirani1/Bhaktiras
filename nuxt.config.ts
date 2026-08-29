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
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover'
    }
  },
  runtimeConfig: {
    /** Empty = site is public. Set SITE_PASSWORD in App Hosting to lock it until launch. */
    sitePassword: process.env.SITE_PASSWORD || '',
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
  /**
   * These headers live in firebase.json too, but that block only applies to the
   * static Firebase Hosting deploy — which PROJECT-MAP records as vestigial.
   * The live site is App Hosting (Nitro on Cloud Run), which never reads
   * firebase.json, so until now the deployed site carried none of them.
   * Declaring them here means Nitro sends them on whichever target serves.
   *
   * No Content-Security-Policy yet: the app pulls Firebase, Google Fonts,
   * gstatic (the messaging service worker) and Flickr, and a wrong CSP fails
   * closed and silently breaks the site. It wants writing against a real
   * report-only run rather than guessing at the origin list here.
   */
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        // `self` for geolocation: the mandir-visit check-in needs it.
        'Permissions-Policy': 'geolocation=(self), microphone=(), camera=(), payment=(), usb=()',
        // Google sign-in uses a popup, which same-origin alone would sever.
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        // No `preload`, and no `includeSubDomains` — a future custom domain may
        // carry subdomains this app knows nothing about.
        'Strict-Transport-Security': 'max-age=31536000'
      }
    },
    '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  },
  css: ['~/assets/app.css'],
  vite: {
    assetsInclude: ['**/*.csv']
  }
})
