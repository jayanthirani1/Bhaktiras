export const ADMIN_MENU = [
  { label: 'Dashboard', to: '/admin', subtitle: 'Jump in and edit live content' },
  { label: 'Timeline', to: '/admin/timeline', subtitle: 'Journey moments on Our Journey' },
  { label: 'Events', to: '/admin/events', subtitle: 'Title, date, description and poster' },
  { label: 'Wordle', to: '/admin/games/wordle', subtitle: 'Plan daily words for the week or month' },
  { label: 'Quiz', to: '/admin/games/quiz', subtitle: 'Questions and answers' },
  { label: 'Crossword', to: '/admin/games/crossword', subtitle: 'Puzzle titles and clues' },
  { label: 'Spelling Bee', to: '/admin/games/spelling-bee', subtitle: 'Hive letters and answers' }
] as const
