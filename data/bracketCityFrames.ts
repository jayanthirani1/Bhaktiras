/**
 * Carrier sentences for the generated Bracket City puzzle.
 *
 * The word bank is a mix of places, festivals, foods, people and abstract
 * values, so a frame has to read correctly with any noun dropped into any slot.
 * These are deliberately list-shaped for that reason — a frame with real syntax
 * ("everyone stayed for {0}") reads fine for a festival and badly for a city.
 */
export interface BracketCityFrame {
  id: string
  /** {0}, {1}, {2}… are replaced by top-level clues. */
  template: string
  slots: number
}

export const BRACKET_CITY_FRAMES: BracketCityFrame[] = [
  { id: 'trail', slots: 3, template: 'Today’s darshan trail: {0}, then {1}, and finally {2}.' },
  { id: 'sabha', slots: 3, template: 'Three words from this morning’s sabha: {0}, {1} and {2}.' },
  { id: 'diary', slots: 3, template: 'Written in a satsangi’s diary: {0} · {1} · {2}' },
  { id: 'notice', slots: 3, template: 'Mandir notice board — {0}, {1}, {2}.' },
  { id: 'katha', slots: 3, template: 'Tonight’s katha touched on {0}, then {1}, and closed with {2}.' },
  { id: 'thali', slots: 2, template: 'On the thali of today’s satsang: {0} and {1}.' },
  { id: 'pair', slots: 2, template: 'A pair to remember: {0} and {1}.' },
  { id: 'question', slots: 2, template: 'Two questions for the sabha: what is {0}, and what is {1}?' },
  { id: 'yatra', slots: 4, template: 'Yatra checklist: {0}, {1}, {2}, {3}.' },
  { id: 'four', slots: 4, template: 'Four for the week: {0}, {1}, {2} and {3}.' }
]
