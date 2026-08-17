/**
 * Keep an FCM foreground listener alive on every page, including admin.
 * Without this, sends while /admin is focused are received but never shown.
 */
export default defineNuxtPlugin(() => {
  const { startForegroundListener } = usePushNotifications()
  void startForegroundListener()
})
