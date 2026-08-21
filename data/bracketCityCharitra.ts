import type { BracketCityPuzzle } from '~/types'

/**
 * Bracket City puzzles drawn from the Ghanshyam Bal Charitra.
 *
 * The generated puzzles can only ever finish on a list of words. These finish
 * on a sentence that tells an episode, which is the whole point of the last
 * bracket closing. Each one is a plain retelling of the events in the book —
 * the names, places and details are the charitra's; the wording is ours.
 *
 * To add more: write one line per episode, wrap each answer's clue in square
 * brackets with `::answer` at the end, and nest a bracket inside another clue
 * wherever one answer explains the next. A clue must never name an answer that
 * appears anywhere else in the same puzzle.
 */
export const CHARITRA_BRACKET_CITY_PUZZLES: BracketCityPuzzle[] = [
  {
    id: 'charitra-10-crossing-the-river',
    title: 'Crossing the River',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Walking from [the village where Ghanshyam was born::Chhapaiya] to the Ram Navmi fair at [the city whose masons had left blocks along the bank, ruled by [the king who had ordered them for his building works::Darshansingh]::Ayodhya], the family found the [ferrymen who doubled their fare for the crowds::boatmen] filling every boat on the [river they had to cross::Saryu] — so Ghanshyam sat everyone on a block of [what one touch of his finger set floating::stone] and carried them over.'
  },
  {
    id: 'charitra-10-flooded-field',
    title: 'The Flooded Field',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Four months of monsoon rain had drowned Moti Tarwadi’s [crop he had sown to feed his family::rice] under the overflowing waters of [the lake his farm sat beside::Bhatiya], so Ghanshyam waded in and pressed his [part of the foot that bored a hole in the soft earth::big toe] down until the flood spun away like a whirlpool — then called [the king of heaven, who swooped down on a winged [vehicle he drove across the sky::chariot]::Indra] to carry the gasping [creatures left flapping among the stalks::fish] to safety.'
  },
  {
    id: 'charitra-10-blind-men',
    title: 'The Blind Men at the Lake',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'On [the fasting day kept on the eleventh of the fortnight::Ekadashi] the family went to bathe at [the lake outside the village::Shravan], where a [holy man charging money for the powers God had given him::sadhu] was turning away everyone too poor to pay — so Ghanshyam took his divine form, raised [the number of arms he showed above the beggars::four] arms, and gave back their [what those men had never once used::sight] for nothing.'
  },
  {
    id: 'charitra-10-wishing-tree',
    title: 'The Wishing Tree',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Ghanshyam and his friends emptied the pot of [fruit his father had cut up to offer as [food given to God before it is shared out::prasad]::jackfruit], and [the sister-in-law who found the pot empty and told his mother::Suvasini] gave them away — but out in the garden the tree that had borne nothing all year hung heavy, and every branch his elder brother [who wished aloud for mangoes, pomegranates and grapes::Ramprasad] named bore a different fruit.'
  },
  {
    id: 'charitra-10-mother-earth',
    title: 'The Tears of Mother Earth',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'On [the winter kite festival::Uttarayan], after bathing at [the lake where the family gave sweets to brahmins and cattle::Narayan], the Earth Mother came before Ghanshyam as a [animal they fed a bowl of halva::cow] and wept at the sins being committed on her body — and [the god of wind and air, who came down from among the kites::Varundev] pointed out the [creatures the fishermen had left dead along the shore::fish], which Ghanshyam sent leaping back alive into the water.'
  },
  {
    id: 'charitra-10-bhaktimata',
    title: 'The Passing of Bhaktimata',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Old and ailing in Ayodhya, [Ghanshyam’s mother::Bhaktimata] asked to be carried home to Chhapaiya, and made him promise to obey [the elder brother she left in charge of him::Rampratap] — then, as he recited [the scripture he spoke at her bedside::Bhagwad Gita|Gita] and showed her [the divine abode where she saw herself seated beside him::Akshardham], her soul left her body, and her sons lit the logs at [the lake where she was cremated::Narayan].'
  },
  {
    id: 'charitra-10-dharmadev',
    title: 'The Passing of Dharmadev',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Only days after his wife’s [thirteen-day rite held for the dead::Shraddh], [Ghanshyam’s father::Dharmadev] handed the house and farm to his eldest son, told him that Ghanshyam was [the supreme person himself::Purna Purushottam], and asked for the [seven-day reading of the Gita that pandit Ramahari began at his bedside::Bhagwat Saptah] — and when he wished aloud to see God in every form, Ghanshyam spread himself into all [the number of incarnations that ringed the bed::twenty-four|24] of them at once.'
  },
  {
    id: 'charitra-10-leaves-home',
    title: 'Ghanshyam Leaves Home',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Blamed for thrashing the wrestlers who had taunted him outside the [temple of the monkey god who served Ram::Hanuman] temple, Ghanshyam folded his clothes in a pile with his [what he left on top for his family to find::jewellery] and walked down to the Saryu — and when the asura [who seized him from behind and threw him into the current::Kaushidutt] tracked him twelve kilometres downstream, sitting in meditation beneath a [tree whose shade he had settled under::peepal], one look from him turned the demons on each other.'
  }
]
