<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { SITE } from '~/data/site'

const route = useRoute()

/**
 * Site-wide defaults. Individual pages override title and description with
 * their own `useSeoMeta`; anything they leave alone falls back to these.
 *
 * The site is shared largely through the WhatsApp community invite, so the
 * og:* tags are what most people actually see before they ever load a page.
 * They need absolute URLs — a relative og:image is dropped by every scraper.
 */
const canonical = computed(() => `${SITE.url}${route.path === '/' ? '' : route.path}`)

useHead({
  link: [
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
    { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
    { rel: 'canonical', href: canonical }
  ],
  meta: [
    { name: 'theme-color', content: '#3b2061' }
  ]
})

useSeoMeta({
  description: SITE.description,
  ogTitle: `${SITE.name} — Celebrating 10 Years with Ghanshyam Maharaj`,
  ogDescription: SITE.description,
  ogSiteName: SITE.name,
  ogType: 'website',
  ogLocale: 'en_GB',
  ogUrl: canonical,
  // Square, because the only artwork that exists at a usable size is the app
  // icon. A purpose-made 1200x630 card would preview better on every platform.
  ogImage: `${SITE.url}/icon-512.png`,
  ogImageWidth: 512,
  ogImageHeight: 512,
  ogImageAlt: `${SITE.name} — ${SITE.templeName}`,
  twitterCard: 'summary',
  twitterTitle: `${SITE.name} — Celebrating 10 Years with Ghanshyam Maharaj`,
  twitterDescription: SITE.description,
  twitterImage: `${SITE.url}/icon-512.png`
})
</script>
