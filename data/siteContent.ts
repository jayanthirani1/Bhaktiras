import {
  IconCalendarEvent,
  IconDeviceGamepad2,
  IconFlame,
  IconGift,
  IconHandGrab,
  IconHeartHandshake,
  IconHome,
  IconMapPin,
  IconUsers
} from '@tabler/icons-vue'
import type { CommunityPromptContent, HomeTileContent, NavItemContent, SevaTeamContent, SiteContentSettings, SiteIconKey } from '~/types'
import {
  DEFAULT_SEVA_HEADING,
  DEFAULT_SEVA_INTRO,
  DEFAULT_SEVA_TEAMS
} from '~/data/sevaTeams'

export const SITE_CONTENT_DOC_ID = 'main'

export const SITE_ICON_OPTIONS: Array<{ key: SiteIconKey, label: string }> = [
  { key: 'home', label: 'Home' },
  { key: 'journey', label: 'Journey' },
  { key: 'events', label: 'Events' },
  { key: 'community', label: 'Community' },
  { key: 'seva', label: 'Seva' },
  { key: 'niyams', label: 'Niyams' },
  { key: 'games', label: 'Games' },
  { key: 'yajman', label: 'Yajman' },
  { key: 'donate', label: 'Donate' }
]

export const SITE_ICON_COMPONENTS = {
  home: IconHome,
  journey: IconMapPin,
  events: IconCalendarEvent,
  community: IconUsers,
  seva: IconHandGrab,
  niyams: IconFlame,
  games: IconDeviceGamepad2,
  yajman: IconHeartHandshake,
  donate: IconGift
} satisfies Record<SiteIconKey, unknown>

export const DEFAULT_HOME_TILES: HomeTileContent[] = [
  { id: 'journey', title: 'Our Journey', desc: '10 years to Patotsav', icon: 'journey', href: '/journey', order: 1, active: true },
  { id: 'events', title: 'Our Events', desc: 'Sabhas & mahotsav dates', icon: 'events', href: '/events', order: 2, active: true },
  { id: 'community', title: 'Our Community', desc: 'What mandir means to you', icon: 'community', href: '/community', order: 3, active: true },
  { id: 'seva', title: 'Seva', desc: 'Teams & WhatsApp community', icon: 'seva', href: '/seva', order: 4, active: true },
  { id: 'niyams', title: 'Our Niyams', desc: 'Utsav niyams & tracker', icon: 'niyams', href: '/niyams', order: 5, active: true },
  { id: 'yajman', title: 'Yajman Opportunities', desc: 'Take part in the Utsav', icon: 'yajman', href: '/yajman', order: 6, active: true },
  { id: 'donate', title: 'Donate', desc: 'Support Shree KS Swaminarayan Temple Woolwich', icon: 'donate', href: 'https://www.sksswoolwich.org/donate', external: true, order: 7, active: true },
  { id: 'games', title: 'Games', desc: 'Wordle, Crossword & daily streaks', icon: 'games', href: '/play', order: 8, active: true }
]

export const DEFAULT_NAV_ITEMS: NavItemContent[] = [
  { id: 'home', label: 'Home', href: '/', icon: 'home', order: 1, active: true, showInDesktopNav: true, showInMobileNav: true, mobilePrimary: true },
  { id: 'niyams', label: 'Niyams', href: '/niyams', icon: 'niyams', order: 2, active: true, showInDesktopNav: true, showInMobileNav: true, mobilePrimary: true },
  { id: 'events', label: 'Events', href: '/events', icon: 'events', order: 3, active: true, showInDesktopNav: true, showInMobileNav: true, mobilePrimary: true },
  { id: 'community', label: 'Community', href: '/community', icon: 'community', order: 4, active: true, showInDesktopNav: true, showInMobileNav: true },
  { id: 'seva', label: 'Seva', href: '/seva', icon: 'seva', order: 5, active: true, showInDesktopNav: true, showInMobileNav: true },
  { id: 'journey', label: 'Journey', href: '/journey', icon: 'journey', order: 6, active: true, showInDesktopNav: true, showInMobileNav: true },
  { id: 'games', label: 'Games', href: '/play', icon: 'games', order: 7, active: true, showInDesktopNav: true, showInMobileNav: true, mobilePrimary: true },
  { id: 'yajman', label: 'Yajman', href: '/yajman', icon: 'yajman', order: 8, active: true, showInMobileNav: true },
  { id: 'donate', label: 'Donate', href: 'https://www.sksswoolwich.org/donate', icon: 'donate', external: true, order: 9, active: true, showInMobileNav: true }
]

export const DEFAULT_COMMUNITY_PROMPTS: CommunityPromptContent[] = [
  { id: 'meaning', text: 'What does this mandir mean to you?', order: 1, active: true },
  { id: 'home', text: 'When did you first feel at home here?', order: 2, active: true },
  { id: 'seva-memory', text: 'A seva memory you still smile about?', order: 3, active: true },
  { id: 'next-generation', text: 'What do you hope this mandir gives the next generation?', order: 4, active: true },
  { id: 'niyam', text: 'A niyam that quietly changed you?', order: 5, active: true },
  { id: 'welcome', text: 'Who made you feel welcome when you were new?', order: 6, active: true },
  { id: 'younger-self', text: 'What would you tell your younger self walking into sabha?', order: 7, active: true },
  { id: 'kirtan', text: 'A kirtan, katha, or aarti that stays with you?', order: 8, active: true }
]

