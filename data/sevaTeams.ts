export interface SevaTeam {
  id: string
  name: string
  summary: string
  responsibilities: string[]
}

export const SEVA_TEAMS: SevaTeam[] = [
  {
    id: 'kitchen',
    name: 'Kitchen & Prasad',
    summary: 'Thal, prasad, and the love that tastes like home.',
    responsibilities: ['Prep and serve prasad', 'Allergen-aware plating', 'Clean-down after sabha', 'Utsav kitchen shifts']
  },
  {
    id: 'welcome',
    name: 'Welcome & Ushering',
    summary: 'The first smile at the door.',
    responsibilities: ['Greet devotees', 'Seat sabha calmly', 'Help elders and families', 'Lost-and-found / wayfinding']
  },
  {
    id: 'kids',
    name: 'Bal / Kishore',
    summary: 'Sanskar for the next generation.',
    responsibilities: ['Bal sabha activities', 'Kishore-kishori engagement', 'Festival kids zone', 'Safeguarding with leads']
  },
  {
    id: 'stage',
    name: 'Stage, AV & Kirtan',
    summary: 'Sound, light, and kirtan that lift the sabha.',
    responsibilities: ['Mic and AV setup', 'Kirtan / tabla support', 'Livestream when needed', 'Stage management for utsav']
  },
  {
    id: 'decor',
    name: 'Decor & Mandir Care',
    summary: 'Make Maharaj’s home beautiful.',
    responsibilities: ['Daily mandir tidy', 'Utsav decor', 'Flowers and lights', 'Storage and packing']
  },
  {
    id: 'security',
    name: 'Security & Parking',
    summary: 'Keep everyone safe and the flow smooth.',
    responsibilities: ['Door and car-park rota', 'Crowd flow at peak times', 'First-aid liaison', 'Close-down checks']
  },
  {
    id: 'comms',
    name: 'Comms & Digital',
    summary: 'WhatsApp, photos, and this website.',
    responsibilities: ['WhatsApp updates', 'Photo/video capture (with consent)', 'Website content', 'Poster and invite design']
  },
  {
    id: 'seva-desk',
    name: 'Seva Desk',
    summary: 'Match people to roles without fuss.',
    responsibilities: ['Rota coordination', 'New volunteer induction', 'WhatsApp community moderation', 'Utsav seva grid']
  }
]
