/**
 * Carrier sentences for the generated Bracket City puzzle.
 *
 * Each frame is tied to one word-bank category and every top-level answer in a
 * puzzle is drawn from it, so the sentence a player uncovers is actually true —
 * a thali frame lists food, a yatra frame lists places. Untyped list frames
 * were tried first and produced lines like "On the thali of today's satsang:
 * Sankhya and Nirgun", which is the one moment of the game that has to land.
 *
 * A frame may only claim what the category guarantees. "Two pins on the
 * pilgrimage map" is too strong for a category holding Golok, a divine abode
 * nobody travels to; "two places" is the claim the bank can actually keep.
 *
 * Nested clues inside a bracket are unrestricted; only the outer answers have
 * to match the theme.
 */
export interface BracketCityFrame {
  id: string
  /** Word-bank category every top-level answer is drawn from. */
  category: string
  /** {0}, {1}, {2}… are replaced by top-level clues. */
  template: string
  slots: number
}

export const BRACKET_CITY_FRAMES: BracketCityFrame[] = [
  // place — 51 usable entries
  { id: 'yatra', category: 'place', slots: 3, template: 'Three places in today’s katha: {0}, {1} and {2}.' },
  { id: 'katha-travels', category: 'place', slots: 3, template: 'Tonight’s katha travelled to {0}, then {1}, and finally {2}.' },
  { id: 'map', category: 'place', slots: 2, template: 'Two places worth remembering: {0} and {1}.' },

  // swaminarayan — 71
  { id: 'sampraday', category: 'swaminarayan', slots: 3, template: 'Three words from the sampraday: {0}, {1} and {2}.' },
  { id: 'vachnamrut-reading', category: 'swaminarayan', slots: 3, template: 'Heard in the Vachnamrut reading: {0}, {1} and {2}.' },
  { id: 'maharaj-three', category: 'swaminarayan', slots: 2, template: 'Maharaj’s satsang in two words: {0} and {1}.' },

  // hinduism — 63
  { id: 'shastra-words', category: 'hinduism', slots: 3, template: 'Three words from the shastras: {0}, {1} and {2}.' },
  { id: 'sanatan', category: 'hinduism', slots: 3, template: 'Three to know from Sanatan Dharma: {0}, {1} and {2}.' },

  // worship — 34
  { id: 'world-of-worship', category: 'worship', slots: 3, template: 'Three from the world of worship: {0}, {1} and {2}.' },
  { id: 'puja-words', category: 'worship', slots: 2, template: 'Two words you would hear at puja: {0} and {1}.' },

  // community — 18
  { id: 'around-mandir', category: 'community', slots: 3, template: 'Around the mandir this week: {0}, {1} and {2}.' },
  { id: 'mandir-life', category: 'community', slots: 2, template: 'Two parts of mandir life: {0} and {1}.' },

  // satsang — 16
  { id: 'sabha-words', category: 'satsang', slots: 3, template: 'Three words from this morning’s sabha: {0}, {1} and {2}.' },
  { id: 'sadhu-spoke', category: 'satsang', slots: 2, template: 'What the sadhu spoke about: {0} and {1}.' },

  // scripture — 16
  { id: 'shastras-today', category: 'scripture', slots: 2, template: 'Read from the shastras today: {0} and {1}.' },
  { id: 'scripture-words', category: 'scripture', slots: 3, template: 'Three words from the scriptures: {0}, {1} and {2}.' },

  // festival — 16. The category is really the whole utsav calendar: it holds
  // Gujarati months and tithis (Kartik, Dashami) and festival trappings
  // (Rangoli, Torana) alongside Diwali and Holi, so a frame cannot say
  // "festivals" outright.
  { id: 'utsav-calendar', category: 'festival', slots: 3, template: 'Three from the utsav calendar: {0}, {1} and {2}.' },
  { id: 'diary-festivals', category: 'festival', slots: 2, template: 'Two words from the utsav season: {0} and {1}.' },

  // food — 8
  { id: 'thali', category: 'food', slots: 2, template: 'On the thali after sabha: {0} and {1}.' },

  // devotion — 7
  { id: 'devotion-words', category: 'devotion', slots: 2, template: 'Two words about devotion: {0} and {1}.' },

  // value — 4
  { id: 'watch-yourself', category: 'value', slots: 2, template: 'Two qualities to watch in yourself: {0} and {1}.' }
]
