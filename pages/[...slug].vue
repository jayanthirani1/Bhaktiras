<template>
  <div class="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-4">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">Page not found</h1>
      <p class="text-[hsl(var(--muted-foreground))] mb-6">The page you're looking for doesn't exist.</p>
      <NuxtLink
        to="/"
        class="inline-block px-6 py-3 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--accent))] font-semibold hover:opacity-90"
      >
        Back to Home
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * This catch-all rendered a 404 page under an HTTP 200 — a soft 404, which
 * search engines index as a real page and monitoring cannot distinguish from
 * a healthy response. Send the status the page is actually reporting.
 */
const event = useRequestEvent()
if (event) setResponseStatus(event, 404)

usePageSeo('Page not found')
useNoIndex()
</script>
