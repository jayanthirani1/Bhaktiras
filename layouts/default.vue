<template>
  <div class="flex min-h-screen flex-col bg-[hsl(var(--background))]">
    <Navigation />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <ClientOnly>
      <SignInPrompt />
      <InstallAppPrompt />
      <PushNotificationPrompt />
      <AchievementUnlockToast />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuth()
const { recordVisit } = usePlayStreak()
const signInPrompt = useSignInPrompt()
const { request: requestInstallPrompt } = useInstallPrompt()

/**
 * The two launch-time prompts, held until Firebase has restored the session.
 *
 * Asking a signed-in devotee to sign in, for the half-second before `auth`
 * resolves, is worse than not asking at all — so both wait on `loading`, then
 * on a short pause so the page they opened is the first thing they see.
 * `useAppPrompts` makes sure only one card actually appears.
 *
 * The install ask is the `return-visit` moment, which is refused on a first
 * session; a newcomer is asked instead at the `game-complete` and `events`
 * moments, once they have got something out of the app.
 *
 * Still deliberately absent: a push prompt on sign-in. That used to ask for
 * notification permission 1.5s after signing in — before the new member had
 * played anything or seen a streak, so there was nothing to accept it *for*.
 * Cold prompts are refused most of the time, and on iOS a refusal is
 * effectively permanent: the only way back is Settings. There is one ask per
 * device, so it has to be spent well. Push now fires only from the
 * `game-complete` moment in `usePushPrompt`, where the offer ("Remind me
 * tomorrow's game?") answers a want the player has just demonstrated.
 */
let launchPromptsFired = false
let launchPromptTimer: number | null = null

onMounted(() => {
  watch(
    auth.loading,
    loading => {
      if (loading || launchPromptsFired) return
      launchPromptsFired = true
      launchPromptTimer = window.setTimeout(() => {
        signInPrompt.request()
        requestInstallPrompt('return-visit')
      }, 2000)
    },
    { immediate: true }
  )
})

onUnmounted(() => {
  if (launchPromptTimer) window.clearTimeout(launchPromptTimer)
})

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
