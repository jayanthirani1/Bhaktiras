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
      { label: 'Crossword', to: '/admin/games/crossword', subtitle: 'Puzzle titles and clues' },
      { label: 'Spelling Bee', to: '/admin/games/spelling-bee', subtitle: 'Hive letters and answers' },
      { label: '1% Club', to: '/admin/games/one-percent', subtitle: 'Ladder questions from 90% to 1%' },
      { label: 'Mini Crossword', to: '/admin/games/mini-crossword', subtitle: 'Quick timed crossword' },
      { label: 'Connections', to: '/admin/games/connections', subtitle: 'Four groups of four satsang words' }
    ]
  }
]

/** Flat list for title/subtitle lookups and any legacy consumers. */
export const ADMIN_MENU: AdminMenuItem[] = [
  ...ADMIN_MENU_TOP,
  ...ADMIN_MENU_GROUPS.flatMap(group => group.items)
]
