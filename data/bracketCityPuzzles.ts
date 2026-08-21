import type { BracketCityPuzzle } from '~/types'

/**
 * Hand-written fallbacks, used only when the daily generator cannot build a
 * puzzle from the word bank. They rotate by date so a bad generator day never
 * shows the same board twice in a row.
 */
export const DEFAULT_BRACKET_CITY_PUZZLES: BracketCityPuzzle[] = [
  {
    id: 'mandir-morning',
    title: 'Mandir Morning',
    published: true,
    source: 'Every morning we do [the lamp ceremony sung before the [image of Bhagvan installed in a mandir::murti]::aarti|arti], and then sit down for [the spiritual discourse read from the [scripture of Bhagvan Swaminarayan’s own spoken words::vachnamrut] ::katha].'
  },
  {
    id: 'utsav-checklist',
    title: 'Utsav Checklist',
    published: true,
    source: 'Utsav checklist: [tower of food offered to Bhagvan the day after Diwali::annakut], [the festival of lights::diwali], and [the sanctified food handed out at the end of sabha::prasad].'
  },
  {
    id: 'satsangi-day',
    title: 'A Satsangi’s Day',
    published: true,
    source: 'A satsangi’s day: [the personal daily worship done after bathing::nitya puja], [the family assembly held at home each evening::ghar sabha], then [selfless service offered at the [Swaminarayan house of worship::mandir] ::seva].'
  }
]
