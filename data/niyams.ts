import type { Niyam } from '~/types'

export type { Niyam }

/** Default utsav niyams — used until admin publishes a list in Firestore. */
export const USTAV_NIYAMS: Niyam[] = [
  { id: 'puja', title: 'Nitya puja', detail: 'Complete daily puja with tilak-chandlo before leaving home.', order: 1 },
  { id: 'arti', title: 'Aarti', detail: 'Attend or do aarti at home if you cannot come to mandir.', order: 2 },
  { id: 'thal', title: 'Thal', detail: 'Offer thal / remember Maharaj before meals.', order: 3 },
  { id: 'vanchan', title: 'Vanchan', detail: 'Read or listen to a short vanchan / Vachanamrut each day.', order: 4 },
  { id: 'chesta', title: 'Chesta / dhun', detail: 'Sing chesta or dhun with the family at least once daily.', order: 5 },
  { id: 'mala', title: 'Extra mala', detail: 'Offer an extra mala dedicated to Patotsav.', order: 6 },
  { id: 'sabha', title: 'Sabha', detail: 'Attend weekly sabha; arrive before dhun starts.', order: 7 },
  { id: 'diet', title: 'Utsav ahaar', detail: 'Keep the announced diet niyams (e.g. no onion/garlic) through the utsav period.', order: 8 },
  { id: 'phone', title: 'Phone in sabha', detail: 'Phone on silent, away during katha and aarti.', order: 9 },
  { id: 'seva', title: 'One seva a week', detail: 'Give at least one seva shift each week — kitchen, welcome, kids, or AV.', order: 10 },
  { id: 'smile', title: 'Smile & welcome', detail: 'Greet every devotee as if Maharaj has arrived.', order: 11 },
  { id: 'gratitude', title: 'Gratitude', detail: 'Write one line on the community wall, or thank someone who served.', order: 12 }
]
