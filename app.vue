<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import faviconUrl from '~/assets/logos/Bhaktiras - Favicon.png?url'

useHead({
  link: [
    { rel: 'icon', type: 'image/png', href: faviconUrl },
    { rel: 'apple-touch-icon', href: faviconUrl },
    { rel: 'manifest', href: '/manifest.webmanifest' }
  ],
  meta: [
    { name: 'theme-color', content: '#3b2061' }
  ]
})
</script>
