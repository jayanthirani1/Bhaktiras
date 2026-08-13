export default defineNuxtRouteMiddleware(async (to) => {
  const isAdminRoute = to.path.startsWith('/admin')
  const isAuthPage = to.path === '/admin/auth'
  if (!isAdminRoute) return
  if (to.path === '/admin/admins' || to.path.startsWith('/admin/admins/')) {
    return navigateTo('/admin')
  }

  if (import.meta.server) {
    if (!isAuthPage) return navigateTo('/admin/auth')
    return
  }

  const { user, loading } = useAuth()
  const { isAdminUser, adminChecked, refreshAdmin } = useAdminAccess()

  const started = Date.now()
  while (loading.value && Date.now() - started < 4000) {
    await new Promise(r => setTimeout(r, 50))
  }

  if (user.value && !adminChecked.value) {
    await refreshAdmin()
    const waitAdmin = Date.now()
    while (!adminChecked.value && Date.now() - waitAdmin < 4000) {
      await new Promise(r => setTimeout(r, 50))
    }
  }

  if (!user.value && !isAuthPage) return navigateTo('/admin/auth')
  if (user.value && isAuthPage) {
    if (!isAdminUser.value) return
    return navigateTo('/admin')
  }
  if (user.value && !isAuthPage && !isAdminUser.value) return navigateTo('/admin/auth')
})
