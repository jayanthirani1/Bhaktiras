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
  const { isAdminUser, isShopUser, adminChecked, refreshAdmin } = useAdminAccess()

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
    if (isAdminUser.value) return navigateTo('/admin')
    if (isShopUser.value) return navigateTo('/admin/shop')
    return
  }
  if (user.value && !isAuthPage && !isAdminUser.value) {
    // Shop staff (Souvenir lead, Treasury) reach the shop pages and nothing
    // else. Who is on the shop team is an admin decision, so Shop team stays
    // admin-only. The rules enforce the same split; this only routes.
    if (isShopUser.value) {
      if (isShopStaffPath(to.path)) return
      return navigateTo('/admin/shop')
    }
    return navigateTo('/admin/auth')
  }
})

function isShopStaffPath(path: string) {
  const clean = path.replace(/\/+$/, '')
  if (clean === '/admin/shop/team') return false
  return clean === '/admin/shop' || clean.startsWith('/admin/shop/')
}
