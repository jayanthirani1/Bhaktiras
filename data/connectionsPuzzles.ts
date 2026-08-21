import type { ConnectionsPuzzle } from '~/types'

export const DEFAULT_CONNECTIONS_PUZZLES: ConnectionsPuzzle[] = [
  {
    id: 'satsang-basics',
    title: 'Satsang Connections',
    published: true,
    groups: [
      { title: 'Mandir activities', difficulty: 0, words: ['Aarti', 'Darshan', 'Thal', 'Pradakshina'] },
      { title: 'Festivals', difficulty: 1, words: ['Annakut', 'Diwali', 'Holi', 'Janmashtami'] },
      { title: 'Kirtan instruments', difficulty: 2, words: ['Dholak', 'Harmonium', 'Manjira', 'Tabla'] },
      { title: 'Names of Bhagvan Swaminarayan', difficulty: 3, words: ['Ghanshyam', 'Hari', 'Nilkanth', 'Sahajanand'] }
    ]
  },
  {
    id: 'mandir-life',
    title: 'Mandir Life',
    published: true,
    groups: [
      { title: 'Parts of daily puja', difficulty: 0, words: ['Chesta', 'Dhyan', 'Mansi', 'Tilak Chandlo'] },
      { title: 'Gujarati meal staples', difficulty: 1, words: ['Dal', 'Khichdi', 'Rotli', 'Shaak'] },
      { title: 'Mandir seva teams', difficulty: 2, words: ['Cleaning', 'Decoration', 'Kitchen', 'Parking'] },
      { title: 'Swaminarayan scriptures', difficulty: 3, words: ['Bhaktachintamani', 'Satsangi Jeevan', 'Shikshapatri', 'Vachnamrut'] }
    ]
  },
  {
    id: 'devotional-practice',
    title: 'Devotional Practice',
    published: true,
    groups: [
      { title: 'Ways to serve', difficulty: 0, words: ['Cook', 'Clean', 'Donate', 'Volunteer'] },
      { title: 'Seen in a mandir', difficulty: 1, words: ['Ghanti', 'Murti', 'Sinhasan', 'Toran'] },
      { title: 'Words heard in sabha', difficulty: 2, words: ['Dhun', 'Katha', 'Kirtan', 'Prarthana'] },
      { title: 'Ekadashi foods', difficulty: 3, words: ['Morio', 'Potato', 'Rajgira', 'Sabudana'] }
    ]
  }
]
