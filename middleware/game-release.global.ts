import { isGameLive, playSlugFromPath } from '~/utils/gameRelease'

export default defineNuxtRouteMiddleware((to) => {
  const slug = playSlugFromPath(to.path)
  if (!slug || isGameLive(slug)) return
  return navigateTo('/play')
})
