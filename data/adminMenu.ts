export type AdminMenuItem = {
  label: string
  to: string
  subtitle: string
}

export type AdminMenuGroup = {
  id: string
  label: string
  items: AdminMenuItem[]
}

/** Top-level links shown above grouped sections. */
export const ADMIN_MENU_TOP: AdminMenuItem[] = [
  { label: 'Dashboard', to: '/admin', subtitle: 'Jump in and edit live content' },
  { label: 'Push notifications', to: '/admin/notifications', subtitle: 'Send updates to opted-in devices' },
  { label: 'Bug reports', to: '/admin/bugs', subtitle: 'Review, resolve and close submitted bugs' }
]

/** Collapsible sidebar sections. */
export const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    id: 'content',
    label: 'Site content',
    items: [
      { label: 'Content settings', to: '/admin/content', subtitle: 'Jump to homepage, nav, community and seva editors' },
      { label: 'Homepage tiles', to: '/admin/content/homepage', subtitle: 'Cards shown on the homepage grid' },
      { label: 'Navigation', to: '/admin/content/navigation', subtitle: 'Desktop nav, mobile tabs and More drawer' },
      { label: 'Community questions', to: '/admin/content/community', subtitle: 'Prompt chips above the wall form' },
      { label: 'Seva teams', to: '/admin/content/seva', subtitle: 'Volunteer teams shown on the Seva page' },
      { label: 'Timeline', to: '/admin/timeline', subtitle: 'Journey moments on Our Journey' },
      { label: 'Events', to: '/admin/events', subtitle: 'Title, date, description and poster' },
      { label: 'Yajman opportunities', to: '/admin/yajman', subtitle: 'Utsav Yajman opportunities shown on the site' },
      { label: 'Niyams', to: '/admin/niyams', subtitle: 'Utsav niyams shown on the tracker' },
      { label: 'Privacy & Policy', to: '/admin/legal', subtitle: 'Footer legal pages' }
    ]
  },
  {
    id: 'games',
    label: 'Games',
    items: [
      { label: 'Game Word Bank', to: '/admin/games/word-bank', subtitle: 'Swaminarayan, Gujarati & basic Hindu words' },
      { label: 'Wordle', to: '/admin/games/wordle', subtitle: 'Plan daily words for the week or month' },
      { label: 'Crossword', to: '/admin/games/crossword', subtitle: 'Quick timed crossword' },
      { label: '1% Club', to: '/admin/games/one-percent', subtitle: 'Daily Vachanamrut ladders (Bhuj edition)' },
      { label: 'Connections', to: '/admin/games/connections', subtitle: 'Four groups of four satsang words' }
    ]
  }
]

/** Flat list for title/subtitle lookups and any legacy consumers. */
export const ADMIN_MENU: AdminMenuItem[] = [
  ...ADMIN_MENU_TOP,
  ...ADMIN_MENU_GROUPS.flatMap(group => group.items)
]
