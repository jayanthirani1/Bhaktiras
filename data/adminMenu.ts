export type AdminMenuItem = {
  label: string
  to: string
  subtitle: string
  /**
   * Firestore collection behind this editor, when there is one. The dashboard
   * shows its document count on the card; items without one (jump-off pages
   * like Content settings, or read-only views like Insights) simply show none.
   */
  collection?: string
}

export type AdminMenuGroup = {
  id: string
  label: string
  items: AdminMenuItem[]
}

/** Top-level links shown above grouped sections. */
export const ADMIN_MENU_TOP: AdminMenuItem[] = [
  { label: 'Dashboard', to: '/admin', subtitle: 'Jump in and edit live content' },
  { label: 'Insights', to: '/admin/insights', subtitle: 'Members, activity and notification reach' },
  { label: 'Push notifications', to: '/admin/notifications', subtitle: 'Send updates to opted-in devices', collection: 'pushMessages' },
  { label: 'Bug reports', to: '/admin/bugs', subtitle: 'Review, resolve and close submitted bugs', collection: 'bugReports' }
]

/** Collapsible sidebar sections. */
export const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    id: 'content',
    label: 'Site content',
    items: [
      { label: 'Content settings', to: '/admin/content', subtitle: 'Jump to homepage, nav, community and seva editors' },
      { label: 'Sections', to: '/admin/content/sections', subtitle: 'Show or hide whole parts of the app' },
      { label: 'Homepage tiles', to: '/admin/content/homepage', subtitle: 'Cards shown on the homepage grid' },
      { label: 'Navigation', to: '/admin/content/navigation', subtitle: 'Desktop nav, mobile tabs and More drawer' },
      { label: 'Community questions', to: '/admin/content/community', subtitle: 'Prompt chips above the wall form' },
      { label: 'Seva teams', to: '/admin/content/seva', subtitle: 'Volunteer teams shown on the Seva page' },
      { label: 'Timeline', to: '/admin/timeline', subtitle: 'Journey moments on Our Journey', collection: 'timeline' },
      { label: 'Events', to: '/admin/events', subtitle: 'Title, date, description and poster', collection: 'events' },
      { label: 'Yajman opportunities', to: '/admin/yajman', subtitle: 'Utsav Yajman opportunities shown on the site', collection: 'yajmanOpportunities' },
      { label: 'Niyam challenges', to: '/admin/niyam-challenges', subtitle: 'Set a shared goal and approve the entries devotees submit', collection: 'niyamChallenges' },
      { label: 'Privacy & Policy', to: '/admin/legal', subtitle: 'Footer legal pages', collection: 'sitePages' }
    ]
  },
  {
    id: 'games',
    label: 'Games',
    items: [
      { label: 'Game Word Bank', to: '/admin/games/word-bank', subtitle: 'Swaminarayan, Gujarati & basic Hindu words', collection: 'gameWords' },
      { label: 'Wordle', to: '/admin/games/wordle', subtitle: 'Plan daily words for the week or month', collection: 'wordleWords' },
      { label: 'Crossword', to: '/admin/games/crossword', subtitle: 'Quick timed crossword', collection: 'miniCrosswordPuzzles' },
      { label: '1% Club', to: '/admin/games/one-percent', subtitle: 'Daily Vachnamrut ladders (Bhuj edition)', collection: 'onePercentQuestions' },
      { label: 'Connections', to: '/admin/games/connections', subtitle: 'Four groups of four satsang words', collection: 'connectionsPuzzles' },
      { label: 'Bracket City', to: '/admin/games/bracket-city', subtitle: 'Override the generated nested-clue puzzle', collection: 'bracketCityPuzzles' },
      { label: 'Surya Chandra', to: '/admin/games/bhakti-marg', subtitle: 'Daily sun-and-moon logic puzzles (Tango-style)', collection: 'bhaktiMargPuzzles' },
      { label: 'Ras Rani', to: '/admin/games/ras-rani', subtitle: 'Queens-style nectar drops, colours and regions', collection: 'rasRaniPuzzles' }
    ]
  }
]

/** Flat list for title/subtitle lookups and any legacy consumers. */
export const ADMIN_MENU: AdminMenuItem[] = [
  ...ADMIN_MENU_TOP,
  ...ADMIN_MENU_GROUPS.flatMap(group => group.items)
]
