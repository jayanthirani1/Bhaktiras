import type { SiteSectionContent, SiteSectionVisibility } from '~/types'

/**
 * The parts of the app an admin can switch off.
 *
 * The catalogue lives in code, not in Firestore: a section is a real page that
 * either exists in this build or does not, so labels, blurbs and routes are
 * owned here and only the on/off switch is stored. That means a stored document
 * can never resurrect a section that has been removed, or hide one behind a
 * stale label, and a section added in a later build simply shows up switched on.
 */
export const SITE_SECTION_CATALOG: Array<Omit<SiteSectionContent, 'visible' | 'order'>> = [
  {
    id: 'journey',
    label: 'Our Journey',
    description: 'The year-by-year timeline from 2017 to Patotsav.',
    paths: ['/journey']
  },
  {
    id: 'events',
    label: 'Our Events',
    description: 'Upcoming and past sabhas, posters and Flickr albums.',
    paths: ['/events']
  },
  {
    id: 'community',
    label: 'Our Community',
    description: 'The message wall and its prompt chips.',
    paths: ['/community']
  },
  {
    id: 'seva',
    label: 'Seva',
    description: 'WhatsApp community invite and the volunteer teams.',
    paths: ['/seva']
  },
  {
    id: 'niyams',
    label: 'Our Niyams',
    description: 'Shared niyam challenges and the submission form.',
    paths: ['/niyams']
  },
  {
    id: 'yajman',
    label: 'Yajman Opportunities',
    description: 'Utsav sponsorship opportunities.',
    paths: ['/yajman']
  },
  {
    id: 'darshan',
    label: 'Darshan',
    description: 'The darshan page.',
    paths: ['/darshan']
  },
  {
    id: 'legacy',
    label: 'Legacy',
    description: 'The legacy page.',
    paths: ['/legacy']
  },
  {
    id: 'games',
    label: 'Games',
    description: 'The whole Games area — every game, streaks and achievements.',
    paths: ['/play']
  }
]

export const SITE_SECTION_IDS = SITE_SECTION_CATALOG.map(section => section.id)

export const DEFAULT_SITE_SECTIONS: SiteSectionContent[] = SITE_SECTION_CATALOG.map((section, index) => ({
  ...section,
  visible: true,
  order: index + 1
}))

/**
 * Merges stored visibility onto the catalogue above.
 *
 * A section with nothing stored against it is visible, so switching a section
 * off is always a deliberate admin action and a fresh database renders the
 * whole site.
 */
export function siteSectionsFromSource(raw: unknown): SiteSectionContent[] {
  const stored = new Map<string, boolean>()
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const value = item as Partial<SiteSectionVisibility> | null
      if (!value?.id) continue
      stored.set(String(value.id), value.visible !== false)
    }
  }
  return SITE_SECTION_CATALOG.map((section, index) => ({
    ...section,
    paths: [...section.paths],
    visible: stored.get(section.id) ?? true,
    order: index + 1
  }))
}

/** Only the switch is written back — the rest of a section is code, not content. */
export function siteSectionsWritePayload(sections: SiteSectionContent[]): SiteSectionVisibility[] {
  const chosen = new Map(sections.map(section => [section.id, section.visible !== false]))
  return SITE_SECTION_CATALOG.map(section => ({
    id: section.id,
    visible: chosen.get(section.id) ?? true
  }))
}

/** True when `path` is the route itself or sits underneath it. */
export function pathMatchesPrefix(prefix: string, path: string): boolean {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path
  return clean === prefix || clean.startsWith(`${prefix}/`)
}

export function sectionForPath(sections: SiteSectionContent[], path: string): SiteSectionContent | null {
  return sections.find(section => section.paths.some(prefix => pathMatchesPrefix(prefix, path))) ?? null
}

/**
 * Whether a nav item or homepage tile may be shown. External links are never
 * gated — they do not belong to a section of this app.
 */
export function linkIsVisible(sections: SiteSectionContent[], href: string): boolean {
  if (!href || /^[a-z]+:/i.test(href)) return true
  const section = sectionForPath(sections, href)
  return !section || section.visible
}
