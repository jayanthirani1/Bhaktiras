export const ADMIN_MENU = [
  { label: 'Dashboard', to: '/admin', subtitle: 'Jump in and edit live content' },
  { label: 'Timeline', to: '/admin/timeline', subtitle: 'Journey moments on Our Journey' },
  { label: 'Events', to: '/admin/events', subtitle: 'Title, date, description and poster' },
  { label: 'Niyams', to: '/admin/niyams', subtitle: 'Utsav niyams shown on the tracker' },
  { label: 'Privacy & Policy', to: '/admin/legal', subtitle: 'Footer legal pages' },
  { label: 'Wordle', to: '/admin/games/wordle', subtitle: 'Plan daily words for the week or month' },
  { label: 'Quiz', to: '/admin/games/quiz', subtitle: 'Questions and answers' },
  { label: 'Crossword', to: '/admin/games/crossword', subtitle: 'Puzzle titles and clues' },
  { label: 'Spelling Bee', to: '/admin/games/spelling-bee', subtitle: 'Hive letters and answers' },
  { label: '1% Club', to: '/admin/games/one-percent', subtitle: 'Ladder questions from 90% to 1%' },
  { label: 'Mini Crossword', to: '/admin/games/mini-crossword', subtitle: 'Quick timed crossword' }
] as const
