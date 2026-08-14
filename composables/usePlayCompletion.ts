import {
  isPlayDone,
  readPlayCompletion,
  type PlayGameSlug
} from '~/utils/playCompletion'

/** Reactive “done today” map for the Play hub cards. */
export function usePlayCompletion(slugs: PlayGameSlug[]) {
  const done = reactive({} as Record<PlayGameSlug, boolean>)

  function refresh() {
    const next = readPlayCompletion(slugs)
    for (const slug of slugs) done[slug] = next[slug]
  }

  onMounted(() => {
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
  })

  onActivated(() => refresh())

  onUnmounted(() => {
    if (import.meta.server) return
    window.removeEventListener('focus', refresh)
    document.removeEventListener('visibilitychange', onVisible)
  })

  function onVisible() {
    if (document.visibilityState === 'visible') refresh()
  }

  return { done, refresh, isDone: (slug: PlayGameSlug) => isPlayDone(slug) }
}
