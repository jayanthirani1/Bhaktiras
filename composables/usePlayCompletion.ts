import {
  readLocalPlayCompletion,
  type PlayCompletionEntry,
  type PlayGameSlug
} from '~/utils/playCompletion'

/** Reactive “done today” map for the Play hub cards, merged across devices. */
export function usePlayCompletion(slugs: PlayGameSlug[]) {
  const { remote, load } = usePlayCompletionStore()
  const local = reactive({} as Record<PlayGameSlug, PlayCompletionEntry | null>)

  function refresh() {
    for (const slug of slugs) local[slug] = readLocalPlayCompletion(slug)
    void load(true)
  }

  function onVisible() {
    if (document.visibilityState === 'visible') refresh()
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

  const done = computed(() => {
    const map = {} as Record<PlayGameSlug, boolean>
    for (const slug of slugs) map[slug] = !!local[slug] || !!remote.value[slug]
    return map
  })

  /** Today's result per game, so the hub can show what the player scored. */
  const results = computed(() => {
    const map = {} as Record<PlayGameSlug, PlayCompletionEntry | null>
    for (const slug of slugs) map[slug] = remote.value[slug] || local[slug] || null
    return map
  })

  return { done, results, refresh }
}
