<template>
  <div class="flex min-h-screen flex-col bg-[hsl(var(--background))]">
    <Navigation />
    <main class="flex-1">
      <!-- A section an admin has switched off, or a game not out yet, never
           mounts its page: the gate stands in its place. -->
      <ContentGate
        v-if="gate"
        :title="gate.title"
        :message="gate.message"
        :release-label="gate.releaseLabel"
        :coming-soon="gate.comingSoon"
        :back-to="gate.backTo"
        :back-label="gate.backLabel"
      />
      <slot v-else />
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
const { gate } = useContentGate()
const { recordVisit } = usePlayStreak()
const signInPrompt = useSignInPrompt()
const { request: requestInstallPrompt } = useInstallPrompt()
const { request: requestPushPrompt } = usePushPrompt()

/**
 * The two launch-time prompts, held until Firebase has restored the session.
 *
 * Asking a signed-in devotee to sign in, for the half-second before `auth`
 * resolves, is worse than not asking at all — so both wait on `loading`, then
 * on a short pause so the page they opened is the first thing they see.
 * `useAppPrompts` makes sure only one card actually appears.
 *
 * The install ask is the `launch` moment. It used to be refused on a first
 * session, on the theory that a newcomer should reach it via `game-complete`
 * or `events` instead — but someone who opens the link, likes what they see and
 * never taps Events was simply never asked, so the ask now stands from the
 * first visit. On Chromium it may surface a moment later than this timer:
 * `useInstallPrompt` holds it until `beforeinstallprompt` arrives.
 *
 * The `signed-in` push moment is the third trigger, below. It is deliberately
 * narrow, because there is one notification ask per device and on iOS a refusal
 * is effectively permanent — the only way back is Settings. So it fires only
 * after the sign-in a devotee just performed, never the one Firebase restores
 * on each launch; never where iOS would refuse it anyway for want of a Home
 * Screen launch; and once, after which the seen flag stands. The other two push
 * moments still carry the asks that answer a demonstrated want: `game-complete`
 * ("Remind me tomorrow's game?") and `events`.
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
        requestInstallPrompt('launch')
      }, 2000)
    },
    { immediate: true }
  )
})

/**
 * The ask that follows signing in, held back so the page they landed on is the
 * first thing they see rather than a card over a screen they have not read.
 * `usePushPrompt` decides whether this moment is owed at all; `useAppPrompts`
 * decides whether it is this round's card.
 */
let signedInPromptTimer: number | null = null

watch(
  () => auth.user.value?.uid,
  (uid, previous) => {
    if (import.meta.server || !uid || uid === previous) return
    if (signedInPromptTimer) window.clearTimeout(signedInPromptTimer)
    signedInPromptTimer = window.setTimeout(() => requestPushPrompt('signed-in'), 2500)
  }
)

onUnmounted(() => {
  if (launchPromptTimer) window.clearTimeout(launchPromptTimer)
  if (signedInPromptTimer) window.clearTimeout(signedInPromptTimer)
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
