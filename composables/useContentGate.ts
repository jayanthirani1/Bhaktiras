import { formatReleaseAt, gameForPath, isGameComingSoon, isGameReleased } from '~/data/gameReleases'
import { sectionForPath } from '~/data/siteSections'

export interface ContentGateState {
  title: string
  message: string
  releaseLabel?: string
  comingSoon?: boolean
  backTo: string
  backLabel: string
}

/**
 * Whether the current route is behind an admin switch, and what to say instead.
 *
 * One check in the default layout covers every public page: a section switched
 * off in Admin -> Content -> Sections, and a game that has not reached its
 * release date, both land here rather than each page having to guard itself.
 */
export function useContentGate() {
  const route = useRoute()
  const { sections, gameReleases, now } = useSiteContent()

  const gate = computed<ContentGateState | null>(() => {
    const path = route.path
    if (path.startsWith('/admin')) return null

    const section = sectionForPath(sections.value, path)
    if (section && !section.visible) {
      return {
        title: `${section.label} isn’t available`,
        message: 'This part of Bhaktiras is switched off at the moment. Everything else is still here.',
        backTo: '/',
        backLabel: 'Back to home'
      }
    }

    const game = gameForPath(gameReleases.value, path)
    if (game && !isGameReleased(game, now.value)) {
      const soon = isGameComingSoon(game, now.value)
      return {
        title: soon ? `${game.title} is coming soon` : `${game.title} isn’t available`,
        message: soon
          ? 'This game hasn’t been released yet. It appears on Games the moment it opens — nothing to do but come back.'
          : 'This game is switched off at the moment. There are others waiting on the Games page.',
        releaseLabel: soon ? formatReleaseAt(game.releaseAt) : '',
        comingSoon: soon,
        backTo: '/play',
        backLabel: 'Back to Games'
      }
    }

    return null
  })

  return { gate }
}
