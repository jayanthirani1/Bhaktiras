<template>
  <div class="flex min-h-screen flex-col bg-[hsl(var(--background))]">
    <Navigation />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <ClientOnly>
      <PushNotificationPrompt />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuth()
const { recordVisit } = usePlayStreak()
const { request: requestPushPrompt } = usePushPrompt()
let signInPromptTimer: ReturnType<typeof setTimeout> | null = null

watch(
  [() => route.path, () => auth.user.value?.uid, auth.loading],
  ([path, uid, loading]) => {
    if (!loading && uid && (path === '/play' || path.startsWith('/play/'))) {
      void recordVisit()
    }
  },
  { immediate: true }
)

watch(
  [() => auth.user.value?.uid, auth.loading],
  ([uid, loading]) => {
    if (loading || !uid || import.meta.server) return
    if (signInPromptTimer) clearTimeout(signInPromptTimer)
    signInPromptTimer = setTimeout(() => requestPushPrompt('sign-in'), 1500)
  },
  { immediate: true }
)

onUnmounted(() => {
  if (signInPromptTimer) clearTimeout(signInPromptTimer)
})
</script>
