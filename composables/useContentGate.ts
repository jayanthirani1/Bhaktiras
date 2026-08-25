import { sectionForPath } from '~/data/siteSections'

export interface ContentGateState {
  title: string
  message: string
  backTo: string
  backLabel: string
}

/**
 * Whether the current route sits in a section an admin has switched off, and
 * what to say instead.
 *
 * One check in the default layout covers every public page, rather than each
 * page having to guard itself.
 */
export function useContentGate() {
  const route = useRoute()
  const { sections } = useSiteContent()

  const gate = computed<ContentGateState | null>(() => {
    const path = route.path
    if (path.startsWith('/admin')) return null

    const section = sectionForPath(sections.value, path)
    if (!section || section.visible) return null

    return {
      title: `${section.label} isn’t available`,
      message: 'This part of Bhaktiras is switched off at the moment. Everything else is still here.',
      backTo: '/',
      backLabel: 'Back to home'
    }
  })

  return { gate }
}
