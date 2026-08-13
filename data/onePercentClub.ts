import type { OnePercentQuestion } from '~/types'

/** Default 1% Club ladder — easy (high %) → hard (1%). Admin can replace via Firestore. */
export const DEFAULT_ONE_PERCENT: OnePercentQuestion[] = [
  {
    id: 'p90',
    percent: 90,
    question: 'How many letters are in the word “Aarti”?',
    options: ['4', '5', '6', '7'],
    correctAnswer: '5',
    order: 1
  },
  {
    id: 'p80',
    percent: 80,
    question: 'Tilak-chandlo is worn on which part of the body?',
    options: ['Wrist', 'Forehead', 'Neck', 'Palm'],
    correctAnswer: 'Forehead',
    order: 2
  },
  {
    id: 'p70',
    percent: 70,
    question: 'What do we offer to Maharaj before eating?',
    options: ['Thal', 'Dhol', 'Divo only', 'Prasad box'],
    correctAnswer: 'Thal',
    order: 3
  },
  {
    id: 'p50',
    percent: 50,
    question: '“Jai Swaminarayan” is primarily a greeting of…',
    options: ['Farewell only', 'Respect & devotion', 'Business', 'Sport'],
    correctAnswer: 'Respect & devotion',
    order: 4
  },
  {
    id: 'p20',
    percent: 20,
    question: 'Chesta is typically sung…',
    options: ['Only at Diwali', 'As a closing prayer', 'Instead of aarti', 'Only by children'],
    correctAnswer: 'As a closing prayer',
    order: 5
  },
  {
    id: 'p10',
    percent: 10,
    question: 'A mala is most often used for…',
    options: ['Cooking', 'Counting mantras', 'Measuring cloth', 'Temple keys'],
    correctAnswer: 'Counting mantras',
    order: 6
  },
  {
    id: 'p5',
    percent: 5,
    question: 'Which scripture is closely linked with Vachanamrut study?',
    options: ['Ramayana only', 'Bhagavad Gita only', 'Vachanamrut', 'Panchatantra'],
    correctAnswer: 'Vachanamrut',
    order: 7
  },
  {
    id: 'p1',
    percent: 1,
    question: 'In Swaminarayan tradition, “Nitya puja” means…',
    options: ['Annual festival only', 'Daily personal worship', 'Kitchen seva', 'Guest registration'],
    correctAnswer: 'Daily personal worship',
    order: 8
  }
]
