export interface Niyam {
  id: string
  title: string
  detail: string
}

/** Utsav niyams — edit freely. Tracker is personal (device only), not a public leaderboard. */
export const USTAV_NIYAMS: Niyam[] = [
  { id: 'puja', title: 'Nitya puja', detail: 'Complete daily puja with tilak-chandlo before leaving home.' },
  { id: 'arti', title: 'Aarti', detail: 'Attend or do aarti at home if you cannot come to mandir.' },
  { id: 'thal', title: 'Thal', detail: 'Offer thal / remember Maharaj before meals.' },
  { id: 'vanchan', title: 'Vanchan', detail: 'Read or listen to a short vanchan / Vachanamrut each day.' },
  { id: 'chesta', title: 'Chesta / dhun', detail: 'Sing chesta or dhun with the family at least once daily.' },
  { id: 'mala', title: 'Extra mala', detail: 'Offer an extra mala dedicated to Patotsav.' },
  { id: 'sabha', title: 'Sabha', detail: 'Attend weekly sabha; arrive before dhun starts.' },
  { id: 'diet', title: 'Utsav ahaar', detail: 'Keep the announced diet niyams (e.g. no onion/garlic) through the utsav period.' },
  { id: 'phone', title: 'Phone in sabha', detail: 'Phone on silent, away during katha and aarti.' },
  { id: 'seva', title: 'One seva a week', detail: 'Give at least one seva shift each week — kitchen, welcome, kids, or AV.' },
  { id: 'smile', title: 'Smile & welcome', detail: 'Greet every devotee as if Maharaj has arrived.' },
  { id: 'gratitude', title: 'Gratitude', detail: 'Write one line on the community wall, or thank someone who served.' }
]
