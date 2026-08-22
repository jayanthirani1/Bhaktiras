<template>
  <div class="flex min-h-screen flex-col bg-[hsl(var(--background))]">
    <Navigation />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <ClientOnly>
      <PushNotificationPrompt />
      <AchievementUnlockToast />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuth()
const { recordVisit } = usePlayStreak()

/**
 * There is deliberately no sign-in push prompt here.
 *
 * This used to ask for notification permission 1.5s after sign-in — before the
 * new member had played anything or seen a streak, so there was nothing to
 * accept it *for*. Cold prompts are refused most of the time, and on iOS a
 * refusal is effectively permanent: the only way back is Settings. There is one
 * ask per device, so it has to be spent well.
 *
 * The prompt now fires only from the `game-complete` moment in
 * `usePushPrompt`, where the offer ("Remind me tomorrow's game?") answers a
 * want the player has just demonstrated.
 */
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
