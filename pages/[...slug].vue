<template>
  <div class="min-h-screen bg-stone-50 flex items-center justify-center px-4">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">Page not found</h1>
      <p class="text-[hsl(var(--muted-foreground))] mb-6">The page you're looking for doesn't exist.</p>
      <NuxtLink
        to="/"
        class="inline-block px-6 py-3 rounded-full bg-[hsl(var(--primary))] text-white font-semibold hover:opacity-90"
      >
        Back to Home
      </NuxtLink>
    </div>
  </div>
</template>
