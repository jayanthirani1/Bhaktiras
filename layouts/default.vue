<template>
  <div class="flex min-h-screen flex-col bg-[hsl(var(--background))]">
    <Navigation />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuth()
const { recordVisit } = usePlayStreak()

watch(
  [() => route.path, () => auth.user.value?.uid, auth.loading],
  ([path, uid, loading]) => {
    if (!loading && uid && (path === '/play' || path.startsWith('/play/'))) {
      void recordVisit()
    }
  },
  { immediate: true }
)
</script>