export const DEFAULT_SITE_CONTENT: SiteContentSettings = {
  id: SITE_CONTENT_DOC_ID,
  homeTiles: DEFAULT_HOME_TILES,
  navItems: DEFAULT_NAV_ITEMS,
  communityPrompts: DEFAULT_COMMUNITY_PROMPTS,
  sevaHeading: DEFAULT_SEVA_HEADING,
  sevaIntro: DEFAULT_SEVA_INTRO,
  sevaTeams: DEFAULT_SEVA_TEAMS
}

function sortByOrder<T extends { order?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function parseHomeTiles(raw: unknown): HomeTileContent[] {
  if (!Array.isArray(raw)) return []
  return sortByOrder(raw.map((item, index) => {
    const value = item as Partial<HomeTileContent>
    if (!value?.id || !value?.title || !value?.href) return null
    return {
      id: String(value.id),
      title: String(value.title),
      desc: String(value.desc || ''),
      href: String(value.href),
      icon: SITE_ICON_COMPONENTS[value.icon as SiteIconKey] ? value.icon as SiteIconKey : 'home',
      ...(value.external === true ? { external: true } : {}),
      active: value.active !== false,
      order: Number(value.order ?? index + 1) || index + 1
    }
  }).filter(Boolean) as HomeTileContent[])
}

export function parseNavItems(raw: unknown): NavItemContent[] {
  if (!Array.isArray(raw)) return []
  return sortByOrder(raw.map((item, index) => {
    const value = item as Partial<NavItemContent>
    if (!value?.id || !value?.label || !value?.href) return null
    return {
      id: String(value.id),
      label: String(value.label),
      href: String(value.href),
      icon: SITE_ICON_COMPONENTS[value.icon as SiteIconKey] ? value.icon as SiteIconKey : 'home',
      ...(value.external === true ? { external: true } : {}),
      active: value.active !== false,
      order: Number(value.order ?? index + 1) || index + 1,
      showInDesktopNav: value.showInDesktopNav === true,
      showInMobileNav: value.showInMobileNav === true,
      ...(value.mobilePrimary === true ? { mobilePrimary: true } : {})
    }
  }).filter(Boolean) as NavItemContent[])
}

export function parseCommunityPrompts(raw: unknown): CommunityPromptContent[] {
  if (!Array.isArray(raw)) return []
  return sortByOrder(raw.map((item, index) => {
    const value = item as Partial<CommunityPromptContent>
    if (!value?.id || !value?.text) return null
    return {
      id: String(value.id),
      text: String(value.text),
      active: value.active !== false,
      order: Number(value.order ?? index + 1) || index + 1
    }
  }).filter(Boolean) as CommunityPromptContent[])
}

export function parseSevaTeams(raw: unknown): SevaTeamContent[] {
  if (!Array.isArray(raw)) return []
  return sortByOrder(raw.map((item, index) => {
    const value = item as Partial<SevaTeamContent>
    if (!value?.id || !value?.name || !value?.description) return null
    return {
      id: String(value.id),
      name: String(value.name),
      summary: String(value.summary || ''),
      description: String(value.description),
      active: value.active !== false,
      order: Number(value.order ?? index + 1) || index + 1
    }
  }).filter(Boolean) as SevaTeamContent[])
}

export function parseSevaHeading(raw: unknown): string {
  const value = String(raw || '').trim()
  return value || DEFAULT_SEVA_HEADING
}

export function parseSevaIntro(raw: unknown): string {
  const value = String(raw || '').trim()
  return value || DEFAULT_SEVA_INTRO
}

export function cloneList<T extends object>(items: T[]): T[] {
  return items.map(item => ({ ...item }))
}

export function homeTilesFromSource(raw: unknown): HomeTileContent[] {
  const parsed = parseHomeTiles(raw)
  return parsed.length ? parsed : cloneList(DEFAULT_HOME_TILES)
}

export function navItemsFromSource(raw: unknown): NavItemContent[] {
  const parsed = parseNavItems(raw)
  return parsed.length ? parsed : cloneList(DEFAULT_NAV_ITEMS)
}

export function communityPromptsFromSource(raw: unknown): CommunityPromptContent[] {
  const parsed = parseCommunityPrompts(raw)
  return parsed.length ? parsed : cloneList(DEFAULT_COMMUNITY_PROMPTS)
}

export function sevaTeamsFromSource(raw: unknown): SevaTeamContent[] {
  const parsed = parseSevaTeams(raw)
  return parsed.length ? parsed : cloneList(DEFAULT_SEVA_TEAMS)
}

export function siteContentWritePayload(data: {
  homeTiles: HomeTileContent[]
  navItems: NavItemContent[]
  communityPrompts: CommunityPromptContent[]
  sevaHeading?: string
  sevaIntro?: string
  sevaTeams: SevaTeamContent[]
}) {
  return {
    homeTiles: parseHomeTiles(data.homeTiles.length ? data.homeTiles : DEFAULT_HOME_TILES),
    navItems: parseNavItems(data.navItems.length ? data.navItems : DEFAULT_NAV_ITEMS),
    communityPrompts: parseCommunityPrompts(data.communityPrompts.length ? data.communityPrompts : DEFAULT_COMMUNITY_PROMPTS),
    sevaHeading: parseSevaHeading(data.sevaHeading),
    sevaIntro: parseSevaIntro(data.sevaIntro),
    sevaTeams: parseSevaTeams(data.sevaTeams.length ? data.sevaTeams : DEFAULT_SEVA_TEAMS)
  }
}
